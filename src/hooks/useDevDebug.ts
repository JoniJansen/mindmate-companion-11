/**
 * DEV-ONLY: Debug utilities for iOS layout verification
 * Remove or disable before production builds
 */

import { useEffect } from "react";

interface DebugInfo {
  safeAreaTop: string;
  safeAreaBottom: string;
  headerHeight: number;
  isPWAStandalone: boolean;
  viewportWidth: number;
  viewportHeight: number;
  devicePixelRatio: number;
}

export function useDevDebug(enabled = false, componentName = "Unknown") {
  useEffect(() => {
    // Only run in development mode and when explicitly enabled
    if (!enabled || import.meta.env.PROD) return;

    const logDebugInfo = () => {
      // Get computed safe-area insets
      const styles = getComputedStyle(document.documentElement);
      const safeAreaTop = styles.getPropertyValue("--sat") || 
        getComputedStyle(document.documentElement).getPropertyValue("padding-top") ||
        "0px";
      
      // Check if running as PWA standalone
      const isPWAStandalone = 
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      // Find header element and measure
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height ?? 0;

      const debugInfo: DebugInfo = {
        safeAreaTop: `env(safe-area-inset-top) = ${getCSSEnvValue("safe-area-inset-top")}`,
        safeAreaBottom: `env(safe-area-inset-bottom) = ${getCSSEnvValue("safe-area-inset-bottom")}`,
        headerHeight,
        isPWAStandalone,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      };

      console.group(`🔧 [DEV DEBUG] ${componentName}`);
      console.table(debugInfo);
      
      // Check for potential double padding
      const appLayout = document.querySelector('[class*="flex flex-col bg-background"]');
      if (appLayout) {
        const appLayoutPaddingTop = getComputedStyle(appLayout).paddingTop;
        console.log(`📐 AppLayout paddingTop: ${appLayoutPaddingTop}`);
      }
      
      if (header) {
        const headerPaddingTop = getComputedStyle(header).paddingTop;
        console.log(`📐 Header paddingTop: ${headerPaddingTop}`);
      }
      
      console.groupEnd();
    };

    // Log on mount
    logDebugInfo();

    // Log on resize (viewport changes)
    window.addEventListener("resize", logDebugInfo);
    
    return () => {
      window.removeEventListener("resize", logDebugInfo);
    };
  }, [enabled, componentName]);
}

/**
 * Helper to get CSS env() value by creating a temporary element
 */
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

/**
 * Quick console function for manual debugging
 * Call from browser console: window.__debugLayout()
 */
if (typeof window !== "undefined" && import.meta.env.DEV) {
  (window as any).__debugLayout = () => {
    console.log("=== LAYOUT DEBUG ===");
    console.log(`Safe-area-inset-top: ${getCSSEnvValue("safe-area-inset-top")}`);
    console.log(`Safe-area-inset-bottom: ${getCSSEnvValue("safe-area-inset-bottom")}`);
    console.log(`Viewport: ${window.innerWidth}x${window.innerHeight}`);
    console.log(`PWA Standalone: ${window.matchMedia("(display-mode: standalone)").matches}`);
    console.log(`Device Pixel Ratio: ${window.devicePixelRatio}`);
    
    const header = document.querySelector("header");
    if (header) {
      console.log(`Header height: ${header.getBoundingClientRect().height}px`);
      console.log(`Header paddingTop: ${getComputedStyle(header).paddingTop}`);
    }
    
    // Check all elements with safe-area padding
    document.querySelectorAll("*").forEach((el) => {
      const style = getComputedStyle(el);
      if (style.paddingTop.includes("env") || parseFloat(style.paddingTop) > 40) {
        console.log(`📍 ${el.tagName}.${el.className.split(" ")[0]} paddingTop: ${style.paddingTop}`);
      }
    });
  };
}
