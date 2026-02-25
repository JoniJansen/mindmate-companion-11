import { ReactNode } from "react";

/**
 * Wrapper for standalone pages (not inside AppLayout) that need scrolling.
 * Uses fixed positioning to bypass the #root overflow:hidden constraint,
 * since intermediate React Router divs don't propagate h-full.
 */
export function StandalonePage({ children }: { children: ReactNode }) {
  return (
    <div 
      className="fixed inset-0 overflow-y-auto overscroll-contain bg-background z-10"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}