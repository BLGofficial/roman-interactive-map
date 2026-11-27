import { Html } from '@react-three/drei';
import { RomanRoadCutawayMesh } from '@/engine/three/RomanRoadCutawayMesh';
import type { SceneComponentProps } from '@/types';

/**
 * Самостоятелен археологически 3D реконструктивен модел (отделен от 9-те оригинални 2D референции).
 * Разграничава ясно археологическите доказателства от реконструктивните хипотези за 117 г. сл. Хр.
 */
export function MansioAndMutatioScene({
  station,
  showStratigraphyCutaway,
  showEpistemologicalLabels,
}: SceneComponentProps) {
  const { scene3dPreset } = station;
  const isLargeStation =
    station.categoryItineraries === 'civitas' || station.categoryItineraries === 'mansio';

  return (
    <group>
      {/* Теренна основа */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[52, 52]} />
        <meshStandardMaterial color="#3b4232" roughness={0.96} />
      </mesh>

      {/* Археологически засвидетелстван конструктивен разрез на римския път */}
      <RomanRoadCutawayMesh
        roadWidthMeters={scene3dPreset.roadWidthMeters}
        showStratigraphyCutaway={showStratigraphyCutaway}
        showLabels={showEpistemologicalLabels}
        cumulativeMiles={station.cumulativeRomanMiles}
      />

      {/* Реконструктивна хипотеза за надземните обеми на крайпътната станция (117 г.) */}
      <group position={[-8.5, 0, -1.5]}>
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[isLargeStation ? 10.5 : 7.2, 0.1, isLargeStation ? 11 : 7.5]} />
          <meshStandardMaterial color="#8f8270" roughness={0.9} />
        </mesh>

        {/* Главно крило с керемиден покрив */}
        <mesh position={[-2.8, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 3.0, isLargeStation ? 10.2 : 6.8]} />
          <meshStandardMaterial color="#d8cbb8" roughness={0.78} />
        </mesh>
        <mesh position={[-2.8, 3.45, 0]} castShadow>
          <coneGeometry args={[2.8, 1.2, 4]} />
          <meshStandardMaterial color="#a84c2c" roughness={0.72} />
        </mesh>

        {/* Конюшни (Stabula) */}
        <mesh position={[1.2, 1.15, -3.6]} castShadow receiveShadow>
          <boxGeometry args={[5.4, 2.3, 2.8]} />
          <meshStandardMaterial color="#cbbba2" roughness={0.82} />
        </mesh>
        <mesh position={[1.2, 2.65, -3.6]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.6, 0.9, 4]} />
          <meshStandardMaterial color="#9e4426" roughness={0.75} />
        </mesh>

        {scene3dPreset.hasFortification117Ad && (
          <group position={[2.2, 0, 4.2]}>
            <mesh position={[0, 2.4, 0]} castShadow>
              <boxGeometry args={[2.8, 4.8, 2.8]} />
              <meshStandardMaterial color="#9e7b66" roughness={0.85} />
            </mesh>
            {showEpistemologicalLabels && (
              <Html position={[0, 5.4, 0]} center distanceFactor={18}>
                <div className="pointer-events-none whitespace-nowrap rounded border border-amberwarn-400/60 bg-obsidian-950/95 px-2 py-0.5 text-[10px] text-amberwarn-400">
                  Реконструктивна хипотеза: ранен превален пост (117 г.)
                </div>
              </Html>
            )}
          </group>
        )}

        {showEpistemologicalLabels && (
          <Html position={[-2.8, 4.7, 0]} center distanceFactor={18}>
            <div className="pointer-events-none whitespace-nowrap rounded border border-amberwarn-400/60 bg-obsidian-950/95 px-2.5 py-1 text-[10px] text-amberwarn-400 shadow">
              Реконструктивна хипотеза: надземни обеми и покриви ({station.historicalNameBg})
            </div>
          </Html>
        )}
      </group>

      {/* Археологическо доказателство (устои) + реконструктивна хипотеза (връхна конструкция) */}
      {scene3dPreset.hasBridge && (
        <group position={[0, 0, -13.5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <planeGeometry args={[52, 5.6]} />
            <meshStandardMaterial color="#214d63" roughness={0.25} metalness={0.35} />
          </mesh>
          {[-2.2, 2.2].map((x) => (
            <mesh key={x} position={[x, 0.65, 0]} castShadow>
              <boxGeometry args={[1.1, 1.3, 2.6]} />
              <meshStandardMaterial color="#9c9386" roughness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[scene3dPreset.roadWidthMeters + 0.4, 0.28, 6.4]} />
            <meshStandardMaterial color="#7d6449" roughness={0.82} />
          </mesh>
          {showEpistemologicalLabels && (
            <Html position={[5.4, 2.1, 0]} center distanceFactor={18}>
              <div className="pointer-events-none whitespace-nowrap rounded border border-verdigris-400/60 bg-obsidian-950/95 px-2 py-0.5 text-[10px] text-verdigris-400">
                Археологическо доказателство: каменни устои · Хипотеза: дървено платно
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
}
