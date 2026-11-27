import { Clock, MapPin, X } from 'lucide-react';
import { useInterfaceStore } from '@/stores/interface-store';
import { useSelectedStation } from '@/hooks/useSelectedStation';

interface ChronologyEra {
  yearBg: string;
  titleBg: string;
  descriptionBg: string;
  linkedStationId: string;
  linkedStationLabelBg: string;
  isPrimaryEpoch?: boolean;
}

const CHRONOLOGY_ERAS: ChronologyEra[] = [
  {
    yearBg: 'IV – I в. пр. Хр.',
    titleBg: 'Предримски тракийски коридор по река Хеброс',
    descriptionBg:
      'Естественото трасе по долината на Марица свързва одриските средища, елинистическия Φιλιππόπολις (основан в 342 г. пр. Хр.) и колониите по Пропонтида и Босфора (Πέρινθος и Βυζάντιον).',
    linkedStationId: 'STOP-01',
    linkedStationLabelBg: 'Към Филипопол',
  },
  {
    yearBg: '45 – 61 г. сл. Хр.',
    titleBg: 'Провинция Тракия и строителната програма на император Нерон',
    descriptionBg:
      'След превръщането на Тракия в римска провинция (45–46 г.) император Нерон възлага през 61 г. на прокуратора Titus Iulius Ustus да изгради държавни странноприемници и резиденции (tabernae et praetoria) по военните пътища — пряко засвидетелствани с надписа край с. Белозем.',
    linkedStationId: 'STOP-03',
    linkedStationLabelBg: 'Към Паремболе (Белозем)',
  },
  {
    yearBg: '98 – 117 г. сл. Хр. (Целеви хоризонт)',
    titleBg: 'Разцвет при Траян и Адриан — Via Militaris през 117 г.',
    descriptionBg:
      'Във връзка с Дакийските и Партската война пътят получава здрава 6-метрова каменна настилка, милиарни колони и мостове (като устоите над р. Сазлийка при Арзус и платното при Изворово). Във Филипопол е завършена траяновата фаза на Античния театър (114–117 г.), а при мира на Pax Romana долният град живее без крепостна стена.',
    linkedStationId: 'STOP-05',
    linkedStationLabelBg: 'Към моста при Арзус',
    isPrimaryEpoch: true,
  },
  {
    yearBg: '124 – 202 г. сл. Хр.',
    titleBg: 'Урбанизация на Адрианопол, стената от 172 г. и Емпорион Пизос',
    descriptionBg:
      'Император Адриан превръща тракийската Uscudama в блестящия полис Hadrianopolis. След нашествието на костобоките Марк Аврелий издига през 172 г. крепостната стена около равнинния Филипопол (IGBulg III/1 878), а през 202 г. Септимий Север основава тържището Emporium Pizos край Димитриево.',
    linkedStationId: 'EXT-09',
    linkedStationLabelBg: 'Към Адрианопол',
  },
  {
    yearBg: '324 – 334 г. сл. Хр.',
    titleBg: 'Освещаването на Константинопол и Бурдигалският пътеводител',
    descriptionBg:
      'През 324–330 г. Константин Велики преустройва Византион в новата имперска столица Constantinopolis. Само три години по-късно (333 г.) анонимен поклонник от Бордо изминава трасето и записва всички сменни и нощувъчни станции в своето Itinerarium Burdigalense.',
    linkedStationId: 'EXT-15',
    linkedStationLabelBg: 'Към Константинопол',
  },
  {
    yearBg: 'IV – VI в. сл. Хр.',
    titleBg: 'Късноантично укрепяване на станциите при Карасура и Кастра Рубра',
    descriptionBg:
      'Под натиска на готи, хуни, авари и славяни някогашните отворени пътни станции се превръщат в мощни каменни крепости с бойни кули и раннохристиянски базилики, разкрити днес на хълма Калето при Рупките (Carassura) и край Изворово (Castra Rubra).',
    linkedStationId: 'STOP-07',
    linkedStationLabelBg: 'Към Кастра Рубра',
  },
];

export function ChronologyModal() {
  const isChronologyOpen = useInterfaceStore((s) => s.isChronologyOpen);
  const setChronologyOpen = useInterfaceStore((s) => s.setChronologyOpen);
  const setViewportMode = useInterfaceStore((s) => s.setViewportMode);
  const { focusStation } = useSelectedStation();

  if (!isChronologyOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Хронология на Via Diagonalis"
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/85 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="cartographic-panel flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg">
        <div className="flex items-center justify-between border-b border-obsidian-700 bg-obsidian-950/80 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-amberwarn-400" />
            <div>
              <h2 className="font-serif text-xl font-bold text-travertine-50">
                Хронология на Via Diagonalis
              </h2>
              <p className="text-xs text-travertine-300">
                От предримския тракийски друм през 117 г. сл. Хр. до Късната античност
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setChronologyOpen(false)}
            aria-label="Затвори хронологията"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded border border-obsidian-700 bg-obsidian-800 text-travertine-200 hover:border-amberwarn-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3.5 overflow-y-auto p-5">
          {CHRONOLOGY_ERAS.map((era) => (
            <article
              key={era.yearBg}
              className={`rounded-lg border p-4 ${
                era.isPrimaryEpoch
                  ? 'border-amberwarn-400 bg-amberwarn-500/10'
                  : 'border-obsidian-700 bg-obsidian-950/75'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold text-amberwarn-400">
                  {era.yearBg}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setChronologyOpen(false);
                    setViewportMode('map');
                    focusStation(era.linkedStationId);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2.5 py-1 text-[11px] font-medium text-travertine-100 transition hover:border-amberwarn-400"
                >
                  <MapPin className="h-3 w-3 text-amberwarn-400" />
                  <span>{era.linkedStationLabelBg}</span>
                </button>
              </div>
              <h3 className="mt-1.5 font-serif text-lg font-bold text-travertine-50">
                {era.titleBg}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-travertine-200">
                {era.descriptionBg}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
