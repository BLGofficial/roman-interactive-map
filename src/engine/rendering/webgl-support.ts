import { useDiagnosticsStore } from '@/stores/diagnostics-store';

export interface WebGLSupportInfo {
  supported: boolean;
  version: 0 | 1 | 2;
  rendererInfo: string;
}

let cachedSupport: WebGLSupportInfo | null = null;

export function detectWebGLSupport(): WebGLSupportInfo {
  if (cachedSupport) return cachedSupport;
  if (typeof document === 'undefined') {
    return { supported: true, version: 2, rendererInfo: 'SSR / Headless' };
  }

  try {
    const canvas = document.createElement('canvas');
    const gl2 = canvas.getContext('webgl2');
    if (gl2) {
      const dbg = gl2.getExtension('WEBGL_debug_renderer_info');
      const rendererInfo = dbg
        ? String(gl2.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : 'WebGL 2.0';
      gl2.getExtension('WEBGL_lose_context')?.loseContext();
      cachedSupport = { supported: true, version: 2, rendererInfo };
      return cachedSupport;
    }

    const gl1 =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (gl1) {
      const dbg = gl1.getExtension('WEBGL_debug_renderer_info');
      const rendererInfo = dbg
        ? String(gl1.getParameter(dbg.UNMASKED_RENDERER_WEBGL))
        : 'WebGL 1.0';
      gl1.getExtension('WEBGL_lose_context')?.loseContext();
      cachedSupport = { supported: true, version: 1, rendererInfo };
      return cachedSupport;
    }
  } catch {
    // WebGL контекстът е блокиран или неподдържан
  }

  cachedSupport = { supported: false, version: 0, rendererInfo: 'Няма WebGL поддръжка' };
  return cachedSupport;
}

export function attachWebGLContextHandlers(
  canvas: HTMLCanvasElement,
  labelBg: string,
  callbacks?: {
    onLost?: () => void;
    onRestored?: () => void;
  }
): () => void {
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    const store = useDiagnosticsStore.getState();
    store.setWebglContextLost(true);
    store.reportIssue({
      id: 'webgl-context-lost',
      category: 'webgl',
      severity: 'error',
      messageBg: `WebGL графичният контекст за „${labelBg}“ беше временно прекъснат.`,
      detailBg:
        'Можете да продължите да разглеждате историческите описания и оригиналните изображения или да възстановите 3D сцената.',
      recoverable: true,
    });
    callbacks?.onLost?.();
  };

  const handleContextRestored = () => {
    const store = useDiagnosticsStore.getState();
    store.setWebglContextLost(false);
    store.clearCategory('webgl');
    callbacks?.onRestored?.();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost, false);
  canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleContextLost, false);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
  };
}
