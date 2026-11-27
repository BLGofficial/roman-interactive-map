export type CoordinatePrecision =
  | 'exact_excavated_site'
  | 'epigraphic_findspot_corridor'
  | 'regional_complex'
  | 'modern_corridor_reference'
  | 'hypothetical_corridor_centroid';

export interface CoordinateRecord {
  lat: number;
  lon: number;
  elevationMeters: number;
  uncertaintyRadiusKm: number;
  pleiadesId: string | null;
  precision: CoordinatePrecision;
  sourceBg: string;
}

export interface CoordinateRegistry {
  crs: string;
  datum: string;
  targetYearAd: number;
  nodes: Record<string, CoordinateRecord>;
  polylines: Record<string, [number, number][]>;
}

export interface RiverRecord {
  id: string;
  polylineKey: string;
  labelNodeKey: string;
  ancientNameBg: string;
  widthPx: number;
  isPrimary: boolean;
}

export interface RiverResolved extends RiverRecord {
  lonLatPairs: [number, number][];
  labelCoordinate: CoordinateRecord;
}

export interface GeographicRegionRecord {
  id: string;
  coordinateKey: string;
  titleBg: string;
  subtitleBg: string;
  kind: 'plain' | 'mountain' | 'sea';
}

export interface GeographicRegionResolved extends GeographicRegionRecord {
  coordinates: CoordinateRecord;
}

export type StationCategory = 'civitas' | 'mansio' | 'mutatio' | 'emporium';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM_HIGH' | 'MEDIUM_LOW' | 'LOW';

export type IdentificationStatus =
  | 'confirmed'
  | 'regionally_confirmed'
  | 'unconfirmed_exact_location';

export type EpistemologicalTag =
  | 'attested_fact'
  | 'archaeological_interpretation'
  | 'scientific_hypothesis'
  | 'artistic_reconstruction';

export type Scene3dType =
  | 'urban-metropolis'
  | 'road-mutatio'
  | 'mansio-praetorium'
  | 'river-bridge'
  | 'sakar-pass-roadbed';

export interface StationEpistemology {
  attestedFactsBg: string[];
  archaeologicalInterpretationsBg: string[];
  scientificHypothesesBg: string[];
  artisticReconstructionNotesBg: string[];
}

export interface StationScene3dPreset {
  sceneType: Scene3dType;
  roadWidthMeters: number;
  hasBridge: boolean;
  hasFortification117Ad: boolean;
  elevationProfile: string;
  titleBg: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  titleBg: string;
  captionBg: string;
  epistemologicalTag: EpistemologicalTag;
  anachronismWarningBg: string | null;
}

export interface BibliographicSource {
  id: string;
  categoryBg: string;
  citationBg: string;
  url: string | null;
}

export interface StationHistoricalGuide {
  historicalPeriodBg: string;
  shortIntroBg: string;
  whatIsItBg: string;
  whyImportantBg: string;
  howItLookedConfirmedBg: string;
  howItLookedHypothesisBg: string;
  archaeologicalDebateBg: string;
}

export interface StationRecord {
  id: string;
  sequence: number;
  isCoreVisualStop?: boolean;
  coordinateKey: string;
  projectName: string;
  historicalNameBg: string;
  historicalNameLatin: string;
  historicalNameGreek?: string;
  nameIn117AdBg: string;
  ancientVariants: string[];
  modernLocationBg: string;
  categoryItineraries: StationCategory;
  categoryLabelBg: string;
  confidenceLevel: ConfidenceLevel;
  identificationStatus: IdentificationStatus;
  identificationSummaryBg: string;
  distanceFromPrevRomanMiles: number;
  cumulativeRomanMiles: number;
  chronologyBg: string;
  stateIn117AdBg: string;
  archaeologicalEvidenceBg: string;
  guide?: StationHistoricalGuide;
  epistemology: StationEpistemology;
  scene3dPreset: StationScene3dPreset;
  galleryItems: GalleryItem[];
  sourceIds: string[];
}

export interface StationResolved extends StationRecord {
  isCoreVisualStop: boolean;
  coordinates: CoordinateRecord;
  routeProgressFraction: number;
  originalReferenceKey: string;
  originalReferenceWidth: number;
  originalReferenceHeight: number;
  originalReferenceProvenanceBg: string;
  resolvedGuide: StationHistoricalGuide;
  resolvedSources: BibliographicSource[];
}

export type SegmentClassification =
  | 'confirmed'
  | 'confirmed_nodes_inferred_line'
  | 'hypothetical_or_inferred';

export interface RouteSegmentRecord {
  id: string;
  titleBg: string;
  nodeKeys: string[];
  polylineKey: string;
  classification: SegmentClassification;
  romanMiles: number;
  riverCrossingsBg: string[];
  evidenceBg: string;
  sourceIds: string[];
}

export interface RouteSegmentResolved extends RouteSegmentRecord {
  positions: CoordinateRecord[];
  curvedLonLat: [number, number][];
}

export type SupplementaryNodeRole =
  | 'omitted_intermediate'
  | 'eastern_continuation'
  | 'eastern_terminus';

export interface SupplementaryNodeRecord {
  id: string;
  coordinateKey: string;
  nameBg: string;
  name117AdBg: string;
  modernLocationBg: string;
  role: SupplementaryNodeRole;
  categoryBg: string;
  note117AdBg: string;
}

export interface SupplementaryNodeResolved extends SupplementaryNodeRecord {
  coordinates: CoordinateRecord;
}
