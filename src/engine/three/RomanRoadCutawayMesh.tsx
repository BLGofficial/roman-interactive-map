import { Html } from '@react-three/drei';

interface RomanRoadCutawayMeshProps {
  roadWidthMeters: number;
  showStratigraphyCutaway: boolean;
  showLabels: boolean;
  cumulativeMiles: number;
}

/**
 * Инженерен 3D модел на четирислойната римска пътна конструкция по Via Militaris (117 г.):
 * 1. Statumen (едър ломен камък)
 * 2. Rudus (трошен камък с хоросан)
 * 3. Nucleus (фин чакъл/пясък)
 * 4. Summum dorsum / Pavimentum (полигонални каменни плочи с бордюри umbones и канавки fossae)
 */
export function RomanRoadCutawayMesh({
  roadWidthMeters,
  showStratigraphyCutaway,
  showLabels,
  cumulativeMiles,
}: RomanRoadCutawayMeshProps) {
  const length = 22;

  return (
    <group position={[0, 0, 0]}>
      {/* Основно пътно платно (Summum dorsum) */}
      <mesh position={[0, 0.24, showStratigraphyCutaway ? -2 : 0]} receiveShadow castShadow>
        <boxGeometry args={[roadWidthMeters, 0.16, showStratigraphyCutaway ? length - 4 : length]} />
        <meshStandardMaterial color="#8f867a" roughness={0.85} />
      </mesh>

      {/* Бордюрни камъни (Umbones) */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (roadWidthMeters / 2 + 0.18), 0.28, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.32, 0.34, length]} />
          <meshStandardMaterial color="#aba090" roughness={0.8} />
        </mesh>
      ))}

      {/* Отводнителни канавки (Fossae) */}
      {[-1, 1].map((side) => (
        <mesh
          key={`fossa-${side}`}
          position={[side * (roadWidthMeters / 2 + 0.75), 0.03, 0]}
          receiveShadow
        >
          <boxGeometry args={[0.65, 0.06, length]} />
          <meshStandardMaterial color="#3c352c" roughness={0.95} />
        </mesh>
      ))}

      {/* Стъпаловиден стратиграфски разрез в предния край */}
      {showStratigraphyCutaway && (
        <group position={[0, 0, 8.5]}>
          {/* Statumen */}
          <mesh position={[0, 0.04, 1.5]} receiveShadow>
            <boxGeometry args={[roadWidthMeters - 0.1, 0.08, 3.2]} />
            <meshStandardMaterial color="#58524b" roughness={0.95} />
          </mesh>
          {/* Rudus */}
          <mesh position={[0, 0.11, 0.7]} receiveShadow>
            <boxGeometry args={[roadWidthMeters - 0.15, 0.07, 2.2]} />
            <meshStandardMaterial color="#766858" roughness={0.9} />
          </mesh>
          {/* Nucleus */}
          <mesh position={[0, 0.17, -0.1]} receiveShadow>
            <boxGeometry args={[roadWidthMeters - 0.2, 0.06, 1.4]} />
            <meshStandardMaterial color="#a89070" roughness={0.85} />
          </mesh>

          {showLabels && (
            <Html position={[roadWidthMeters / 2 + 1.1, 0.55, 0.8]} center distanceFactor={16}>
              <div className="pointer-events-none whitespace-nowrap rounded border border-travertine-300/40 bg-obsidian-950/90 px-2 py-1 text-[11px] text-travertine-100 shadow">
                Разрез: Statumen → Rudus → Nucleus → Pavimentum ({roadWidthMeters.toFixed(1)} м)
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Римска милиарна колона (Miliarium — 117 г. сл. Хр.) */}
      <group position={[roadWidthMeters / 2 + 1.35, 0, 3.2]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[0.62, 0.4, 0.62]} />
          <meshStandardMaterial color="#cbb697" roughness={0.75} />
        </mesh>
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.25, 1.6, 20]} />
          <meshStandardMaterial color="#dfd3bf" roughness={0.7} />
        </mesh>
        {showLabels && (
          <Html position={[0, 2.35, 0]} center distanceFactor={15}>
            <div className="pointer-events-none whitespace-nowrap rounded border border-verdigris-400/50 bg-obsidian-950/90 px-2 py-0.5 font-mono text-[10px] text-verdigris-400">
              MP {cumulativeMiles || 'I'} · IMP. CAES. TRAIAN / HADRIAN (117 г.)
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}
