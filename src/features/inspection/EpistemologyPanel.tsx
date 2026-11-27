import type { StationEpistemology } from '@/types';

interface EpistemologyPanelProps {
  epistemology: StationEpistemology;
}

export function EpistemologyPanel({ epistemology }: EpistemologyPanelProps) {
  const sections = [
    {
      title: '1. Исторически засвидетелствани факти (117 г.)',
      items: epistemology.attestedFactsBg,
      tone: 'border-verdigris-500/40 bg-verdigris-500/10 text-verdigris-400',
    },
    {
      title: '2. Археологически интерпретации',
      items: epistemology.archaeologicalInterpretationsBg,
      tone: 'border-travertine-300/40 bg-travertine-300/10 text-travertine-200',
    },
    {
      title: '3. Научни хипотези',
      items: epistemology.scientificHypothesesBg,
      tone: 'border-amberwarn-500/40 bg-amberwarn-500/10 text-amberwarn-400',
    },
    {
      title: '4. Бележки към художествената реконструкция',
      items: epistemology.artisticReconstructionNotesBg,
      tone: 'border-imperial-500/40 bg-imperial-500/10 text-imperial-400',
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map((section) => (
        <section
          key={section.title}
          className={`rounded border p-2.5 ${section.tone}`}
        >
          <h4 className="text-xs font-semibold">{section.title}</h4>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-travertine-100">
            {section.items.map((item) => (
              <li key={item} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
