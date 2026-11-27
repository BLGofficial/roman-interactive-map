import { Scissors, Tag, Layers, Waves, Sun } from 'lucide-react';
import { APP_CONFIG } from '@/app/config/app-config';
import { useMapStore } from '@/stores/map-store';
import { useInterfaceStore } from '@/stores/interface-store';
import type { BasemapStyle } from '@/types';

/**
 * Дискретна горна картографска лента за слоевете на терена и 3D разреза,
 * оставяща максимална свободна площ за 3D картата.
 */
export function ViewportControlsBar() {
  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const showStratigraphyCutaway = useInterfaceStore((s) => s.showStratigraphyCutaway);
  const showEpistemologicalLabels = useInterfaceStore((s) => s.showEpistemologicalLabels);
  const toggleStratigraphyCutaway = useInterfaceStore((s) => s.toggleStratigraphyCutaway);
  const toggleEpistemologicalLabels = useInterfaceStore((s) => s.toggleEpistemologicalLabels);

  const basemap = useMapStore((s) => s.basemap);
  const setBasemap = useMapStore((s) => s.setBasemap);
  const enableSunShadows = useMapStore((s) => s.enableSunShadows);
  const toggleSunShadows = useMapStore((s) => s.toggleSunShadows);
  const showConfirmedSegments = useMapStore((s) => s.showConfirmedSegments);
  const showInferredSegments = useMapStore((s) => s.showInferredSegments);
  const showRiversAndGeography = useMapStore((s) => s.showRiversAndGeography);
  const toggleConfirmedSegments = useMapStore((s) => s.toggleConfirmedSegments);
  const toggleInferredSegments = useMapStore((s) => s.toggleInferredSegments);
  const toggleRiversAndGeography = useMapStore((s) => s.toggleRiversAndGeography);

  const basemapOptions: { id: BasemapStyle; label: string }[] = [
    { id: 'satellite', label: 'Сателит' },
    { id: 'topographic', label: 'Релеф' },
    { id: 'dark', label: 'Графит' },
  ];

  if (viewportMode === 'scene3d') {
    return (
      <div className="pointer-events-auto fixed left-1/2 top-20 z-20 flex -translate-x-1/2 flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={toggleStratigraphyCutaway}
          className={`cartographic-panel inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
            showStratigraphyCutaway ? 'text-amberwarn-400' : 'text-travertine-300'
          }`}
        >
          <Scissors className="h-3.5 w-3.5" />
          <span>Стратиграфски разрез</span>
        </button>
        <button
          type="button"
          onClick={toggleEpistemologicalLabels}
          className={`cartographic-panel inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${
            showEpistemologicalLabels ? 'text-verdigris-400' : 'text-travertine-300'
          }`}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Етикети за достоверност</span>
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-20 hidden -translate-x-1/2 items-center gap-2 xl:flex">
      <div className="cartographic-panel pointer-events-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]">
        <Layers className="mr-1 h-3 w-3 text-amberwarn-400" />
        <button
          type="button"
          onClick={toggleConfirmedSegments}
          className={`cursor-pointer rounded-full px-2 py-0.5 transition ${
            showConfirmedSegments
              ? 'bg-amberwarn-500/25 text-amberwarn-400'
              : 'text-travertine-400 hover:text-travertine-200'
          }`}
        >
          Потвърден път
        </button>
        <button
          type="button"
          onClick={toggleInferredSegments}
          className={`cursor-pointer rounded-full px-2 py-0.5 transition ${
            showInferredSegments
              ? 'bg-imperial-500/25 text-imperial-400'
              : 'text-travertine-400 hover:text-travertine-200'
          }`}
        >
          Хипотетичен
        </button>
        <button
          type="button"
          onClick={toggleRiversAndGeography}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 transition ${
            showRiversAndGeography
              ? 'bg-verdigris-500/20 text-verdigris-400'
              : 'text-travertine-400 hover:text-travertine-200'
          }`}
        >
          <Waves className="h-3 w-3" />
          <span>Реки</span>
        </button>
        <button
          type="button"
          onClick={toggleSunShadows}
          className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 transition ${
            enableSunShadows
              ? 'bg-travertine-300/20 text-travertine-100'
              : 'text-travertine-400 hover:text-travertine-200'
          }`}
        >
          <Sun className="h-3 w-3" />
          <span>Сенки</span>
        </button>

        <span className="mx-1 h-3.5 w-px bg-obsidian-700" />

        <div
          title={APP_CONFIG.cesium.basemapProvenanceBg[basemap]}
          className="flex items-center gap-0.5"
        >
          {basemapOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setBasemap(opt.id)}
              className={`cursor-pointer rounded-full px-2 py-0.5 transition ${
                basemap === opt.id
                  ? 'bg-obsidian-700 text-travertine-50'
                  : 'text-travertine-300 hover:text-travertine-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
