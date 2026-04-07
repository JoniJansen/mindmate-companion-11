import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/logger";

interface Props {
  children: ReactNode;
  /** Section name for error reporting (e.g. "chat", "journal") */
  section: string;
  /** Optional fallback UI. If not provided, uses default error card. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Granular error boundary for app sections.
 * Catches errors within a section without crashing the entire app.
 * Logs errors with section context for diagnostics.
 */
export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(this.props.section, "render_crash", {
      message: error.message,
      componentStack: errorInfo.componentStack?.substring(0, 500),
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isGerman = (() => {
        try {
          const prefs = localStorage.getItem("soulvay-preferences");
          if (prefs) return JSON.parse(prefs).language === "de";
        } catch {}
        return navigator.language?.startsWith("de") || false;
      })();

      return (
        <div className="flex flex-col items-center justify-center p-8 gap-4 min-h-[200px]">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {isGerman
              ? "Dieser Bereich konnte nicht geladen werden."
              : "This section couldn't load."}
          </p>
          <Button size="sm" variant="outline" onClick={this.handleRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            {isGerman ? "Erneut versuchen" : "Try again"}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
