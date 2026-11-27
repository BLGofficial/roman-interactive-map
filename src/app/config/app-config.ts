import type { BasemapStyle, CameraTarget } from '@/types';

const rawIonToken = (import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined)?.trim() ?? '';

export const APP_CONFIG = {
  appTitleBg: 'VIA DIAGONALIS — Интерактивен исторически изследовател',
  appSubtitleBg: 'Римска Тракия около 117 г. сл. Хр. · От Филипопол до Византион',
  targetYearAd: Number(import.meta.env.VITE_DEFAULT_YEAR ?? 117),
  romanMileToKm: 1.48,
  cesium: {
    ionToken: rawIonToken,
    hasIonToken: rawIonToken.length > 0,
    arcgisWorldElevationUrl:
      'https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer',
    verticalExaggeration: 1.35,
    basemapUrls: {
      satellite:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      topographic: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
      dark: 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    } satisfies Record<BasemapStyle, string>,
    basemapProvenanceBg: {
      satellite: 'Реална съвременна сателитна фотография (Esri) + 3D DEM релеф',
      topographic: 'Топографска изохипсна карта (OpenTopoMap) + 3D DEM релеф',
      dark: 'Картографска подложка с висок контраст (CARTO) + 3D DEM релеф',
    } satisfies Record<BasemapStyle, string>,
  },
  cameraPresets: {
    fullCorridor: {
      lat: 39.75,
      lon: 26.85,
      altitudeMeters: 375000,
      headingDegrees: 0,
      pitchDegrees: -56,
      durationSeconds: 1.7,
    } satisfies CameraTarget,
    bulgarianSector: {
      lat: 41.32,
      lon: 25.48,
      altitudeMeters: 145000,
      headingDegrees: 6,
      pitchDegrees: -48,
      durationSeconds: 1.5,
    } satisfies CameraTarget,
    easternThrace: {
      lat: 40.58,
      lon: 27.55,
      altitudeMeters: 185000,
      headingDegrees: -8,
      pitchDegrees: -48,
      durationSeconds: 1.6,
    } satisfies CameraTarget,
    easternTerminus: {
      lat: 40.82,
      lon: 28.9759,
      altitudeMeters: 32000,
      headingDegrees: 0,
      pitchDegrees: -46,
      durationSeconds: 1.6,
    } satisfies CameraTarget,
  },
} as const;
