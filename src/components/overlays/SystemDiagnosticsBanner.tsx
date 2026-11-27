import { AlertTriangle, RefreshCw, WifiOff, X } from 'lucide-react';
import { useDiagnosticsStore } from '@/stores/diagnostics-store';

/**
 * Дискретен неблокиращ диагностичен банер (P09):
 * Показва се само при реално възникнал проблем (офлайн режим, недостъпен 3D терен,
 * недостъпна външна картографска подложка, липсващо изображение или WebGL грешка)
 * и предлага директно възстановяване с един бутон.
 */
export function SystemDiagnosticsBanner() {
  const issues = useDiagnosticsStore((s) => s.issues);
  const isOffline = useDiagnosticsStore((s) => s.isOffline);
  const dismissIssue = useDiagnosticsStore((s) => s.dismissIssue);
  const triggerTerrainRetry = useDiagnosticsStore((s) => s.triggerTerrainRetry);
  const triggerImageryRetry = useDiagnosticsStore((s) => s.triggerImageryRetry);
  const triggerSceneReset = useDiagnosticsStore((s) => s.triggerSceneReset);

  const activeIssue = issues[issues.length - 1];

  if (!isOffline && !activeIssue) return null;

  const handleRetry = () => {
    if (!activeIssue) {
      triggerTerrainRetry();
      triggerImageryRetry();
      return;
    }
    if (activeIssue.category === 'terrain') triggerTerrainRetry();
    else if (activeIssue.category === 'imagery') triggerImageryRetry();
    else if (activeIssue.category === 'webgl') triggerSceneReset();
    dismissIssue(activeIssue.id);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-[7.2rem] z-40 flex w-[min(94vw,32rem)] -translate-x-1/2 justify-center"
    >
      <div className="cartographic-panel pointer-events-auto flex items-center gap-2.5 rounded-lg border-amberwarn-400/55 px-3 py-2 text-xs text-travertine-100">
        {isOffline ? (
          <WifiOff className="h-4 w-4 shrink-0 text-amberwarn-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-amberwarn-400" />
        )}

        <div className="min-w-0 flex-1 leading-snug">
          <span className="font-medium text-travertine-50">
            {isOffline && !activeIssue
              ? 'Офлайн режим: използва се локална картографска мрежа и кеширани данни.'
              : activeIssue?.messageBg}
          </span>
        </div>

        {(isOffline || activeIssue?.recoverable) && (
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded border border-amberwarn-400/60 bg-amberwarn-500/15 px-2 py-1 text-[11px] font-semibold text-amberwarn-400 hover:bg-amberwarn-500/25"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Опитай пак</span>
          </button>
        )}

        {activeIssue && (
          <button
            type="button"
            onClick={() => dismissIssue(activeIssue.id)}
            aria-label="Скрий системното известие"
            className="inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-travertine-300 hover:bg-obsidian-800 hover:text-travertine-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
