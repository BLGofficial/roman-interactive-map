import rawRegistry from '@/data/route/coordinates-registry.json';
import { sanitizeCoordinateRecord, sanitizePolyline } from '@/utils/validation';
import type { CoordinateRecord, CoordinateRegistry } from '@/types';

const registry = rawRegistry as unknown as CoordinateRegistry;

/**
 * Единствен централизиран и защитен достъп до географските координати и полилиниите на трасето.
 * При липсващ или невалиден запис записва диагностично предупреждение и връща безопасна стойност без срив.
 */
export function getCoordinateByKey(coordinateKey: string): CoordinateRecord {
  const record = registry.nodes[coordinateKey];
  return sanitizeCoordinateRecord(record, coordinateKey);
}

export function getPolylineByKey(polylineKey: string): [number, number][] {
  const line = registry.polylines[polylineKey];
  return sanitizePolyline(line, polylineKey);
}

/**
 * Генерира реалистична плавна крива на трасето чрез Catmull-Rom сплайн върху опорните топографски точки,
 * така че пътят следва релефа и речните тераси вместо прави геометрични отсечки.
 */
export function densifyCatmullRomLonLat(
  controlPoints: [number, number][],
  subdivisionsPerSegment = 6
): [number, number][] {
  if (controlPoints.length <= 2) return controlPoints;

  const result: [number, number][] = [];
  const n = controlPoints.length;

  const catmullRom = (p0: number, p1: number, p2: number, p3: number, t: number) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  for (let i = 0; i < n - 1; i++) {
    const p0 = controlPoints[Math.max(0, i - 1)];
    const p1 = controlPoints[i];
    const p2 = controlPoints[i + 1];
    const p3 = controlPoints[Math.min(n - 1, i + 2)];

    for (let step = 0; step < subdivisionsPerSegment; step++) {
      const t = step / subdivisionsPerSegment;
      result.push([
        catmullRom(p0[0], p1[0], p2[0], p3[0], t),
        catmullRom(p0[1], p1[1], p2[1], p3[1], t),
      ]);
    }
  }

  result.push(controlPoints[n - 1]);
  return result;
}

export function computeHaversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeInitialBearingDegrees(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const phi1 = toRad(from.lat);
  const phi2 = toRad(to.lat);
  const dLambda = toRad(to.lon - from.lon);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
