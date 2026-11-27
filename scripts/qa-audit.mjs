import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return {
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
    bytes: buf.length,
    pngWidth: buf.readUInt32BE(16),
    pngHeight: buf.readUInt32BE(20),
    isPngSignature:
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
  };
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function initialBearingDeg(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const phi1 = toRad(a.lat);
  const phi2 = toRad(b.lat);
  const dL = toRad(b.lon - a.lon);
  const y = Math.sin(dL) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dL);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function collectFiles(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, exts, out);
    else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
  }
  return out;
}

const results = {
  passed: 0,
  failed: 0,
  checks: [],
};

function assertCheck(category, name, condition, detail = '') {
  if (condition) {
    results.passed += 1;
    results.checks.push({ status: 'PASS', category, name, detail });
  } else {
    results.failed += 1;
    results.checks.push({ status: 'FAIL', category, name, detail });
  }
}

async function runAudit() {
  // 1. ГЕОГРАФСКА И ИСТОРИЧЕСКА ВАЛИДАЦИЯ
  const registry = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/route/coordinates-registry.json'), 'utf8')
  );
  const segments = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/route/route-segments.json'), 'utf8')
  );
  const sourcesCatalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/historical/sources-catalog.json'), 'utf8')
  );
  const imageManifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'src/data/stations/station-images.json'), 'utf8')
  );

  const stationDir = path.join(ROOT, 'src/data/stations');
  const stationFiles = fs
    .readdirSync(stationDir)
    .filter((f) => /^[0-9]{2}-.*\.json$/.test(f))
    .sort();
  const stations = stationFiles.map((f) =>
    JSON.parse(fs.readFileSync(path.join(stationDir, f), 'utf8'))
  );

  assertCheck(
    'Geographic',
    'Налични са точно 11 спирки (8 визуални + 3 източни)',
    stations.length === 11,
    `count=${stations.length}`
  );

  const nodeKeys = Object.keys(registry.nodes);
  const allCoordsValid = nodeKeys.every((key) => {
    const c = registry.nodes[key];
    return (
      typeof c.lat === 'number' &&
      typeof c.lon === 'number' &&
      Number.isFinite(c.lat) &&
      Number.isFinite(c.lon) &&
      c.lat >= 39.0 &&
      c.lat <= 44.5 &&
      c.lon >= 22.0 &&
      c.lon <= 31.0
    );
  });
  assertCheck(
    'Geographic',
    `Всички ${nodeKeys.length} координатни точки са валидни WGS84 в балканския коридор`,
    allCoordsValid
  );

  let seqOrdered = true;
  let milesMonotonic = true;
  let eastProgression = true;
  let allSourcesResolved = true;

  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    const coord = registry.nodes[st.coordinateKey];
    if (st.sequence !== i + 1) seqOrdered = false;
    for (const sId of st.sourceIds) {
      if (!sourcesCatalog[sId]) allSourcesResolved = false;
    }
    if (i > 0) {
      const prev = stations[i - 1];
      const prevCoord = registry.nodes[prev.coordinateKey];
      if (st.cumulativeRomanMiles < prev.cumulativeRomanMiles) milesMonotonic = false;
      if (coord.lon <= prevCoord.lon) eastProgression = false;
    }
  }

  assertCheck('Geographic', 'Строга поредност на спирките (sequence 1..11)', seqOrdered);
  assertCheck(
    'Geographic',
    'Монотонна дистанция в римски мили (0 → 276 m.p.)',
    milesMonotonic && stations[10].cumulativeRomanMiles === 276
  );
  assertCheck(
    'Geographic',
    'Непрекъсната географска посока Запад → Изток (24.7491°E → 28.9759°E)',
    eastProgression
  );
  assertCheck(
    'Geographic',
    'Всички библиографски препратки (sourceIds) се резолват в sources-catalog.json',
    allSourcesResolved
  );

  const overallBearing = initialBearingDeg(
    registry.nodes['STOP-01'],
    registry.nodes['EXT-15']
  );
  const directKm = haversineKm(registry.nodes['STOP-01'], registry.nodes['EXT-15']);
  assertCheck(
    'Geographic',
    'Географски азимут Филипопол → Константинопол е югоизточен (105°–115°)',
    overallBearing >= 105 && overallBearing <= 115,
    `bearing=${overallBearing.toFixed(2)}°, geodesic=${directKm.toFixed(1)} km`
  );

  let segmentsContinuous = true;
  for (let i = 0; i < segments.length; i++) {
    const poly = registry.polylines[segments[i].polylineKey];
    if (!Array.isArray(poly) || poly.length < 3) segmentsContinuous = false;
    if (i > 0) {
      const prevPoly = registry.polylines[segments[i - 1].polylineKey];
      const endPrev = prevPoly[prevPoly.length - 1];
      const startCurr = poly[0];
      if (
        Math.abs(endPrev[0] - startCurr[0]) > 0.0001 ||
        Math.abs(endPrev[1] - startCurr[1]) > 0.0001
      ) {
        segmentsContinuous = false;
      }
    }
  }
  assertCheck(
    'Geographic',
    'Пълна топологична непрекъснатост между всички 9 пътни сегмента',
    segmentsContinuous
  );

  // 2. ВАЛИДАЦИЯ НА 9-ТЕ ОРИГИНАЛНИ ИЗОБРАЖЕНИЯ (Канонични SHA-256 контролни суми)
  const CANONICAL_SHA256 = {
    regional_panorama: '01c6cef80e21324604fbbdf81f78e8ef79636470bc034a91721a116af2e2c5f3',
    philippopolis: 'd652e81c9fff8a869ae53c974f4cd5761fac3636d2f7ad5d95d5ce11751da992',
    sernota: 'f1448915dca19a908fa2f8065aefbfe09ec0257df2fa3d976674d1941102c0d0',
    parembole: 'f047b7ad3985fcaa00ff085ecd22dc105eb790e6ca651918737eadb776accf01',
    carassura: '6172bf24e919cede02174462d62c2e0c216ac231a9354121d3e7fbee81f0a458',
    arzus: 'f3b3162c075d55fc6bae610cab3800052d95b3c6f07dca329ddfb4b2b24840d0',
    pale: 'f01927a3b00ee446d882269cc354704e0bf9ed78ccc3db830e80bba5ca9fbb58',
    castra_rubra: 'c6a4af952fd3d20864fc5013bc161d1a230a65c7b783fe5cf772376bee8bd8a4',
    burdipta: 'd3aa615b004fb5d616e90cb7d39ed38874c21c7a88272719be7eab67f8419a03',
  };

  const manifestKeys = Object.keys(imageManifest);
  let allByteIdentical = true;
  let allDimensionsMatch = true;

  for (const key of manifestKeys) {
    const item = imageManifest[key];
    const publicPath = path.join(ROOT, 'public', item.image.replace(/^\//, ''));
    const origRootPath = path.join(ROOT, item.originalFilename);
    if (!fs.existsSync(publicPath)) {
      allByteIdentical = false;
      continue;
    }
    const pubInfo = sha256File(publicPath);
    if (
      pubInfo.sha256 !== CANONICAL_SHA256[key] ||
      !pubInfo.isPngSignature ||
      (fs.existsSync(origRootPath) && sha256File(origRootPath).sha256 !== pubInfo.sha256)
    ) {
      allByteIdentical = false;
    }
    if (pubInfo.pngWidth !== item.width || pubInfo.pngHeight !== item.height) {
      allDimensionsMatch = false;
    }
  }

  assertCheck(
    'Images',
    'Всички 9 оригинални изображения са байт-идентични (SHA-256) с първоизточниците',
    manifestKeys.length === 9 && allByteIdentical
  );
  assertCheck(
    'Images',
    'Бинарните PNG размери (IHDR) съвпадат точно с манифеста (1672×941 и 1448×1086)',
    allDimensionsMatch
  );

  const srcFiles = collectFiles(path.join(ROOT, 'src'), ['.ts', '.tsx', '.css']);
  const objectCoverHits = srcFiles.filter((f) =>
    fs.readFileSync(f, 'utf8').includes('object-cover')
  );
  assertCheck(
    'Images',
    'Нулево неволно изрязване (0 срещания на object-cover в целия src/)',
    objectCoverHits.length === 0
  );

  // 3. РЕАЛНИ RUNTIME ФУНКЦИОНАЛНИ И ERROR-HANDLING ТЕСТОВЕ ПРЕЗ VITE MODULE RUNNER
  const vite = await createViteServer({
    root: ROOT,
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const stationStoreMod = await vite.ssrLoadModule('/src/stores/station-store.ts');
    const cameraStoreMod = await vite.ssrLoadModule('/src/stores/camera-store.ts');
    const interfaceStoreMod = await vite.ssrLoadModule('/src/stores/interface-store.ts');
    const diagnosticsStoreMod = await vite.ssrLoadModule('/src/stores/diagnostics-store.ts');
    const routeLoaderMod = await vite.ssrLoadModule('/src/features/route/route-loader.ts');
    const imageLoaderMod = await vite.ssrLoadModule(
      '/src/features/gallery/image-manifest-loader.ts'
    );
    const validationMod = await vite.ssrLoadModule('/src/utils/validation.ts');

    const { useStationStore } = stationStoreMod;
    const { useCameraStore } = cameraStoreMod;
    const { useInterfaceStore } = interfaceStoreMod;
    const { useDiagnosticsStore } = diagnosticsStoreMod;

    // 3.1 Стартиране и зареждане на станции, криволинейно трасе и реки
    const loadedStations = useStationStore.getState().stations;
    const spine = routeLoaderMod.getFullCurvedRouteSpine();
    const rivers = routeLoaderMod.loadRivers();
    assertCheck(
      'Functional',
      'Инициализация на хранилищата, криволинейния сплайн на пътя и речната мрежа',
      loadedStations.length === 11 &&
        spine.points.length > 250 &&
        spine.totalKm > 380 &&
        rivers.length === 6,
      `curvedVertices=${spine.points.length}, spineKm=${spine.totalKm.toFixed(1)}, rivers=${rivers.length}`
    );

    // 3.2 Преминаване към следваща и предишна спирка (1 -> 11 -> 1)
    for (let step = 0; step < 12; step++) {
      useStationStore.getState().selectNextStation();
    }
    const atEnd = useStationStore.getState().selectedStationId;
    for (let step = 0; step < 12; step++) {
      useStationStore.getState().selectPreviousStation();
    }
    const backAtStart = useStationStore.getState().selectedStationId;
    assertCheck(
      'Functional',
      'Навигация Следваща / Предишна спирка през целия маршрут със защита на границите',
      atEnd === 'EXT-15' && backAtStart === 'STOP-01',
      `end=${atEnd}, start=${backAtStart}`
    );

    // 3.3 Избиране на станция + отваряне на инспекционни панели
    useStationStore.getState().selectStation('STOP-06');
    const paleStation = useStationStore
      .getState()
      .stations.find((s) => s.id === 'STOP-06');
    useCameraStore.getState().enterLocalInspection(paleStation.coordinates, 1850);
    useInterfaceStore.getState().activateStationInspectionCard();
    assertCheck(
      'Functional',
      'Избор на спирка активира локална 3D инспекция и отваря информационния панел',
      useStationStore.getState().selectedStationId === 'STOP-06' &&
        useCameraStore.getState().cameraMode === 'local-inspection' &&
        useInterfaceStore.getState().isDesktopRightOpen === true &&
        useInterfaceStore.getState().activeNavSection === 'stops'
    );

    // 3.4 Всички 5 режима на камерата + връщане към общия изглед
    const presets = [
      'regional-overview',
      'birds-eye',
      'low-aerial',
      'third-person',
      'local-inspection',
    ];
    for (const p of presets) {
      useCameraStore.getState().applyViewPreset(p, paleStation.coordinates);
    }
    useCameraStore.getState().returnToRouteOverview();
    assertCheck(
      'Functional',
      'Превключване на 5-те перспективи на камерата и плавно връщане към общ обзор',
      useCameraStore.getState().cameraMode === 'overview' &&
        useCameraStore.getState().activeViewPreset === 'regional-overview'
    );

    // 3.5 Движение по маршрута и прогресивно разкриване на каменния път
    const sampleStart = routeLoaderMod.sampleRouteAtProgress(0);
    const sampleMid = routeLoaderMod.sampleRouteAtProgress(0.5);
    const sampleEnd = routeLoaderMod.sampleRouteAtProgress(1);
    const slice25 = routeLoaderMod.sliceCurvedRouteUpToProgress(0.25);
    const slice75 = routeLoaderMod.sliceCurvedRouteUpToProgress(0.75);
    assertCheck(
      'Functional',
      'Придвижване по маршрута (0% → 50% → 100%) и прогресивно разгръщане на трасето',
      Math.abs(sampleStart.lon - 24.7491) < 0.01 &&
        sampleMid.lon > 26.0 &&
        Math.abs(sampleEnd.lon - 28.9759) < 0.01 &&
        slice75.length > slice25.length &&
        slice25.length >= 2,
      `slice25=${slice25.length} pts, slice75=${slice75.length} pts`
    );

    // 3.6 Галерия, Image Lightbox и модални прозорци
    useInterfaceStore.getState().openGallery('carassura', true);
    const galleryOpenedInLightbox =
      useInterfaceStore.getState().isGalleryOpen &&
      useInterfaceStore.getState().isLightboxFullscreen &&
      useInterfaceStore.getState().activeReferenceKey === 'carassura';
    useInterfaceStore.getState().openGuideModal();
    const guideExclusivelyOpen =
      useInterfaceStore.getState().isGuideModalOpen &&
      !useInterfaceStore.getState().isGalleryOpen;
    useInterfaceStore.getState().closeAllOverlays();
    const allClosed =
      !useInterfaceStore.getState().isGuideModalOpen &&
      !useInterfaceStore.getState().isGalleryOpen;
    assertCheck(
      'Functional',
      'Отваряне и затваряне на Image Lightbox, Исторически гид и навигационни секции',
      galleryOpenedInLightbox && guideExclusivelyOpen && allClosed
    );

    // 3.7 Runtime географски и манифестен одит (runGeographicAndAssetIntegrityAudit)
    const runtimeAudit = validationMod.runGeographicAndAssetIntegrityAudit(
      loadedStations,
      useStationStore.getState().segments,
      imageLoaderMod.getAllOriginalReferences()
    );
    assertCheck(
      'Geographic',
      'Вграденият runtime одит (runGeographicAndAssetIntegrityAudit) преминава без грешки',
      runtimeAudit.passed && runtimeAudit.errorsBg.length === 0
    );

    // 3.8 Инжектиране на грешки: невалидни координати, счупени полилинии и възстановяване на сцена
    const badCoord = validationMod.sanitizeCoordinateRecord(
      { lat: Number.NaN, lon: 999, elevationMeters: -99999, uncertaintyRadiusKm: -5 },
      'FAULT-INJECT-COORD'
    );
    const badPoly = validationMod.sanitizePolyline(
      [[Number.NaN, 42.1]],
      'FAULT-INJECT-POLY'
    );
    const issuesAfterFault = useDiagnosticsStore.getState().issues;
    const prevTerrainNonce = useDiagnosticsStore.getState().terrainRetryNonce;
    const prevSceneNonce = useDiagnosticsStore.getState().sceneResetNonce;
    useDiagnosticsStore.getState().triggerTerrainRetry();
    useDiagnosticsStore.getState().triggerSceneReset();
    assertCheck(
      'ErrorHandling',
      'Защита при невалидни координати/полилинии и механизъм за възстановяване на терен и WebGL',
      badCoord.lat === 42.1474 &&
        badCoord.lon === 24.7491 &&
        badPoly.length === 2 &&
        issuesAfterFault.length >= 2 &&
        useDiagnosticsStore.getState().terrainRetryNonce === prevTerrainNonce + 1 &&
        useDiagnosticsStore.getState().sceneResetNonce === prevSceneNonce + 1
    );
  } finally {
    await vite.close();
  }

  // 4. ПРОВЕРКА НА ПРОДУКЦИОННИЯ БИЛД И CESIUM СТАТИЧНИТЕ РЕСУРСИ В dist/
  const distIndex = path.join(ROOT, 'dist/index.html');
  const distCesiumHeights = path.join(
    ROOT,
    'dist/cesium/Assets/approximateTerrainHeights.json'
  );
  const distAllImagesExist = manifestKeys.every((k) =>
    fs.existsSync(
      path.join(ROOT, 'dist', imageManifest[k].image.replace(/^\//, ''))
    )
  );
  assertCheck(
    'Build & WebGL',
    'Продукционният пакет dist/ съдържа index.html, Cesium Workers/Assets и всички 9 оригинални PNG файла',
    fs.existsSync(distIndex) && fs.existsSync(distCesiumHeights) && distAllImagesExist
  );

  // Ако локалният preview сървър на 127.0.0.1:4173 работи, проверяваме и реални HTTP 200 отговори
  try {
    const resRoot = await fetch('http://127.0.0.1:4173/');
    const resImg = await fetch(
      'http://127.0.0.1:4173/assets/historical-references/01-philippopolis.png'
    );
    const resCesium = await fetch(
      'http://127.0.0.1:4173/cesium/Assets/approximateTerrainHeights.json'
    );
    assertCheck(
      'HTTP Live',
      'Реални HTTP 200 отговори от продукционния сървър за HTML, оригинално изображение и Cesium асети',
      resRoot.status === 200 &&
        resImg.status === 200 &&
        resImg.headers.get('content-type')?.includes('image/png') &&
        resCesium.status === 200,
      `root=${resRoot.status}, img=${resImg.status} (${resImg.headers.get('content-length')} bytes), cesium=${resCesium.status}`
    );
  } catch {
    // Пропуска се тихо ако npm run qa се извиква без стартиран preview сървър
  }

  console.log(JSON.stringify(results, null, 2));
  if (results.failed > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
