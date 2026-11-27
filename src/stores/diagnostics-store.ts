import { create } from 'zustand';

export type DiagnosticCategory =
  | 'terrain'
  | 'imagery'
  | 'coordinates'
  | 'image'
  | 'webgl';

export interface DiagnosticIssue {
  id: string;
  category: DiagnosticCategory;
  severity: 'warning' | 'error';
  messageBg: string;
  detailBg?: string;
  recoverable: boolean;
  timestamp: number;
}

interface DiagnosticsStoreState {
  issues: DiagnosticIssue[];
  isOffline: boolean;
  terrainFallbackActive: boolean;
  imageryFallbackActive: boolean;
  webglContextLost: boolean;
  terrainRetryNonce: number;
  imageryRetryNonce: number;
  sceneResetNonce: number;
  fps: number;
  jsHeapMb: number | null;
  reportIssue: (issue: Omit<DiagnosticIssue, 'timestamp'>) => void;
  dismissIssue: (id: string) => void;
  clearCategory: (category: DiagnosticCategory) => void;
  setOffline: (offline: boolean) => void;
  setTerrainFallbackActive: (active: boolean) => void;
  setImageryFallbackActive: (active: boolean) => void;
  setWebglContextLost: (lost: boolean) => void;
  triggerTerrainRetry: () => void;
  triggerImageryRetry: () => void;
  triggerSceneReset: () => void;
  updatePerformanceMetrics: (fps: number, jsHeapMb: number | null) => void;
}

export const useDiagnosticsStore = create<DiagnosticsStoreState>((set) => ({
  issues: [],
  isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  terrainFallbackActive: false,
  imageryFallbackActive: false,
  webglContextLost: false,
  terrainRetryNonce: 0,
  imageryRetryNonce: 0,
  sceneResetNonce: 0,
  fps: 60,
  jsHeapMb: null,
  reportIssue: (incoming) =>
    set((state) => {
      const existingIdx = state.issues.findIndex((item) => item.id === incoming.id);
      const nextItem: DiagnosticIssue = { ...incoming, timestamp: Date.now() };
      if (existingIdx >= 0) {
        const copy = [...state.issues];
        copy[existingIdx] = nextItem;
        return { issues: copy };
      }
      return { issues: [...state.issues.slice(-7), nextItem] };
    }),
  dismissIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((item) => item.id !== id),
    })),
  clearCategory: (category) =>
    set((state) => ({
      issues: state.issues.filter((item) => item.category !== category),
    })),
  setOffline: (isOffline) => set({ isOffline }),
  setTerrainFallbackActive: (terrainFallbackActive) => set({ terrainFallbackActive }),
  setImageryFallbackActive: (imageryFallbackActive) => set({ imageryFallbackActive }),
  setWebglContextLost: (webglContextLost) => set({ webglContextLost }),
  triggerTerrainRetry: () =>
    set((s) => ({
      terrainRetryNonce: s.terrainRetryNonce + 1,
      terrainFallbackActive: false,
      issues: s.issues.filter((i) => i.category !== 'terrain'),
    })),
  triggerImageryRetry: () =>
    set((s) => ({
      imageryRetryNonce: s.imageryRetryNonce + 1,
      imageryFallbackActive: false,
      issues: s.issues.filter((i) => i.category !== 'imagery'),
    })),
  triggerSceneReset: () =>
    set((s) => ({
      sceneResetNonce: s.sceneResetNonce + 1,
      webglContextLost: false,
      issues: s.issues.filter((i) => i.category !== 'webgl'),
    })),
  updatePerformanceMetrics: (fps, jsHeapMb) => set({ fps, jsHeapMb }),
}));
