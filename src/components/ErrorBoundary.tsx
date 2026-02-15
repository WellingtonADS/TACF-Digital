import React from "react";

type State = { hasError: boolean; error?: Error | null };

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console for now; we can add remote logging later
     
    console.error("Unhandled render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
          <div className="max-w-xl w-full bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Ocorreu um erro</h2>
            <p className="text-sm text-gray-600 mb-4">
              Algo impediu o carregamento correto da aplicação. Veja o console
              para mais detalhes.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
