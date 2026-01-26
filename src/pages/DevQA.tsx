/**
 * DEV-ONLY: Device QA Screen for iPhone vs Preview parity verification
 * Access via /dev-qa route (only in development mode)
 * REMOVE or disable before production release
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";

interface LayoutCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  value: string;
  expected?: string;
}

export default function DevQA() {
  const navigate = useNavigate();
  const [checks, setChecks] = useState<LayoutCheck[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const runChecks = () => {
    setIsRefreshing(true);
    
    const results: LayoutCheck[] = [];
    
    // 1. Safe-area insets
    const safeTop = getCSSEnvValue("safe-area-inset-top");
    const safeBottom = getCSSEnvValue("safe-area-inset-bottom");
    
    results.push({
      name: "safe-area-inset-top",
      status: safeTop !== "0px" ? "pass" : "warn",
      value: safeTop,
      expected: "> 0px on notched devices",
    });
    
    results.push({
      name: "safe-area-inset-bottom",
      status: safeBottom !== "0px" ? "pass" : "warn", 
      value: safeBottom,
      expected: "> 0px on devices with home indicator",
    });
    
    // 2. Viewport dimensions
    results.push({
      name: "Viewport Size",
      status: "pass",
      value: `${window.innerWidth}×${window.innerHeight}`,
    });
    
    results.push({
      name: "Device Pixel Ratio",
      status: "pass",
      value: `${window.devicePixelRatio}x`,
    });
    
    // 3. Viewport height units
    const svhSupport = CSS.supports("height", "100svh");
    const dvhSupport = CSS.supports("height", "100dvh");
    results.push({
      name: "svh/dvh Support",
      status: svhSupport && dvhSupport ? "pass" : "warn",
      value: `svh: ${svhSupport ? "✓" : "✗"}, dvh: ${dvhSupport ? "✓" : "✗"}`,
    });
    
    // 4. PWA / Standalone mode
    const isPWA = window.matchMedia("(display-mode: standalone)").matches || 
                  (window.navigator as any).standalone === true;
    results.push({
      name: "PWA Standalone Mode",
      status: isPWA ? "pass" : "warn",
      value: isPWA ? "Yes" : "No (browser mode)",
    });
    
    // 5. Font scale detection (if possible)
    const baseFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const expectedBase = 16;
    const fontScale = Math.round((baseFontSize / expectedBase) * 100);
    results.push({
      name: "Font Scale",
      status: fontScale >= 90 && fontScale <= 120 ? "pass" : "warn",
      value: `${fontScale}% (base: ${baseFontSize}px)`,
      expected: "90-120% for standard UX",
    });
    
    // 6. Check for overflow:hidden on ancestors (potential clipping)
    const overflowHiddenAncestors = findOverflowHiddenAncestors();
    results.push({
      name: "Ancestors with overflow:hidden",
      status: overflowHiddenAncestors.length === 0 ? "pass" : "warn",
      value: overflowHiddenAncestors.length === 0 
        ? "None detected" 
        : `${overflowHiddenAncestors.length} found`,
      expected: "0 (to prevent scroll clipping)",
    });
    
    // 7. PageHeader safe-area check
    const pageHeaders = document.querySelectorAll("header");
    let headerSafeAreaCount = 0;
    pageHeaders.forEach(header => {
      const paddingTop = getComputedStyle(header).paddingTop;
      if (parseFloat(paddingTop) > 20) headerSafeAreaCount++;
    });
    results.push({
      name: "Headers with safe-area padding",
      status: headerSafeAreaCount === 1 ? "pass" : headerSafeAreaCount === 0 ? "warn" : "fail",
      value: `${headerSafeAreaCount} header(s)`,
      expected: "Exactly 1 (PageHeader only)",
    });
    
    // 8. Touch target size check
    const smallButtons = document.querySelectorAll("button, a, [role='button']");
    let undersizedTargets = 0;
    smallButtons.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        undersizedTargets++;
      }
    });
    results.push({
      name: "Touch targets < 44px",
      status: undersizedTargets === 0 ? "pass" : "warn",
      value: `${undersizedTargets} element(s)`,
      expected: "0 for Apple HIG compliance",
    });
    
    // 9. User agent info
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    results.push({
      name: "Platform",
      status: "pass",
      value: isIOS ? (isSafari ? "iOS Safari" : "iOS WKWebView") : "Non-iOS",
    });
    
    // 10. Language preference
    results.push({
      name: "navigator.language",
      status: "pass",
      value: navigator.language,
    });
    
    setChecks(results);
    setIsRefreshing(false);
  };
  
  useEffect(() => {
    runChecks();
  }, []);
  
  const getStatusIcon = (status: "pass" | "warn" | "fail") => {
    switch (status) {
      case "pass": return <CheckCircle className="w-5 h-5 text-primary" />;
      case "warn": return <AlertTriangle className="w-5 h-5 text-accent" />;
      case "fail": return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };
  
  const passCount = checks.filter(c => c.status === "pass").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const failCount = checks.filter(c => c.status === "fail").length;

  return (
    <div className="flex flex-col h-full bg-background">
      <PageHeader
        title="Device QA"
        subtitle="iPhone vs Preview Parity"
        showBack
        backTo="/chat"
        showSettings={false}
        rightElement={
          <Button 
            variant="ghost" 
            size="icon"
            onClick={runChecks}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        }
      />
      
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div className="px-4 py-4 pb-32 max-w-lg mx-auto space-y-4">
          {/* Summary */}
          <div className="bg-card rounded-2xl border border-border/40 p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Summary</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{passCount} Pass</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium">{warnCount} Warn</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">{failCount} Fail</span>
              </div>
            </div>
          </div>
          
          {/* Checks */}
          <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/30">
              <h2 className="text-sm font-semibold text-muted-foreground">Layout Checks</h2>
            </div>
            <div className="divide-y divide-border/30">
              {checks.map((check, i) => (
                <div key={i} className="p-4 flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{check.name}</p>
                    <p className="text-sm text-primary font-mono">{check.value}</p>
                    {check.expected && (
                      <p className="text-xs text-muted-foreground mt-1">Expected: {check.expected}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Raw Debug Info */}
          <div className="bg-card rounded-2xl border border-border/40 p-4">
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Raw Debug</h2>
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
{`User Agent:
${navigator.userAgent}

Screen: ${screen.width}×${screen.height}
Viewport: ${window.innerWidth}×${window.innerHeight}
DPR: ${window.devicePixelRatio}

Safe Areas:
  top: ${getCSSEnvValue("safe-area-inset-top")}
  bottom: ${getCSSEnvValue("safe-area-inset-bottom")}
  left: ${getCSSEnvValue("safe-area-inset-left")}
  right: ${getCSSEnvValue("safe-area-inset-right")}
`}
            </pre>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            DEV ONLY – Remove before release
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getCSSEnvValue(envName: string): string {
  const testEl = document.createElement("div");
  testEl.style.position = "absolute";
  testEl.style.visibility = "hidden";
  testEl.style.height = `env(${envName}, 0px)`;
  document.body.appendChild(testEl);
  const value = getComputedStyle(testEl).height;
  document.body.removeChild(testEl);
  return value;
}

function findOverflowHiddenAncestors(): Element[] {
  const found: Element[] = [];
  // Check main content containers
  const containers = document.querySelectorAll("main, div[class*='flex'], div[class*='overflow']");
  containers.forEach(el => {
    const style = getComputedStyle(el);
    if (style.overflow === "hidden" || style.overflowX === "hidden") {
      // Exclude elements that are meant to clip (like cards with rounded corners)
      if (!el.className.includes("rounded") && !el.className.includes("card")) {
        found.push(el);
      }
    }
  });
  return found;
}
