import { useState } from 'react';
import { Compass, Images, Menu, X, Box, Globe } from 'lucide-react';
import { useCameraStore } from '@/stores/camera-store';
import { useMapStore } from '@/stores/map-store';
import { useInterfaceStore, type NavSectionId } from '@/stores/interface-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';

export function TopHeaderBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const viewportMode = useInterfaceStore((s) => s.viewportMode);
  const setViewportMode = useInterfaceStore((s) => s.setViewportMode);
  const activeNavSection = useInterfaceStore((s) => s.activeNavSection);
  const setActiveNavSection = useInterfaceStore((s) => s.setActiveNavSection);
  const setHomeIntroOpen = useInterfaceStore((s) => s.setHomeIntroOpen);
  const setChronologyOpen = useInterfaceStore((s) => s.setChronologyOpen);
  const setAboutOpen = useInterfaceStore((s) => s.setAboutOpen);
  const openGallery = useInterfaceStore((s) => s.openGallery);
  const setDesktopLeftOpen = useInterfaceStore((s) => s.setDesktopLeftOpen);
  const setMobileStationsOpen = useInterfaceStore((s) => s.setMobileStationsOpen);
  const closeAllOverlays = useInterfaceStore((s) => s.closeAllOverlays);

  const returnToRouteOverview = useCameraStore((s) => s.returnToRouteOverview);
  const setProgressiveReveal = useMapStore((s) => s.setProgressiveReveal);
  const { selectedStation } = useSelectedStation();

  const handleNavClick = (section: NavSectionId) => {
    setMobileMenuOpen(false);
    if (section === 'home') {
      setHomeIntroOpen(true);
      return;
    }
    if (section === 'route') {
      closeAllOverlays();
      setActiveNavSection('route');
      setViewportMode('map');
      setProgressiveReveal(false);
      returnToRouteOverview();
      return;
    }
    if (section === 'stops') {
      closeAllOverlays();
      setActiveNavSection('stops');
      setViewportMode('map');
      setDesktopLeftOpen(true);
      if (window.innerWidth < 1024) {
        setMobileStationsOpen(true);
      }
      return;
    }
    if (section === 'chronology') {
      setChronologyOpen(true);
      return;
    }
    if (section === 'about') {
      setAboutOpen(true);
    }
  };

  const navItems: { id: NavSectionId; label: string }[] = [
    { id: 'home', label: 'Начало' },
    { id: 'route', label: 'Маршрут' },
    { id: 'stops', label: 'Исторически спирки' },
    { id: 'chronology', label: 'Хронология' },
    { id: 'about', label: 'За проекта' },
  ];

  return (
    <header className="pointer-events-none fixed inset-x-2.5 top-2.5 z-30 sm:inset-x-4 sm:top-3">
      <div className="cartographic-panel pointer-events-auto mx-auto flex h-14 items-center justify-between rounded-lg px-3 sm:px-4">
        {/* Лого и подзаглавие */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex cursor-pointer items-center gap-2.5 text-left"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-amberwarn-400/50 bg-obsidian-950 text-amberwarn-400">
            <Compass className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <span className="block font-serif text-base font-bold tracking-wider text-travertine-50 sm:text-lg">
              VIA DIAGONALIS
            </span>
            <span className="block text-[10.5px] tracking-wide text-travertine-200 sm:text-xs">
              По следите на древния римски път
            </span>
          </div>
        </button>

        {/* Петте основни навигационни секции (Десктоп) */}
        <nav
          aria-label="Основна навигация"
          className="hidden items-center gap-1 lg:flex"
        >
          {navItems.map((item) => {
            const active = activeNavSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`cursor-pointer rounded px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                  active
                    ? 'border border-amberwarn-400/60 bg-amberwarn-500/20 text-amberwarn-400'
                    : 'text-travertine-200 hover:bg-obsidian-800/80 hover:text-travertine-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Десни действия: 3D Карта/Архитектура + Оригинални референции + Мобилно меню */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              setViewportMode(viewportMode === 'map' ? 'scene3d' : 'map')
            }
            title={
              viewportMode === 'map'
                ? 'Превключи към отделен 3D архитектурен разрез'
                : 'Върни се към 3D географската карта'
            }
            className="hidden cursor-pointer items-center gap-1.5 rounded border border-obsidian-700 bg-obsidian-950/85 px-2.5 py-1.5 text-xs font-medium text-travertine-100 transition hover:border-amberwarn-400 sm:inline-flex"
          >
            {viewportMode === 'map' ? (
              <>
                <Box className="h-3.5 w-3.5 text-imperial-400" />
                <span className="hidden xl:inline">3D Разрез</span>
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5 text-amberwarn-400" />
                <span>3D Карта</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => openGallery(selectedStation?.originalReferenceKey, false)}
            title="Отвори галерията с деветте оригинални визуални референции"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-amberwarn-400/45 bg-obsidian-950/85 px-2.5 py-1.5 text-xs font-medium text-travertine-50 transition hover:border-amberwarn-400 hover:bg-obsidian-800"
          >
            <Images className="h-3.5 w-3.5 text-amberwarn-400" />
            <span className="hidden md:inline">Галерия</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Навигационно меню"
            aria-expanded={mobileMenuOpen}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-950 text-travertine-100 hover:border-amberwarn-400 lg:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Падащо навигационно меню за вертикален мобилен екран */}
      {mobileMenuOpen && (
        <nav
          aria-label="Мобилна навигация"
          className="cartographic-panel pointer-events-auto mt-1.5 flex flex-col gap-1 rounded-lg p-2 lg:hidden"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full cursor-pointer rounded px-3 py-2.5 text-left text-xs font-medium ${
                activeNavSection === item.id
                  ? 'bg-amberwarn-500/20 text-amberwarn-400'
                  : 'text-travertine-100 hover:bg-obsidian-800'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              setViewportMode(viewportMode === 'map' ? 'scene3d' : 'map');
            }}
            className="w-full cursor-pointer rounded border-t border-obsidian-700 px-3 py-2.5 text-left text-xs font-medium text-imperial-400"
          >
            {viewportMode === 'map'
              ? 'Превключи към 3D Архитектурен разрез'
              : 'Върни се към 3D Географската карта'}
          </button>
        </nav>
      )}
    </header>
  );
}
