import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { ResilientHistoricalImage } from '@/components/common/ResilientHistoricalImage';
import { useInterfaceStore } from '@/stores/interface-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';
import {
  formatCoordinatesBg,
  formatRomanMilesBg,
  getConfidenceBadgeBg,
  getIdentificationStatusLabelBg,
} from '@/utils/formatters';

/**
 * Пълен четим исторически гид за избраната спирка („Научи повече“ — P07).
 * Написан на достъпен и конкретен български език, със запазени латински и гръцки названия
 * и ясно разграничение между археологически факти и реконструктивни хипотези.
 */
export function HistoricalGuideModal() {
  const isGuideModalOpen = useInterfaceStore((s) => s.isGuideModalOpen);
  const closeGuideModal = useInterfaceStore((s) => s.closeGuideModal);
  const openGallery = useInterfaceStore((s) => s.openGallery);
  const setViewportMode = useInterfaceStore((s) => s.setViewportMode);

  const { selectedStation, focusStation, goNext, goPrevious } = useSelectedStation();

  if (!isGuideModalOpen || !selectedStation) return null;

  const { resolvedGuide, resolvedSources } = selectedStation;
  const badge = getConfidenceBadgeBg(selectedStation.confidenceLevel);
  const heroImage = selectedStation.galleryItems[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Исторически разказ за ${selectedStation.historicalNameBg}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/90 p-2 backdrop-blur-sm sm:p-5"
    >
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-obsidian-700 bg-obsidian-900 text-travertine-100 shadow-2xl">
        {/* Заглавна лента с навигация между спирките */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-obsidian-700 bg-obsidian-950 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              aria-label="Предишна спирка"
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-travertine-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Следваща спирка"
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-travertine-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="ml-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-amberwarn-400">
                  СПИРКА {selectedStation.sequence} · {selectedStation.cumulativeRomanMiles} MP
                </span>
                <span
                  className={`rounded border px-2 py-0.5 text-[10px] font-medium ${badge.toneClass}`}
                >
                  {badge.label}
                </span>
              </div>
              <h2 className="font-serif text-base font-bold text-travertine-50 sm:text-xl">
                {selectedStation.historicalNameBg}{' '}
                <span className="font-sans text-xs font-normal text-travertine-300 sm:text-sm">
                  ({selectedStation.historicalNameLatin}
                  {selectedStation.historicalNameGreek
                    ? ` · ${selectedStation.historicalNameGreek}`
                    : ''}
                  )
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeGuideModal}
            aria-label="Затвори историческия гид"
            className="inline-flex h-8 w-8 items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-travertine-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Основно четивно тяло */}
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {/* Бърза визитка: Съвременно местоположение + Исторически период */}
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-obsidian-700 bg-obsidian-950 p-3.5 text-xs sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-amberwarn-400">
                <MapPin className="h-3.5 w-3.5" />
                <span>Съвременно местоположение</span>
              </div>
              <p className="mt-1 text-travertine-100">
                {selectedStation.modernLocationBg}
              </p>
              <p className="mt-0.5 font-mono text-[11px] text-travertine-400">
                {formatCoordinatesBg(
                  selectedStation.coordinates.lat,
                  selectedStation.coordinates.lon
                )}{' '}
                · {formatRomanMilesBg(selectedStation.distanceFromPrevRomanMiles)} от предходната
                спирка
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 font-semibold text-verdigris-400">
                <Clock className="h-3.5 w-3.5" />
                <span>Исторически период</span>
              </div>
              <p className="mt-1 text-travertine-100">
                {resolvedGuide.historicalPeriodBg}
              </p>
              <p className="mt-0.5 text-[11px] text-travertine-400">
                Статус: {getIdentificationStatusLabelBg(selectedStation.identificationStatus)}
              </p>
            </div>
          </div>

          {/* Оригинално изображение в оригинално съотношение + бутони за карта и увеличение */}
          {heroImage && (
            <div className="overflow-hidden rounded-lg border border-obsidian-700 bg-[#07090b]">
              <ResilientHistoricalImage
                src={heroImage.imageUrl}
                alt={heroImage.titleBg}
                nativeWidth={selectedStation.originalReferenceWidth}
                nativeHeight={selectedStation.originalReferenceHeight}
                className="mx-auto max-h-[42vh] w-auto object-contain"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-obsidian-800 bg-obsidian-950 px-3.5 py-2 text-xs">
                <span className="text-[11px] text-travertine-300">
                  {selectedStation.originalReferenceProvenanceBg}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openGallery(selectedStation.originalReferenceKey, false)}
                    className="inline-flex items-center gap-1 rounded border border-amberwarn-400/50 bg-amberwarn-500/15 px-2.5 py-1 text-[11px] font-semibold text-amberwarn-400 hover:bg-amberwarn-500/25"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Разгледай изображението
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closeGuideModal();
                      setViewportMode('map');
                      focusStation(selectedStation.id);
                    }}
                    className="inline-flex items-center gap-1 rounded border border-verdigris-500/50 bg-verdigris-500/15 px-2.5 py-1 text-[11px] font-semibold text-verdigris-400 hover:bg-verdigris-500/25"
                  >
                    <Compass className="h-3.5 w-3.5" />
                    Покажи на картата
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 1. Какво представлява мястото? */}
          <section className="space-y-1.5">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-travertine-50">
              <Landmark className="h-4 w-4 text-imperial-400" />
              Какво представлява мястото?
            </h3>
            <p className="text-sm leading-relaxed text-travertine-100">
              {resolvedGuide.whatIsItBg}
            </p>
          </section>

          {/* 2. Защо е било важно? */}
          <section className="space-y-1.5">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-travertine-50">
              <Compass className="h-4 w-4 text-amberwarn-400" />
              Защо е било важно?
            </h3>
            <p className="text-sm leading-relaxed text-travertine-100">
              {resolvedGuide.whyImportantBg}
            </p>
          </section>

          {/* 3. Как е изглеждало? (разграничено от хипотетичните реконструкции) */}
          <section className="space-y-2.5">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-travertine-50">
              <Sparkles className="h-4 w-4 text-verdigris-400" />
              Как е изглеждало през 117 г. сл. Хр.?
            </h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-verdigris-500/40 bg-verdigris-500/10 p-3.5">
                <div className="text-xs font-semibold text-verdigris-400">
                  Потвърдена среда и архитектура
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-travertine-100">
                  {resolvedGuide.howItLookedConfirmedBg}
                </p>
              </div>

              <div className="rounded-lg border border-amberwarn-500/40 bg-amberwarn-500/10 p-3.5">
                <div className="text-xs font-semibold text-amberwarn-400">
                  Хипотетична реконструкция и визуални разлики
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-travertine-100">
                  {resolvedGuide.howItLookedHypothesisBg}
                </p>
              </div>
            </div>
          </section>

          {/* 4. Археологически доказателства и научна дискусия */}
          <section className="space-y-2 rounded-lg border border-obsidian-700 bg-obsidian-950 p-4">
            <h3 className="flex items-center gap-2 font-serif text-base font-semibold text-travertine-50">
              <ShieldCheck className="h-4 w-4 text-verdigris-400" />
              Археологически доказателства и научни дискусии
            </h3>
            <p className="text-xs leading-relaxed text-travertine-100">
              <strong className="text-travertine-200">Открито на терен: </strong>
              {selectedStation.archaeologicalEvidenceBg}
            </p>
            <p className="text-xs leading-relaxed text-travertine-200">
              <strong className="text-amberwarn-400">Открити въпроси: </strong>
              {resolvedGuide.archaeologicalDebateBg}
            </p>
          </section>

          {/* 5. Източници и литература */}
          <section className="space-y-2 border-t border-obsidian-800 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-travertine-300">
                <BookOpen className="h-3.5 w-3.5" />
                Източници и научна литература
              </h3>
              {selectedStation.coordinates.pleiadesId && (
                <a
                  href={`https://pleiades.stoa.org/places/${selectedStation.coordinates.pleiadesId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-verdigris-400 hover:underline"
                >
                  Pleiades Gazetteer #{selectedStation.coordinates.pleiadesId}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <ul className="space-y-1.5 text-xs text-travertine-300">
              {resolvedSources.map((src) => (
                <li
                  key={src.id}
                  className="rounded border border-obsidian-800 bg-obsidian-950 px-3 py-2 leading-relaxed"
                >
                  <span className="mr-1.5 rounded bg-obsidian-800 px-1.5 py-0.5 font-mono text-[10px] text-amberwarn-400">
                    {src.categoryBg}
                  </span>
                  <span>{src.citationBg}</span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-2 inline-flex items-center gap-0.5 text-verdigris-400 hover:underline"
                    >
                      Връзка
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
