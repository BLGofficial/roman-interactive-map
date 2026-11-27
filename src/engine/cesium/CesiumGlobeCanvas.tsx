import { useEffect, useMemo, useRef } from 'react';
import * as Cesium from 'cesium';
import { cameraDirector } from '@/engine/camera/CameraDirector';
import {
  configureViewerQualityAndPerformance,
  setViewerSunShadows,
} from '@/engine/cesium/atmosphere-and-lod';
import {
  createBasemapImageryProvider,
  createConfiguredTerrainProvider,
  createOfflineCartographicGridProvider,
} from '@/engine/terrain/terrain-provider';
import { attachWebGLContextHandlers } from '@/engine/rendering/webgl-support';
import {
  syncProgressiveRevealedRoad,
  syncTravellerObserverEntity,
  syncViaDiagonalisEntities,
} from '@/engine/cesium/route-entities-sync';
import {
  loadGeographicRegions,
  loadRivers,
  sampleRouteAtProgress,
  sliceCurvedRouteUpToProgress,
} from '@/features/route/route-loader';
import { useMapStore } from '@/stores/map-store';
import { useCameraStore } from '@/stores/camera-store';
import { useStationStore } from '@/stores/station-store';
import { useInterfaceStore } from '@/stores/interface-store';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { getIdentificationStatusLabelBg } from '@/utils/formatters';

export function CesiumGlobeCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const dataSourceRef = useRef<Cesium.CustomDataSource | null>(null);

  const rivers = useMemo(() => loadRivers(), []);
  const regions = useMemo(() => loadGeographicRegions(), []);

  const basemap = useMapStore((s) => s.basemap);
  const enableSunShadows = useMapStore((s) => s.enableSunShadows);
  const showConfirmedSegments = useMapStore((s) => s.showConfirmedSegments);
  const showInferredSegments = useMapStore((s) => s.showInferredSegments);
  const showRiversAndGeography = useMapStore((s) => s.showRiversAndGeography);
  const showUncertaintyCircles = useMapStore((s) => s.showUncertaintyCircles);
  const showSupplementaryNodes = useMapStore((s) => s.showSupplementaryNodes);
  const isProgressiveReveal = useMapStore((s) => s.isProgressiveReveal);
  const setGlobeReady = useMapStore((s) => s.setGlobeReady);
  const setTerrainSource = useMapStore((s) => s.setTerrainSource);
  const setHoveredMarker = useMapStore((s) => s.setHoveredMarker);
  const setHoveredEntityLabel = useMapStore((s) => s.setHoveredEntityLabel);
  const setActiveSegmentId = useMapStore((s) => s.setActiveSegmentId);

  const activeViewPreset = useCameraStore((s) => s.activeViewPreset);
  const cameraMode = useCameraStore((s) => s.cameraMode);
  const target = useCameraStore((s) => s.target);
  const flightNonce = useCameraStore((s) => s.flightNonce);
  const presetNonce = useCameraStore((s) => s.presetNonce);
  const routeProgress = useCameraStore((s) => s.routeProgress);
  const setRouteProgress = useCameraStore((s) => s.setRouteProgress);
  const isPlayingRoute = useCameraStore((s) => s.isPlayingRoute);
  const routeSpeedMultiplier = useCameraStore((s) => s.routeSpeedMultiplier);
  const thirdPersonAltitudeMeters = useCameraStore((s) => s.thirdPersonAltitudeMeters);
  const thirdPersonHeadingOffsetDeg = useCameraStore((s) => s.thirdPersonHeadingOffsetDeg);
  const thirdPersonScope = useCameraStore((s) => s.thirdPersonScope);
  const activeSegmentId = useMapStore((s) => s.activeSegmentId);
  const inspectionCenter = useCameraStore((s) => s.inspectionCenter);
  const inspectionRangeMeters = useCameraStore((s) => s.inspectionRangeMeters);
  const isAutoOrbiting = useCameraStore((s) => s.isAutoOrbiting);
  const setIsFlying = useCameraStore((s) => s.setIsFlying);
  const enterLocalInspection = useCameraStore((s) => s.enterLocalInspection);
  const focusTerrainPoint = useCameraStore((s) => s.focusTerrainPoint);

  const stations = useStationStore((s) => s.stations);
  const segments = useStationStore((s) => s.segments);
  const supplementaryNodes = useStationStore((s) => s.supplementaryNodes);
  const selectedStationId = useStationStore((s) => s.selectedStationId);
  const selectStation = useStationStore((s) => s.selectStation);
  const selectSupplementaryNode = useStationStore((s) => s.selectSupplementaryNode);

  const activateStationInspectionCard = useInterfaceStore(
    (s) => s.activateStationInspectionCard
  );

  const terrainRetryNonce = useDiagnosticsStore((s) => s.terrainRetryNonce);
  const imageryRetryNonce = useDiagnosticsStore((s) => s.imageryRetryNonce);

  // Инициализация на Cesium.Viewer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const viewer = new Cesium.Viewer(el, {
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      baseLayer: new Cesium.ImageryLayer(createOfflineCartographicGridProvider()),
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY,
    });

    const cleanupQuality = configureViewerQualityAndPerformance(viewer);

    // Защита при WebGL context loss и грешки в 3D рендерирането (P09)
    const detachWebGLHandlers = attachWebGLContextHandlers(
      viewer.scene.canvas,
      '3D географски терен',
      {
        onLost: () => {
          useCameraStore.getState().setIsPlayingRoute(false);
        },
        onRestored: () => {
          if (!viewer.isDestroyed()) viewer.scene.requestRender();
        },
      }
    );

    const removeRenderError = viewer.scene.renderError.addEventListener(
      (_scene: Cesium.Scene, error: Error) => {
        useCameraStore.getState().setIsPlayingRoute(false);
        useDiagnosticsStore.getState().reportIssue({
          id: 'cesium-render-error',
          category: 'webgl',
          severity: 'error',
          messageBg: 'Възникна грешка при 3D рендерирането на географската сцена.',
          detailBg: error?.message,
          recoverable: true,
        });
      }
    );

    const dataSource = new Cesium.CustomDataSource('via-diagonalis');
    void viewer.dataSources.add(dataSource);

    viewerRef.current = viewer;
    dataSourceRef.current = dataSource;
    cameraDirector.attach(viewer);

    cameraDirector.flyTo(useCameraStore.getState().target, setIsFlying);

    // Премахване на вградения рязък double-click скок на Cesium и замяна с плавен 3D фокус върху избрана точка на терена
    viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

    handler.setInputAction(
      (movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
        const picked = viewer.scene.pick(movement.position);
        if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
          const entityId = picked.id.id;
          if (entityId.startsWith('station:')) {
            const stationId = entityId.replace('station:', '');
            const found = useStationStore
              .getState()
              .stations.find((s) => s.id === stationId);
            if (found) {
              selectStation(found.id);
              setRouteProgress(found.routeProgressFraction);
              enterLocalInspection(found.coordinates, 1450);
              activateStationInspectionCard();
              return;
            }
          }
        }

        const terrainPt = cameraDirector.pickTerrainCoordinates(movement.position);
        if (terrainPt) {
          focusTerrainPoint({
            ...terrainPt,
            labelBg: `Избрана точка на терена (${terrainPt.lat.toFixed(4)}°, ${terrainPt.lon.toFixed(4)}°)`,
          });
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    // При click върху маркер: 1) Фокусира камерата, 2) Отваря инфо панела, 3) Показва историческото изображение, 4) Активира инспекционния режим
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(movement.position);
      if (!Cesium.defined(picked) || !(picked.id instanceof Cesium.Entity)) {
        setActiveSegmentId(null);
        viewer.scene.requestRender();
        return;
      }

      const entityId = picked.id.id;
      if (entityId.startsWith('station:')) {
        const stationId = entityId.replace('station:', '');
        const found = useStationStore.getState().stations.find((s) => s.id === stationId);
        if (found) {
          selectStation(found.id);
          setRouteProgress(found.routeProgressFraction);
          enterLocalInspection(
            found.coordinates,
            found.id === 'EXT-15' ? 6500 : 2800
          );
          activateStationInspectionCard();
        }
      } else if (entityId.startsWith('supp:')) {
        const nodeId = entityId.replace('supp:', '');
        const foundNode = useStationStore
          .getState()
          .supplementaryNodes.find((n) => n.id === nodeId);
        if (foundNode) {
          selectSupplementaryNode(foundNode.id);
          enterLocalInspection(foundNode.coordinates, 4200);
          activateStationInspectionCard();
        }
      } else if (
        entityId.startsWith('segment:') ||
        entityId.startsWith('segment-glow:')
      ) {
        const cleanId = entityId
          .replace('segment-glow:', '')
          .replace('segment:', '');
        setActiveSegmentId(cleanId);
        viewer.scene.requestRender();
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // При hover: показва името, номера, местоположението и историческия статус
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
      const picked = viewer.scene.pick(movement.endPosition);
      if (Cesium.defined(picked) && picked.id instanceof Cesium.Entity) {
        const entityId = picked.id.id;
        el.style.cursor = 'pointer';

        if (entityId.startsWith('station:')) {
          const stationId = entityId.replace('station:', '');
          const st = useStationStore.getState().stations.find((s) => s.id === stationId);
          if (st) {
            setHoveredMarker({
              titleBg: `${st.sequence}. ${st.historicalNameBg} (${st.projectName})`,
              modernLocationBg: st.modernLocationBg,
              statusBg: getIdentificationStatusLabelBg(st.identificationStatus),
              isHypothetical: st.identificationStatus === 'unconfirmed_exact_location',
              screenX: movement.endPosition.x,
              screenY: movement.endPosition.y,
            });
            setHoveredEntityLabel(null);
            return;
          }
        }

        setHoveredMarker(null);
        setHoveredEntityLabel(picked.id.name ?? null);
      } else {
        el.style.cursor = 'grab';
        setHoveredMarker(null);
        setHoveredEntityLabel(null);
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      setGlobeReady(false);
      removeRenderError();
      detachWebGLHandlers();
      cleanupQuality();
      handler.destroy();
      cameraDirector.detach();
      if (!viewer.isDestroyed()) {
        viewer.destroy();
      }
      viewerRef.current = null;
      dataSourceRef.current = null;
    };
  }, [
    activateStationInspectionCard,
    enterLocalInspection,
    focusTerrainPoint,
    selectStation,
    selectSupplementaryNode,
    setActiveSegmentId,
    setGlobeReady,
    setHoveredEntityLabel,
    setHoveredMarker,
    setIsFlying,
    setRouteProgress,
  ]);

  // Зареждане и повторно опитване (retry) на 3D терена с автоматичен резервен елипсоид при грешка
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    let cancelled = false;
    let detachTerrainMonitor: (() => void) | null = null;

    setTerrainSource('loading');
    void createConfiguredTerrainProvider(() => {
      if (cancelled || viewer.isDestroyed()) return;
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider();
      setTerrainSource('ellipsoid');
      viewer.scene.requestRender();
    }).then(({ provider, sourceKind, detachErrorListener }) => {
      if (cancelled || viewer.isDestroyed()) {
        detachErrorListener();
        return;
      }
      detachTerrainMonitor = detachErrorListener;
      viewer.terrainProvider = provider;
      setTerrainSource(sourceKind);
      setGlobeReady(true);
      viewer.scene.requestRender();
    });

    return () => {
      cancelled = true;
      detachTerrainMonitor?.();
    };
  }, [setGlobeReady, setTerrainSource, terrainRetryNonce]);

  // Базова офлайн картографска мрежа + външна сателитна/топографска подложка с мониторинг на грешки
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    viewer.imageryLayers.removeAll();
    viewer.imageryLayers.addImageryProvider(createOfflineCartographicGridProvider());

    let detachBasemapErrors: (() => void) | null = null;
    if (typeof navigator === 'undefined' || navigator.onLine) {
      const { provider, detachErrorListener } = createBasemapImageryProvider(basemap);
      detachBasemapErrors = detachErrorListener;
      viewer.imageryLayers.addImageryProvider(provider);
    }

    viewer.scene.requestRender();
    return () => {
      detachBasemapErrors?.();
    };
  }, [basemap, imageryRetryNonce]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;
    setViewerSunShadows(viewer, enableSunShadows);
  }, [enableSunShadows]);

  useEffect(() => {
    const ds = dataSourceRef.current;
    const viewer = viewerRef.current;
    if (!ds || !viewer || viewer.isDestroyed()) return;

    syncViaDiagonalisEntities(ds, {
      stations,
      segments,
      supplementaryNodes,
      rivers,
      regions,
      selectedStationId,
      showConfirmedSegments,
      showInferredSegments,
      showRiversAndGeography,
      showUncertaintyCircles,
      showSupplementaryNodes,
      isProgressiveReveal,
    });

    if (isProgressiveReveal) {
      const currentProgress = useCameraStore.getState().routeProgress;
      syncProgressiveRevealedRoad(
        ds,
        sliceCurvedRouteUpToProgress(Math.max(0.015, currentProgress))
      );
    }

    viewer.scene.requestRender();
  }, [
    isProgressiveReveal,
    regions,
    rivers,
    segments,
    selectedStationId,
    showConfirmedSegments,
    showInferredSegments,
    showRiversAndGeography,
    showSupplementaryNodes,
    showUncertaintyCircles,
    stations,
    supplementaryNodes,
  ]);

  // Постепенно визуализиране на каменния златист път при движение/прогресия
  useEffect(() => {
    const ds = dataSourceRef.current;
    const viewer = viewerRef.current;
    if (!ds || !viewer || viewer.isDestroyed()) return;

    if (!isProgressiveReveal) {
      syncProgressiveRevealedRoad(ds, null);
    } else {
      syncProgressiveRevealedRoad(
        ds,
        sliceCurvedRouteUpToProgress(Math.max(0.015, routeProgress))
      );
    }
    viewer.scene.requestRender();
  }, [isProgressiveReveal, routeProgress]);

  useEffect(() => {
    if (cameraMode !== 'overview') return;
    if (dataSourceRef.current) {
      syncTravellerObserverEntity(dataSourceRef.current, null);
    }
    cameraDirector.flyTo(target, setIsFlying);
  }, [cameraMode, flightNonce, target, setIsFlying]);

  useEffect(() => {
    if (cameraMode !== 'local-inspection') return;
    if (dataSourceRef.current) {
      syncTravellerObserverEntity(dataSourceRef.current, null);
    }
    const fallbackStation = stations.find((s) => s.id === selectedStationId) ?? stations[0];
    const center = inspectionCenter ?? fallbackStation?.coordinates;
    if (center) {
      cameraDirector.enterLocalStationInspection(center, inspectionRangeMeters, setIsFlying);
    }
  }, [
    cameraMode,
    inspectionCenter,
    inspectionRangeMeters,
    presetNonce,
    selectedStationId,
    setIsFlying,
    stations,
  ]);

  useEffect(() => {
    if (cameraMode !== 'local-inspection' || !isAutoOrbiting) return;
    let rafId = 0;
    let prev = performance.now();

    const tick = (now: number) => {
      const dtSec = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      cameraDirector.orbitAroundFocus(dtSec * 14);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cameraMode, isAutoOrbiting]);

  useEffect(() => {
    if (cameraMode !== 'third-person') return;
    const ds = dataSourceRef.current;
    if (!ds) return;

    const filterSeg = thirdPersonScope === 'selected-segment' ? activeSegmentId : null;
    const sample = sampleRouteAtProgress(routeProgress, filterSeg);
    const pitchForPreset = activeViewPreset === 'low-aerial' ? -18 : undefined;
    const observerPos = cameraDirector.updateThirdPersonObserver(
      sample,
      thirdPersonAltitudeMeters,
      thirdPersonHeadingOffsetDeg,
      pitchForPreset,
      setIsFlying
    );
    syncTravellerObserverEntity(ds, observerPos);

    // Автоматично синхронизира активната спирка при преминаване покрай нея в режим „Проследи маршрута“
    if (!filterSeg) {
      const allStations = useStationStore.getState().stations;
      let closest = allStations[0];
      let minDiff = Number.POSITIVE_INFINITY;
      for (const st of allStations) {
        const diff = Math.abs(st.routeProgressFraction - routeProgress);
        if (diff < minDiff) {
          minDiff = diff;
          closest = st;
        }
      }
      if (closest && minDiff < 0.035 && closest.id !== useStationStore.getState().selectedStationId) {
        selectStation(closest.id);
      }
    }
  }, [
    activeSegmentId,
    activeViewPreset,
    cameraMode,
    presetNonce,
    routeProgress,
    selectStation,
    setIsFlying,
    thirdPersonAltitudeMeters,
    thirdPersonHeadingOffsetDeg,
    thirdPersonScope,
  ]);

  useEffect(() => {
    if (cameraMode !== 'third-person' || !isPlayingRoute) return;
    let rafId = 0;
    let prev = performance.now();

    const step = (now: number) => {
      const dtSec = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      const state = useCameraStore.getState();
      const scopeFactor = state.thirdPersonScope === 'selected-segment' ? 0.08 : 0.024;
      const nextProgress = state.routeProgress + dtSec * scopeFactor * state.routeSpeedMultiplier;

      if (nextProgress >= 1) {
        state.setRouteProgress(1);
        state.setIsPlayingRoute(false);
        return;
      }

      state.setRouteProgress(nextProgress);
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [cameraMode, isPlayingRoute, routeSpeedMultiplier]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full touch-none select-none"
      aria-label="Интерактивна 3D географска среда на Via Diagonalis"
    />
  );
}
