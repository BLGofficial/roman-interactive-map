import rawSources from '@/data/historical/sources-catalog.json';
import { getCoordinateByKey } from '@/utils/coordinates';
import { findProgressFractionForCoordinate } from '@/features/route/route-loader';
import {
  getOriginalReferenceForStationId,
  getRegionalPanoramaReference,
} from '@/features/gallery/image-manifest-loader';
import type {
  BibliographicSource,
  StationHistoricalGuide,
  StationRecord,
  StationResolved,
} from '@/types';

const stationModules = import.meta.glob<{ default: StationRecord }>(
  '../../data/stations/[0-9]*.json',
  { eager: true }
);

const sourcesCatalog = rawSources as Record<string, BibliographicSource>;

let cachedStations: StationResolved[] | null = null;

function buildFallbackGuide(record: StationRecord): StationHistoricalGuide {
  return {
    historicalPeriodBg: record.chronologyBg,
    shortIntroBg: record.stateIn117AdBg,
    whatIsItBg: record.stateIn117AdBg,
    whyImportantBg: record.identificationSummaryBg,
    howItLookedConfirmedBg: record.archaeologicalEvidenceBg,
    howItLookedHypothesisBg:
      record.epistemology.scientificHypothesesBg.join(' ') ||
      'Част от архитектурните детайли са възстановени хипотетично по римски паралели.',
    archaeologicalDebateBg: record.identificationSummaryBg,
  };
}

export function loadAllStations(): StationResolved[] {
  if (cachedStations) return cachedStations;

  const regionalRef = getRegionalPanoramaReference();

  const resolved = Object.values(stationModules)
    .filter((mod) => mod?.default && typeof mod.default.sequence === 'number')
    .map((mod) => {
      const record = mod.default;
      const coordinates = getCoordinateByKey(record.coordinateKey);
      const manifestRef =
        getOriginalReferenceForStationId(record.id) ?? regionalRef;

      const syncedGallery = record.galleryItems.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              imageUrl: manifestRef.image,
            }
          : item
      );

      const resolvedSources: BibliographicSource[] = record.sourceIds
        .map((id) => sourcesCatalog[id])
        .filter((s): s is BibliographicSource => Boolean(s));

      return {
        ...record,
        isCoreVisualStop: record.isCoreVisualStop ?? record.sequence <= 8,
        coordinates,
        routeProgressFraction: findProgressFractionForCoordinate(coordinates),
        originalReferenceKey: manifestRef.key,
        originalReferenceWidth: manifestRef.width,
        originalReferenceHeight: manifestRef.height,
        originalReferenceProvenanceBg: manifestRef.provenanceBg,
        resolvedGuide: record.guide ?? buildFallbackGuide(record),
        resolvedSources,
        galleryItems: syncedGallery,
      } satisfies StationResolved;
    })
    .sort((a, b) => a.sequence - b.sequence);

  cachedStations = resolved;
  return resolved;
}
