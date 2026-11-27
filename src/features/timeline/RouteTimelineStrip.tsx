import { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Map,
  Video,
  Play,
  Pause,
} from 'lucide-react';
import { cameraDirector } from '@/engine/camera/CameraDirector';
import { useSelectedStation } from '@/hooks/useSelectedStation';
import { useCameraStore } from '@/stores/camera-store';
import { useMapStore } from '@/stores/map-store';
import { useInterfaceStore } from '@/stores/interface-store';
import type { CameraViewPresetId } from '@/types';

/**
 * Долен контролен панел (P08):
 * Съдържа всички изисквани контроли с реална функционалност:
 * Zoom · Orbit · Reset · Предишна спирка · Следваща спирка · Пълен маршрут · Камера.
 */
export function RouteTimelineStrip() {
  const [cameraMenuOpen, setCameraMenuOpen] = useState(false);

  const { stations, selectedStation, focusStation, goNext, goPrevious } =
    useSelectedStation();

  const cameraMode = useCameraStore((s) => s.cameraMode);
  const activeViewPreset = useCameraStore((s) => s.activeViewPreset);
  const applyViewPreset = useCameraStore((s) => s.applyViewPreset);
  const target = useCameraStore((s) => s.target);
  const inspectionCenter = useCameraStore((s) => s.inspectionCenter);
  const setIsFlying = useCameraStore((s) => s.setIsFlying);
  const routeProgress = useCameraStore((s) => s.routeProgress);
  const isPlayingRoute = useCameraStore((s) => s.isPlayingRoute);
  const setCameraMode = useCameraStore((s) => s.setCameraMode);
  const setRouteProgress = useCameraStore((s) => s.setRouteProgress);
  const setIsPlayingRoute = useCameraStore((s) => s.setIsPlayingRoute);
  const setThirdPersonScope = useCameraStore((s) => s.setThirdPersonScope);
  const returnToRouteOverview = useCameraStore((s) => s.returnToRouteOverview);

  const isProgressiveReveal = useMapStore((s) => s.isProgressiveReveal);
  const setProgressiveReveal = useMapStore((s) => s.setProgressiveReveal);
  const setViewportMode = useInterfaceStore((s) => s.setViewportMode);

  const effectiveProgress =
    cameraMode === 'third-person' || isProgressiveReveal
      ? routeProgress
      : selectedStation?.routeProgressFraction ?? 0;

  const progressPercent = Math.round(effectiveProgress * 100);
  const isTracingActive = cameraMode === 'third-person' && isPlayingRoute;

  const handleFullRoute = () => {
    setViewportMode('map');
    setIsPlayingRoute(false);
    setProgressiveReveal(false);
    setRouteProgress(1);
    returnToRouteOverview();
  };

  const handleToggleTrace = () => {
    setViewportMode('map');
    if (isTracingActive) {
      setIsPlayingRoute(false);
      return;
    }
    setThirdPersonScope('full-route');
    setProgressiveReveal(true);
    const startFrom =
      effectiveProgress >= 0.98
        ? 0
        : cameraMode === 'third-person'
          ? routeProgress
          : selectedStation?.routeProgressFraction ?? 0;
    setRouteProgress(startFrom);
    setCameraMode('third-person');
    setIsPlayingRoute(true);
  };

  const cameraOptions: { id: CameraViewPresetId; label: string }[] = [
    { id: 'regional-overview', label: 'Регионален обзор' },
    { id: 'birds-eye', label: 'Птичи поглед' },
    { id: 'low-aerial', label: 'Нисък въздушен изглед' },
    { id: 'third-person', label: 'Трето лице' },
    { id: 'local-inspection', label: 'Локален инспекционен изглед' },
  ];

  return (
    <footer className="pointer-events-none fixed inset-x-2.5 bottom-2.5 z-30 flex justify-center sm:inset-x-4 sm:bottom-3">
      <div className="cartographic-panel pointer-events-auto relative w-full max-w-5xl rounded-lg px-3 py-2">
        {/* Изскачащо меню за избор на режим на Камерата */}
        {cameraMenuOpen && (
          <div className="cartographic-panel absolute bottom-full right-2 mb-2 w-60 rounded-lg p-1.5">
            <div className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amberwarn-400">
              Изгледи на камерата
            </div>
            {cameraOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setViewportMode('map');
                  applyViewPreset(opt.id, selectedStation?.coordinates);
                  setCameraMenuOpen(false);
                }}
                className={`w-full cursor-pointer rounded px-2.5 py-1.5 text-left text-xs font-medium transition ${
                  activeViewPreset === opt.id
                    ? 'bg-amberwarn-500/20 text-amberwarn-400'
                    : 'text-travertine-100 hover:bg-obsidian-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Фина линия на прогреса с интерактивни точки от Филипопол до Константинопол */}
        <div className="mb-2 flex items-center gap-2">
          <span className="hidden font-mono text-[10px] text-travertine-300 sm:inline">
            Филипопол
          </span>
          <div className="relative flex h-3.5 flex-1 items-center">
            <div className="h-1 w-full overflow-hidden rounded-full bg-obsidian-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-imperial-400 to-amberwarn-400 transition-all duration-200"
                style={{ width: `${Math.max(2, progressPercent)}%` }}
              />
            </div>
            {stations.map((st) => {
              const leftPct = st.routeProgressFraction * 100;
              const isCurrent = st.id === selectedStation?.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => focusStation(st.id)}
                  style={{ left: `${leftPct}%` }}
                  title={`${st.sequence}. ${st.historicalNameBg}`}
                  aria-label={`Спирка ${st.sequence}: ${st.historicalNameBg}`}
                  className={`absolute -translate-x-1/2 cursor-pointer rounded-full border transition ${
                    isCurrent
                      ? 'h-3.5 w-3.5 border-travertine-50 bg-amberwarn-400'
                      : 'h-2 w-2 border-obsidian-700 bg-obsidian-950 hover:border-amberwarn-400'
                  }`}
                />
              );
            })}
          </div>
          <span className="font-mono text-[10px] text-amberwarn-400">
            {progressPercent}%
          </span>
        </div>

        {/* Основен ред: Zoom · Orbit · Reset | Предишна · Следваща · Пълен маршрут · Камера */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {/* Група 1: Zoom, Orbit, Reset */}
          <div className="flex items-center gap-1">
            <div className="inline-flex rounded border border-obsidian-700 bg-obsidian-950/90">
              <button
                type="button"
                onClick={() => cameraDirector.zoomByFactor(0.72)}
                title="Приближи (Zoom In)"
                aria-label="Приближи"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center border-r border-obsidian-700 text-travertine-100 hover:bg-obsidian-800 hover:text-amberwarn-400"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => cameraDirector.zoomByFactor(1.36)}
                title="Отдалечи (Zoom Out)"
                aria-label="Отдалечи"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-travertine-100 hover:bg-obsidian-800 hover:text-amberwarn-400"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="inline-flex rounded border border-obsidian-700 bg-obsidian-950/90">
              <button
                type="button"
                onClick={() => cameraDirector.orbitAroundFocus(-20)}
                title="Орбита наляво (Orbit)"
                aria-label="Орбита наляво"
                className="inline-flex h-8 cursor-pointer items-center gap-1 border-r border-obsidian-700 px-2 text-[11px] text-travertine-200 hover:bg-obsidian-800 hover:text-amberwarn-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Orbit</span>
              </button>
              <button
                type="button"
                onClick={() => cameraDirector.orbitAroundFocus(20)}
                title="Орбита надясно (Orbit)"
                aria-label="Орбита надясно"
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center text-travertine-200 hover:bg-obsidian-800 hover:text-amberwarn-400"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() =>
                cameraDirector.resetForMode(
                  cameraMode,
                  target,
                  inspectionCenter,
                  setIsFlying
                )
              }
              title="Нулирай камерата (Reset)"
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-obsidian-700 bg-obsidian-950/90 px-2.5 text-[11px] font-medium text-travertine-200 hover:border-amberwarn-400 hover:text-travertine-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Група 2: Предишна спирка, Следваща спирка, Проследи / Пълен маршрут, Камера */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={goPrevious}
              disabled={selectedStation?.sequence === 1}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-obsidian-700 bg-obsidian-950/90 px-2.5 text-[11px] font-medium text-travertine-100 transition hover:border-amberwarn-400 disabled:opacity-35"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Предишна спирка</span>
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={selectedStation?.sequence === stations.length}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-amberwarn-400/50 bg-amberwarn-500/15 px-2.5 text-[11px] font-semibold text-amberwarn-400 transition hover:bg-amberwarn-500/25 disabled:opacity-35"
            >
              <span className="hidden sm:inline">Следваща спирка</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleTrace}
              title="Плавно въздушно проследяване на маршрута"
              className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded border px-2.5 text-[11px] font-medium transition ${
                isTracingActive
                  ? 'border-amberwarn-400 bg-amberwarn-500 text-obsidian-950'
                  : 'border-obsidian-700 bg-obsidian-950/90 text-travertine-100 hover:border-amberwarn-400'
              }`}
            >
              {isTracingActive ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5 text-amberwarn-400" />
              )}
              <span className="hidden lg:inline">
                {isTracingActive ? 'Пауза' : 'Проследи'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleFullRoute}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded border border-obsidian-700 bg-obsidian-950/90 px-2.5 text-[11px] font-medium text-travertine-100 transition hover:border-amberwarn-400"
            >
              <Map className="h-3.5 w-3.5 text-imperial-400" />
              <span>Пълен маршрут</span>
            </button>

            <button
              type="button"
              onClick={() => setCameraMenuOpen((v) => !v)}
              aria-expanded={cameraMenuOpen}
              className={`inline-flex h-8 cursor-pointer items-center gap-1 rounded border px-2.5 text-[11px] font-semibold transition ${
                cameraMenuOpen
                  ? 'border-amberwarn-400 bg-amberwarn-500 text-obsidian-950'
                  : 'border-imperial-400/50 bg-imperial-500/20 text-travertine-50 hover:border-amberwarn-400'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>Камера</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
