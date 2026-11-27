import { X, Mountain, Search } from 'lucide-react';
import { APP_CONFIG } from '@/app/config/app-config';
import { useMapStore } from '@/stores/map-store';
import { useStationStore } from '@/stores/station-store';
import { useInterfaceStore } from '@/stores/interface-store';
import { useCameraStore } from '@/stores/camera-store';
import {
  formatRomanMilesBg,
  getSegmentClassificationLabelBg,
} from '@/utils/formatters';

export function MapLegendAndHoverOverlay() {
  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const cameraMode = useCameraStore((s) => s.cameraMode);
  const basemap = useMapStore((s) => s.basemap);
  const terrainSource = useMapStore((s) => s.terrainSource);
  const hoveredMarker = useMapStore((s) => s.hoveredMarker);
  const hoveredLabel = useMapStore((s) => s.hoveredEntityLabelBg);
  const activeSegmentId = useMapStore((s) => s.activeSegmentId);
  const setActiveSegmentId = useMapStore((s) => s.setActiveSegmentId);
  const segments = useStationStore((s) => s.segments);

  if (viewportMode !== 'map') return null;

  const activeSegment = segments.find((seg) => seg.id === activeSegmentId);

  const terrainLabelBg =
    terrainSource === 'cesium-world-terrain'
      ? 'Cesium World Terrain 3D'
      : terrainSource === 'arcgis-dem-3d'
        ? 'Esri WorldElevation 3D DEM'
        : terrainSource === 'ellipsoid'
          ? 'WGS84 Елипсоид'
          : 'Зареждане на 3D релеф...';

  return (
    <>
      {/* Богата подсказка при hover върху маркер на спирка */}
      {hoveredMarker && (
        <div
          style={{
            left: Math.min(window.innerWidth - 280, Math.max(12, hoveredMarker.screenX + 16)),
            top: Math.max(12, hoveredMarker.screenY - 24),
          }}
          className="cartographic-panel pointer-events-none fixed z-30 w-64 rounded-lg p-2.5 text-xs"
        >
          <div className="font-serif text-sm font-semibold text-travertine-50">
            {hoveredMarker.titleBg}
          </div>
          <div className="mt-0.5 text-[11px] text-travertine-300">
            {hoveredMarker.modernLocationBg}
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-obsidian-800 pt-1.5 text-[10px]">
            <span
              className={
                hoveredMarker.isHypothetical ? 'text-amberwarn-400' : 'text-verdigris-400'
              }
            >
              {hoveredMarker.statusBg}
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-travertine-200">
              <Search className="h-3 w-3 text-amberwarn-400" />
              Клик за инспекция
            </span>
          </div>
        </div>
      )}

      {!hoveredMarker && hoveredLabel && (
        <div className="cartographic-panel pointer-events-none fixed left-1/2 top-[7.4rem] z-20 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-medium text-travertine-50">
          {hoveredLabel}
        </div>
      )}

      {activeSegment && (
        <div className="cartographic-panel pointer-events-auto fixed bottom-24 left-1/2 z-30 w-[min(92vw,26rem)] -translate-x-1/2 rounded-lg p-3 text-xs text-travertine-100">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase text-amberwarn-400">
                {activeSegment.id} · {getSegmentClassificationLabelBg(activeSegment.classification)}
              </span>
              <h3 className="mt-0.5 font-serif text-base font-semibold text-travertine-50">
                {activeSegment.titleBg}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveSegmentId(null)}
              aria-label="Затвори детайлите за участъка"
              className="cursor-pointer rounded p-1 text-travertine-400 hover:bg-obsidian-800 hover:text-travertine-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1 font-mono text-[11px] text-travertine-300">
            Дължина: {formatRomanMilesBg(activeSegment.romanMiles)}
          </p>
          <p className="mt-1.5 leading-relaxed text-travertine-200">
            {activeSegment.evidenceBg}
          </p>
          {activeSegment.riverCrossingsBg.length > 0 && (
            <p className="mt-1.5 text-[11px] text-verdigris-400">
              Речни преходи: {activeSegment.riverCrossingsBg.join(' · ')}
            </p>
          )}
        </div>
      )}

      {/* Дискретна картографска легенда над долния панел при обзорен режим */}
      {!activeSegment && cameraMode === 'overview' && (
        <div className="cartographic-panel pointer-events-none fixed bottom-[5.4rem] left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 rounded-full px-3.5 py-1 text-[11px] text-travertine-200 xl:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-5 rounded border border-travertine-100/60 bg-amberwarn-400" />
            Потвърдено трасе
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 border-t-2 border-dashed border-amberwarn-400" />
            Хипотетичен участък
          </span>
          <span className="flex items-center gap-1.5 text-travertine-300">
            <Mountain className="h-3.5 w-3.5 text-verdigris-400" />
            {terrainLabelBg} · {APP_CONFIG.cesium.basemapProvenanceBg[basemap].split('+')[0]}
          </span>
        </div>
      )}
    </>
  );
}
