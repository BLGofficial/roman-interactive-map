import { useEffect, useState, type CSSProperties } from 'react';
import { ImageOff, RefreshCw } from 'lucide-react';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';

interface ResilientHistoricalImageProps {
  src: string;
  alt: string;
  nativeWidth: number;
  nativeHeight: number;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
  draggable?: boolean;
}

/**
 * Защитен компонент за оригиналните исторически изображения (P05 + P09):
 * - Гарантира 100% запазване на пропорциите (aspectRatio + object-contain), без изрязване и без CSS филтри.
 * - Обработва липсващи или недостъпни изображения с ясна обратна връзка на български и бутон за повторен опит,
 *   без никога да подменя актива с генериран заместител.
 */
export function ResilientHistoricalImage({
  src,
  alt,
  nativeWidth,
  nativeHeight,
  className = 'h-auto w-full object-contain',
  style,
  loading = 'lazy',
  draggable = false,
}: ResilientHistoricalImageProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const effectiveSrc =
    retryCount === 0
      ? src
      : `${src}${src.includes('?') ? '&' : '?'}retry=${retryCount}`;

  if (hasError) {
    return (
      <div
        role="alert"
        style={{
          aspectRatio: `${nativeWidth} / ${nativeHeight}`,
          ...style,
        }}
        className="flex w-full flex-col items-center justify-center gap-2 rounded border border-amberwarn-500/40 bg-obsidian-950 p-4 text-center text-xs text-travertine-200"
      >
        <ImageOff className="h-6 w-6 text-amberwarn-400" />
        <div className="font-semibold text-travertine-50">
          Оригиналното изображение не можа да бъде заредено
        </div>
        <div className="max-w-xs break-all font-mono text-[10px] text-travertine-400">
          {src}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setHasError(false);
            setRetryCount((c) => c + 1);
          }}
          className="mt-1 inline-flex cursor-pointer items-center gap-1.5 rounded border border-amberwarn-400/60 bg-amberwarn-500/15 px-3 py-1 text-[11px] font-semibold text-amberwarn-400 hover:bg-amberwarn-500/25"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Опитай отново</span>
        </button>
      </div>
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      loading={loading}
      decoding="async"
      draggable={draggable}
      onError={() => {
        setHasError(true);
        useDiagnosticsStore.getState().reportIssue({
          id: `missing-image:${src}`,
          category: 'image',
          severity: 'warning',
          messageBg: `Липсващо или недостъпно оригинално изображение: ${alt}`,
          detailBg: src,
          recoverable: true,
        });
      }}
      style={{
        aspectRatio: `${nativeWidth} / ${nativeHeight}`,
        ...style,
      }}
      className={className}
    />
  );
}
