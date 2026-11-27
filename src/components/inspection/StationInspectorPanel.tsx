import {
  Box,
  ExternalLink,
  Images,
  MapPin,
  ShieldCheck,
  BookOpen,
  X,
  Compass,
  Clock,
  PanelRightClose,
  Maximize2,
} from 'lucide-react';
import { ResilientHistoricalImage } from '@/components/common/ResilientHistoricalImage';
import { EpistemologyPanel } from '@/features/inspection/EpistemologyPanel';
import { useStationStore } from '@/stores/station-store';
import { useInterfaceStore, type InspectionTab } from '@/stores/interface-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';
import {
  formatCoordinatesBg,
  getConfidenceBadgeBg,
  getIdentificationStatusLabelBg,
} from '@/utils/formatters';

export function StationInspectorPanel() {
  const { selectedStation, focusStation } = useSelectedStation();
  const supplementaryNodes = useStationStore((s) => s.supplementaryNodes);
  const selectedSupplementaryId = useStationStore((s) => s.selectedSupplementaryId);
  const selectSupplementaryNode = useStationStore((s) => s.selectSupplementaryNode);

  const inspectionTab = useInterfaceStore((s) => s.inspectionTab);
  const setInspectionTab = useInterfaceStore((s) => s.setInspectionTab);
  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const setViewportMode = useInterfaceStore((s) => s.setViewportMode);
  const openGallery = useInterfaceStore((s) => s.openGallery);
  const openGuideModal = useInterfaceStore((s) => s.openGuideModal);
  const setDesktopRightOpen = useInterfaceStore((s) => s.setDesktopRightOpen);
  const setMobileInspectorOpen = useInterfaceStore((s) => s.setMobileInspectorOpen);

  const activeSuppNode = supplementaryNodes.find(
    (n) => n.id === selectedSupplementaryId
  );

  if (!selectedStation) return null;

  const badge = getConfidenceBadgeBg(selectedStation.confidenceLevel);
  const previewImage = selectedStation.galleryItems[0];
  const { resolvedGuide, resolvedSources } = selectedStation;

  const tabs: { id: InspectionTab; label: string }[] = [
    { id: 'overview', label: 'Описание' },
    { id: 'epistemology', label: 'Достоверност' },
    { id: 'archaeology', label: 'Източници' },
  ];

  return (
    <aside className="cartographic-panel flex h-full flex-col overflow-hidden rounded-lg text-travertine-100">
      {activeSuppNode && (
        <div className="border-b border-verdigris-500/40 bg-verdigris-500/15 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-verdigris-400">
                {activeSuppNode.categoryBg}
              </span>
              <h3 className="font-serif text-base font-bold text-travertine-50">
                {activeSuppNode.nameBg}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => selectSupplementaryNode(null)}
              aria-label="Върни се към основната спирка"
              className="cursor-pointer rounded p-1 text-travertine-300 hover:bg-obsidian-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-travertine-100">{activeSuppNode.note117AdBg}</p>
        </div>
      )}

      {/* Заглавие, достоверност и бутон за скриване */}
      <div className="border-b border-obsidian-700 bg-obsidian-950/70 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`rounded border px-2 py-0.5 text-[10px] font-medium ${badge.toneClass}`}
          >
            {badge.label}
          </span>

          <button
            type="button"
            onClick={() => {
              setDesktopRightOpen(false);
              setMobileInspectorOpen(false);
            }}
            title="Скрий десния панел"
            aria-label="Скрий десния панел"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-900 text-travertine-300 hover:border-amberwarn-400 hover:text-travertine-50"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Име + оригинални латински и гръцки названия */}
        <h2 className="mt-1.5 font-serif text-xl font-bold leading-tight text-travertine-50">
          {selectedStation.sequence}. {selectedStation.historicalNameBg}
        </h2>
        <p className="font-mono text-[11px] text-amberwarn-400">
          {selectedStation.historicalNameLatin}
          {selectedStation.historicalNameGreek
            ? ` · ${selectedStation.historicalNameGreek}`
            : ''}
        </p>

        {/* Снимка в оригинално съотношение с бутон за цял екран */}
        {previewImage && (
          <div className="group relative mt-2.5 overflow-hidden rounded border border-amberwarn-400/35 bg-[#07090b]">
            <button
              type="button"
              onClick={() => openGallery(selectedStation.originalReferenceKey, true)}
              title="Разгледай оригиналното изображение на цял екран"
              className="block w-full cursor-pointer bg-[#07090b] text-left"
            >
              <ResilientHistoricalImage
                src={previewImage.imageUrl}
                alt={previewImage.titleBg}
                nativeWidth={selectedStation.originalReferenceWidth}
                nativeHeight={selectedStation.originalReferenceHeight}
                className="h-auto w-full object-contain"
              />
            </button>
            <button
              type="button"
              onClick={() => openGallery(selectedStation.originalReferenceKey, true)}
              className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1 rounded border border-amberwarn-400/60 bg-obsidian-950/90 px-2 py-1 text-[10px] font-semibold text-amberwarn-400 backdrop-blur hover:bg-obsidian-900"
            >
              <Maximize2 className="h-3 w-3" />
              <span>Цял екран</span>
            </button>
          </div>
        )}

        {/* Кратко историческо описание */}
        <p className="mt-2.5 text-xs leading-relaxed text-travertine-100">
          {resolvedGuide.shortIntroBg}
        </p>

        {/* Основни бутони: Научи повече, Разгледай изображението, Покажи на картата */}
        <div className="mt-3 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={openGuideModal}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded bg-amberwarn-500 px-3 py-2 text-xs font-semibold text-obsidian-950 transition hover:bg-amberwarn-400"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Научи повече</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => openGallery(selectedStation.originalReferenceKey, false)}
              className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2 py-1.5 text-[11px] font-medium text-travertine-100 transition hover:border-amberwarn-400"
            >
              <Images className="h-3.5 w-3.5 text-amberwarn-400" />
              <span>Разгледай изображението</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewportMode('map');
                focusStation(selectedStation.id);
                setMobileInspectorOpen(false);
              }}
              className="inline-flex cursor-pointer items-center justify-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2 py-1.5 text-[11px] font-medium text-travertine-100 transition hover:border-verdigris-400"
            >
              <Compass className="h-3.5 w-3.5 text-verdigris-400" />
              <span>Покажи на картата</span>
            </button>
          </div>
        </div>
      </div>

      {/* Подтабове: Описание, Достоверност, Източници */}
      <div className="grid grid-cols-3 border-b border-obsidian-700 bg-obsidian-950/80 text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setInspectionTab(tab.id)}
            className={`cursor-pointer border-b-2 py-2 font-medium transition ${
              inspectionTab === tab.id
                ? 'border-amberwarn-400 text-amberwarn-400'
                : 'border-transparent text-travertine-300 hover:text-travertine-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Допълнителна информация и източници */}
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5 text-xs">
        {inspectionTab === 'overview' && (
          <>
            <div className="space-y-1.5 rounded border border-obsidian-700 bg-obsidian-950/75 p-2.5">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-amberwarn-400">
                <MapPin className="h-3 w-3" /> Съвременно местоположение
              </div>
              <p className="text-travertine-100">{selectedStation.modernLocationBg}</p>
              <p className="font-mono text-[10.5px] text-travertine-300">
                {formatCoordinatesBg(
                  selectedStation.coordinates.lat,
                  selectedStation.coordinates.lon
                )}
              </p>

              <div className="flex items-center gap-1 border-t border-obsidian-800 pt-1.5 text-[11px] font-semibold text-imperial-400">
                <Clock className="h-3 w-3" /> Исторически период
              </div>
              <p className="text-travertine-100">{resolvedGuide.historicalPeriodBg}</p>
            </div>

            <div className="rounded border border-obsidian-700 bg-obsidian-950/75 p-2.5">
              <h3 className="text-[11px] font-semibold text-amberwarn-400">
                Какво представлява и защо е важно?
              </h3>
              <p className="mt-1 leading-relaxed text-travertine-100">
                {resolvedGuide.whatIsItBg}
              </p>
              <p className="mt-1.5 leading-relaxed text-travertine-200">
                {resolvedGuide.whyImportantBg}
              </p>
            </div>

            <div className="rounded border border-verdigris-500/35 bg-verdigris-500/10 p-2.5">
              <h3 className="text-[11px] font-semibold text-verdigris-400">
                Потвърдена архитектура (117 г.)
              </h3>
              <p className="mt-1 leading-relaxed text-travertine-100">
                {resolvedGuide.howItLookedConfirmedBg}
              </p>
            </div>

            <div className="rounded border border-amberwarn-500/35 bg-amberwarn-500/10 p-2.5">
              <h3 className="text-[11px] font-semibold text-amberwarn-400">
                Реконструктивни хипотези
              </h3>
              <p className="mt-1 leading-relaxed text-travertine-100">
                {resolvedGuide.howItLookedHypothesisBg}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setViewportMode(viewportMode === 'scene3d' ? 'map' : 'scene3d')
              }
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded border border-obsidian-700 bg-obsidian-800 px-2.5 py-2 text-xs font-medium text-travertine-100 transition hover:border-amberwarn-400"
            >
              <Box className="h-3.5 w-3.5 text-imperial-400" />
              <span>
                {viewportMode === 'scene3d'
                  ? 'Върни се към 3D географската карта'
                  : 'Разгледай 3D стратиграфския модел'}
              </span>
            </button>
          </>
        )}

        {inspectionTab === 'epistemology' && (
          <EpistemologyPanel epistemology={selectedStation.epistemology} />
        )}

        {inspectionTab === 'archaeology' && (
          <div className="space-y-2.5">
            <div className="rounded border border-obsidian-700 bg-obsidian-950/75 p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-verdigris-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                {getIdentificationStatusLabelBg(selectedStation.identificationStatus)}
              </div>
              <p className="mt-1 leading-relaxed text-travertine-100">
                {selectedStation.archaeologicalEvidenceBg}
              </p>
              <p className="mt-1.5 leading-relaxed text-travertine-200">
                <strong className="text-amberwarn-400">Дискусия: </strong>
                {resolvedGuide.archaeologicalDebateBg}
              </p>
            </div>

            <div className="space-y-1.5 rounded border border-obsidian-700 bg-obsidian-950/75 p-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-amberwarn-400">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" /> Библиографски източници
                </span>
                {selectedStation.coordinates.pleiadesId && (
                  <a
                    href={`https://pleiades.stoa.org/places/${selectedStation.coordinates.pleiadesId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-verdigris-400 hover:underline"
                  >
                    Pleiades #{selectedStation.coordinates.pleiadesId}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <ul className="space-y-1.5 pt-1">
                {resolvedSources.map((src) => (
                  <li
                    key={src.id}
                    className="border-t border-obsidian-800 pt-1.5 text-[11px] leading-relaxed text-travertine-200"
                  >
                    <strong className="text-travertine-50">{src.categoryBg}: </strong>
                    {src.citationBg}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
