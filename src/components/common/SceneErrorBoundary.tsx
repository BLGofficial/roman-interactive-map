import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Images, RefreshCw } from 'lucide-react';
import { detectWebGLSupport } from '@/engine/rendering/webgl-support';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';
import { useInterfaceStore } from '@/stores/interface-store';

interface SceneErrorBoundaryProps {
  sceneNameBg: string;
  resetKey: string | number;
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  errorMessage: string | null;
}

/**
 * Локална защита около 3D WebGL сцените (CesiumJS и Three.js / R3F).
 * При срив на 3D рендерирането или липса на WebGL запазва целия потребителски интерфейс,
 * списъка на спирките, историческите разкази и 9-те оригинални изображения напълно работещи.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  public state: SceneErrorBoundaryState = { errorMessage: null };

  public static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { errorMessage: error.message || 'Неочаквана грешка в 3D рендерирането.' };
  }

  public componentDidUpdate(prevProps: SceneErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.errorMessage) {
      this.setState({ errorMessage: null });
    }
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[SceneErrorBoundary: ${this.props.sceneNameBg}]`, error, info);
    useDiagnosticsStore.getState().reportIssue({
      id: `scene-render-error:${this.props.sceneNameBg}`,
      category: 'webgl',
      severity: 'error',
      messageBg: `Грешка при 3D рендериране в „${this.props.sceneNameBg}“.`,
      detailBg: error.message,
      recoverable: true,
    });
  }

  public render() {
    const webgl = detectWebGLSupport();

    if (!webgl.supported || this.state.errorMessage) {
      const reason = !webgl.supported
        ? 'Вашият браузър или хардуерна среда не поддържа WebGL ускорение.'
        : this.state.errorMessage;

      return (
        <div
          role="alert"
          className="flex h-full w-full flex-col items-center justify-center bg-obsidian-950 p-6 text-center text-travertine-100"
        >
          <div className="cartographic-panel max-w-md rounded-lg p-6">
            <AlertTriangle className="mx-auto h-8 w-8 text-amberwarn-400" />
            <h2 className="mt-3 font-serif text-xl font-bold text-travertine-50">
              3D сцената е временно недостъпна
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-travertine-200">{reason}</p>
            <p className="mt-2 text-[11px] text-travertine-300">
              Историческите описания на спирките, хронологията и деветте оригинални
              визуални референции остават напълно достъпни.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {webgl.supported && (
                <button
                  type="button"
                  onClick={() => {
                    this.setState({ errorMessage: null });
                    useDiagnosticsStore.getState().triggerSceneReset();
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-amberwarn-500 px-3.5 py-2 text-xs font-semibold text-obsidian-950 hover:bg-amberwarn-400"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Възстанови 3D сцената</span>
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  useInterfaceStore.getState().openGallery('regional_panorama', false)
                }
                className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-obsidian-700 bg-obsidian-800 px-3.5 py-2 text-xs font-medium text-travertine-100 hover:border-amberwarn-400"
              >
                <Images className="h-3.5 w-3.5 text-amberwarn-400" />
                <span>Отвори оригиналните референции</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
