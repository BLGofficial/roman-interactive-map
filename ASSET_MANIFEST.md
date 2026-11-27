# ASSET_MANIFEST — Регистър на оригиналните визуални активи

## 1. Статут и правила за неприкосновеност (Original Image Preservation)

В проекта са интегрирани **точно девет (9) оригинални визуални референции** (`.png`). Те са третирани като неприкосновени първични визуални активи при спазване на следните задължителни технически и научни правила:

- **100% байтова идентичност**: Файловете в `public/assets/historical-references/` са директни копия с напълно идентични криптографски **SHA-256** контролни суми спрямо оригиналните изходни файлове.
- **Нулеви модификации и заместители**: Не са генерирани нови или заместващи AI изображения; не са променяни архитектурата, композицията, перспективата или цветовете.
- **Нулево изрязване (`Zero Cropping`)**: В целия изходен код не се използва `object-cover`. Всички компоненти (`ResilientHistoricalImage`, `StationInspectorPanel`, `ZoomPanImageViewer`, `HistoricalGalleryModal`, `HistoricalGuideModal`) визуализират изображенията чрез `object-contain` и точния им оригинален `aspectRatio` (`1672 / 941` за панорамата и `1448 / 1086` = `4 / 3` за осемте спирки).
- **Нулево използване като 3D текстури**: Изображенията са напълно отделени от 3D геометрията в CesiumJS и Three.js.
- **Научно етикетиране**: Всеки актив носи ясен етикет *„Оригинална дигитална визуална референция — не представлява автентично изображение от античността“*, заедно с конкретна археологическа бележка при хронологични разлики спрямо 117 г. сл. Хр.

---

## 2. Криптографски и технически манифест на деветте оригинални изображения

| № | Ключ в манифеста | Свързана спирка | Път в приложението (`public/`) | Оригинален изходен файл | Резолюция (px) | Пропорция | Размер (байта) | SHA-256 контролна сума |
| :-: | :--- | :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **0** | `regional_panorama` | Общ обзор (`null` + контекст за `EXT-09..15`) | `/assets/historical-references/00-regional-panorama.png` | `Roman Thrace_ The Via Diagonalis.png` | `1672 × 941` | `1672 / 941` | `3 881 353` | `01c6cef80e21324604fbbdf81f78e8ef79636470bc034a91721a116af2e2c5f3` |
| **1** | `philippopolis` | `STOP-01` (Филипопол) | `/assets/historical-references/01-philippopolis.png` | `ChatGPT Image Nov 7, 2026, 02_52_02 AM-1.png` | `1448 × 1086` | `4 / 3` | `3 944 254` | `d652e81c9fff8a869ae53c974f4cd5761fac3636d2f7ad5d95d5ce11751da992` |
| **2** | `sernota` | `STOP-02` (Сернота) | `/assets/historical-references/02-sernota.png` | `ChatGPT Image Nov 7, 2026, 02_52_09 AM-2.png` | `1448 × 1086` | `4 / 3` | `4 057 646` | `f1448915dca19a908fa2f8065aefbfe09ec0257df2fa3d976674d1941102c0d0` |
| **3** | `parembole` | `STOP-03` (Паремболе) | `/assets/historical-references/03-parembole.png` | `ChatGPT Image Nov 7, 2026, 02_52_18 AM-3.png` | `1448 × 1086` | `4 / 3` | `3 926 864` | `f047b7ad3985fcaa00ff085ecd22dc105eb790e6ca651918737eadb776accf01` |
| **4** | `carassura` | `STOP-04` (Карасура) | `/assets/historical-references/04-carassura.png` | `ChatGPT Image Nov 7, 2026, 02_52_24 AM-4.png` | `1448 × 1086` | `4 / 3` | `4 042 119` | `6172bf24e919cede02174462d62c2e0c216ac231a9354121d3e7fbee81f0a458` |
| **5** | `arzus` | `STOP-05` (Арзус) | `/assets/historical-references/05-arzus.png` | `ChatGPT Image Nov 7, 2026, 02_52_28 AM-5.png` | `1448 × 1086` | `4 / 3` | `3 989 444` | `f3b3162c075d55fc6bae610cab3800052d95b3c6f07dca329ddfb4b2b24840d0` |
| **6** | `pale` | `STOP-06` (Пале / *Palae*) | `/assets/historical-references/06-pale.png` | `ChatGPT Image Nov 7, 2026, 02_52_34 AM-6.png` | `1448 × 1086` | `4 / 3` | `4 190 426` | `f01927a3b00ee446d882269cc354704e0bf9ed78ccc3db830e80bba5ca9fbb58` |
| **7** | `castra_rubra` | `STOP-07` (Кастра Рубра) | `/assets/historical-references/07-castra-rubra.png` | `ChatGPT Image Nov 7, 2026, 02_52_42 AM-7.png` | `1448 × 1086` | `4 / 3` | `4 195 035` | `c6a4af952fd3d20864fc5013bc161d1a230a65c7b783fe5cf772376bee8bd8a4` |
| **8** | `burdipta` | `STOP-08` (Бурдипта) | `/assets/historical-references/08-burdipta.png` | `ChatGPT Image Nov 7, 2026, 02_52_47 AM-8.png` | `1448 × 1086` | `4 / 3` | `4 256 121` | `d3aa615b004fb5d616e90cb7d39ed38874c21c7a88272719be7eab67f8419a03` |

---

## 3. Процедурни и програмни активи

Освен деветте оригинални референции, приложението генерира динамично в паметта (без външни файлове):
- **Процедурна каменна настилка на пътя** (`src/engine/cesium/roman-road-material.ts`) — `256 × 64` canvas текстура на римски полигонален паваж с бордюрни блокове (*umbones*) в пясъчно-златист колорит.
- **Интерактивни номерирани маркери с икона за инспекция** (`getStationMarkerCanvas`, `96 × 112` px) — плътен контур за потвърдени станции, пунктиран за хипотетични (*Pale*) и медно-зелен за финалната точка (*Constantinople*).
- **Офлайн картографска мрежа** (`createOfflineCartographicGridProvider` в `src/engine/terrain/terrain-provider.ts`) — резервна векторно-растерна координатна мрежа при липса на интернет връзка.

---

## 4. Автоматична проверка на манифеста

Всеки път при изпълнение на `npm run qa` (`scripts/qa-audit.mjs`) автоматично се проверяват:
1. Наличието на всички 9 файла в `public/assets/historical-references/`.
2. Пълното съвпадение на техните **SHA-256** хешове с първичните изходни файлове.
3. Реалните бинарни размери от PNG `IHDR` заглавията спрямо `src/data/stations/station-images.json`.
4. Липсата на `object-cover` в целия `src/`.
