import rawSegments from '@/data/route/route-segments.json';
import rawSupplementary from '@/data/historical/supplementary-nodes.json';
import rawGeoContext from '@/data/route/geographic-context.json';
import {
  computeHaversineKm,
  computeInitialBearingDegrees,
  densifyCatmullRomLonLat,
  getCoordinateByKey,
  getPolylineByKey,
} from '@/utils/coordinates';
import type {
  CoordinateRecord,
  GeographicRegionRecord,
  GeographicRegionResolved,
  RiverRecord,
  RiverResolved,
  RouteSegmentRecord,
  RouteSegmentResolved,
  RouteTravellerSample,
  SupplementaryNodeRecord,
  SupplementaryNodeResolved,
} from '@/types';

let cachedSegments: RouteSegmentResolved[] | null = null;
let cachedSupplementary: SupplementaryNodeResolved[] | null = null;
let cachedRivers: RiverResolved[] | null = null;
let cachedRegions: GeographicRegionResolved[] | null = null;

export function loadRouteSegments(): RouteSegmentResolved[] {
  if (cachedSegments) return cachedSegments;

  cachedSegments = (rawSegments as RouteSegmentRecord[]).map((seg) => {
    const controlPts = getPolylineByKey(seg.polylineKey);
    return {
      ...seg,
      positions: seg.nodeKeys.map((key) => getCoordinateByKey(key)),
      curvedLonLat: densifyCatmullRomLonLat(controlPts, 6),
    };
  });

  return cachedSegments;
}

/**
 * Връща само междинните станции, които НЕ са изведени като самостоятелни спирки в src/data/stations/,
 * за да няма дублиране на маркери върху 3D картата.
 */
export function loadSupplementaryNodes(excludeIds?: Set<string>): SupplementaryNodeResolved[] {
  if (!cachedSupplementary) {
    cachedSupplementary = (rawSupplementary as SupplementaryNodeRecord[]).map((node) => ({
      ...node,
      coordinates: getCoordinateByKey(node.coordinateKey),
    }));
  }

  if (!excludeIds || excludeIds.size === 0) return cachedSupplementary;
  return cachedSupplementary.filter((n) => !excludeIds.has(n.id));
}

export function loadRivers(): RiverResolved[] {
  if (cachedRivers) return cachedRivers;

  const raw = (rawGeoContext as { rivers: RiverRecord[] }).rivers;
  cachedRivers = raw.map((river) => ({
    ...river,
    lonLatPairs: densifyCatmullRomLonLat(getPolylineByKey(river.polylineKey), 4),
    labelCoordinate: getCoordinateByKey(river.labelNodeKey),
  }));

  return cachedRivers;
}

export function loadGeographicRegions(): GeographicRegionResolved[] {
  if (cachedRegions) return cachedRegions;

  const raw = (rawGeoContext as { regions: GeographicRegionRecord[] }).regions;
  cachedRegions = raw.map((region) => ({
    ...region,
    coordinates: getCoordinateByKey(region.coordinateKey),
  }));

  return cachedRegions;
}

interface CurvedLeg {
  from: { lon: number; lat: number };
  to: { lon: number; lat: number };
  lengthKm: number;
  cumulativeStartKm: number;
  segmentTitleBg: string;
}

let cachedFullSpine: {
  legs: CurvedLeg[];
  points: [number, number][];
  totalKm: number;
} | null = null;

export function getFullCurvedRouteSpine() {
  if (cachedFullSpine) return cachedFullSpine;

  const segments = loadRouteSegments();
  const legs: CurvedLeg[] = [];
  const points: [number, number][] = [];
  let cumulativeKm = 0;

  segments.forEach((seg, segIdx) => {
    const pts = seg.curvedLonLat;
    for (let i = 0; i < pts.length; i++) {
      if (segIdx > 0 && i === 0) continue;
      points.push(pts[i]);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const a = { lon: pts[i][0], lat: pts[i][1] };
      const b = { lon: pts[i + 1][0], lat: pts[i + 1][1] };
      const lengthKm = Math.max(0.01, computeHaversineKm(a, b));
      legs.push({
        from: a,
        to: b,
        lengthKm,
        cumulativeStartKm: cumulativeKm,
        segmentTitleBg: seg.titleBg,
      });
      cumulativeKm += lengthKm;
    }
  });

  cachedFullSpine = { legs, points, totalKm: cumulativeKm };
  return cachedFullSpine;
}

/**
 * Намира относителната позиция [0..1] на дадена станция върху цялото извито трасе Philippopolis -> Constantinople.
 */
export function findProgressFractionForCoordinate(coord: CoordinateRecord): number {
  const { legs, totalKm } = getFullCurvedRouteSpine();
  if (legs.length === 0 || totalKm <= 0) return 0;

  let bestDist = Number.POSITIVE_INFINITY;
  let bestKm = 0;

  for (const leg of legs) {
    const d = computeHaversineKm(coord, leg.from);
    if (d < bestDist) {
      bestDist = d;
      bestKm = leg.cumulativeStartKm;
    }
  }
  const lastLeg = legs[legs.length - 1];
  const endDist = computeHaversineKm(coord, lastLeg.to);
  if (endDist < bestDist) {
    bestKm = totalKm;
  }

  return Math.min(1, Math.max(0, bestKm / totalKm));
}

/**
 * Връща отрязаната полилиния [lon, lat][] от Филипопол до текущия прогрес [0..1]
 * за постепенно визуализиране при движение по маршрута.
 */
export function sliceCurvedRouteUpToProgress(progress01: number): [number, number][] {
  const { legs, totalKm } = getFullCurvedRouteSpine();
  const clamped = Math.min(1, Math.max(0, progress01));
  if (clamped <= 0.001 || legs.length === 0) {
    return legs.length > 0
      ? [
          [legs[0].from.lon, legs[0].from.lat],
          [legs[0].from.lon + 0.001, legs[0].from.lat],
        ]
      : [];
  }

  const targetKm = clamped * totalKm;
  const sliced: [number, number][] = [[legs[0].from.lon, legs[0].from.lat]];

  for (const leg of legs) {
    const legEndKm = leg.cumulativeStartKm + leg.lengthKm;
    if (targetKm >= legEndKm) {
      sliced.push([leg.to.lon, leg.to.lat]);
    } else if (targetKm > leg.cumulativeStartKm) {
      const t = (targetKm - leg.cumulativeStartKm) / leg.lengthKm;
      sliced.push([
        leg.from.lon + (leg.to.lon - leg.from.lon) * t,
        leg.from.lat + (leg.to.lat - leg.from.lat) * t,
      ]);
      break;
    } else {
      break;
    }
  }

  return sliced;
}

export function sampleRouteAtProgress(
  progress01: number,
  filterSegmentId?: string | null
): RouteTravellerSample {
  const allSegments = loadRouteSegments();

  if (filterSegmentId) {
    const seg = allSegments.find((s) => s.id === filterSegmentId);
    if (seg && seg.curvedLonLat.length >= 2) {
      const pts = seg.curvedLonLat;
      let segTotalKm = 0;
      const segLegs: CurvedLeg[] = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = { lon: pts[i][0], lat: pts[i][1] };
        const b = { lon: pts[i + 1][0], lat: pts[i + 1][1] };
        const lengthKm = Math.max(0.01, computeHaversineKm(a, b));
        segLegs.push({
          from: a,
          to: b,
          lengthKm,
          cumulativeStartKm: segTotalKm,
          segmentTitleBg: seg.titleBg,
        });
        segTotalKm += lengthKm;
      }
      const clamped = Math.min(1, Math.max(0, progress01));
      const targetKm = clamped * segTotalKm;
      const active =
        segLegs.find((l) => targetKm <= l.cumulativeStartKm + l.lengthKm) ??
        segLegs[segLegs.length - 1];
      const t = Math.min(
        1,
        Math.max(0, (targetKm - active.cumulativeStartKm) / active.lengthKm)
      );
      return {
        lat: active.from.lat + (active.to.lat - active.from.lat) * t,
        lon: active.from.lon + (active.to.lon - active.from.lon) * t,
        elevationMeters: 140,
        headingDegrees: computeInitialBearingDegrees(active.from, active.to),
        distanceKm: targetKm,
        totalDistanceKm: segTotalKm,
        nearestSegmentTitleBg: active.segmentTitleBg,
      };
    }
  }

  const { legs, totalKm } = getFullCurvedRouteSpine();
  const clamped = Math.min(1, Math.max(0, progress01));
  const targetKm = clamped * totalKm;
  const activeLeg =
    legs.find((leg) => targetKm <= leg.cumulativeStartKm + leg.lengthKm) ??
    legs[legs.length - 1];

  const t = Math.min(
    1,
    Math.max(0, (targetKm - activeLeg.cumulativeStartKm) / activeLeg.lengthKm)
  );

  return {
    lat: activeLeg.from.lat + (activeLeg.to.lat - activeLeg.from.lat) * t,
    lon: activeLeg.from.lon + (activeLeg.to.lon - activeLeg.from.lon) * t,
    elevationMeters: 120,
    headingDegrees: computeInitialBearingDegrees(activeLeg.from, activeLeg.to),
    distanceKm: targetKm,
    totalDistanceKm: totalKm,
    nearestSegmentTitleBg: activeLeg.segmentTitleBg,
  };
}
