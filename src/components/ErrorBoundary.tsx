import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      // Detect language from localStorage
      const isGerman = (() => {
        try {
          const prefs = localStorage.getItem("soulvay-preferences");
          if (prefs) return JSON.parse(prefs).language === "de";
        } catch {}
        return navigator.language?.startsWith("de") || false;
      })();

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-foreground">
                {isGerman ? "Etwas hat nicht geklappt" : "Something didn't work"}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isGerman
                  ? "Das sollte nicht passieren. Lade die Seite neu oder kehre zur Startseite zurück."
                  : "That wasn't supposed to happen. Reload the page or go back to start."}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                {isGerman ? "Neu laden" : "Reload"}
              </Button>
              <Button variant="outline" onClick={this.handleGoHome}>
                {isGerman ? "Zur Startseite" : "Go Home"}
              </Button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-4 p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground">
                <summary className="cursor-pointer font-medium">Debug Info</summary>
                <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
