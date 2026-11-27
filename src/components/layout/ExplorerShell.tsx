import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { List, BookOpen } from 'lucide-react';
import { TopHeaderBar } from '@/components/navigation/TopHeaderBar';
import { StationSidebarList } from '@/components/navigation/StationSidebarList';
import { StationInspectorPanel } from '@/components/inspection/StationInspectorPanel';
import { ViewportControlsBar } from '@/components/controls/ViewportControlsBar';
import { ThirdPersonRouteBar } from '@/components/controls/ThirdPersonRouteBar';
import { MapLegendAndHoverOverlay } from '@/components/overlays/MapLegendAndHoverOverlay';
import { SystemDiagnosticsBanner } from '@/components/overlays/SystemDiagnosticsBanner';
import { RouteTimelineStrip } from '@/features/timeline/RouteTimelineStrip';
import { useInterfaceStore } from '@/stores/interface-store';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';

// Lazy-зареждане на вторичните модални прозорци за минимален начален пакет
const LazyHomeIntroOverlay = lazy(async () => ({
  default: (await import('@/components/overlays/HomeIntroOverlay')).HomeIntroOverlay,
}));
const LazyChronologyModal = lazy(async () => ({
  default: (await import('@/features/timeline/ChronologyModal')).ChronologyModal,
}));
const LazyAboutProjectModal = lazy(async () => ({
  default: (await import('@/components/overlays/AboutProjectModal')).AboutProjectModal,
}));
const LazyHistoricalGalleryModal = lazy(async () => ({
  default: (await import('@/features/gallery/HistoricalGalleryModal'))
    .HistoricalGalleryModal,
}));
const LazyHistoricalGuideModal = lazy(async () => ({
  default: (await import('@/features/inspection/HistoricalGuideModal'))
    .HistoricalGuideModal,
}));

interface ExplorerShellProps {
  children: ReactNode;
}

/**
 * Основна обвивка на платформата (P08 + P09):
 * 3D картата заема 100% от площта на екрана (full-bleed), а панелите са дискретни,
 * плаващи и сгъваеми, с lazy-зареждане на модалите и мониторинг на свързаността.
 */
export function ExplorerShell({ children }: ExplorerShellProps) {
  const isDesktopLeftOpen = useInterfaceStore((s) => s.isDesktopLeftOpen);
  const setDesktopLeftOpen = useInterfaceStore((s) => s.setDesktopLeftOpen);
  const isDesktopRightOpen = useInterfaceStore((s) => s.isDesktopRightOpen);
  const setDesktopRightOpen = useInterfaceStore((s) => s.setDesktopRightOpen);

  const isMobileStationsOpen = useInterfaceStore((s) => s.isMobileStationsOpen);
  const setMobileStationsOpen = useInterfaceStore((s) => s.setMobileStationsOpen);
  const isMobileInspectorOpen = useInterfaceStore((s) => s.isMobileInspectorOpen);
  const setMobileInspectorOpen = useInterfaceStore((s) => s.setMobileInspectorOpen);

  const isHomeIntroOpen = useInterfaceStore((s) => s.isHomeIntroOpen);
  const isChronologyOpen = useInterfaceStore((s) => s.isChronologyOpen);
  const isAboutOpen = useInterfaceStore((s) => s.isAboutOpen);
  const isGalleryOpen = useInterfaceStore((s) => s.isGalleryOpen);
  const isGuideModalOpen = useInterfaceStore((s) => s.isGuideModalOpen);

  const setOffline = useDiagnosticsStore((s) => s.setOffline);
  const triggerTerrainRetry = useDiagnosticsStore((s) => s.triggerTerrainRetry);
  const triggerImageryRetry = useDiagnosticsStore((s) => s.triggerImageryRetry);

  const { selectedStation, stations } = useSelectedStation();

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => {
      setOffline(false);
      triggerTerrainRetry();
      triggerImageryRetry();
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [setOffline, triggerImageryRetry, triggerTerrainRetry]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-obsidian-950">
      {/* Пълноекранен 3D Viewport (заема максималната площ на екрана) */}
      <main className="absolute inset-0 h-full w-full overflow-hidden">
        {children}
      </main>

      {/* Горна навигация и диагностика */}
      <TopHeaderBar />
      <ViewportControlsBar />
      <SystemDiagnosticsBanner />
      <MapLegendAndHoverOverlay />

      {/* Ляв плаващ панел (Десктоп) или дискретен бутон за отваряне */}
      {isDesktopLeftOpen ? (
        <div className="fixed bottom-24 left-3 top-20 z-20 hidden w-72 lg:block xl:left-4 xl:w-80">
          <StationSidebarList />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDesktopLeftOpen(true)}
          className="cartographic-panel fixed left-3 top-20 z-20 hidden cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-travertine-100 transition hover:border-amberwarn-400 lg:inline-flex xl:left-4"
        >
          <List className="h-4 w-4 text-amberwarn-400" />
          <span>Спирки ({stations.length})</span>
        </button>
      )}

      {/* Десен плаващ инспекционен панел (Десктоп) или дискретен бутон */}
      {isDesktopRightOpen ? (
        <div className="fixed bottom-24 right-3 top-20 z-20 hidden w-80 lg:block xl:right-4 xl:w-[22.5rem]">
          <StationInspectorPanel />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDesktopRightOpen(true)}
          className="cartographic-panel fixed right-3 top-20 z-20 hidden cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-travertine-100 transition hover:border-amberwarn-400 lg:inline-flex xl:right-4"
        >
          <BookOpen className="h-4 w-4 text-amberwarn-400" />
          <span>Инспекция: {selectedStation?.historicalNameBg}</span>
        </button>
      )}

      {/* Бързи плаващи бутони за вертикален мобилен екран */}
      <div className="fixed inset-x-2.5 top-[4.6rem] z-20 flex items-center justify-between gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileStationsOpen(true)}
          className="cartographic-panel inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-travertine-50"
        >
          <List className="h-4 w-4 text-amberwarn-400" />
          <span>Спирки ({selectedStation?.sequence}/{stations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileInspectorOpen(true)}
          className="cartographic-panel inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-amberwarn-400"
        >
          <BookOpen className="h-4 w-4" />
          <span className="max-w-[38vw] truncate">{selectedStation?.historicalNameBg}</span>
        </button>
      </div>

      {/* Вертикален мобилен лист: Списък на спирките */}
      {isMobileStationsOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-obsidian-950/70 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="Затвори списъка на спирките"
            onClick={() => setMobileStationsOpen(false)}
            className="flex-1"
          />
          <div className="h-[76dvh] w-full px-2 pb-2">
            <StationSidebarList />
          </div>
        </div>
      )}

      {/* Вертикален мобилен лист: Десен инспекционен панел */}
      {isMobileInspectorOpen && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-obsidian-950/70 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            aria-label="Затвори панела за инспекция"
            onClick={() => setMobileInspectorOpen(false)}
            className="flex-1"
          />
          <div className="h-[80dvh] w-full px-2 pb-2">
            <StationInspectorPanel />
          </div>
        </div>
      )}

      {/* Спомагателна лента за височина при Трето лице + Долен контролен панел */}
      <ThirdPersonRouteBar />
      <RouteTimelineStrip />

      {/* Lazy модали — зареждат се при първо отваряне */}
      <Suspense fallback={null}>
        {isHomeIntroOpen && <LazyHomeIntroOverlay />}
        {isChronologyOpen && <LazyChronologyModal />}
        {isAboutOpen && <LazyAboutProjectModal />}
        {isGalleryOpen && <LazyHistoricalGalleryModal />}
        {isGuideModalOpen && <LazyHistoricalGuideModal />}
      </Suspense>
    </div>
  );
}
