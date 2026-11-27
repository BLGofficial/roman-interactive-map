import { create } from 'zustand';
import type { ActiveViewportMode } from '@/types';

export type InspectionTab = 'overview' | 'epistemology' | 'archaeology';

export type NavSectionId = 'home' | 'route' | 'stops' | 'chronology' | 'about';

interface InterfaceStoreState {
  viewportMode: ActiveViewportMode;
  activeNavSection: NavSectionId;
  inspectionTab: InspectionTab;
  isHomeIntroOpen: boolean;
  isChronologyOpen: boolean;
  isAboutOpen: boolean;
  isGalleryOpen: boolean;
  isGuideModalOpen: boolean;
  isLightboxFullscreen: boolean;
  activeReferenceKey: string | null;
  showStratigraphyCutaway: boolean;
  showEpistemologicalLabels: boolean;
  isDesktopLeftOpen: boolean;
  isDesktopRightOpen: boolean;
  isMobileStationsOpen: boolean;
  isMobileInspectorOpen: boolean;
  stationFocusHighlightNonce: number;
  setViewportMode: (mode: ActiveViewportMode) => void;
  setActiveNavSection: (section: NavSectionId) => void;
  setInspectionTab: (tab: InspectionTab) => void;
  setHomeIntroOpen: (open: boolean) => void;
  setChronologyOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  openGallery: (referenceKey?: string, startInLightbox?: boolean) => void;
  closeGallery: () => void;
  openGuideModal: () => void;
  closeGuideModal: () => void;
  setLightboxFullscreen: (fullscreen: boolean) => void;
  setActiveReferenceKey: (key: string) => void;
  toggleStratigraphyCutaway: () => void;
  toggleEpistemologicalLabels: () => void;
  setDesktopLeftOpen: (open: boolean) => void;
  setDesktopRightOpen: (open: boolean) => void;
  setMobileStationsOpen: (open: boolean) => void;
  setMobileInspectorOpen: (open: boolean) => void;
  activateStationInspectionCard: () => void;
  closeAllOverlays: () => void;
}

export const useInterfaceStore = create<InterfaceStoreState>((set) => ({
  viewportMode: 'map',
  activeNavSection: 'route',
  inspectionTab: 'overview',
  isHomeIntroOpen: false,
  isChronologyOpen: false,
  isAboutOpen: false,
  isGalleryOpen: false,
  isGuideModalOpen: false,
  isLightboxFullscreen: false,
  activeReferenceKey: null,
  showStratigraphyCutaway: true,
  showEpistemologicalLabels: true,
  isDesktopLeftOpen: true,
  isDesktopRightOpen: true,
  isMobileStationsOpen: false,
  isMobileInspectorOpen: false,
  stationFocusHighlightNonce: 0,
  setViewportMode: (viewportMode) => set({ viewportMode }),
  setActiveNavSection: (activeNavSection) => set({ activeNavSection }),
  setInspectionTab: (inspectionTab) => set({ inspectionTab }),
  setHomeIntroOpen: (isHomeIntroOpen) =>
    set({
      isHomeIntroOpen,
      ...(isHomeIntroOpen
        ? {
            activeNavSection: 'home',
            isChronologyOpen: false,
            isAboutOpen: false,
            isGalleryOpen: false,
            isGuideModalOpen: false,
          }
        : {}),
    }),
  setChronologyOpen: (isChronologyOpen) =>
    set({
      isChronologyOpen,
      ...(isChronologyOpen
        ? {
            activeNavSection: 'chronology',
            isHomeIntroOpen: false,
            isAboutOpen: false,
            isGalleryOpen: false,
            isGuideModalOpen: false,
          }
        : { activeNavSection: 'route' }),
    }),
  setAboutOpen: (isAboutOpen) =>
    set({
      isAboutOpen,
      ...(isAboutOpen
        ? {
            activeNavSection: 'about',
            isHomeIntroOpen: false,
            isChronologyOpen: false,
            isGalleryOpen: false,
            isGuideModalOpen: false,
          }
        : { activeNavSection: 'route' }),
    }),
  openGallery: (referenceKey, startInLightbox = false) =>
    set({
      isGalleryOpen: true,
      isHomeIntroOpen: false,
      isChronologyOpen: false,
      isAboutOpen: false,
      isGuideModalOpen: false,
      isLightboxFullscreen: startInLightbox,
      activeReferenceKey: referenceKey ?? null,
    }),
  closeGallery: () => set({ isGalleryOpen: false, isLightboxFullscreen: false }),
  openGuideModal: () =>
    set({
      isGuideModalOpen: true,
      isGalleryOpen: false,
      isHomeIntroOpen: false,
      isChronologyOpen: false,
      isAboutOpen: false,
    }),
  closeGuideModal: () => set({ isGuideModalOpen: false }),
  setLightboxFullscreen: (isLightboxFullscreen) => set({ isLightboxFullscreen }),
  setActiveReferenceKey: (activeReferenceKey) => set({ activeReferenceKey }),
  toggleStratigraphyCutaway: () =>
    set((s) => ({ showStratigraphyCutaway: !s.showStratigraphyCutaway })),
  toggleEpistemologicalLabels: () =>
    set((s) => ({ showEpistemologicalLabels: !s.showEpistemologicalLabels })),
  setDesktopLeftOpen: (isDesktopLeftOpen) => set({ isDesktopLeftOpen }),
  setDesktopRightOpen: (isDesktopRightOpen) => set({ isDesktopRightOpen }),
  setMobileStationsOpen: (isMobileStationsOpen) =>
    set({
      isMobileStationsOpen,
      ...(isMobileStationsOpen ? { isMobileInspectorOpen: false } : {}),
    }),
  setMobileInspectorOpen: (isMobileInspectorOpen) =>
    set({
      isMobileInspectorOpen,
      ...(isMobileInspectorOpen ? { isMobileStationsOpen: false } : {}),
    }),
  activateStationInspectionCard: () =>
    set((s) => ({
      activeNavSection: 'stops',
      inspectionTab: 'overview',
      isDesktopRightOpen: true,
      isMobileStationsOpen: false,
      isMobileInspectorOpen: true,
      stationFocusHighlightNonce: s.stationFocusHighlightNonce + 1,
    })),
  closeAllOverlays: () =>
    set({
      isHomeIntroOpen: false,
      isChronologyOpen: false,
      isAboutOpen: false,
      isGalleryOpen: false,
      isGuideModalOpen: false,
      isLightboxFullscreen: false,
    }),
}));
