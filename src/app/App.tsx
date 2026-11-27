import { AppProviders } from '@/app/providers/AppProviders';
import { ViewStageRouter } from '@/app/router/ViewStageRouter';
import { ExplorerShell } from '@/components/layout/ExplorerShell';

export function App() {
  return (
    <AppProviders>
      <ExplorerShell>
        <ViewStageRouter />
      </ExplorerShell>
    </AppProviders>
  );
}
