import type { ComponentType } from 'react';
import type { Scene3dType, StationResolved } from './domain';

export type BasemapStyle = 'satellite' | 'topographic' | 'dark';

export type ActiveViewportMode = 'map' | 'scene3d';

export type GeographicCameraMode = 'overview' | 'third-person' | 'local-inspection';

/**
 * Петте предварително зададени изгледа на камерата (P06):
 * - regional-overview: Регионален обзор
 * - birds-eye: Птичи поглед
 * - low-aerial: Нисък въздушен изглед
 * - third-person: Трето лице
 * - local-inspection: Локален инспекционен изглед
 */
export type CameraViewPresetId =
  | 'regional-overview'
  | 'birds-eye'
  | 'low-aerial'
  | 'third-person'
  | 'local-inspection';

export type CameraPresetId =
  | 'full-corridor'
  | 'bulgarian-sector'
  | 'eastern-thrace'
  | 'eastern-terminus'
  | 'station-focus';

export type ThirdPersonRouteScope = 'full-route' | 'selected-segment';

export interface CameraTarget {
  lat: number;
  lon: number;
  altitudeMeters: number;
  headingDegrees: number;
  pitchDegrees: number;
  durationSeconds?: number;
}

export interface TerrainFocusPoint {
  lat: number;
  lon: number;
  elevationMeters: number;
  labelBg: string;
}

export interface RouteTravellerSample {
  lat: number;
  lon: number;
  elevationMeters: number;
  headingDegrees: number;
  distanceKm: number;
  totalDistanceKm: number;
  nearestSegmentTitleBg: string;
}

export interface SceneComponentProps {
  station: StationResolved;
  showStratigraphyCutaway: boolean;
  showEpistemologicalLabels: boolean;
}

export interface SceneDescriptor {
  sceneType: Scene3dType;
  titleBg: string;
  subtitleBg: string;
  defaultCameraPosition: [number, number, number];
  Component: ComponentType<SceneComponentProps>;
}
