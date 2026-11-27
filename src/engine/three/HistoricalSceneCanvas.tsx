import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { THRACIAN_LIGHTING_117_AD } from '@/engine/rendering/lighting-presets';
import { attachWebGLContextHandlers } from '@/engine/rendering/webgl-support';
import { getHistoricalSceneDescriptor } from '@/features/historical-scenes/scene-registry';
import { useInterfaceStore } from '@/stores/interface-store';
import type { StationResolved } from '@/types';

interface HistoricalSceneCanvasProps {
  station: StationResolved;
}

export function HistoricalSceneCanvas({ station }: HistoricalSceneCanvasProps) {
  const showStratigraphyCutaway = useInterfaceStore((s) => s.showStratigraphyCutaway);
  const showEpistemologicalLabels = useInterfaceStore((s) => s.showEpistemologicalLabels);
  const detachContextRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      detachContextRef.current?.();
      detachContextRef.current = null;
    };
  }, []);

  const descriptor = getHistoricalSceneDescriptor(station.scene3dPreset.sceneType);
  const SceneComponent = descriptor.Component;

  return (
    <div className="relative h-full w-full bg-obsidian-950">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        gl={{ powerPreference: 'high-performance', antialias: true }}
        camera={{ position: descriptor.defaultCameraPosition, fov: 42, near: 0.1, far: 200 }}
        onCreated={({ gl }) => {
          detachContextRef.current?.();
          detachContextRef.current = attachWebGLContextHandlers(
            gl.domElement,
            '3D археологически разрез'
          );
        }}
      >
        <color attach="background" args={[THRACIAN_LIGHTING_117_AD.fogColor]} />
        <fog
          attach="fog"
          args={[
            THRACIAN_LIGHTING_117_AD.fogColor,
            THRACIAN_LIGHTING_117_AD.fogNear,
            THRACIAN_LIGHTING_117_AD.fogFar,
          ]}
        />
        <ambientLight intensity={THRACIAN_LIGHTING_117_AD.ambientIntensity} />
        <hemisphereLight
          args={[
            THRACIAN_LIGHTING_117_AD.hemisphereSky,
            THRACIAN_LIGHTING_117_AD.hemisphereGround,
            0.5,
          ]}
        />
        <directionalLight
          position={THRACIAN_LIGHTING_117_AD.sunPosition}
          intensity={THRACIAN_LIGHTING_117_AD.sunIntensity}
          color={THRACIAN_LIGHTING_117_AD.sunColor}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <SceneComponent
          station={station}
          showStratigraphyCutaway={showStratigraphyCutaway}
          showEpistemologicalLabels={showEpistemologicalLabels}
        />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minDistance={6}
          maxDistance={38}
          maxPolarAngle={Math.PI / 2 - 0.06}
        />
      </Canvas>

      {/* Научна легенда: разграничение между археологически данни, 3D хипотеза и оригиналните 2D референции */}
      <div className="pointer-events-none absolute bottom-24 right-3 z-10 max-w-sm rounded border border-obsidian-700 bg-obsidian-900/90 p-2.5 text-[11px] text-travertine-200 backdrop-blur">
        <div className="font-semibold text-travertine-50">
          Самостоятелна 3D археологическа схема (отделна от оригиналните изображения)
        </div>
        <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
          <span className="text-verdigris-400">● Зелено: археологически данни</span>
          <span className="text-amberwarn-400">● Кехлибар: реконструктивни хипотези</span>
        </div>
      </div>
    </div>
  );
}
