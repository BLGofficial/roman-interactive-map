import { APP_CONFIG } from '@/app/config/app-config';
import type {
  ConfidenceLevel,
  EpistemologicalTag,
  IdentificationStatus,
  SegmentClassification,
} from '@/types';

export function formatCoordinatesBg(lat: number, lon: number): string {
  return `${lat.toFixed(4)}° с.ш., ${lon.toFixed(4)}° и.д.`;
}

export function formatRomanMilesBg(romanMiles: number): string {
  if (romanMiles === 0) return 'Начална точка (0 mp)';
  const km = (romanMiles * APP_CONFIG.romanMileToKm).toFixed(1);
  return `${romanMiles} римски мили (~${km} км)`;
}

export function getConfidenceBadgeBg(level: ConfidenceLevel): {
  label: string;
  toneClass: string;
} {
  switch (level) {
    case 'HIGH':
      return {
        label: 'Висока достоверност',
        toneClass: 'bg-verdigris-500/20 text-verdigris-400 border-verdigris-500/40',
      };
    case 'MEDIUM_HIGH':
      return {
        label: 'Средно-висока достоверност',
        toneClass: 'bg-travertine-300/20 text-travertine-200 border-travertine-300/40',
      };
    case 'MEDIUM_LOW':
      return {
        label: 'Регионална локализация',
        toneClass: 'bg-amberwarn-500/20 text-amberwarn-400 border-amberwarn-500/40',
      };
    case 'LOW':
      return {
        label: 'Непотвърдена точна локация',
        toneClass: 'bg-imperial-500/25 text-imperial-400 border-imperial-500/50',
      };
  }
}

export function getIdentificationStatusLabelBg(status: IdentificationStatus): string {
  switch (status) {
    case 'confirmed':
      return 'Археологически и изворово потвърдена';
    case 'regionally_confirmed':
      return 'Регионално потвърдена (с буфер на несигурност)';
    case 'unconfirmed_exact_location':
      return 'Непотвърдена на терен (проектно запазено име)';
  }
}

export function getSegmentClassificationLabelBg(classification: SegmentClassification): string {
  switch (classification) {
    case 'confirmed':
      return 'Археологически засвидетелстван участък';
    case 'confirmed_nodes_inferred_line':
      return 'Потвърдени станции с реконструирано трасе';
    case 'hypothetical_or_inferred':
      return 'Предполагаем участък по релеф и антични мили';
  }
}

export function getEpistemologicalLabelBg(tag: EpistemologicalTag): {
  label: string;
  toneClass: string;
} {
  switch (tag) {
    case 'attested_fact':
      return {
        label: 'Исторически факт (117 г.)',
        toneClass: 'bg-verdigris-500/20 text-verdigris-400 border-verdigris-500/40',
      };
    case 'archaeological_interpretation':
      return {
        label: 'Археологическа интерпретация',
        toneClass: 'bg-travertine-300/20 text-travertine-200 border-travertine-300/40',
      };
    case 'scientific_hypothesis':
      return {
        label: 'Научна хипотеза',
        toneClass: 'bg-amberwarn-500/20 text-amberwarn-400 border-amberwarn-500/40',
      };
    case 'artistic_reconstruction':
      return {
        label: 'Художествена реконструкция',
        toneClass: 'bg-imperial-500/20 text-imperial-400 border-imperial-500/40',
      };
  }
}
