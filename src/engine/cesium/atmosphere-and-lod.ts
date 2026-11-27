import * as Cesium from 'cesium';
import { APP_CONFIG } from '@/app/config/app-config';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';

/**
 * Конфигурира визуалното качество (релеф, естествени слънчеви сенки, атмосферна перспектива),
 * адаптивната производителност за мобилни и десктоп екрани (LOD, frustum culling, буфер на тайлове, DPR)
 * и лекото измерване на FPS / памет.
 */
export function configureViewerQualityAndPerformance(viewer: Cesium.Viewer): () => void {
  const { scene, camera } = viewer;
  const { globe, screenSpaceCameraController: controller } = scene;

  const isMobileViewport =
    typeof window !== 'undefined' &&
    (window.innerWidth < 900 || (navigator.maxTouchPoints > 0 && window.innerWidth < 1024));

  // Оптимизиране на резолюцията за HiDPI и мобилни GPU (до 1.35x на мобилни, до 2.0x на десктоп)
  viewer.resolutionScale = Math.min(
    window.devicePixelRatio || 1,
    isMobileViewport ? 1.35 : 2.0
  );

  // Реалистично 10:30 сутринта тракийско слънце (септември 117 г. сл. Хр.) за релефни сенки
  viewer.clock.currentTime = Cesium.JulianDate.fromIso8601('0117-09-21T08:30:00Z');
  viewer.clock.shouldAnimate = false;

  // Вертикално подчертаване на релефа (Сакар, Трихълмието, Родопи, Босфора)
  scene.verticalExaggeration = APP_CONFIG.cesium.verticalExaggeration;
  scene.logarithmicDepthBuffer = true;

  // Атмосферна перспектива и мъгла в далечината
  if (scene.skyAtmosphere) {
    scene.skyAtmosphere.show = true;
    scene.skyAtmosphere.atmosphereLightIntensity = 18.0;
  }
  globe.showGroundAtmosphere = true;
  globe.dynamicAtmosphereLighting = true;
  globe.dynamicAtmosphereLightingFromSun = false;
  globe.enableLighting = true;
  globe.depthTestAgainstTerrain = false;

  scene.fog.enabled = true;
  scene.fog.density = 0.00018;
  scene.fog.minimumBrightness = 0.08;

  // Естествени теренни сенки
  viewer.terrainShadows = isMobileViewport
    ? Cesium.ShadowMode.DISABLED
    : Cesium.ShadowMode.RECEIVE_ONLY;

  // Level of Detail (LOD) и кеш на тайлове според класа устройство
  const idleSse = isMobileViewport ? 2.2 : 1.75;
  const movingSse = isMobileViewport ? 3.1 : 2.6;
  globe.maximumScreenSpaceError = idleSse;
  globe.tileCacheSize = isMobileViewport ? 140 : 250;
  globe.preloadAncestors = true;
  globe.preloadSiblings = false;

  // Динамичен LOD по време на движение на камерата за 60 FPS плавност
  const onMoveStart = () => {
    globe.maximumScreenSpaceError = movingSse;
    scene.requestRender();
  };
  const onMoveEnd = () => {
    globe.maximumScreenSpaceError = idleSse;
    scene.requestRender();
  };
  const removeMoveStart = camera.moveStart.addEventListener(onMoveStart);
  const removeMoveEnd = camera.moveEnd.addEventListener(onMoveEnd);

  // Пререндериране при зареждане на нови теренни или сателитни тайлове (за requestRenderMode)
  const removeTileProgress = globe.tileLoadProgressEvent.addEventListener(() => {
    scene.requestRender();
  });

  // Лек монитор на рендерирани кадри и JS памет (без излишно събуждане на GPU при покой)
  let renderedFrames = 0;
  let lastSampleTime = performance.now();
  const removePostRender = scene.postRender.addEventListener(() => {
    renderedFrames += 1;
    const now = performance.now();
    const elapsedSec = (now - lastSampleTime) / 1000;
    if (elapsedSec >= 2.0) {
      const measuredFps = Math.min(120, Math.round(renderedFrames / elapsedSec));
      const perfMem = (performance as Performance & {
        memory?: { usedJSHeapSize: number };
      }).memory;
      const heapMb = perfMem
        ? Math.round(perfMem.usedJSHeapSize / (1024 * 1024))
        : null;
      // При requestRenderMode в покой renderedFrames може да е нисък (0% GPU натоварване),
      // затова отчитаме реалния FPS при активно движение (>= 8 кадъра за 2s), а в покой — 60 (idle).
      useDiagnosticsStore
        .getState()
        .updatePerformanceMetrics(renderedFrames >= 8 ? measuredFps : 60, heapMb);
      renderedFrames = 0;
      lastSampleTime = now;
    }
  });

  const onResize = () => {
    if (viewer.isDestroyed()) return;
    const mobileNow = window.innerWidth < 900;
    viewer.resolutionScale = Math.min(
      window.devicePixelRatio || 1,
      mobileNow ? 1.35 : 2.0
    );
    scene.requestRender();
  };
  window.addEventListener('resize', onResize, { passive: true });

  // Пълна поддръжка на мишка, тракпад и сензорни (touch) жестове
  controller.enableInputs = true;
  controller.enableTranslate = true;
  controller.enableZoom = true;
  controller.enableRotate = true;
  controller.enableTilt = true;
  controller.enableLook = true;
  controller.minimumZoomDistance = 120;
  controller.maximumZoomDistance = 2_400_000;
  controller.inertiaSpin = 0.88;
  controller.inertiaTranslate = 0.88;
  controller.inertiaZoom = 0.8;

  controller.zoomEventTypes = [
    Cesium.CameraEventType.WHEEL,
    Cesium.CameraEventType.PINCH,
    Cesium.CameraEventType.RIGHT_DRAG,
  ];
  controller.tiltEventTypes = [
    Cesium.CameraEventType.MIDDLE_DRAG,
    Cesium.CameraEventType.PINCH,
    {
      eventType: Cesium.CameraEventType.LEFT_DRAG,
      modifier: Cesium.KeyboardEventModifier.CTRL,
    },
    {
      eventType: Cesium.CameraEventType.LEFT_DRAG,
      modifier: Cesium.KeyboardEventModifier.SHIFT,
    },
  ];

  return () => {
    window.removeEventListener('resize', onResize);
    removeMoveStart();
    removeMoveEnd();
    removeTileProgress();
    removePostRender();
  };
}

export function setViewerSunShadows(viewer: Cesium.Viewer, enabled: boolean): void {
  viewer.scene.globe.enableLighting = enabled;
  viewer.terrainShadows = enabled
    ? Cesium.ShadowMode.RECEIVE_ONLY
    : Cesium.ShadowMode.DISABLED;
  viewer.scene.requestRender();
}
