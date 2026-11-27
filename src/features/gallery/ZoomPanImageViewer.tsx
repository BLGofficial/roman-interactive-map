import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Scan,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ImageOff,
  RefreshCw,
} from 'lucide-react';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';

interface ZoomPanImageViewerProps {
  imageUrl: string;
  titleBg: string;
  nativeWidth: number;
  nativeHeight: number;
  isLightboxFullscreen: boolean;
  onToggleLightbox: () => void;
}

/**
 * Интерактивен преглед на оригиналните визуални референции:
 * - Запазва 100% оригиналните цветове, композиция, перспектива и съотношение на страните (без изрязване и без CSS филтри).
 * - Поддържа Zoom In, Zoom Out, Пълен размер (1:1 пиксели), Pan (мишка, touch и бутони), Reset Zoom и Lightbox.
 */
export function ZoomPanImageViewer({
  imageUrl,
  titleBg,
  nativeWidth,
  nativeHeight,
  isLightboxFullscreen,
  onToggleLightbox,
}: ZoomPanImageViewerProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const dragOriginRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });

  // Нулиране при смяна на изображението
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setImageLoadError(false);
  }, [imageUrl]);

  const clampScale = (next: number) => Math.min(5, Math.max(1, Number(next.toFixed(2))));

  const handleZoomIn = useCallback(() => {
    setScale((prev) => clampScale(prev * 1.3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = clampScale(prev / 1.3);
      if (next <= 1.02) {
        setPan({ x: 0, y: 0 });
        return 1;
      }
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Пълен оригинален размер (1:1 пиксел спрямо текущия контейнер)
  const handleActualPixelSize = useCallback(() => {
    const el = viewportRef.current;
    if (!el) {
      setScale(2);
      return;
    }
    const fitRatio = Math.min(el.clientWidth / nativeWidth, el.clientHeight / nativeHeight);
    const oneToOneScale = fitRatio > 0 ? Math.max(1.25, 1 / fitRatio) : 2;
    setScale(clampScale(oneToOneScale));
    setPan({ x: 0, y: 0 });
  }, [nativeHeight, nativeWidth]);

  const nudgePan = useCallback((dx: number, dy: number) => {
    setScale((curr) => (curr <= 1 ? 1.4 : curr));
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col bg-[#07090b]">
      {/* Контролна лента: Zoom In, Zoom Out, Пълен размер, Pan, Reset Zoom, Lightbox */}
      <div className="z-20 flex flex-wrap items-center justify-between gap-2 border-b border-obsidian-800 bg-obsidian-950 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Приближи (+)"
            className="inline-flex items-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2 py-1 text-[11px] font-medium text-travertine-100 hover:border-travertine-300"
          >
            <ZoomIn className="h-3.5 w-3.5 text-amberwarn-400" />
            <span>Zoom In</span>
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            title="Отдалечи (-)"
            className="inline-flex items-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2 py-1 text-[11px] font-medium text-travertine-100 hover:border-travertine-300 disabled:opacity-40"
          >
            <ZoomOut className="h-3.5 w-3.5" />
            <span>Zoom Out</span>
          </button>

          <button
            type="button"
            onClick={handleActualPixelSize}
            title="Покажи в пълен оригинален размер (1:1 пиксели)"
            className="inline-flex items-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2 py-1 text-[11px] font-medium text-travertine-100 hover:border-travertine-300"
          >
            <Scan className="h-3.5 w-3.5 text-verdigris-400" />
            <span>Пълен размер ({nativeWidth}×{nativeHeight})</span>
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            disabled={scale === 1 && pan.x === 0 && pan.y === 0}
            title="Нулирай приближението и позицията"
            className="inline-flex items-center gap-1 rounded border border-obsidian-700 bg-obsidian-800 px-2 py-1 text-[11px] font-medium text-travertine-200 hover:border-travertine-300 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Zoom</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Дирекционни Pan бутони за достъпност + подсказка за плъзгане */}
          <div className="hidden items-center gap-0.5 rounded border border-obsidian-800 bg-obsidian-900 px-1 py-0.5 sm:flex">
            <span className="px-1 text-[10px] text-travertine-400">Pan:</span>
            <button
              type="button"
              onClick={() => nudgePan(0, 70)}
              aria-label="Премести нагоре"
              className="rounded p-1 text-travertine-200 hover:bg-obsidian-800"
            >
              <ArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => nudgePan(0, -70)}
              aria-label="Премести надолу"
              className="rounded p-1 text-travertine-200 hover:bg-obsidian-800"
            >
              <ArrowDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => nudgePan(70, 0)}
              aria-label="Премести наляво"
              className="rounded p-1 text-travertine-200 hover:bg-obsidian-800"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => nudgePan(-70, 0)}
              aria-label="Премести надясно"
              className="rounded p-1 text-travertine-200 hover:bg-obsidian-800"
            >
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <span className="font-mono text-[11px] text-travertine-300">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={onToggleLightbox}
            className="inline-flex items-center gap-1 rounded border border-amberwarn-400/50 bg-amberwarn-500/15 px-2.5 py-1 text-[11px] font-semibold text-amberwarn-400 hover:bg-amberwarn-500/25"
          >
            {isLightboxFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Покажи детайли</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Lightbox (Пълен екран)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Платно на оригиналното изображение — без филтри, без изрязване, оригинално съотношение на страните */}
      <div
        ref={viewportRef}
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY < 0) handleZoomIn();
          else handleZoomOut();
        }}
        onDoubleClick={() => {
          if (scale > 1) handleResetZoom();
          else setScale(2.4);
        }}
        onPointerDown={(e) => {
          if (scale <= 1) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          setIsDragging(true);
          dragOriginRef.current = {
            x: e.clientX,
            y: e.clientY,
            panX: pan.x,
            panY: pan.y,
          };
        }}
        onPointerMove={(e) => {
          if (!isDragging) return;
          const dx = e.clientX - dragOriginRef.current.x;
          const dy = e.clientY - dragOriginRef.current.y;
          setPan({
            x: dragOriginRef.current.panX + dx,
            y: dragOriginRef.current.panY + dy,
          });
        }}
        onPointerUp={() => setIsDragging(false)}
        onPointerCancel={() => setIsDragging(false)}
        className={`relative flex flex-1 items-center justify-center overflow-hidden p-2 touch-none select-none ${
          scale > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
        }`}
      >
        {imageLoadError ? (
          <div
            role="alert"
            className="cartographic-panel flex max-w-md flex-col items-center gap-2.5 rounded-lg p-6 text-center text-xs text-travertine-200"
          >
            <ImageOff className="h-8 w-8 text-amberwarn-400" />
            <div className="font-serif text-base font-bold text-travertine-50">
              Оригиналният визуален актив не може да бъде зареден
            </div>
            <div className="break-all font-mono text-[11px] text-travertine-400">
              {imageUrl}
            </div>
            <button
              type="button"
              onClick={() => {
                setImageLoadError(false);
                setRetryCount((c) => c + 1);
              }}
              className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded bg-amberwarn-500 px-3.5 py-1.5 text-xs font-semibold text-obsidian-950 hover:bg-amberwarn-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Опитай повторно зареждане</span>
            </button>
          </div>
        ) : (
          <img
            src={
              retryCount === 0
                ? imageUrl
                : `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}retry=${retryCount}`
            }
            alt={titleBg}
            decoding="async"
            draggable={false}
            onError={() => {
              setImageLoadError(true);
              useDiagnosticsStore.getState().reportIssue({
                id: `missing-lightbox-image:${imageUrl}`,
                category: 'image',
                severity: 'warning',
                messageBg: `Липсващо оригинално изображение в Lightbox: ${titleBg}`,
                detailBg: imageUrl,
                recoverable: true,
              });
            }}
            style={{
              aspectRatio: `${nativeWidth} / ${nativeHeight}`,
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transformOrigin: 'center center',
            }}
            className="max-h-full max-w-full object-contain transition-transform duration-75"
          />
        )}
      </div>
    </div>
  );
}
