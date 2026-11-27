import * as Cesium from 'cesium';
import { APP_CONFIG } from '@/app/config/app-config';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import type { TerrainSourceKind } from '@/stores/map-store';
import type { BasemapStyle } from '@/types';

export interface ConfiguredTerrainResult {
  provider: Cesium.TerrainProvider;
  sourceKind: TerrainSourceKind;
  detachErrorListener: () => void;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Изтече времето за връзка (${timeoutMs} ms)`));
    }, timeoutMs);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function attachTerrainRuntimeMonitor(
  provider: Cesium.TerrainProvider,
  onCriticalFailure?: () => void
): () => void {
  let tileErrorCount = 0;
  const remove = provider.errorEvent.addEventListener(() => {
    tileErrorCount += 1;
    if (tileErrorCount === 4) {
      const store = useDiagnosticsStore.getState();
      store.setTerrainFallbackActive(true);
      store.reportIssue({
        id: 'terrain-tile-errors',
        category: 'terrain',
        severity: 'warning',
        messageBg:
          'Външният 3D сървър за релеф не отговаря коректно — активиран е резервен WGS84 елипсоид.',
        recoverable: true,
      });
      onCriticalFailure?.();
    }
  });
  return () => {
    remove();
  };
}

/**
 * Зарежда реален 3D цифров модел на релефа (DEM) с таймаут и автоматичен резервен режим:
 * 1. При наличен VITE_CESIUM_ION_TOKEN -> Cesium World Terrain.
 * 2. Без ключ -> публичен Esri WorldElevation3D DEM.
 * 3. При офлайн среда или недостъпен външен ресурс -> резервен WGS84 елипсоид с известие и опция за повторен опит.
 */
export async function createConfiguredTerrainProvider(
  onRuntimeFallback?: () => void
): Promise<ConfiguredTerrainResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const store = useDiagnosticsStore.getState();
    store.setTerrainFallbackActive(true);
    store.reportIssue({
      id: 'terrain-offline-fallback',
      category: 'terrain',
      severity: 'warning',
      messageBg: 'Офлайн среда: 3D релефът работи в резервен елипсоиден режим.',
      recoverable: true,
    });
    return {
      provider: new Cesium.EllipsoidTerrainProvider(),
      sourceKind: 'ellipsoid',
      detachErrorListener: () => {},
    };
  }

  if (APP_CONFIG.cesium.hasIonToken) {
    Cesium.Ion.defaultAccessToken = APP_CONFIG.cesium.ionToken;
    try {
      const worldTerrain = await withTimeout(
        Cesium.createWorldTerrainAsync({
          requestVertexNormals: true,
          requestWaterMask: true,
        }),
        8000
      );
      useDiagnosticsStore.getState().clearCategory('terrain');
      return {
        provider: worldTerrain,
        sourceKind: 'cesium-world-terrain',
        detachErrorListener: attachTerrainRuntimeMonitor(worldTerrain, onRuntimeFallback),
      };
    } catch {
      // Продължава автоматично към публичния ArcGIS 3D DEM
    }
  }

  try {
    const arcgisTerrain = (await withTimeout(
      Cesium.ArcGISTiledElevationTerrainProvider.fromUrl(
        APP_CONFIG.cesium.arcgisWorldElevationUrl
      ),
      8000
    )) as unknown as Cesium.TerrainProvider;

    useDiagnosticsStore.getState().clearCategory('terrain');
    return {
      provider: arcgisTerrain,
      sourceKind: 'arcgis-dem-3d',
      detachErrorListener: attachTerrainRuntimeMonitor(arcgisTerrain, onRuntimeFallback),
    };
  } catch {
    const store = useDiagnosticsStore.getState();
    store.setTerrainFallbackActive(true);
    store.reportIssue({
      id: 'terrain-init-failed',
      category: 'terrain',
      severity: 'warning',
      messageBg:
        'Неуспешно зареждане на външния 3D релеф — активиран е резервен WGS84 елипсоид.',
      recoverable: true,
    });
    return {
      provider: new Cesium.EllipsoidTerrainProvider(),
      sourceKind: 'ellipsoid',
      detachErrorListener: () => {},
    };
  }
}

/**
 * Процедурна офлайн картографска мрежа в цветовете на римската имперска картография.
 * Служи като базов слой под външните тайлове, така че при недостъпен интернет/сървър
 * потребителят винаги вижда чиста картографска основа, реките, трасето и спирките.
 */
export function createOfflineCartographicGridProvider(): Cesium.GridImageryProvider {
  return new Cesium.GridImageryProvider({
    cells: 8,
    color: Cesium.Color.fromCssColorString('#c89d3c').withAlpha(0.24),
    glowColor: Cesium.Color.fromCssColorString('#35312a').withAlpha(0.35),
    glowWidth: 2,
    backgroundColor: Cesium.Color.fromCssColorString('#14171c'),
  });
}

export function createBasemapImageryProvider(style: BasemapStyle): {
  provider: Cesium.UrlTemplateImageryProvider;
  detachErrorListener: () => void;
} {
  const creditText =
    style === 'satellite'
      ? 'Реална сателитна фотография: Esri, Maxar, Earthstar Geographics'
      : style === 'topographic'
        ? 'Топографска карта: OpenTopoMap (CC-BY-SA)'
        : 'Картографска подложка: CARTO / OpenStreetMap';

  const provider = new Cesium.UrlTemplateImageryProvider({
    url: APP_CONFIG.cesium.basemapUrls[style],
    tileWidth: 256,
    tileHeight: 256,
    maximumLevel: style === 'topographic' ? 17 : 18,
    credit: new Cesium.Credit(creditText),
  });

  let consecutiveErrors = 0;
  const remove = provider.errorEvent.addEventListener(() => {
    consecutiveErrors += 1;
    if (consecutiveErrors === 5) {
      const store = useDiagnosticsStore.getState();
      store.setImageryFallbackActive(true);
      store.reportIssue({
        id: `basemap-unavailable:${style}`,
        category: 'imagery',
        severity: 'warning',
        messageBg:
          'Външната картографска подложка е частично или напълно недостъпна — използва се локална картографска мрежа.',
        recoverable: true,
      });
    }
  });

  return {
    provider,
    detachErrorListener: () => remove(),
  };
}
