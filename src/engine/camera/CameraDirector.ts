import * as Cesium from 'cesium';
import { isValidWgs84 } from '@/utils/validation';
import type {
  CameraTarget,
  CoordinateRecord,
  GeographicCameraMode,
  RouteTravellerSample,
} from '@/types';

export type PanDirection = 'north' | 'south' | 'east' | 'west';

/**
 * Пружинно-демпфиран 3D контролер на камерата (P06):
 * - Нулево телепортиране: всеки преход използва кубична интерполация (CUBIC_IN_OUT) или експоненциално затихване.
 * - Плавно следване от трето лице със свободно орбитално завъртане, регулируема височина и свободно реене над терена.
 * - Поддържа Desktop (drag, плавно колелце, WASD/стрелки със скоростен вектор, двоен клик за фокус)
 *   и Mobile (1-пръст ротация, 2-пръста pinch мащабиране и 2-пръста pan преместване по терена).
 */
export class CameraDirector {
  private viewer: Cesium.Viewer | null = null;
  private isLockedTransform = false;

  // Текуща и целева котва за плавно следване (без скокове)
  private currentAnchorCarto: { lon: number; lat: number; height: number } | null = null;
  private desiredRangeMeters = 3600;
  private currentRangeMeters = 3600;
  private lastRouteHeadingDeg: number | null = null;
  private isTransitionFlying = false;

  // Двупръстов touch pan + pinch тракер за мобилни екрани
  private activeTouches = new Map<number, { x: number; y: number }>();
  private prevTwoFingerCentroid: { x: number; y: number; dist: number } | null = null;
  private detachDomListeners: (() => void) | null = null;

  public attach(viewer: Cesium.Viewer): void {
    this.viewer = viewer;
    this.isLockedTransform = false;
    this.currentAnchorCarto = null;
    this.lastRouteHeadingDeg = null;
    this.isTransitionFlying = false;
    this.bindSmoothWheelAndTouchGestures(viewer);
  }

  public detach(): void {
    this.detachDomListeners?.();
    this.detachDomListeners = null;
    this.activeTouches.clear();

    if (this.viewer && !this.viewer.isDestroyed()) {
      this.releaseReferenceLock();
      this.viewer.camera.cancelFlight();
    }
    this.viewer = null;
  }

  public requestRender(): void {
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.scene.requestRender();
    }
  }

  public releaseReferenceLock(): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;
    if (this.isLockedTransform) {
      this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
      this.isLockedTransform = false;
      this.currentAnchorCarto = null;
      this.lastRouteHeadingDeg = null;
      this.viewer.scene.requestRender();
    }
  }

  public sampleSurfaceHeight(lon: number, lat: number, fallbackMeters = 120): number {
    if (!this.viewer || this.viewer.isDestroyed()) return fallbackMeters;
    const carto = Cesium.Cartographic.fromDegrees(lon, lat);
    const sampled = this.viewer.scene.globe.getHeight(carto);
    return typeof sampled === 'number' && Number.isFinite(sampled) && sampled > -500
      ? sampled
      : fallbackMeters;
  }

  /**
   * Избира точна 3D координата върху терена по екранни пиксели (за Double-click фокус).
   */
  public pickTerrainCoordinates(
    windowPosition: Cesium.Cartesian2
  ): { lat: number; lon: number; elevationMeters: number } | null {
    if (!this.viewer || this.viewer.isDestroyed()) return null;
    const ray = this.viewer.camera.getPickRay(windowPosition);
    if (!ray) return null;
    const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
    if (!cartesian) return null;
    const carto = Cesium.Cartographic.fromCartesian(cartesian);
    return {
      lat: Cesium.Math.toDegrees(carto.latitude),
      lon: Cesium.Math.toDegrees(carto.longitude),
      elevationMeters: Math.max(0, carto.height),
    };
  }

  /**
   * Плавен полет до обзорна/целева географска позиция (без телепортиране).
   */
  public flyTo(target: CameraTarget, onStateChange?: (flying: boolean) => void): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;
    if (!isValidWgs84(target.lat, target.lon)) return;

    this.releaseReferenceLock();
    this.isTransitionFlying = true;
    onStateChange?.(true);

    this.viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        target.lon,
        target.lat,
        target.altitudeMeters
      ),
      orientation: {
        heading: Cesium.Math.toRadians(target.headingDegrees),
        pitch: Cesium.Math.toRadians(target.pitchDegrees),
        roll: 0,
      },
      duration: target.durationSeconds ?? 1.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
      complete: () => {
        this.isTransitionFlying = false;
        onStateChange?.(false);
        this.requestRender();
      },
      cancel: () => {
        this.isTransitionFlying = false;
        onStateChange?.(false);
        this.requestRender();
      },
    });
  }

  /**
   * Плавно влизане или следване в Режим Трето лице:
   * - Ако потребителят току-що превключва от далечна точка (> 8 км скок), извършва плавен въздушен полет до наблюдателя!
   * - При движение по трасето прилага експоненциално затихване на котвата, височината и азимута.
   */
  public updateThirdPersonObserver(
    sample: RouteTravellerSample,
    altitudeMeters: number,
    headingOffsetDeg: number,
    pitchPresetDeg?: number,
    onStateChange?: (flying: boolean) => void
  ): Cesium.Cartesian3 | null {
    if (!this.viewer || this.viewer.isDestroyed()) return null;
    if (!isValidWgs84(sample.lat, sample.lon)) return null;

    const targetHeight =
      this.sampleSurfaceHeight(sample.lon, sample.lat, sample.elevationMeters) + 12;
    const targetObserverPos = Cesium.Cartesian3.fromDegrees(
      sample.lon,
      sample.lat,
      targetHeight
    );

    const targetRange = Math.max(380, altitudeMeters * 1.55);
    this.desiredRangeMeters = targetRange;

    // Проверка за голямо преместване -> плавен полет вместо телепортиране
    if (!this.currentAnchorCarto) {
      this.flySmoothlyToAnchor(
        { lon: sample.lon, lat: sample.lat, height: targetHeight },
        (sample.headingDegrees + headingOffsetDeg) % 360,
        pitchPresetDeg ?? -27,
        targetRange,
        1.35,
        onStateChange
      );
      this.lastRouteHeadingDeg = sample.headingDegrees;
      return targetObserverPos;
    }

    if (this.isTransitionFlying) {
      return targetObserverPos;
    }

    const dLon = Math.abs(sample.lon - this.currentAnchorCarto.lon);
    const dLat = Math.abs(sample.lat - this.currentAnchorCarto.lat);
    if (dLon > 0.14 || dLat > 0.14) {
      this.flySmoothlyToAnchor(
        { lon: sample.lon, lat: sample.lat, height: targetHeight },
        (sample.headingDegrees + headingOffsetDeg) % 360,
        pitchPresetDeg ?? -27,
        targetRange,
        1.25,
        onStateChange
      );
      this.lastRouteHeadingDeg = sample.headingDegrees;
      return targetObserverPos;
    }

    // Експоненциално плавно следване (Spring Damping)
    const smooth = 0.24;
    this.currentAnchorCarto = {
      lon: this.currentAnchorCarto.lon + (sample.lon - this.currentAnchorCarto.lon) * smooth,
      lat: this.currentAnchorCarto.lat + (sample.lat - this.currentAnchorCarto.lat) * smooth,
      height:
        this.currentAnchorCarto.height +
        (targetHeight - this.currentAnchorCarto.height) * smooth,
    };
    this.currentRangeMeters += (this.desiredRangeMeters - this.currentRangeMeters) * 0.22;

    const dampedPos = Cesium.Cartesian3.fromDegrees(
      this.currentAnchorCarto.lon,
      this.currentAnchorCarto.lat,
      this.currentAnchorCarto.height
    );
    const enuTransform = Cesium.Transforms.eastNorthUpToFixedFrame(dampedPos);

    let desiredHeadingRad = this.viewer.camera.heading;
    if (this.lastRouteHeadingDeg !== null) {
      let deltaDeg = sample.headingDegrees - this.lastRouteHeadingDeg;
      if (deltaDeg > 180) deltaDeg -= 360;
      if (deltaDeg < -180) deltaDeg += 360;
      desiredHeadingRad += Cesium.Math.toRadians(deltaDeg * 0.35);
    }
    this.lastRouteHeadingDeg = sample.headingDegrees;

    const desiredPitchRad =
      pitchPresetDeg !== undefined
        ? Cesium.Math.toRadians(pitchPresetDeg)
        : Cesium.Math.clamp(
            this.viewer.camera.pitch,
            Cesium.Math.toRadians(-82),
            Cesium.Math.toRadians(-10)
          );

    this.viewer.camera.lookAtTransform(
      enuTransform,
      new Cesium.HeadingPitchRange(
        desiredHeadingRad,
        desiredPitchRad,
        this.currentRangeMeters
      )
    );
    this.isLockedTransform = true;
    this.viewer.scene.requestRender();

    return targetObserverPos;
  }

  /**
   * Инспекционен режим — плавно приближаване и центриране около станция или избрана точка със свободна 360° орбита.
   */
  public enterLocalStationInspection(
    coord: CoordinateRecord,
    rangeMeters = 1850,
    onStateChange?: (flying: boolean) => void
  ): void {
    if (!isValidWgs84(coord.lat, coord.lon)) return;
    const surfaceHeight =
      this.sampleSurfaceHeight(coord.lon, coord.lat, coord.elevationMeters) + 14;

    this.flySmoothlyToAnchor(
      { lon: coord.lon, lat: coord.lat, height: surfaceHeight },
      16,
      -33,
      rangeMeters,
      1.45,
      onStateChange
    );
  }

  private flySmoothlyToAnchor(
    anchor: { lon: number; lat: number; height: number },
    headingDeg: number,
    pitchDeg: number,
    rangeMeters: number,
    durationSec: number,
    onStateChange?: (flying: boolean) => void
  ): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;

    this.releaseReferenceLock();
    this.isTransitionFlying = true;
    onStateChange?.(true);

    const center = Cesium.Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.height);
    const sphere = new Cesium.BoundingSphere(center, 180);
    const offset = new Cesium.HeadingPitchRange(
      Cesium.Math.toRadians(headingDeg),
      Cesium.Math.toRadians(pitchDeg),
      rangeMeters
    );

    this.viewer.camera.flyToBoundingSphere(sphere, {
      offset,
      duration: durationSec,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
      complete: () => {
        if (!this.viewer || this.viewer.isDestroyed()) return;
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(center);
        this.viewer.camera.lookAtTransform(enu, offset);
        this.currentAnchorCarto = { ...anchor };
        this.currentRangeMeters = rangeMeters;
        this.desiredRangeMeters = rangeMeters;
        this.isLockedTransform = true;
        this.isTransitionFlying = false;
        onStateChange?.(false);
        this.requestRender();
      },
      cancel: () => {
        this.isTransitionFlying = false;
        onStateChange?.(false);
        this.requestRender();
      },
    });
  }

  /**
   * Непрекъснато плавно движение над терена (WASD / стрелки / двупръстов pan) по курса на камерата.
   */
  public glideOverTerrain(forwardAxis: number, rightAxis: number, dtSec: number): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;
    if (forwardAxis === 0 && rightAxis === 0) return;

    const cam = this.viewer.camera;
    const heading = cam.heading;

    if (this.isLockedTransform && this.currentAnchorCarto) {
      // Премества плавно самата 3D котва на третото лице по терена, запазвайки орбиталния наклон и височина!
      const speedMetersPerSec = Math.max(280, this.currentRangeMeters * 0.65);
      const dist = speedMetersPerSec * dtSec;

      const dNorth = (Math.cos(heading) * forwardAxis - Math.sin(heading) * rightAxis) * dist;
      const dEast = (Math.sin(heading) * forwardAxis + Math.cos(heading) * rightAxis) * dist;

      const metersPerDegLat = 111_132;
      const metersPerDegLon =
        111_320 * Math.max(0.2, Math.cos(Cesium.Math.toRadians(this.currentAnchorCarto.lat)));

      const nextLat = Cesium.Math.clamp(
        this.currentAnchorCarto.lat + dNorth / metersPerDegLat,
        39.5,
        44.2
      );
      const nextLon = Cesium.Math.clamp(
        this.currentAnchorCarto.lon + dEast / metersPerDegLon,
        22.5,
        30.5
      );
      const targetGround =
        this.sampleSurfaceHeight(nextLon, nextLat, this.currentAnchorCarto.height) + 14;

      this.currentAnchorCarto = {
        lon: nextLon,
        lat: nextLat,
        height:
          this.currentAnchorCarto.height +
          (targetGround - this.currentAnchorCarto.height) * 0.25,
      };

      const range = Cesium.Cartesian3.magnitude(cam.position);
      const pitch = cam.pitch;
      const center = Cesium.Cartesian3.fromDegrees(
        this.currentAnchorCarto.lon,
        this.currentAnchorCarto.lat,
        this.currentAnchorCarto.height
      );
      cam.lookAtTransform(
        Cesium.Transforms.eastNorthUpToFixedFrame(center),
        new Cesium.HeadingPitchRange(heading, pitch, range)
      );
      this.requestRender();
      return;
    }

    // В свободен въздушен режим премества камерата хоризонтално над релефа без пробиване в земята
    const carto = cam.positionCartographic;
    const alt = Math.max(350, carto.height);
    const stepMeters = alt * 0.72 * dtSec;

    const dNorth = (Math.cos(heading) * forwardAxis - Math.sin(heading) * rightAxis) * stepMeters;
    const dEast = (Math.sin(heading) * forwardAxis + Math.cos(heading) * rightAxis) * stepMeters;

    const metersPerDegLat = 111_132;
    const metersPerDegLon = 111_320 * Math.max(0.2, Math.cos(carto.latitude));

    const nextLatDeg = Cesium.Math.clamp(
      Cesium.Math.toDegrees(carto.latitude) + dNorth / metersPerDegLat,
      39.0,
      44.5
    );
    const nextLonDeg = Cesium.Math.clamp(
      Cesium.Math.toDegrees(carto.longitude) + dEast / metersPerDegLon,
      22.0,
      31.0
    );
    const minSafeAlt = this.sampleSurfaceHeight(nextLonDeg, nextLatDeg, 0) + 220;

    cam.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        nextLonDeg,
        nextLatDeg,
        Math.max(minSafeAlt, alt)
      ),
      orientation: {
        heading: cam.heading,
        pitch: cam.pitch,
        roll: 0,
      },
    });
    this.requestRender();
  }

  /**
   * Плавно контролирано приближаване и отдалечаване (без резки скокове).
   */
  public zoomByFactor(factor: number): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;
    const cam = this.viewer.camera;

    if (this.isLockedTransform && this.currentAnchorCarto) {
      const currentMag = Cesium.Cartesian3.magnitude(cam.position);
      const nextRange = Cesium.Math.clamp(currentMag * factor, 280, 650_000);
      this.currentRangeMeters = nextRange;
      this.desiredRangeMeters = nextRange;
      cam.lookAtTransform(
        cam.transform,
        new Cesium.HeadingPitchRange(cam.heading, cam.pitch, nextRange)
      );
      this.requestRender();
      return;
    }

    const carto = cam.positionCartographic;
    const targetHeight = Cesium.Math.clamp(carto.height * factor, 260, 1_800_000);
    cam.flyTo({
      destination: Cesium.Cartesian3.fromRadians(
        carto.longitude,
        carto.latitude,
        targetHeight
      ),
      orientation: {
        heading: cam.heading,
        pitch: cam.pitch,
        roll: 0,
      },
      duration: 0.32,
      easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
    });
  }

  public orbitAroundFocus(deltaDegrees: number, deltaPitchDeg = 0): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;
    const yawRad = Cesium.Math.toRadians(deltaDegrees);
    const pitchRad = Cesium.Math.toRadians(deltaPitchDeg);

    if (this.isLockedTransform) {
      this.viewer.camera.rotateLeft(yawRad);
      if (deltaPitchDeg !== 0) {
        this.viewer.camera.rotateUp(pitchRad);
      }
      this.requestRender();
      return;
    }

    const canvas = this.viewer.scene.canvas;
    const centerPx = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
    const ray = this.viewer.camera.getPickRay(centerPx);
    const pivot = ray ? this.viewer.scene.globe.pick(ray, this.viewer.scene) : undefined;

    if (pivot) {
      const transform = Cesium.Transforms.eastNorthUpToFixedFrame(pivot);
      const prevTransform = Cesium.Matrix4.clone(this.viewer.camera.transform);
      this.viewer.camera.lookAtTransform(transform);
      this.viewer.camera.rotateLeft(yawRad);
      if (deltaPitchDeg !== 0) {
        this.viewer.camera.rotateUp(pitchRad);
      }
      this.viewer.camera.lookAtTransform(prevTransform);
    } else {
      this.viewer.camera.twistLeft(yawRad);
    }
    this.requestRender();
  }

  public pan(direction: PanDirection): void {
    switch (direction) {
      case 'north':
        this.glideOverTerrain(1, 0, 0.25);
        break;
      case 'south':
        this.glideOverTerrain(-1, 0, 0.25);
        break;
      case 'east':
        this.glideOverTerrain(0, 1, 0.25);
        break;
      case 'west':
        this.glideOverTerrain(0, -1, 0.25);
        break;
    }
  }

  public alignNorth(): void {
    if (!this.viewer || this.viewer.isDestroyed()) return;
    if (this.isLockedTransform && this.currentAnchorCarto) {
      this.flySmoothlyToAnchor(
        this.currentAnchorCarto,
        0,
        Cesium.Math.toDegrees(this.viewer.camera.pitch),
        Cesium.Cartesian3.magnitude(this.viewer.camera.position),
        0.55
      );
    } else {
      this.viewer.camera.flyTo({
        destination: this.viewer.camera.positionWC,
        orientation: {
          heading: 0,
          pitch: this.viewer.camera.pitch,
          roll: 0,
        },
        duration: 0.55,
        easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT,
      });
    }
  }

  public resetForMode(
    mode: GeographicCameraMode,
    overviewTarget: CameraTarget,
    inspectionCenter: CoordinateRecord | null,
    onStateChange?: (flying: boolean) => void
  ): void {
    if (mode === 'local-inspection' && inspectionCenter) {
      this.enterLocalStationInspection(inspectionCenter, 1850, onStateChange);
    } else {
      this.flyTo(overviewTarget, onStateChange);
    }
  }

  /**
   * Добавя двупръстов pan (Two-finger pan) на мобилни устройства, когато камерата е в орбитален режим
   * (където 1 пръст извършва One-finger rotation, а щипването — Pinch to zoom).
   */
  private bindSmoothWheelAndTouchGestures(viewer: Cesium.Viewer): void {
    const canvas = viewer.scene.canvas;

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.activeTouches.size === 2) {
        const pts = Array.from(this.activeTouches.values());
        this.prevTwoFingerCentroid = {
          x: (pts[0].x + pts[1].x) / 2,
          y: (pts[0].y + pts[1].y) / 2,
          dist: Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y),
        };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch' || !this.activeTouches.has(e.pointerId)) return;
      this.activeTouches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activeTouches.size === 2 && this.prevTwoFingerCentroid && this.isLockedTransform) {
        const pts = Array.from(this.activeTouches.values());
        const cx = (pts[0].x + pts[1].x) / 2;
        const cy = (pts[0].y + pts[1].y) / 2;
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);

        const dx = cx - this.prevTwoFingerCentroid.x;
        const dy = cy - this.prevTwoFingerCentroid.y;
        const dDist = Math.abs(dist - this.prevTwoFingerCentroid.dist);

        // Ако пръстите се местят заедно (Two-finger pan), плъзгаме котвата над терена
        if (Math.hypot(dx, dy) > 1.5 && dDist < 12) {
          this.glideOverTerrain(dy * 0.012, -dx * 0.012, 0.12);
        }

        this.prevTwoFingerCentroid = { x: cx, y: cy, dist };
      }
    };

    const clearTouch = (e: PointerEvent) => {
      this.activeTouches.delete(e.pointerId);
      if (this.activeTouches.size < 2) {
        this.prevTwoFingerCentroid = null;
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerup', clearTouch, { passive: true });
    canvas.addEventListener('pointercancel', clearTouch, { passive: true });

    this.detachDomListeners = () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', clearTouch);
      canvas.removeEventListener('pointercancel', clearTouch);
    };
  }
}

export const cameraDirector = new CameraDirector();
