import { AlertTriangle, CheckCircle2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getAllOriginalReferences,
  getOriginalReferenceByKey,
  getOriginalReferenceForStationId,
} from '@/features/gallery/image-manifest-loader';
import { ResilientHistoricalImage } from '@/components/common/ResilientHistoricalImage';
import { ZoomPanImageViewer } from '@/features/gallery/ZoomPanImageViewer';
import { useStationStore } from '@/stores/station-store';
import { useInterfaceStore } from '@/stores/interface-store';

/**
 * Галерия и Lightbox за деветте оригинални визуални референции (P05).
 * Напълно отделена от 3D двигателите; запазва 100% оригиналните изображения без модификация.
 */
export function HistoricalGalleryModal() {
  const isGalleryOpen = useInterfaceStore((s) => s.isGalleryOpen);
  const isLightboxFullscreen = useInterfaceStore((s) => s.isLightboxFullscreen);
  const setLightboxFullscreen = useInterfaceStore((s) => s.setLightboxFullscreen);
  const activeReferenceKey = useInterfaceStore((s) => s.activeReferenceKey);
  const setActiveReferenceKey = useInterfaceStore((s) => s.setActiveReferenceKey);
  const closeGallery = useInterfaceStore((s) => s.closeGallery);

  const stations = useStationStore((s) => s.stations);
  const selectedStationId = useStationStore((s) => s.selectedStationId);
  const selectStation = useStationStore((s) => s.selectStation);

  if (!isGalleryOpen) return null;

  const allReferences = getAllOriginalReferences();
  const activeRef =
    (activeReferenceKey ? getOriginalReferenceByKey(activeReferenceKey) : undefined) ??
    getOriginalReferenceForStationId(selectedStationId) ??
    allReferences[0];

  const currentIndex = allReferences.findIndex((r) => r.key === activeRef.key);
  const linkedStation = activeRef.stationId
    ? stations.find((st) => st.id === activeRef.stationId)
    : undefined;
  const linkedGalleryNote = linkedStation?.galleryItems[0];

  const goRelative = (delta: number) => {
    const nextIdx = (currentIndex + delta + allReferences.length) % allReferences.length;
    const nextRef = allReferences[nextIdx];
    setActiveReferenceKey(nextRef.key);
    if (nextRef.stationId) {
      selectStation(nextRef.stationId);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Оригинални исторически визуални референции и Lightbox"
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/95 p-0 backdrop-blur-sm sm:p-3"
    >
      <div
        className={`flex flex-col overflow-hidden border border-obsidian-700 bg-obsidian-900 shadow-2xl ${
          isLightboxFullscreen
            ? 'h-dvh w-screen rounded-none border-0'
            : 'h-dvh w-full max-w-7xl sm:h-[92vh] sm:rounded-lg'
        }`}
      >
        {/* Заглавна лента */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-obsidian-700 bg-obsidian-900 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goRelative(-1)}
                aria-label="Предишна оригинална референция"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-travertine-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => goRelative(1)}
                aria-label="Следваща оригинална референция"
                className="inline-flex h-8 w-8 items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-travertine-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase text-amberwarn-400">
                  ОРИГИНАЛНА РЕФЕРЕНЦИЯ {currentIndex + 1} / {allReferences.length}
                </span>
                <span className="hidden items-center gap-1 rounded bg-verdigris-500/15 px-1.5 py-0.5 text-[10px] font-medium text-verdigris-400 sm:inline-flex">
                  <CheckCircle2 className="h-3 w-3" />
                  Непроменен оригинален файл ({activeRef.width}×{activeRef.height})
                </span>
              </div>
              <h2 className="text-sm font-semibold text-travertine-50 sm:text-base">
                {activeRef.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeGallery}
            aria-label="Затвори галерията"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-travertine-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Основна работна област: Zoom/Pan Lightbox + опционален исторически панел */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="min-h-[48vh] flex-1 overflow-hidden">
            <ZoomPanImageViewer
              imageUrl={activeRef.image}
              titleBg={activeRef.title}
              nativeWidth={activeRef.width}
              nativeHeight={activeRef.height}
              isLightboxFullscreen={isLightboxFullscreen}
              onToggleLightbox={() => setLightboxFullscreen(!isLightboxFullscreen)}
            />
          </div>

          {!isLightboxFullscreen && (
            <div className="flex w-full shrink-0 flex-col justify-between overflow-y-auto border-t border-obsidian-700 bg-obsidian-900 p-4 text-xs lg:w-96 lg:border-l lg:border-t-0">
              <div className="space-y-3">
                <div className="rounded border border-travertine-300/30 bg-obsidian-950 p-2.5 text-[11px] leading-relaxed text-travertine-200">
                  <strong className="block text-travertine-50">
                    Статут на визуалния актив (`{activeRef.type}`):
                  </strong>
                  {activeRef.provenanceBg}
                </div>

                {linkedStation && (
                  <div className="rounded border border-obsidian-700 bg-obsidian-950 p-2.5">
                    <div className="font-semibold text-travertine-50">
                      Исторически контекст (117 г. сл. Хр.)
                    </div>
                    <p className="mt-1 leading-relaxed text-travertine-200">
                      {linkedStation.stateIn117AdBg}
                    </p>
                  </div>
                )}

                {linkedGalleryNote?.anachronismWarningBg && (
                  <div className="rounded border border-amberwarn-500/50 bg-amberwarn-500/15 p-2.5 text-travertine-100">
                    <div className="flex items-center gap-1.5 font-semibold text-amberwarn-400">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Археологическа бележка за 117 г.</span>
                    </div>
                    <p className="mt-1 leading-relaxed">
                      {linkedGalleryNote.anachronismWarningBg}
                    </p>
                  </div>
                )}
              </div>

              {/* Лента с всички 9 оригинални визуални референции в оригинално съотношение на страните */}
              <div className="mt-4 border-t border-obsidian-800 pt-3">
                <div className="mb-2 text-[11px] font-semibold text-travertine-300">
                  Деветте оригинални референции (station-images.json)
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {allReferences.map((ref, idx) => {
                    const selected = ref.key === activeRef.key;
                    return (
                      <button
                        key={ref.key}
                        type="button"
                        onClick={() => {
                          setActiveReferenceKey(ref.key);
                          if (ref.stationId) {
                            selectStation(ref.stationId);
                          }
                        }}
                        className={`flex flex-col overflow-hidden rounded border bg-obsidian-950 p-1 text-left transition ${
                          selected
                            ? 'border-amberwarn-400 ring-1 ring-amberwarn-400'
                            : 'border-obsidian-700 hover:border-travertine-300'
                        }`}
                      >
                        <ResilientHistoricalImage
                          src={ref.image}
                          alt={ref.title}
                          nativeWidth={ref.width}
                          nativeHeight={ref.height}
                          className="w-full object-contain"
                        />
                        <span className="mt-1 line-clamp-1 text-[10px] text-travertine-200">
                          {idx === 0 ? 'Панорама' : `${idx}. ${ref.title}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
