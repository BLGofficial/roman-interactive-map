import { SlidersHorizontal, RefreshCw, X } from 'lucide-react';
import { sampleRouteAtProgress } from '@/features/route/route-loader';
import { useCameraStore } from '@/stores/camera-store';
import { useMapStore } from '@/stores/map-store';
import { useInterfaceStore } from '@/stores/interface-store';

/**
 * Компактна плаваща лента само за специфичните параметри на Режим Трето лице (регулиране на височината и скоростта)
 * и Авто-орбита в Локална инспекция, позиционирана над долния контролен панел без дублиране на основните бутони.
 */
export function ThirdPersonRouteBar() {
  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const cameraMode = useCameraStore((s) => s.cameraMode);
  const customFocusPoint = useCameraStore((s) => s.customFocusPoint);
  const routeProgress = useCameraStore((s) => s.routeProgress);
  const routeSpeedMultiplier = useCameraStore((s) => s.routeSpeedMultiplier);
  const thirdPersonAltitudeMeters = useCameraStore((s) => s.thirdPersonAltitudeMeters);
  const thirdPersonScope = useCameraStore((s) => s.thirdPersonScope);
  const isAutoOrbiting = useCameraStore((s) => s.isAutoOrbiting);

  const setRouteProgress = useCameraStore((s) => s.setRouteProgress);
  const setRouteSpeedMultiplier = useCameraStore((s) => s.setRouteSpeedMultiplier);
  const setThirdPersonAltitudeMeters = useCameraStore(
    (s) => s.setThirdPersonAltitudeMeters
  );
  const toggleAutoOrbit = useCameraStore((s) => s.toggleAutoOrbit);
  const exitInspectionSmoothly = useCameraStore((s) => s.exitInspectionSmoothly);

  const activeSegmentId = useMapStore((s) => s.activeSegmentId);

  if (viewportMode !== 'map' || cameraMode === 'overview') return null;

  if (cameraMode === 'local-inspection') {
    return (
      <div className="cartographic-panel pointer-events-auto fixed bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-travertine-100">
        <span className="font-mono text-[10px] font-semibold uppercase text-amberwarn-400">
          {customFocusPoint ? customFocusPoint.labelBg : 'Орбитална инспекция'}
        </span>
        <button
          type="button"
          onClick={toggleAutoOrbit}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] transition ${
            isAutoOrbiting
              ? 'border-verdigris-400 bg-verdigris-500/20 text-verdigris-400'
              : 'border-obsidian-700 bg-obsidian-950 text-travertine-200 hover:border-amberwarn-400'
          }`}
        >
          <RefreshCw className={`h-3 w-3 ${isAutoOrbiting ? 'animate-spin' : ''}`} />
          <span>Авто-орбита</span>
        </button>
        <button
          type="button"
          onClick={exitInspectionSmoothly}
          title="Изход от инспекция (Esc)"
          aria-label="Изход от инспекция"
          className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-obsidian-700 bg-obsidian-950 text-travertine-300 hover:border-amberwarn-400 hover:text-travertine-50"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const filterSeg = thirdPersonScope === 'selected-segment' ? activeSegmentId : null;
  const sample = sampleRouteAtProgress(routeProgress, filterSeg);
  const speeds: (0.5 | 1 | 2 | 4)[] = [0.5, 1, 2, 4];

  return (
    <div className="cartographic-panel pointer-events-auto fixed bottom-24 left-1/2 z-20 flex w-[94%] max-w-xl -translate-x-1/2 flex-wrap items-center justify-between gap-2.5 rounded-lg px-3.5 py-2 text-xs text-travertine-100">
      <div className="flex flex-1 items-center gap-2">
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(routeProgress * 1000)}
          onChange={(e) => setRouteProgress(Number(e.target.value) / 1000)}
          aria-label="Позиция по трасето"
          className="h-1 flex-1 cursor-pointer accent-amberwarn-400"
        />
        <span className="shrink-0 font-mono text-[10.5px] text-amberwarn-400">
          {sample.distanceKm.toFixed(0)}/{sample.totalDistanceKm.toFixed(0)} км
        </span>
      </div>

      <div className="flex items-center gap-2">
        <SlidersHorizontal className="h-3.5 w-3.5 text-travertine-300" />
        <label htmlFor="tp-alt" className="text-[11px] text-travertine-300">
          Височина:
        </label>
        <input
          id="tp-alt"
          type="range"
          min={350}
          max={20000}
          step={150}
          value={thirdPersonAltitudeMeters}
          onChange={(e) => setThirdPersonAltitudeMeters(Number(e.target.value))}
          className="h-1 w-20 cursor-pointer accent-travertine-200"
        />
        <span className="font-mono text-[10.5px] text-travertine-200">
          {(thirdPersonAltitudeMeters / 1000).toFixed(1)} км
        </span>

        <div className="flex items-center gap-0.5 border-l border-obsidian-700 pl-2">
          {speeds.map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setRouteSpeedMultiplier(spd)}
              className={`cursor-pointer rounded px-1.5 py-0.5 font-mono text-[10px] ${
                routeSpeedMultiplier === spd
                  ? 'bg-amberwarn-500/25 text-amberwarn-400'
                  : 'text-travertine-400 hover:text-travertine-200'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
