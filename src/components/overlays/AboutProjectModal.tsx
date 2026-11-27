import { useMemo } from 'react';
import { Activity, BookOpen, Compass, ShieldCheck, Layers, X } from 'lucide-react';
import { getAllOriginalReferences } from '@/features/gallery/image-manifest-loader';
import { detectWebGLSupport } from '@/engine/rendering/webgl-support';
import { useInterfaceStore } from '@/stores/interface-store';
import { useStationStore } from '@/stores/station-store';
import { useMapStore } from '@/stores/map-store';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { runGeographicAndAssetIntegrityAudit } from '@/utils/validation';

export function AboutProjectModal() {
  const isAboutOpen = useInterfaceStore((s) => s.isAboutOpen);
  const setAboutOpen = useInterfaceStore((s) => s.setAboutOpen);
  const stations = useStationStore((s) => s.stations);
  const segments = useStationStore((s) => s.segments);
  const terrainSource = useMapStore((s) => s.terrainSource);
  const fps = useDiagnosticsStore((s) => s.fps);
  const jsHeapMb = useDiagnosticsStore((s) => s.jsHeapMb);

  const audit = useMemo(
    () =>
      runGeographicAndAssetIntegrityAudit(
        stations,
        segments,
        getAllOriginalReferences()
      ),
    [segments, stations]
  );

  const webgl = detectWebGLSupport();

  if (!isAboutOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="За проекта Via Diagonalis"
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/85 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="cartographic-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-obsidian-700 bg-obsidian-950/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-amberwarn-400" />
            <div>
              <h2 className="font-serif text-xl font-bold text-travertine-50">
                За проекта VIA DIAGONALIS
              </h2>
              <p className="text-xs text-travertine-300">
                Дигитална археология, 3D WebGIS картография и научна методология
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAboutOpen(false)}
            aria-label="Затвори информацията за проекта"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-amberwarn-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs leading-relaxed text-travertine-200">
          <section className="rounded-lg border border-obsidian-700 bg-obsidian-950/75 p-4">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-travertine-50">
              <Layers className="h-4 w-4 text-amberwarn-400" />
              Мисия и обхват
            </h3>
            <p className="mt-1.5 text-travertine-100">
              Платформата реконструира тракийския и източнотракийския дял на стратегическия
              римски път *Via Militaris* (наречен от Константин Иречек *Via Diagonalis*) — от
              *Philippopolis* (Пловдив) през осемте визуално документирани крайпътни спирки в
              Горнотракийската низина и Сакар, през *Uscudama / Hadrianopolis* (Одрин) и
              *Perinthus* (Мармара Ерейлиси) до *Byzantium / Constantinopolis* (Истанбул), с
              основен исторически фокус около **117 г. сл. Хр.**
            </p>
          </section>

          <section className="rounded-lg border border-obsidian-700 bg-obsidian-950/75 p-4">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-travertine-50">
              <ShieldCheck className="h-4 w-4 text-verdigris-400" />
              Научна коректност и опазване на оригиналните референции
            </h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-travertine-100">
              <li>
                <strong>Четири нива на достоверност:</strong> ясно разграничение между
                исторически засвидетелствани факти, археологически интерпретации, научни
                хипотези и художествени реконструкции.
              </li>
              <li>
                <strong>Непокътнати оригинални референции:</strong> деветте визуални актива се
                визуализират без изрязване, цветови промени или прекодиране, като откритите
                разлики спрямо 117 г. (напр. крепостната стена на Филипопол от 172 г. или
                византийските куртини при Кастра Рубра от V–VI в.) са честно обяснени в текста.
              </li>
              <li>
                <strong>Реален 3D релеф и координати:</strong> нито една координата не е
                измислена; станциите са привързани към *Pleiades*, *Digital Atlas of the Roman
                Empire (DARE)* и теренните отчети на НАИМ при БАН, а непотвърдените на терен
                спирки (*Сернота*, *Пале*) са означени като хипотетични области.
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-obsidian-700 bg-obsidian-950/75 p-4">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-travertine-50">
              <BookOpen className="h-4 w-4 text-imperial-400" />
              Основни групи извори и управление
            </h3>
            <p className="mt-1.5">
              Писмени и епиграфски паметници: *Itinerarium Antonini*, *Itinerarium
              Burdigalense* (333 г.), *Tabula Peutingeriana*, *CIL* III 6123 (надписът на Нерон
              от 61 г.), *IGBulg* III/1–2 (БАН), корпусът на *Perinthus* и публикациите на НАИМ
              при БАН (*АОР*, М. Маджаров, Е. Кесякова, И. Топалилов, Н. Шаранков, М. Вендел, Б.
              Борисов).
            </p>
            <p className="mt-2 font-mono text-[11px] text-amberwarn-400">
              Бързи клавиши: WASD / Стрелки (движение над релефа) · Q/E (орбита) · +/- (мащаб)
              · Двоен клик (фокус върху точка) · 1–5 (изгледи на камерата) · Esc (изход).
            </p>
          </section>

          <section className="rounded-lg border border-obsidian-700 bg-obsidian-950/75 p-4">
            <h3 className="flex items-center gap-2 font-serif text-base font-bold text-travertine-50">
              <Activity className="h-4 w-4 text-verdigris-400" />
              Системна верификация и производителност
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[11px] sm:grid-cols-4">
              <div className="rounded border border-obsidian-800 bg-obsidian-900 p-2">
                <div className="text-[10px] text-travertine-400">Гео-одит</div>
                <div className="font-semibold text-verdigris-400">
                  {audit.passed ? 'PASSED' : 'WARN'} ({audit.stationCount}/11 спирки)
                </div>
              </div>
              <div className="rounded border border-obsidian-800 bg-obsidian-900 p-2">
                <div className="text-[10px] text-travertine-400">Оригинални активи</div>
                <div className="font-semibold text-amberwarn-400">
                  {audit.originalReferencesCount}/9 непроменени
                </div>
              </div>
              <div className="rounded border border-obsidian-800 bg-obsidian-900 p-2">
                <div className="text-[10px] text-travertine-400">3D Релеф / FPS</div>
                <div className="font-semibold text-travertine-50">
                  {terrainSource} · ~{fps} FPS
                </div>
              </div>
              <div className="rounded border border-obsidian-800 bg-obsidian-900 p-2">
                <div className="text-[10px] text-travertine-400">WebGL / Памет</div>
                <div className="truncate font-semibold text-travertine-100" title={webgl.rendererInfo}>
                  WebGL {webgl.version}.0{jsHeapMb ? ` · ${jsHeapMb} MB` : ''}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
