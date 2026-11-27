import { create } from 'zustand';
import { loadAllStations } from '@/features/stations/station-loader';
import { loadRouteSegments, loadSupplementaryNodes } from '@/features/route/route-loader';
import type {
  RouteSegmentResolved,
  StationResolved,
  SupplementaryNodeResolved,
} from '@/types';

export type StationConfidenceFilter = 'ALL' | 'CONFIRMED' | 'HYPOTHETICAL';

interface StationStoreState {
  stations: StationResolved[];
  segments: RouteSegmentResolved[];
  supplementaryNodes: SupplementaryNodeResolved[];
  selectedStationId: string;
  selectedSupplementaryId: string | null;
  confidenceFilter: StationConfidenceFilter;
  searchQuery: string;
  selectStation: (stationId: string) => void;
  selectSupplementaryNode: (nodeId: string | null) => void;
  selectNextStation: () => StationResolved | undefined;
  selectPreviousStation: () => StationResolved | undefined;
  setConfidenceFilter: (filter: StationConfidenceFilter) => void;
  setSearchQuery: (query: string) => void;
}

const initialStations = loadAllStations();
const primaryIds = new Set(initialStations.map((s) => s.id));
const initialSegments = loadRouteSegments();
const initialSupplementary = loadSupplementaryNodes(primaryIds);

export const useStationStore = create<StationStoreState>((set, get) => ({
  stations: initialStations,
  segments: initialSegments,
  supplementaryNodes: initialSupplementary,
  selectedStationId: initialStations[0]?.id ?? 'STOP-01',
  selectedSupplementaryId: null,
  confidenceFilter: 'ALL',
  searchQuery: '',
  selectStation: (selectedStationId) =>
    set({ selectedStationId, selectedSupplementaryId: null }),
  selectSupplementaryNode: (selectedSupplementaryId) =>
    set({ selectedSupplementaryId }),
  selectNextStation: () => {
    const { stations, selectedStationId } = get();
    const idx = stations.findIndex((s) => s.id === selectedStationId);
    const next = stations[Math.min(stations.length - 1, idx + 1)] ?? stations[0];
    if (next) set({ selectedStationId: next.id, selectedSupplementaryId: null });
    return next;
  },
  selectPreviousStation: () => {
    const { stations, selectedStationId } = get();
    const idx = stations.findIndex((s) => s.id === selectedStationId);
    const prev = stations[Math.max(0, idx - 1)] ?? stations[0];
    if (prev) set({ selectedStationId: prev.id, selectedSupplementaryId: null });
    return prev;
  },
  setConfidenceFilter: (confidenceFilter) => set({ confidenceFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
