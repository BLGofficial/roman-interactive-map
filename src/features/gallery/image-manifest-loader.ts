import rawManifest from '@/data/stations/station-images.json';

export interface OriginalImageManifestEntry {
  key: string;
  title: string;
  stationId: string | null;
  image: string;
  type: 'original-reference';
  originalFilename: string;
  width: number;
  height: number;
  aspectRatio: string;
  provenanceBg: string;
}

type RawManifestMap = Record<string, Omit<OriginalImageManifestEntry, 'key'>>;

const manifestEntries: OriginalImageManifestEntry[] = Object.entries(
  rawManifest as RawManifestMap
).map(([key, value]) => ({
  key,
  ...value,
}));

export function getAllOriginalReferences(): OriginalImageManifestEntry[] {
  return manifestEntries;
}

export function getOriginalReferenceByKey(
  key: string
): OriginalImageManifestEntry | undefined {
  return manifestEntries.find((entry) => entry.key === key);
}

export function getOriginalReferenceForStationId(
  stationId: string
): OriginalImageManifestEntry | undefined {
  return manifestEntries.find((entry) => entry.stationId === stationId);
}

export function getRegionalPanoramaReference(): OriginalImageManifestEntry {
  return (
    manifestEntries.find((entry) => entry.key === 'regional_panorama') ??
    manifestEntries[0]
  );
}
