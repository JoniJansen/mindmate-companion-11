import { ReactNode } from "react";

/**
 * Wrapper for standalone pages (not inside AppLayout) that need scrolling.
 * Required because body/#root are position:fixed + overflow:hidden for native iOS feel.
 */
export function StandalonePage({ children }: { children: ReactNode }) {
  return (
    <div 
      className="h-full overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </div>
  );
}