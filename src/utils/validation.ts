import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import type { OriginalImageManifestEntry } from '@/features/gallery/image-manifest-loader';
import type {
  CoordinateRecord,
  RouteSegmentResolved,
  StationResolved,
} from '@/types';

/**
 * Безопасна резервна координата (Форум на Филипопол — начална точка на Via Diagonalis),
 * използвана само ако външна/модифицирана координата е невалидна, за да не прекъсне 3D рендерирането.
 */
export const FALLBACK_PHILIPPOPOLIS_COORDINATE: CoordinateRecord = {
  lat: 42.1474,
  lon: 24.7491,
  elevationMeters: 168,
  uncertaintyRadiusKm: 0.5,
  pleiadesId: '216927',
  precision: 'exact_excavated_site',
  sourceBg: 'Резервна валидирана координата: Филипопол (Пловдив)',
};

export function isValidWgs84(lat: unknown, lon: unknown): boolean {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

export function isWithinViaDiagonalisBounds(lat: number, lon: number): boolean {
  return lat >= 38.5 && lat <= 45.5 && lon >= 21.5 && lon <= 31.5;
}

export function sanitizeCoordinateRecord(
  record: CoordinateRecord | undefined | null,
  keyLabel: string
): CoordinateRecord {
  if (!record || !isValidWgs84(record.lat, record.lon)) {
    useDiagnosticsStore.getState().reportIssue({
      id: `coord-invalid:${keyLabel}`,
      category: 'coordinates',
      severity: 'warning',
      messageBg: `Невалидна или липсваща координата за ключ „${keyLabel}“ — приложена е резервна стойност.`,
      recoverable: false,
    });
    return { ...FALLBACK_PHILIPPOPOLIS_COORDINATE };
  }

  if (!isWithinViaDiagonalisBounds(record.lat, record.lon)) {
    useDiagnosticsStore.getState().reportIssue({
      id: `coord-bounds:${keyLabel}`,
      category: 'coordinates',
      severity: 'warning',
      messageBg: `Координатата за „${keyLabel}“ (${record.lat}°, ${record.lon}°) е извън историческия обхват на Тракия.`,
      recoverable: false,
    });
  }

  const safeElevation =
    typeof record.elevationMeters === 'number' &&
    Number.isFinite(record.elevationMeters) &&
    record.elevationMeters >= -450 &&
    record.elevationMeters <= 5000
      ? record.elevationMeters
      : 120;

  const safeUncertainty =
    typeof record.uncertaintyRadiusKm === 'number' &&
    Number.isFinite(record.uncertaintyRadiusKm) &&
    record.uncertaintyRadiusKm >= 0
      ? record.uncertaintyRadiusKm
      : 1.0;

  return {
    ...record,
    elevationMeters: safeElevation,
    uncertaintyRadiusKm: safeUncertainty,
  };
}

export function sanitizePolyline(
  points: [number, number][] | undefined | null,
  keyLabel: string
): [number, number][] {
  if (!Array.isArray(points) || points.length < 2) {
    useDiagnosticsStore.getState().reportIssue({
      id: `polyline-invalid:${keyLabel}`,
      category: 'coordinates',
      severity: 'warning',
      messageBg: `Липсваща или твърде кратка полилиния „${keyLabel}“ — заменена с безопасен сегмент.`,
      recoverable: false,
    });
    return [
      [FALLBACK_PHILIPPOPOLIS_COORDINATE.lon, FALLBACK_PHILIPPOPOLIS_COORDINATE.lat],
      [
        FALLBACK_PHILIPPOPOLIS_COORDINATE.lon + 0.02,
        FALLBACK_PHILIPPOPOLIS_COORDINATE.lat,
      ],
    ];
  }

  const valid = points.filter(
    (pt) => Array.isArray(pt) && pt.length >= 2 && isValidWgs84(pt[1], pt[0])
  );

  if (valid.length < points.length) {
    useDiagnosticsStore.getState().reportIssue({
      id: `polyline-filtered:${keyLabel}`,
      category: 'coordinates',
      severity: 'warning',
      messageBg: `Открити и филтрирани са ${points.length - valid.length} невалидни точки в полилиния „${keyLabel}“.`,
      recoverable: false,
    });
  }

  if (valid.length < 2) {
    return [
      [FALLBACK_PHILIPPOPOLIS_COORDINATE.lon, FALLBACK_PHILIPPOPOLIS_COORDINATE.lat],
      [
        FALLBACK_PHILIPPOPOLIS_COORDINATE.lon + 0.02,
        FALLBACK_PHILIPPOPOLIS_COORDINATE.lat,
      ],
    ];
  }

  return valid;
}

export interface IntegrityAuditResult {
  passed: boolean;
  stationCount: number;
  confirmedStationsCount: number;
  hypotheticalStationsCount: number;
  segmentCount: number;
  originalReferencesCount: number;
  errorsBg: string[];
  warningsBg: string[];
}

/**
 * Пълен програмен одит на географските координати, подредбата на спирките, посоката на трасето
 * и целостта на 9-те оригинални визуални референции (P09).
 */
export function runGeographicAndAssetIntegrityAudit(
  stations: StationResolved[],
  segments: RouteSegmentResolved[],
  references: OriginalImageManifestEntry[]
): IntegrityAuditResult {
  const errorsBg: string[] = [];
  const warningsBg: string[] = [];

  if (stations.length !== 11) {
    errorsBg.push(`Очаквани са 11 спирки по маршрута, открити са ${stations.length}.`);
  }

  for (let i = 0; i < stations.length; i++) {
    const st = stations[i];
    if (st.sequence !== i + 1) {
      errorsBg.push(
        `Нарушена поредност при спирка ${st.id}: sequence=${st.sequence}, очаквано=${i + 1}.`
      );
    }
    if (!isValidWgs84(st.coordinates.lat, st.coordinates.lon)) {
      errorsBg.push(`Невалидни WGS84 координати за ${st.id}.`);
    } else if (!isWithinViaDiagonalisBounds(st.coordinates.lat, st.coordinates.lon)) {
      errorsBg.push(`Координатите на ${st.id} са извън балканския коридор.`);
    }

    if (i > 0) {
      const prev = stations[i - 1];
      if (st.cumulativeRomanMiles < prev.cumulativeRomanMiles) {
        errorsBg.push(
          `Немонотонна кумулативна дистанция между ${prev.id} и ${st.id}.`
        );
      }
      if (st.routeProgressFraction < prev.routeProgressFraction) {
        errorsBg.push(
          `Немонотонен прогрес по маршрута между ${prev.id} (${prev.routeProgressFraction}) и ${st.id} (${st.routeProgressFraction}).`
        );
      }
      if (st.coordinates.lon <= prev.coordinates.lon) {
        errorsBg.push(
          `Нарушена географска посока запад→изток между ${prev.id} (${prev.coordinates.lon}°E) и ${st.id} (${st.coordinates.lon}°E).`
        );
      }
    }
  }

  // Проверка на начална и крайна точка (Philippopolis -> Constantinople)
  const first = stations[0];
  const last = stations[stations.length - 1];
  if (first?.id !== 'STOP-01') {
    errorsBg.push('Началната спирка не е STOP-01 (Филипопол).');
  }
  if (last?.id !== 'EXT-15') {
    errorsBg.push('Крайната спирка не е EXT-15 (Византион / Константинопол).');
  }

  // Проверка на разграничението между потвърдени и хипотетични локации
  const confirmedStationsCount = stations.filter(
    (s) => s.identificationStatus === 'confirmed'
  ).length;
  const hypotheticalStationsCount = stations.filter(
    (s) => s.identificationStatus !== 'confirmed'
  ).length;

  const pale = stations.find((s) => s.id === 'STOP-06');
  if (
    !pale ||
    pale.confidenceLevel !== 'LOW' ||
    pale.identificationStatus !== 'unconfirmed_exact_location'
  ) {
    errorsBg.push('Спирка Pale (STOP-06) трябва да е маркирана като хипотетична (LOW).');
  }

  // Проверка на непрекъснатостта на сегментите на трасето
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.curvedLonLat.length < 4) {
      errorsBg.push(`Сегмент ${seg.id} няма достатъчно криволинейни точки.`);
    }
    if (i > 0) {
      const prevSeg = segments[i - 1];
      const prevEnd = prevSeg.curvedLonLat[prevSeg.curvedLonLat.length - 1];
      const currStart = seg.curvedLonLat[0];
      if (
        Math.abs(prevEnd[0] - currStart[0]) > 0.001 ||
        Math.abs(prevEnd[1] - currStart[1]) > 0.001
      ) {
        errorsBg.push(`Прекъсване на геометрията между ${prevSeg.id} и ${seg.id}.`);
      }
    }
  }

  // Проверка на 9-те оригинални референции
  if (references.length !== 9) {
    errorsBg.push(
      `Очаквани са точно 9 оригинални визуални референции, открити са ${references.length}.`
    );
  }
  for (const ref of references) {
    if (ref.type !== 'original-reference') {
      errorsBg.push(`Референция ${ref.key} не е от тип original-reference.`);
    }
    if (ref.width <= 0 || ref.height <= 0) {
      errorsBg.push(`Невалидни размери за изображение ${ref.key}.`);
    }
    if (!ref.image.startsWith('/assets/historical-references/')) {
      warningsBg.push(`Нестандартен път за оригинално изображение: ${ref.image}`);
    }
  }

  return {
    passed: errorsBg.length === 0,
    stationCount: stations.length,
    confirmedStationsCount,
    hypotheticalStationsCount,
    segmentCount: segments.length,
    originalReferencesCount: references.length,
    errorsBg,
    warningsBg,
  };
}
