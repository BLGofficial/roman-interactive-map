import { Suspense, lazy } from 'react';
import { SceneErrorBoundary } from '@/components/common/SceneErrorBoundary';
import { useInterfaceStore } from '@/stores/interface-store';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';

const LazyCesiumGlobeCanvas = lazy(async () => {
  const mod = await import('@/engine/cesium/CesiumGlobeCanvas');
  return { default: mod.CesiumGlobeCanvas };
});

const LazyHistoricalSceneCanvas = lazy(async () => {
  const mod = await import('@/engine/three/HistoricalSceneCanvas');
  return { default: mod.HistoricalSceneCanvas };
});

/**
 * Lazy-зареждане на тежките 3D двигатели (CesiumJS WebGIS и Three.js / R3F),
 * обвити в SceneErrorBoundary, така че началната обвивка се зарежда мигновено,
 * активен е само един WebGL контекст и при 3D грешка интерфейсът остава работещ.
 */
export function ViewStageRouter() {
  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const sceneResetNonce = useDiagnosticsStore((s) => s.sceneResetNonce);
  const { selectedStation } = useSelectedStation();

  if (viewportMode === 'scene3d' && selectedStation) {
    return (
      <SceneErrorBoundary
        sceneNameBg="3D историческа реконструкция"
        resetKey={`scene3d-${sceneResetNonce}-${selectedStation.id}`}
      >
        <Suspense
          fallback={
            <div
              role="status"
              aria-busy="true"
              className="flex h-full w-full items-center justify-center bg-obsidian-950 text-xs text-travertine-300"
            >
              Зареждане на 3D историческата реконструкция (117 г. сл. Хр.)...
            </div>
          }
        >
          <div key={sceneResetNonce} className="relative h-full w-full">
            <LazyHistoricalSceneCanvas station={selectedStation} />
            <div className="pointer-events-none absolute left-1/2 top-[7.4rem] -translate-x-1/2 rounded border border-obsidian-700 bg-obsidian-900/90 px-3 py-1 text-xs text-travertine-200 backdrop-blur">
              {selectedStation.scene3dPreset.titleBg}
            </div>
          </div>
        </Suspense>
      </SceneErrorBoundary>
    );
  }

  return (
    <SceneErrorBoundary
      sceneNameBg="3D географски терен"
      resetKey={`map-${sceneResetNonce}`}
    >
      <Suspense
        fallback={
          <div
            role="status"
            aria-busy="true"
            className="flex h-full w-full items-center justify-center bg-obsidian-950 text-xs text-travertine-300"
          >
            Инициализиране на 3D географския релеф на Римска Тракия...
          </div>
        }
      >
        <div key={sceneResetNonce} className="h-full w-full">
          <LazyCesiumGlobeCanvas />
        </div>
      </Suspense>
    </SceneErrorBoundary>
  );
}
