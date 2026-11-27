import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  errorMessage: string | null;
}

class AppErrorBoundary extends Component<Props, State> {
  public state: State = { errorMessage: null };

  public static getDerivedStateFromError(error: Error): State {
    return { errorMessage: error.message };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Грешка в приложението Via Diagonalis:', error, info);
  }

  public render() {
    if (this.state.errorMessage) {
      return (
        <div className="flex h-dvh w-screen flex-col items-center justify-center bg-obsidian-950 p-6 text-center text-travertine-100">
          <h1 className="font-serif text-xl font-bold text-imperial-400">
            Възникна грешка при инициализация на 3D средата
          </h1>
          <p className="mt-2 max-w-md text-xs text-travertine-300">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-imperial-500 px-4 py-2 text-xs font-medium text-travertine-50"
          >
            Презареди приложението
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppProviders({ children }: Props) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
