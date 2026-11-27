import { create } from 'zustand';
import { APP_CONFIG } from '@/app/config/app-config';
import type {
  CameraPresetId,
  CameraTarget,
  CameraViewPresetId,
  CoordinateRecord,
  GeographicCameraMode,
  TerrainFocusPoint,
  ThirdPersonRouteScope,
} from '@/types';

interface CameraStoreState {
  cameraMode: GeographicCameraMode;
  activeViewPreset: CameraViewPresetId;
  activePreset: CameraPresetId;
  target: CameraTarget;
  flightNonce: number;
  presetNonce: number;
  isFlying: boolean;

  // Произволна фокусна точка върху терена (напр. при двоен клик)
  customFocusPoint: TerrainFocusPoint | null;

  // Режим Трето лице / Въздушно следване
  routeProgress: number;
  isPlayingRoute: boolean;
  routeSpeedMultiplier: 0.5 | 1 | 2 | 4;
  thirdPersonAltitudeMeters: number;
  thirdPersonHeadingOffsetDeg: number;
  thirdPersonScope: ThirdPersonRouteScope;

  // Инспекционен режим
  inspectionCenter: CoordinateRecord | null;
  inspectionRangeMeters: number;
  isAutoOrbiting: boolean;

  applyViewPreset: (
    viewPreset: CameraViewPresetId,
    anchorCoord?: CoordinateRecord
  ) => void;
  setCameraMode: (mode: GeographicCameraMode, centerForInspection?: CoordinateRecord) => void;
  flyToPreset: (preset: Exclude<CameraPresetId, 'station-focus'>) => void;
  flyToCoordinates: (coord: CoordinateRecord, altitudeMeters?: number) => void;
  focusTerrainPoint: (point: TerrainFocusPoint) => void;
  clearCustomFocusPoint: () => void;
  enterLocalInspection: (coord: CoordinateRecord, rangeMeters?: number) => void;
  exitInspectionSmoothly: () => void;
  returnToRouteOverview: () => void;
  setRouteProgress: (progress: number) => void;
  togglePlayRoute: () => void;
  setIsPlayingRoute: (playing: boolean) => void;
  setRouteSpeedMultiplier: (speed: 0.5 | 1 | 2 | 4) => void;
  setThirdPersonAltitudeMeters: (altitude: number) => void;
  addThirdPersonHeadingOffset: (deltaDeg: number) => void;
  resetThirdPersonOrientation: () => void;
  setThirdPersonScope: (scope: ThirdPersonRouteScope) => void;
  toggleAutoOrbit: () => void;
  setIsFlying: (isFlying: boolean) => void;
}

export const useCameraStore = create<CameraStoreState>((set) => ({
  cameraMode: 'overview',
  activeViewPreset: 'regional-overview',
  activePreset: 'full-corridor',
  target: APP_CONFIG.cameraPresets.fullCorridor,
  flightNonce: 1,
  presetNonce: 1,
  isFlying: false,

  customFocusPoint: null,

  routeProgress: 0,
  isPlayingRoute: false,
  routeSpeedMultiplier: 1,
  thirdPersonAltitudeMeters: 2600,
  thirdPersonHeadingOffsetDeg: 0,
  thirdPersonScope: 'full-route',

  inspectionCenter: null,
  inspectionRangeMeters: 1850,
  isAutoOrbiting: false,

  applyViewPreset: (viewPreset, anchorCoord) =>
    set((state) => {
      const refCoord = anchorCoord ??
        state.inspectionCenter ?? {
          lat: 42.1474,
          lon: 24.7491,
          elevationMeters: 168,
          uncertaintyRadiusKm: 0.5,
          pleiadesId: '216927',
          precision: 'exact_excavated_site',
          sourceBg: '',
        };

      if (viewPreset === 'regional-overview') {
        return {
          cameraMode: 'overview',
          activeViewPreset: 'regional-overview',
          activePreset: 'full-corridor',
          isPlayingRoute: false,
          isAutoOrbiting: false,
          target: APP_CONFIG.cameraPresets.fullCorridor,
          flightNonce: state.flightNonce + 1,
          presetNonce: state.presetNonce + 1,
        };
      }

      if (viewPreset === 'birds-eye') {
        return {
          cameraMode: 'overview',
          activeViewPreset: 'birds-eye',
          activePreset: 'station-focus',
          isPlayingRoute: false,
          isAutoOrbiting: false,
          inspectionCenter: refCoord,
          target: {
            lat: refCoord.lat - 0.04,
            lon: refCoord.lon,
            altitudeMeters: 68000,
            headingDegrees: 0,
            pitchDegrees: -82,
            durationSeconds: 1.5,
          },
          flightNonce: state.flightNonce + 1,
          presetNonce: state.presetNonce + 1,
        };
      }

      if (viewPreset === 'low-aerial') {
        return {
          cameraMode: 'third-person',
          activeViewPreset: 'low-aerial',
          isAutoOrbiting: false,
          thirdPersonAltitudeMeters: 950,
          inspectionCenter: refCoord,
          presetNonce: state.presetNonce + 1,
        };
      }

      if (viewPreset === 'third-person') {
        return {
          cameraMode: 'third-person',
          activeViewPreset: 'third-person',
          isAutoOrbiting: false,
          thirdPersonAltitudeMeters: 2600,
          inspectionCenter: refCoord,
          presetNonce: state.presetNonce + 1,
        };
      }

      return {
        cameraMode: 'local-inspection',
        activeViewPreset: 'local-inspection',
        activePreset: 'station-focus',
        isPlayingRoute: false,
        inspectionCenter: refCoord,
        inspectionRangeMeters: 1850,
        presetNonce: state.presetNonce + 1,
      };
    }),

  setCameraMode: (mode, centerForInspection) =>
    set((state) => {
      if (mode === 'overview') {
        return {
          cameraMode: 'overview',
          activeViewPreset: 'regional-overview',
          isPlayingRoute: false,
          isAutoOrbiting: false,
          activePreset: 'full-corridor',
          target: APP_CONFIG.cameraPresets.fullCorridor,
          flightNonce: state.flightNonce + 1,
        };
      }
      if (mode === 'third-person') {
        return {
          cameraMode: 'third-person',
          activeViewPreset: 'third-person',
          isAutoOrbiting: false,
          thirdPersonHeadingOffsetDeg: 0,
          presetNonce: state.presetNonce + 1,
        };
      }
      return {
        cameraMode: 'local-inspection',
        activeViewPreset: 'local-inspection',
        isPlayingRoute: false,
        inspectionCenter: centerForInspection ?? state.inspectionCenter,
        inspectionRangeMeters: 1850,
        presetNonce: state.presetNonce + 1,
      };
    }),

  flyToPreset: (preset) =>
    set((state) => {
      const presetTarget =
        preset === 'full-corridor'
          ? APP_CONFIG.cameraPresets.fullCorridor
          : preset === 'eastern-thrace'
            ? APP_CONFIG.cameraPresets.easternThrace
            : preset === 'eastern-terminus'
              ? APP_CONFIG.cameraPresets.easternTerminus
              : APP_CONFIG.cameraPresets.bulgarianSector;

      return {
        cameraMode: 'overview',
        activeViewPreset: 'regional-overview',
        isPlayingRoute: false,
        isAutoOrbiting: false,
        activePreset: preset,
        target: presetTarget,
        flightNonce: state.flightNonce + 1,
      };
    }),

  flyToCoordinates: (coord, altitudeMeters = 14000) =>
    set((state) => ({
      cameraMode: 'overview',
      activeViewPreset: 'regional-overview',
      isPlayingRoute: false,
      isAutoOrbiting: false,
      activePreset: 'station-focus',
      inspectionCenter: coord,
      target: {
        lat: coord.lat - 0.055,
        lon: coord.lon,
        altitudeMeters,
        headingDegrees: 0,
        pitchDegrees: -42,
        durationSeconds: 1.4,
      },
      flightNonce: state.flightNonce + 1,
    })),

  focusTerrainPoint: (point) =>
    set((state) => ({
      customFocusPoint: point,
      cameraMode: 'local-inspection',
      activeViewPreset: 'local-inspection',
      isPlayingRoute: false,
      isAutoOrbiting: false,
      inspectionCenter: {
        lat: point.lat,
        lon: point.lon,
        elevationMeters: point.elevationMeters,
        uncertaintyRadiusKm: 0,
        pleiadesId: null,
        precision: 'exact_excavated_site',
        sourceBg: point.labelBg,
      },
      inspectionRangeMeters: 2200,
      presetNonce: state.presetNonce + 1,
    })),

  clearCustomFocusPoint: () => set({ customFocusPoint: null }),

  enterLocalInspection: (coord, rangeMeters = 1850) =>
    set((state) => ({
      customFocusPoint: null,
      cameraMode: 'local-inspection',
      activeViewPreset: 'local-inspection',
      isPlayingRoute: false,
      activePreset: 'station-focus',
      inspectionCenter: coord,
      inspectionRangeMeters: rangeMeters,
      presetNonce: state.presetNonce + 1,
    })),

  exitInspectionSmoothly: () =>
    set((state) => {
      const c = state.inspectionCenter;
      if (!c) {
        return {
          customFocusPoint: null,
          cameraMode: 'overview',
          activeViewPreset: 'regional-overview',
          isAutoOrbiting: false,
          target: APP_CONFIG.cameraPresets.bulgarianSector,
          flightNonce: state.flightNonce + 1,
        };
      }
      return {
        customFocusPoint: null,
        cameraMode: 'overview',
        activeViewPreset: 'regional-overview',
        isAutoOrbiting: false,
        target: {
          lat: c.lat - 0.22,
          lon: c.lon,
          altitudeMeters: 48000,
          headingDegrees: 0,
          pitchDegrees: -48,
          durationSeconds: 1.35,
        },
        flightNonce: state.flightNonce + 1,
      };
    }),

  returnToRouteOverview: () =>
    set((state) => ({
      customFocusPoint: null,
      cameraMode: 'overview',
      activeViewPreset: 'regional-overview',
      isPlayingRoute: false,
      isAutoOrbiting: false,
      activePreset: 'full-corridor',
      target: APP_CONFIG.cameraPresets.fullCorridor,
      flightNonce: state.flightNonce + 1,
    })),

  setRouteProgress: (progress) =>
    set({ routeProgress: Math.min(1, Math.max(0, progress)) }),

  togglePlayRoute: () => set((s) => ({ isPlayingRoute: !s.isPlayingRoute })),

  setIsPlayingRoute: (isPlayingRoute) => set({ isPlayingRoute }),

  setRouteSpeedMultiplier: (routeSpeedMultiplier) => set({ routeSpeedMultiplier }),

  setThirdPersonAltitudeMeters: (altitude) =>
    set({ thirdPersonAltitudeMeters: Math.min(25000, Math.max(350, altitude)) }),

  addThirdPersonHeadingOffset: (deltaDeg) =>
    set((s) => ({
      thirdPersonHeadingOffsetDeg: (s.thirdPersonHeadingOffsetDeg + deltaDeg + 360) % 360,
    })),

  resetThirdPersonOrientation: () =>
    set({ thirdPersonHeadingOffsetDeg: 0, thirdPersonAltitudeMeters: 2600 }),

  setThirdPersonScope: (thirdPersonScope) =>
    set({ thirdPersonScope, routeProgress: 0, isPlayingRoute: false }),

  toggleAutoOrbit: () => set((s) => ({ isAutoOrbiting: !s.isAutoOrbiting })),

  setIsFlying: (isFlying: boolean) => set({ isFlying }),
}));
