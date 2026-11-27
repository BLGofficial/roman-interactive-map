import { useCallback, useEffect } from 'react';
import { cameraDirector } from '@/engine/camera/CameraDirector';
import { useStationStore } from '@/stores/station-store';
import { useCameraStore } from '@/stores/camera-store';
import { useInterfaceStore } from '@/stores/interface-store';
import { useMapStore } from '@/stores/map-store';

export function useSelectedStation() {
  const stations = useStationStore((s) => s.stations);
  const selectedStationId = useStationStore((s) => s.selectedStationId);
  const selectStation = useStationStore((s) => s.selectStation);
  const selectNextStation = useStationStore((s) => s.selectNextStation);
  const selectPreviousStation = useStationStore((s) => s.selectPreviousStation);

  const enterLocalInspection = useCameraStore((s) => s.enterLocalInspection);
  const exitInspectionSmoothly = useCameraStore((s) => s.exitInspectionSmoothly);
  const applyViewPreset = useCameraStore((s) => s.applyViewPreset);
  const setRouteProgress = useCameraStore((s) => s.setRouteProgress);
  const returnToRouteOverview = useCameraStore((s) => s.returnToRouteOverview);
  const togglePlayRoute = useCameraStore((s) => s.togglePlayRoute);

  const closeGallery = useInterfaceStore((s) => s.closeGallery);
  const closeGuideModal = useInterfaceStore((s) => s.closeGuideModal);
  const closeAllOverlays = useInterfaceStore((s) => s.closeAllOverlays);
  const isGalleryOpen = useInterfaceStore((s) => s.isGalleryOpen);
  const isGuideModalOpen = useInterfaceStore((s) => s.isGuideModalOpen);
  const isHomeIntroOpen = useInterfaceStore((s) => s.isHomeIntroOpen);
  const isChronologyOpen = useInterfaceStore((s) => s.isChronologyOpen);
  const isAboutOpen = useInterfaceStore((s) => s.isAboutOpen);
  const isMobileStationsOpen = useInterfaceStore((s) => s.isMobileStationsOpen);
  const isMobileInspectorOpen = useInterfaceStore((s) => s.isMobileInspectorOpen);
  const setMobileStationsOpen = useInterfaceStore((s) => s.setMobileStationsOpen);
  const setMobileInspectorOpen = useInterfaceStore((s) => s.setMobileInspectorOpen);
  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const activateStationInspectionCard = useInterfaceStore(
    (s) => s.activateStationInspectionCard
  );

  const setActiveSegmentId = useMapStore((s) => s.setActiveSegmentId);

  const selectedStation =
    stations.find((st) => st.id === selectedStationId) ?? stations[0];

  const focusStation = useCallback(
    (stationId: string) => {
      const target = stations.find((st) => st.id === stationId);
      if (!target) return;
      selectStation(target.id);
      setRouteProgress(target.routeProgressFraction);
      enterLocalInspection(
        target.coordinates,
        target.id === 'EXT-15' ? 4800 : 1850
      );
      activateStationInspectionCard();
    },
    [
      activateStationInspectionCard,
      enterLocalInspection,
      selectStation,
      setRouteProgress,
      stations,
    ]
  );

  const goNext = useCallback(() => {
    const next = selectNextStation();
    if (next) {
      setRouteProgress(next.routeProgressFraction);
      enterLocalInspection(next.coordinates, next.id === 'EXT-15' ? 4800 : 1850);
      activateStationInspectionCard();
    }
  }, [
    activateStationInspectionCard,
    enterLocalInspection,
    selectNextStation,
    setRouteProgress,
  ]);

  const goPrevious = useCallback(() => {
    const prev = selectPreviousStation();
    if (prev) {
      setRouteProgress(prev.routeProgressFraction);
      enterLocalInspection(prev.coordinates, prev.id === 'EXT-15' ? 4800 : 1850);
      activateStationInspectionCard();
    }
  }, [
    activateStationInspectionCard,
    enterLocalInspection,
    selectPreviousStation,
    setRouteProgress,
  ]);

  // Непрекъснато плавно движение с WASD и Arrow keys + дискретни клавишни команди (Escape, Q/E, 1..5)
  useEffect(() => {
    const pressedMoveKeys = new Set<string>();
    let rafId = 0;
    let lastTs = 0;

    const stepSmoothMovement = (now: number) => {
      if (pressedMoveKeys.size === 0) {
        rafId = 0;
        return;
      }

      const dtSec = lastTs > 0 ? Math.min(0.06, (now - lastTs) / 1000) : 0.016;
      lastTs = now;

      let forward = 0;
      let right = 0;
      if (pressedMoveKeys.has('w') || pressedMoveKeys.has('arrowup')) forward += 1;
      if (pressedMoveKeys.has('s') || pressedMoveKeys.has('arrowdown')) forward -= 1;
      if (pressedMoveKeys.has('d') || pressedMoveKeys.has('arrowright')) right += 1;
      if (pressedMoveKeys.has('a') || pressedMoveKeys.has('arrowleft')) right -= 1;

      if (forward !== 0 || right !== 0) {
        cameraDirector.glideOverTerrain(forward, right, dtSec);
      }

      if (pressedMoveKeys.has('q')) {
        cameraDirector.orbitAroundFocus(-55 * dtSec);
      }
      if (pressedMoveKeys.has('e')) {
        cameraDirector.orbitAroundFocus(55 * dtSec);
      }

      rafId = requestAnimationFrame(stepSmoothMovement);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        if (
          isGalleryOpen ||
          isGuideModalOpen ||
          isHomeIntroOpen ||
          isChronologyOpen ||
          isAboutOpen
        ) {
          closeAllOverlays();
          return;
        }
        if (isMobileStationsOpen) {
          setMobileStationsOpen(false);
          return;
        }
        if (isMobileInspectorOpen) {
          setMobileInspectorOpen(false);
          return;
        }
        const mapState = useMapStore.getState();
        if (mapState.activeSegmentId) {
          setActiveSegmentId(null);
          return;
        }
        if (useCameraStore.getState().cameraMode !== 'overview') {
          exitInspectionSmoothly();
        }
        return;
      }

      if (
        isGalleryOpen ||
        isGuideModalOpen ||
        isHomeIntroOpen ||
        isChronologyOpen ||
        isAboutOpen ||
        viewportMode !== 'map'
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      if (
        key === 'w' ||
        key === 'a' ||
        key === 's' ||
        key === 'd' ||
        key === 'arrowup' ||
        key === 'arrowdown' ||
        key === 'arrowleft' ||
        key === 'arrowright' ||
        key === 'q' ||
        key === 'e'
      ) {
        if (key.startsWith('arrow')) e.preventDefault();
        pressedMoveKeys.add(key);
        if (!rafId) {
          lastTs = performance.now();
          rafId = requestAnimationFrame(stepSmoothMovement);
        }
        return;
      }

      switch (key) {
        case '+':
        case '=':
          cameraDirector.zoomByFactor(0.75);
          break;
        case '-':
        case '_':
          cameraDirector.zoomByFactor(1.32);
          break;
        case 'n':
          cameraDirector.alignNorth();
          break;
        case 'r': {
          const camState = useCameraStore.getState();
          cameraDirector.resetForMode(
            camState.cameraMode,
            camState.target,
            camState.inspectionCenter,
            camState.setIsFlying
          );
          break;
        }
        case 'f':
          if (selectedStation) {
            enterLocalInspection(
              selectedStation.coordinates,
              selectedStation.id === 'EXT-15' ? 4800 : 1850
            );
          }
          break;
        case 'o':
          returnToRouteOverview();
          break;
        case '1':
          applyViewPreset('regional-overview', selectedStation?.coordinates);
          break;
        case '2':
          applyViewPreset('birds-eye', selectedStation?.coordinates);
          break;
        case '3':
          applyViewPreset('low-aerial', selectedStation?.coordinates);
          break;
        case '4':
          applyViewPreset('third-person', selectedStation?.coordinates);
          break;
        case '5':
          applyViewPreset('local-inspection', selectedStation?.coordinates);
          break;
        case '[':
          goPrevious();
          break;
        case ']':
          goNext();
          break;
        case ' ':
          if (useCameraStore.getState().cameraMode === 'third-person') {
            e.preventDefault();
            togglePlayRoute();
          }
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      pressedMoveKeys.delete(e.key.toLowerCase());
    };

    const onBlur = () => {
      pressedMoveKeys.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [
    applyViewPreset,
    closeAllOverlays,
    closeGallery,
    closeGuideModal,
    enterLocalInspection,
    exitInspectionSmoothly,
    goNext,
    goPrevious,
    isAboutOpen,
    isChronologyOpen,
    isGalleryOpen,
    isGuideModalOpen,
    isHomeIntroOpen,
    isMobileInspectorOpen,
    isMobileStationsOpen,
    returnToRouteOverview,
    selectedStation,
    setActiveSegmentId,
    setMobileInspectorOpen,
    setMobileStationsOpen,
    togglePlayRoute,
    viewportMode,
  ]);

  return {
    stations,
    selectedStation,
    focusStation,
    goNext,
    goPrevious,
  };
}
