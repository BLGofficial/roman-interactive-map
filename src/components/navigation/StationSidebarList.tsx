import {
  Search,
  Flag,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
} from 'lucide-react';
import { useStationStore, type StationConfidenceFilter } from '@/stores/station-store';
import { useInterfaceStore } from '@/stores/interface-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';
import { getConfidenceBadgeBg } from '@/utils/formatters';

export function StationSidebarList() {
  const { stations, selectedStation, focusStation, goNext, goPrevious } =
    useSelectedStation();

  const confidenceFilter = useStationStore((s) => s.confidenceFilter);
  const setConfidenceFilter = useStationStore((s) => s.setConfidenceFilter);
  const searchQuery = useStationStore((s) => s.searchQuery);
  const setSearchQuery = useStationStore((s) => s.setSearchQuery);

  const setDesktopLeftOpen = useInterfaceStore((s) => s.setDesktopLeftOpen);
  const setMobileStationsOpen = useInterfaceStore((s) => s.setMobileStationsOpen);

  const filteredStations = stations.filter((station) => {
    const matchesConfidence =
      confidenceFilter === 'ALL'
        ? true
        : confidenceFilter === 'CONFIRMED'
          ? station.identificationStatus === 'confirmed'
          : station.identificationStatus !== 'confirmed';
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q.length === 0 ||
      station.historicalNameBg.toLowerCase().includes(q) ||
      station.projectName.toLowerCase().includes(q) ||
      station.modernLocationBg.toLowerCase().includes(q);
    return matchesConfidence && matchesSearch;
  });

  const progressPct = Math.round(
    (selectedStation?.routeProgressFraction ?? 0) * 100
  );

  const confirmedCount = stations.filter(
    (s) => s.identificationStatus === 'confirmed'
  ).length;
  const nonExactCount = stations.length - confirmedCount;

  const filterButtons: { id: StationConfidenceFilter; label: string }[] = [
    { id: 'ALL', label: `Всички (${stations.length})` },
    { id: 'CONFIRMED', label: `Потвърдени (${confirmedCount})` },
    { id: 'HYPOTHETICAL', label: `Хипотетични (${nonExactCount})` },
  ];

  return (
    <div className="cartographic-panel flex h-full flex-col overflow-hidden rounded-lg text-travertine-100">
      {/* Текуща спирка + Напредък по маршрута + Бързо преминаване */}
      <div className="border-b border-obsidian-700 bg-obsidian-950/70 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-amberwarn-400">
            Текуща спирка · {selectedStation?.sequence}/{stations.length}
          </span>
          <button
            type="button"
            onClick={() => {
              setDesktopLeftOpen(false);
              setMobileStationsOpen(false);
            }}
            title="Скрий левия панел за по-голям 3D екран"
            aria-label="Скрий левия панел"
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-900 text-travertine-300 hover:border-amberwarn-400 hover:text-travertine-50"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="font-serif text-base font-bold text-travertine-50">
            {selectedStation?.historicalNameBg}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrevious}
              disabled={selectedStation?.sequence === 1}
              title="Предишна точка"
              aria-label="Предишна точка"
              className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-900 text-travertine-200 hover:border-amberwarn-400 disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={selectedStation?.sequence === stations.length}
              title="Следваща точка"
              aria-label="Следваща точка"
              className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-900 text-travertine-200 hover:border-amberwarn-400 disabled:opacity-35"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Визуален напредък по маршрута */}
        <div className="mt-2">
          <div className="flex items-center justify-between font-mono text-[10px] text-travertine-300">
            <span>Напредък по маршрута</span>
            <span className="text-amberwarn-400">
              {progressPct}% · {selectedStation?.cumulativeRomanMiles ?? 0}/276 mp
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-obsidian-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-imperial-400 to-amberwarn-400 transition-all duration-300"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>
        </div>

        {/* Търсене и филтър по исторически статус */}
        <div className="relative mt-2.5">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-travertine-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Бързо търсене на спирка..."
            aria-label="Търсене на историческа спирка"
            className="w-full rounded border border-obsidian-700 bg-obsidian-950 py-1.5 pl-8 pr-2.5 text-xs text-travertine-100 placeholder:text-travertine-400/70 focus:border-amberwarn-400 focus:outline-none"
          />
        </div>

        <div className="mt-2 flex gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setConfidenceFilter(btn.id)}
              className={`flex-1 cursor-pointer rounded border px-1.5 py-1 text-[10.5px] font-medium transition ${
                confidenceFilter === btn.id
                  ? 'border-amberwarn-400/70 bg-amberwarn-500/20 text-amberwarn-400'
                  : 'border-obsidian-700 bg-obsidian-950/80 text-travertine-300 hover:text-travertine-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Списък на спирките с исторически статус */}
      <ul role="list" className="flex-1 divide-y divide-obsidian-800/80 overflow-y-auto">
        {filteredStations.map((station) => {
          const isSelected = station.id === selectedStation?.id;
          const badge = getConfidenceBadgeBg(station.confidenceLevel);
          const isUnconfirmed =
            station.identificationStatus === 'unconfirmed_exact_location';
          const isTerminus = station.id === 'EXT-15';

          return (
            <li key={station.id}>
              <button
                type="button"
                onClick={() => {
                  focusStation(station.id);
                  setMobileStationsOpen(false);
                }}
                className={`w-full cursor-pointer px-3 py-2.5 text-left transition-colors duration-150 ${
                  isSelected
                    ? 'border-l-2 border-amberwarn-400 bg-obsidian-800/90'
                    : 'hover:bg-obsidian-800/45'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-bold ${
                        isSelected
                          ? 'border-amberwarn-400 bg-amberwarn-500 text-obsidian-950'
                          : 'border-travertine-300/35 bg-obsidian-950 text-amberwarn-400'
                      }`}
                    >
                      {station.sequence}
                    </span>
                    <span className="font-serif text-[15px] font-bold text-travertine-50">
                      {station.historicalNameBg}
                    </span>
                    {isTerminus && (
                      <Flag className="h-3 w-3 shrink-0 text-verdigris-400" />
                    )}
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-travertine-300">
                    {station.cumulativeRomanMiles} mp
                  </span>
                </div>

                <p className="mt-0.5 line-clamp-1 text-[11px] text-travertine-300">
                  {station.modernLocationBg}
                </p>

                <div className="mt-1.5 flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${badge.toneClass}`}
                  >
                    {isUnconfirmed && <AlertTriangle className="h-2.5 w-2.5" />}
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-travertine-400">
                    {station.isCoreVisualStop
                      ? `Спирка ${station.sequence}/8`
                      : 'Източен етап'}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
