import { create } from 'zustand';
import type { BasemapStyle } from '@/types';

export type TerrainSourceKind = 'loading' | 'cesium-world-terrain' | 'arcgis-dem-3d' | 'ellipsoid';

export interface HoveredMarkerTooltip {
  titleBg: string;
  modernLocationBg: string;
  statusBg: string;
  isHypothetical: boolean;
  screenX: number;
  screenY: number;
}

interface MapStoreState {
  basemap: BasemapStyle;
  terrainSource: TerrainSourceKind;
  enableSunShadows: boolean;
  showConfirmedSegments: boolean;
  showInferredSegments: boolean;
  showRiversAndGeography: boolean;
  showUncertaintyCircles: boolean;
  showSupplementaryNodes: boolean;
  isProgressiveReveal: boolean;
  isGlobeReady: boolean;
  hoveredMarker: HoveredMarkerTooltip | null;
  hoveredEntityLabelBg: string | null;
  activeSegmentId: string | null;
  setBasemap: (basemap: BasemapStyle) => void;
  setTerrainSource: (source: TerrainSourceKind) => void;
  toggleSunShadows: () => void;
  toggleConfirmedSegments: () => void;
  toggleInferredSegments: () => void;
  toggleRiversAndGeography: () => void;
  toggleUncertaintyCircles: () => void;
  toggleSupplementaryNodes: () => void;
  setProgressiveReveal: (enabled: boolean) => void;
  setGlobeReady: (ready: boolean) => void;
  setHoveredMarker: (tooltip: HoveredMarkerTooltip | null) => void;
  setHoveredEntityLabel: (label: string | null) => void;
  setActiveSegmentId: (segmentId: string | null) => void;
}

export const useMapStore = create<MapStoreState>((set) => ({
  basemap: 'satellite',
  terrainSource: 'loading',
  enableSunShadows: true,
  showConfirmedSegments: true,
  showInferredSegments: true,
  showRiversAndGeography: true,
  showUncertaintyCircles: true,
  showSupplementaryNodes: true,
  isProgressiveReveal: false,
  isGlobeReady: false,
  hoveredMarker: null,
  hoveredEntityLabelBg: null,
  activeSegmentId: null,
  setBasemap: (basemap) => set({ basemap }),
  setTerrainSource: (terrainSource) => set({ terrainSource }),
  toggleSunShadows: () => set((s) => ({ enableSunShadows: !s.enableSunShadows })),
  toggleConfirmedSegments: () =>
    set((s) => ({ showConfirmedSegments: !s.showConfirmedSegments })),
  toggleInferredSegments: () =>
    set((s) => ({ showInferredSegments: !s.showInferredSegments })),
  toggleRiversAndGeography: () =>
    set((s) => ({ showRiversAndGeography: !s.showRiversAndGeography })),
  toggleUncertaintyCircles: () =>
    set((s) => ({ showUncertaintyCircles: !s.showUncertaintyCircles })),
  toggleSupplementaryNodes: () =>
    set((s) => ({ showSupplementaryNodes: !s.showSupplementaryNodes })),
  setProgressiveReveal: (isProgressiveReveal) => set({ isProgressiveReveal }),
  setGlobeReady: (isGlobeReady) => set({ isGlobeReady }),
  setHoveredMarker: (hoveredMarker) => set({ hoveredMarker }),
  setHoveredEntityLabel: (hoveredEntityLabelBg) => set({ hoveredEntityLabelBg }),
  setActiveSegmentId: (activeSegmentId) => set({ activeSegmentId }),
}));
