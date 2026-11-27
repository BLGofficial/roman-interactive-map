import * as Cesium from 'cesium';
import {
  createRomanStoneRoadMaterial,
  getStationMarkerCanvas,
} from '@/engine/cesium/roman-road-material';
import type {
  GeographicRegionResolved,
  RiverResolved,
  RouteSegmentResolved,
  StationResolved,
  SupplementaryNodeResolved,
} from '@/types';

export interface RouteSyncOptions {
  stations: StationResolved[];
  segments: RouteSegmentResolved[];
  supplementaryNodes: SupplementaryNodeResolved[];
  rivers: RiverResolved[];
  regions: GeographicRegionResolved[];
  selectedStationId: string;
  showConfirmedSegments: boolean;
  showInferredSegments: boolean;
  showRiversAndGeography: boolean;
  showUncertaintyCircles: boolean;
  showSupplementaryNodes: boolean;
  isProgressiveReveal: boolean;
}

const TRAVELLER_ENTITY_ID = 'traveller:observer';
const PROGRESSIVE_STONE_ID = 'progressive:stone-road';
const PROGRESSIVE_GLOW_ID = 'progressive:glow-road';

export function syncViaDiagonalisEntities(
  dataSource: Cesium.CustomDataSource,
  options: RouteSyncOptions
): void {
  dataSource.entities.suspendEvents();
  dataSource.entities.removeAll();

  const {
    stations,
    segments,
    supplementaryNodes,
    rivers,
    regions,
    selectedStationId,
    showConfirmedSegments,
    showInferredSegments,
    showRiversAndGeography,
    showUncertaintyCircles,
    showSupplementaryNodes,
    isProgressiveReveal,
  } = options;

  // 0. Реалистични речни корита и физикогеографски контекст
  if (showRiversAndGeography) {
    for (const river of rivers) {
      const flatCoords: number[] = [];
      for (const [lon, lat] of river.lonLatPairs) {
        flatCoords.push(lon, lat);
      }

      dataSource.entities.add({
        id: `river:${river.id}`,
        name: river.ancientNameBg,
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(flatCoords),
          width: river.widthPx,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.16,
            color: Cesium.Color.fromCssColorString(
              river.isPrimary ? '#3b8db5' : '#4b7fa1'
            ).withAlpha(0.8),
          }),
          clampToGround: true,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0,
            river.isPrimary ? 1_400_000 : 520_000
          ),
        },
      });
    }

    for (const region of regions) {
      const colorCss =
        region.kind === 'sea'
          ? '#7cc2e8'
          : region.kind === 'mountain'
            ? '#dfd3bf'
            : '#cbb697';

      dataSource.entities.add({
        id: `region:${region.id}`,
        name: `${region.titleBg} — ${region.subtitleBg}`,
        position: Cesium.Cartesian3.fromDegrees(
          region.coordinates.lon,
          region.coordinates.lat,
          region.coordinates.elevationMeters + 120
        ),
        label: {
          text: region.titleBg,
          font: '600 11px Georgia, serif',
          fillColor: Cesium.Color.fromCssColorString(colorCss).withAlpha(0.82),
          outlineColor: Cesium.Color.fromCssColorString('#0b0d10'),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(95_000, 1_100_000),
          translucencyByDistance: new Cesium.NearFarScalar(95_000, 0.9, 950_000, 0.45),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  // 1. Извито историческо трасе на Via Diagonalis (каменна текстура + пясъчно-златиста светлинна нишка)
  for (const segment of segments) {
    const isHypothetical = segment.classification === 'hypothetical_or_inferred';
    if (!isHypothetical && !showConfirmedSegments) continue;
    if (isHypothetical && !showInferredSegments) continue;

    const flatCurved: number[] = [];
    for (const [lon, lat] of segment.curvedLonLat) {
      flatCurved.push(lon, lat);
    }
    const cartesianPositions = Cesium.Cartesian3.fromDegreesArray(flatCurved);

    if (isProgressiveReveal) {
      // В режим „Проследи маршрута“ оставяме деликатна водеща следа за ориентация,
      // а каменната златиста настилка се разгръща динамично до текущата точка.
      dataSource.entities.add({
        id: `segment:${segment.id}`,
        name: segment.titleBg,
        polyline: {
          positions: cartesianPositions,
          width: 3,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#e4c47a').withAlpha(0.32),
            dashLength: 14,
          }),
          clampToGround: true,
        },
      });
      continue;
    }

    if (!isHypothetical) {
      // Основен каменен пласт с процедурна римска настилка в пясъчно-златист тон
      dataSource.entities.add({
        id: `segment:${segment.id}`,
        name: segment.titleBg,
        polyline: {
          positions: cartesianPositions,
          width: 10,
          material: createRomanStoneRoadMaterial(segment.romanMiles * 2.2),
          clampToGround: true,
        },
      });

      // Лека топла светлинна нишка по короната на пътя
      dataSource.entities.add({
        id: `segment-glow:${segment.id}`,
        name: segment.titleBg,
        polyline: {
          positions: cartesianPositions,
          width: 5,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromCssColorString('#ffe39f').withAlpha(0.78),
          }),
          clampToGround: true,
        },
      });
    } else {
      // Хипотетични участъци: мек златист ореол + пунктирана пясъчно-кехлибарена каменна линия
      dataSource.entities.add({
        id: `segment-glow:${segment.id}`,
        name: segment.titleBg,
        polyline: {
          positions: cartesianPositions,
          width: 8,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.25,
            color: Cesium.Color.fromCssColorString('#dfa348').withAlpha(0.45),
          }),
          clampToGround: true,
        },
      });

      dataSource.entities.add({
        id: `segment:${segment.id}`,
        name: segment.titleBg,
        polyline: {
          positions: cartesianPositions,
          width: 4.5,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString('#f7d88b'),
            gapColor: Cesium.Color.fromCssColorString('#593d18').withAlpha(0.55),
            dashLength: 20,
          }),
          clampToGround: true,
        },
      });
    }
  }

  // 2. Второстепенни междинни станции по маршрута (Циле, Опизо, Раме, Буртудизус, Бергуле, Селимбрия, Регион)
  if (showSupplementaryNodes) {
    for (const node of supplementaryNodes) {
      dataSource.entities.add({
        id: `supp:${node.id}`,
        name: node.nameBg,
        position: Cesium.Cartesian3.fromDegrees(
          node.coordinates.lon,
          node.coordinates.lat,
          node.coordinates.elevationMeters + 25
        ),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromCssColorString('#e4c47a'),
          outlineColor: Cesium.Color.fromCssColorString('#0b0d10'),
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(15_000, 1.15, 850_000, 0.7),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: node.nameBg,
          font: '500 11px Inter, sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#e4d7c3'),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -11),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 340_000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  // 3. Интерактивни маркери на спирките (1. Филипопол -> 8-те визуални -> Адрианопол -> Перинт -> 11. Константинопол)
  for (const station of stations) {
    const isSelected = station.id === selectedStationId;
    const isHypothetical = station.identificationStatus === 'unconfirmed_exact_location';
    const isTerminus = station.id === 'EXT-15';

    // Визуално подчертаване на избрания обект при инспекция (светещ златист пръстен върху релефа)
    if (isSelected) {
      dataSource.entities.add({
        id: `highlight-ring:${station.id}`,
        position: Cesium.Cartesian3.fromDegrees(
          station.coordinates.lon,
          station.coordinates.lat
        ),
        ellipse: {
          semiMajorAxis: 420,
          semiMinorAxis: 420,
          material: Cesium.Color.fromCssColorString('#fae4ad').withAlpha(0.22),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#fae4ad'),
          outlineWidth: 3,
          height: 0,
        },
      });
    }

    // Приблизителен географски обхват за хипотетични или регионални станции
    if (showUncertaintyCircles && station.coordinates.uncertaintyRadiusKm >= 1.0) {
      dataSource.entities.add({
        id: `uncertainty:${station.id}`,
        name: `Приблизителна географска област: ${station.historicalNameBg} (±${station.coordinates.uncertaintyRadiusKm} км)`,
        position: Cesium.Cartesian3.fromDegrees(
          station.coordinates.lon,
          station.coordinates.lat
        ),
        ellipse: {
          semiMajorAxis: station.coordinates.uncertaintyRadiusKm * 1000,
          semiMinorAxis: station.coordinates.uncertaintyRadiusKm * 1000,
          material: (isHypothetical
            ? Cesium.Color.fromCssColorString('#dfa348')
            : Cesium.Color.fromCssColorString('#e3b359')
          ).withAlpha(isHypothetical ? 0.18 : 0.1),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString('#f7d88b').withAlpha(0.65),
          height: 0,
        },
      });
    }

    const markerCanvas = getStationMarkerCanvas({
      sequence: station.sequence,
      isSelected,
      status: station.identificationStatus,
      isTerminus,
    });

    dataSource.entities.add({
      id: `station:${station.id}`,
      name: `${station.sequence}. ${station.historicalNameBg}`,
      position: Cesium.Cartesian3.fromDegrees(
        station.coordinates.lon,
        station.coordinates.lat,
        station.coordinates.elevationMeters + 22
      ),
      billboard: {
        image: markerCanvas,
        width: isSelected ? 46 : 38,
        height: isSelected ? 54 : 45,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scaleByDistance: new Cesium.NearFarScalar(8_000, 1.12, 950_000, 0.78),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `${station.sequence}. ${station.historicalNameBg}${
          isHypothetical ? ' (хипотетична)' : ''
        }`,
        font: isSelected ? '700 13px Inter, sans-serif' : '600 11.5px Inter, sans-serif',
        fillColor: Cesium.Color.fromCssColorString(
          isHypothetical ? '#fae4ad' : '#faf7f2'
        ),
        outlineColor: Cesium.Color.fromCssColorString('#0b0d10'),
        outlineWidth: 4,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: isSelected,
        backgroundColor: Cesium.Color.fromCssColorString('#12161b').withAlpha(0.88),
        backgroundPadding: new Cesium.Cartesian2(8, 4),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, isSelected ? -56 : -47),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
          0,
          isSelected || isTerminus || station.sequence === 1 || station.sequence === 9
            ? 1_500_000
            : 650_000
        ),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  dataSource.entities.resumeEvents();
}

/**
 * Актуализира постепенно разгръщащата се каменна златиста линия по маршрута от Филипопол към Константинопол.
 */
export function syncProgressiveRevealedRoad(
  dataSource: Cesium.CustomDataSource,
  slicedLonLat: [number, number][] | null
): void {
  const existingStone = dataSource.entities.getById(PROGRESSIVE_STONE_ID);
  const existingGlow = dataSource.entities.getById(PROGRESSIVE_GLOW_ID);

  if (!slicedLonLat || slicedLonLat.length < 2) {
    if (existingStone) dataSource.entities.remove(existingStone);
    if (existingGlow) dataSource.entities.remove(existingGlow);
    return;
  }

  const flat: number[] = [];
  for (const [lon, lat] of slicedLonLat) {
    flat.push(lon, lat);
  }
  const positions = Cesium.Cartesian3.fromDegreesArray(flat);

  if (existingStone?.polyline && existingGlow?.polyline) {
    existingStone.polyline.positions = new Cesium.ConstantProperty(positions);
    existingGlow.polyline.positions = new Cesium.ConstantProperty(positions);
    return;
  }

  dataSource.entities.add({
    id: PROGRESSIVE_STONE_ID,
    name: 'Via Diagonalis — изминато трасе',
    polyline: {
      positions,
      width: 11,
      material: createRomanStoneRoadMaterial(slicedLonLat.length * 1.4),
      clampToGround: true,
    },
  });

  dataSource.entities.add({
    id: PROGRESSIVE_GLOW_ID,
    name: 'Via Diagonalis — светлинна следа',
    polyline: {
      positions,
      width: 6,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.34,
        color: Cesium.Color.fromCssColorString('#ffe7a8').withAlpha(0.9),
      }),
      clampToGround: true,
    },
  });
}

export function syncTravellerObserverEntity(
  dataSource: Cesium.CustomDataSource,
  position: Cesium.Cartesian3 | null
): void {
  const existing = dataSource.entities.getById(TRAVELLER_ENTITY_ID);

  if (!position) {
    if (existing) dataSource.entities.remove(existing);
    return;
  }

  if (existing) {
    existing.position = new Cesium.ConstantPositionProperty(position);
    return;
  }

  dataSource.entities.add({
    id: TRAVELLER_ENTITY_ID,
    name: 'Пътешественик по Via Diagonalis',
    position,
    point: {
      pixelSize: 15,
      color: Cesium.Color.fromCssColorString('#fae4ad'),
      outlineColor: Cesium.Color.fromCssColorString('#b84a27'),
      outlineWidth: 3.5,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: 'По следите на Via Diagonalis',
      font: '700 11px Inter, sans-serif',
      fillColor: Cesium.Color.fromCssColorString('#fae4ad'),
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 3,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -16),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
  });
}
