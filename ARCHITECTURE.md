# ARCHITECTURE — Системна архитектура на VIA DIAGONALIS

## 1. Архитектурни принципи

1. **Строго разделение на отговорностите между 3D двигателите (Zero Engine Overlap)**:
   - **CesiumJS (`src/engine/cesium/`)** управлява единствено глобалната WGS84 геопространствена сцена: реален 3D DEM релеф, речни корита, криволинейно трасе на древния път, интерактивни маркери на станциите, атмосферна перспектива и полет на камерата от трето лице.
   - **Three.js / React Three Fiber (`src/engine/three/`)** управлява единствено локалните 3D археологически и стратиграфски реконструкции (напр. разрез на римското пътно платно: *statumen → rudus → nucleus → pavimentum*, мостови устои, *mansio* / *mutatio* обеми).
   - Чрез `ViewStageRouter.tsx` в даден момент е монтиран **само един активен WebGL контекст**, което елиминира двойното GPU натоварване и изчерпването на графичната памет на мобилни устройства.

2. **Единствен източник на географската истина (`Single Source of Truth`)**:
   - Всички координати (`EPSG:4326 / WGS84`), радиуси на локализационна несигурност, *Pleiades* идентификатори и опорни полилинии се съхраняват централизирано в `src/data/route/coordinates-registry.json` и се четат само през защитения валидатор `src/utils/coordinates.ts` и `src/utils/validation.ts`. В UI компонентите няма хардкоднати координати.

3. **Неприкосновеност на оригиналните визуални активи (Original Image Preservation)**:
   - Деветте оригинални `.png` референции се съхраняват байт-идентично в `public/assets/historical-references/` и се описват в `src/data/stations/station-images.json`.
   - Те **никога** не се прожектират като текстури върху 3D геометрия и **никога** не се изрязват (`object-cover` е забранен; навсякъде се използва `object-contain` с точния `aspectRatio`).

---

## 2. Модулна структура на директориите

```text
via-diagonalis-explorer/
├── public/
│   └── assets/
│       └── historical-references/   # 9 непроменени оригинални PNG референции (SHA-256 верифицирани)
├── scripts/
│   └── qa-audit.mjs                 # Автоматизиран географски, бинарен PNG и SHA-256 одит
├── docs/
│   ├── architecture/                # Първоначална спецификация (P02)
│   └── research/                    # Исторически и ГИС проучвания (P01)
└── src/
    ├── app/
    │   ├── App.tsx                  # Коренова композиция
    │   ├── config/app-config.ts     # Конфигурация на обхвата, DEM/тайл доставчици и константи
    │   ├── providers/AppProviders.tsx # Глобален React Error Boundary
    │   └── router/ViewStageRouter.tsx # Lazy превключване между CesiumJS и R3F + SceneErrorBoundary
    ├── components/
    │   ├── common/                  # ResilientHistoricalImage, SceneErrorBoundary
    │   ├── controls/                # ViewportControlsBar, ThirdPersonRouteBar
    │   ├── inspection/              # StationInspectorPanel (десен плаващ панел)
    │   ├── layout/                  # ExplorerShell (full-bleed 3D екран + десктоп/мобилни панели)
    │   ├── navigation/              # TopHeaderBar, StationSidebarList (ляв плаващ панел)
    │   └── overlays/                # HomeIntroOverlay, AboutProjectModal, MapLegendAndHoverOverlay, SystemDiagnosticsBanner
    ├── data/
    │   ├── historical/              # sources-catalog.json, supplementary-nodes.json
    │   ├── route/                   # coordinates-registry.json, route-segments.json, geographic-context.json
    │   └── stations/                # station-images.json + 01-philippopolis.json .. 11-constantinople.json
    ├── engine/
    │   ├── camera/CameraDirector.ts # Пружинно-демпфирана 3D камера (Overview, Third-Person, Local Inspection)
    │   ├── cesium/                  # CesiumGlobeCanvas, atmosphere-and-lod, roman-road-material, route-entities-sync
    │   ├── rendering/               # lighting-presets.ts, webgl-support.ts
    │   ├── terrain/                 # terrain-provider.ts (3D DEM + таймаут + офлайн картографска мрежа)
    │   └── three/                   # HistoricalSceneCanvas.tsx
    ├── features/
    │   ├── gallery/                 # HistoricalGalleryModal, ZoomPanImageViewer, image-manifest-loader
    │   ├── historical-scenes/       # Археологически 3D сцени и стратиграфски разрези
    │   ├── inspection/              # HistoricalGuideModal, EpistemologyPanel
    │   ├── route/                   # route-loader.ts (Catmull-Rom сплайн, прогресивно разкриване)
    │   ├── stations/                # station-loader.ts
    │   └── timeline/                # RouteTimelineStrip (долен панел), ChronologyModal
    ├── hooks/
    │   └── useSelectedStation.ts    # Синхронизация на избрана станция, WASD/стрелки и клавишни команди
    ├── stores/                      # Zustand хранилища: station, camera, map, interface, diagnostics
    ├── styles/globals.css           # Римска картографска палитра и типографски правила
    ├── types/                       # Строги TypeScript интерфейси за целия домейн
    └── utils/                       # coordinates.ts, validation.ts, formatters.ts
```

---

## 3. Управление на състоянието (Zustand Stores)

| Хранилище | Отговорност |
| :--- | :--- |
| `station-store.ts` | Списък на 11-те спирки, 9-те сегмента и междинните станции, текуща спирка, търсене и филтър по достоверност. |
| `camera-store.ts` | Режим на камерата (`overview`, `third-person`, `local-inspection`), 5 готови перспективи, прогрес по маршрута `[0..1]`, скорост и височина на наблюдателя. |
| `map-store.ts` | Картографска подложка (`satellite`, `topographic`, `dark`), активен DEM източник, видимост на потвърдени/хипотетични сегменти, реки и слънчеви сенки. |
| `interface-store.ts` | Активна навигационна секция, отворени модали, състояние на сгъваемите десктоп панели и мобилните листове (`bottom sheets`). |
| `diagnostics-store.ts` | Мониторинг на системни събития (офлайн режим, резервен терен/подложка, липсващи изображения, WebGL контекст, FPS и JS памет) и действия за възстановяване. |

---

## 4. Производителност и оптимизации

- **Рендериране при заявка (`requestRenderMode: true`)**: CesiumJS преизчислява кадър само при движение на камерата, зареждане на тайл или потребителско действие — **0% GPU натоварване в покой**.
- **Код-сплитинг и Lazy Loading**: чрез `React.lazy()` тежките 3D пакети (`CesiumGlobeCanvas` и `HistoricalSceneCanvas`) и всички пет вторични модала се зареждат асинхронно в отделни JS фрагменти.
- **Адаптивен LOD за мобилни и десктоп устройства**:
  - На мобилни екрани `resolutionScale` е ограничен до `1.35x` (при `2.0x` на десктоп), сенките на терена се изключват автоматично, а `tileCacheSize` се намалява до `140` за нисък разход на RAM/VRAM.
  - По време на движение на камерата `maximumScreenSpaceError` временно се повишава (`2.6` / `3.1`), осигурявайки стабилни 60 FPS при полет.
- **Ограничени кешове за текстури**: процедурните 2D платна за каменната настилка на пътя и номерираните маркери са кеширани с горна граница (до 64 елемента).

---

## 5. Устойчивост и обработка на грешки (Error Handling)

1. **Невалидни координати (`src/utils/validation.ts`)**: Всяка координата и полилиния преминава през проверка за крайни числа, WGS84 граници и балкански обхват; при грешка се подава известие в `diagnostics-store` и се връща безопасна валидирана точка (Филипопол), без да се допуска `NaN` в Cesium/Three.js.
2. **Липсващи изображения (`ResilientHistoricalImage.tsx` & `ZoomPanImageViewer.tsx`)**: При грешка при зареждане на изображение (`onError`) се визуализира информативна карта на български език с точния път до актива и бутон **„Опитай отново“**, без да се генерират фалшиви заместители.
3. **Неуспешно зареждане на 3D терена (`terrain-provider.ts`)**: Външните заявки за DEM са защитени с 8-секунден таймаут и слушател на `errorEvent`; при отказ системата превключва автоматично към `EllipsoidTerrainProvider` и предоставя бутон за повторен опит.
4. **Недостъпни външни ресурси**: Под външните сателитни и топографски тайлове винаги присъства процедурна локална картографска мрежа (`GridImageryProvider`), която поема визуализацията при липса на интернет връзка; събитията `online` / `offline` автоматично възстановяват слоевете.
5. **Грешки при 3D рендериране и WebGL**: `SceneErrorBoundary`, `detectWebGLSupport()`, `viewer.scene.renderError` и слушателите за `webglcontextlost` / `webglcontextrestored` изолират всеки евентуален графичен проблем, запазвайки интерфейса, текстовете и галерията с оригинални изображения 100% функционални.
