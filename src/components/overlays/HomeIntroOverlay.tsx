import { Compass, Play, Images, MapPin, X } from 'lucide-react';
import { useInterfaceStore } from '@/stores/interface-store';
import { useCameraStore } from '@/stores/camera-store';
import { useMapStore } from '@/stores/map-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';

export function HomeIntroOverlay() {
  const isHomeIntroOpen = useInterfaceStore((s) => s.isHomeIntroOpen);
  const setHomeIntroOpen = useInterfaceStore((s) => s.setHomeIntroOpen);
  const setActiveNavSection = useInterfaceStore((s) => s.setActiveNavSection);
  const openGallery = useInterfaceStore((s) => s.openGallery);
  const setViewportMode = useInterfaceStore((s) => s.setViewportMode);

  const setCameraMode = useCameraStore((s) => s.setCameraMode);
  const setRouteProgress = useCameraStore((s) => s.setRouteProgress);
  const setIsPlayingRoute = useCameraStore((s) => s.setIsPlayingRoute);
  const setProgressiveReveal = useMapStore((s) => s.setProgressiveReveal);
  const { focusStation } = useSelectedStation();

  if (!isHomeIntroOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Начало — Via Diagonalis"
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/80 p-4 backdrop-blur-sm"
    >
      <div className="cartographic-panel relative max-w-2xl overflow-hidden rounded-lg p-6 sm:p-8">
        <button
          type="button"
          onClick={() => {
            setHomeIntroOpen(false);
            setActiveNavSection('route');
          }}
          aria-label="Затвори началния екран"
          className="absolute right-4 top-4 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-900 text-travertine-200 hover:border-amberwarn-400"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded border border-amberwarn-500/40 bg-amberwarn-500/10 px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-amberwarn-400">
          <Compass className="h-3.5 w-3.5" />
          Римска Тракия · 117 г. сл. Хр.
        </div>

        <h2 className="mt-3 font-serif text-3xl font-bold tracking-wide text-travertine-50 sm:text-4xl">
          VIA DIAGONALIS
        </h2>
        <p className="mt-1 font-serif text-lg italic text-amberwarn-400">
          По следите на древния римски път — от Филипопол до Константинопол
        </p>

        <p className="mt-4 text-sm leading-relaxed text-travertine-100">
          Изследвайте в реална 3D географска среда централната сухопътна артерия на Римската
          империя на Балканите (*Via Militaris*). Преминете през осемте визуално
          реконструирани тракийски спирки между *Philippopolis* и *Burdipta*, продължете през
          *Uscudama / Hadrianopolis* и провинциалната столица *Perinthus* и достигнете
          историческия край на пътя при *Byzantium / Constantinopolis* на брега на Босфора.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setHomeIntroOpen(false);
              setActiveNavSection('stops');
              setViewportMode('map');
              focusStation('STOP-01');
            }}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded bg-amberwarn-500 px-4 py-2.5 text-xs font-semibold text-obsidian-950 transition hover:bg-amberwarn-400"
          >
            <MapPin className="h-4 w-4" />
            <span>Тръгни от Филипопол</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHomeIntroOpen(false);
              setActiveNavSection('route');
              setViewportMode('map');
              setProgressiveReveal(true);
              setRouteProgress(0);
              setCameraMode('third-person');
              setIsPlayingRoute(true);
            }}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-imperial-400/60 bg-imperial-500/25 px-4 py-2.5 text-xs font-semibold text-travertine-50 transition hover:bg-imperial-500/40"
          >
            <Play className="h-4 w-4 text-amberwarn-400" />
            <span>Проследи маршрута</span>
          </button>

          <button
            type="button"
            onClick={() => openGallery('regional_panorama', false)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-obsidian-700 bg-obsidian-800 px-4 py-2.5 text-xs font-medium text-travertine-100 transition hover:border-amberwarn-400"
          >
            <Images className="h-4 w-4 text-amberwarn-400" />
            <span>Оригинални референции</span>
          </button>
        </div>
      </div>
    </div>
  );
}
