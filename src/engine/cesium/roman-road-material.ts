import * as Cesium from 'cesium';
import type { IdentificationStatus } from '@/types';

let cachedStoneCanvas: HTMLCanvasElement | null = null;
const markerCanvasCache = new Map<string, HTMLCanvasElement>();

/**
 * Генерира процедурна безшевна каменна текстура (opus siliceum / polygonale)
 * в топъл пясъчно-златист цвят с бордюрни блокове (umbones), за да се отличава
 * отчетливо древният път Via Diagonalis от съвременните асфалтови пътища.
 */
export function getRomanStoneTextureCanvas(): HTMLCanvasElement {
  if (cachedStoneCanvas) return cachedStoneCanvas;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Основен топъл пясъчно-златист хоросанов фон
  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, '#f3d796');
  grad.addColorStop(0.14, '#cfa154');
  grad.addColorStop(0.5, '#e6be73');
  grad.addColorStop(0.86, '#cfa154');
  grad.addColorStop(1, '#f3d796');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 64);

  // Светли каменни бордюри (Umbones) от двете страни на платното
  ctx.fillStyle = '#fae4ad';
  ctx.fillRect(0, 2, 256, 7);
  ctx.fillRect(0, 55, 256, 7);

  // Фуги на бордюрите
  ctx.strokeStyle = '#6e5023';
  ctx.lineWidth = 2;
  for (let x = 0; x < 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 10);
    ctx.moveTo(x + 16, 54);
    ctx.lineTo(x + 16, 64);
    ctx.stroke();
  }

  // Вътрешни каменни плочи (три реда разместени квадри/полигони)
  const rows = [
    { y: 11, h: 13, offset: 0 },
    { y: 26, h: 12, offset: 14 },
    { y: 40, h: 13, offset: 7 },
  ];
  const blockPalette = ['#dfb468', '#d5a657', '#eac57c', '#cca050', '#e3ba6e'];

  rows.forEach((row, rIdx) => {
    let x = -row.offset;
    let bIdx = 0;
    while (x < 256) {
      const w = 26 + ((rIdx * 7 + bIdx * 11) % 14);
      ctx.fillStyle = blockPalette[(rIdx + bIdx) % blockPalette.length];
      ctx.fillRect(x + 1, row.y, w - 2, row.h);

      ctx.strokeStyle = '#6b4d22';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 1, row.y, w - 2, row.h);

      x += w;
      bIdx += 1;
    }
  });

  cachedStoneCanvas = canvas;
  return canvas;
}

export function createRomanStoneRoadMaterial(
  repeatAlongLength: number
): Cesium.ImageMaterialProperty {
  return new Cesium.ImageMaterialProperty({
    image: getRomanStoneTextureCanvas(),
    repeat: new Cesium.Cartesian2(Math.max(8, Math.round(repeatAlongLength)), 1),
  });
}

/**
 * Създава интерактивен маркер с номер на спирката, цветен статус и икона за инспекция (лупа).
 */
export function getStationMarkerCanvas(options: {
  sequence: number;
  isSelected: boolean;
  status: IdentificationStatus;
  isTerminus: boolean;
}): HTMLCanvasElement {
  const key = `${options.sequence}:${options.isSelected}:${options.status}:${options.isTerminus}`;
  const cached = markerCanvasCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 112;
  const ctx = canvas.getContext('2d')!;

  const cx = 48;
  const cy = 44;
  const radius = options.isSelected ? 30 : 25;

  const isHypothetical = options.status === 'unconfirmed_exact_location';
  const primaryColor = options.isTerminus
    ? '#49ad95'
    : isHypothetical
      ? '#dfa348'
      : '#e3b359';
  const coreFill = options.isSelected ? '#271c12' : '#12161b';

  // Външно сияние при избрана спирка
  if (options.isSelected) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(243, 215, 150, 0.28)';
    ctx.fill();
  }

  // Острие на пина надолу към терена
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy + radius - 4);
  ctx.lineTo(cx, 104);
  ctx.lineTo(cx + 11, cy + radius - 4);
  ctx.closePath();
  ctx.fillStyle = primaryColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0b0d10';
  ctx.stroke();

  // Основен медальон
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = coreFill;
  ctx.fill();

  // Пръстен според историческия статус (пунктиран за хипотетична локация)
  ctx.save();
  if (isHypothetical) {
    ctx.setLineDash([6, 4]);
  }
  ctx.lineWidth = options.isSelected ? 4.5 : 3.2;
  ctx.strokeStyle = options.isSelected ? '#fae4ad' : primaryColor;
  ctx.stroke();
  ctx.restore();

  // Номер на спирката
  ctx.fillStyle = '#faf7f2';
  ctx.font = options.isSelected
    ? '700 22px Inter, system-ui, sans-serif'
    : '700 19px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(options.sequence), cx, cy + 1);

  // Малка значка с икона за инспекция (лупа) горе вдясно
  const bx = cx + radius - 4;
  const by = cy - radius + 6;
  ctx.beginPath();
  ctx.arc(bx, by, 11, 0, Math.PI * 2);
  ctx.fillStyle = primaryColor;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0b0d10';
  ctx.stroke();

  // Рисуване на лупа в значката
  ctx.beginPath();
  ctx.arc(bx - 1.5, by - 1.5, 4.2, 0, Math.PI * 2);
  ctx.strokeStyle = '#0b0d10';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx + 1.5, by + 1.5);
  ctx.lineTo(bx + 5, by + 5);
  ctx.stroke();

  if (markerCanvasCache.size >= 64) {
    const oldestKey = markerCanvasCache.keys().next().value;
    if (oldestKey) markerCanvasCache.delete(oldestKey);
  }
  markerCanvasCache.set(key, canvas);
  return canvas;
}
