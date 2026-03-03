/**
 * Central safe-area and layout constants.
 * Single source of truth — no magic numbers in components.
 */

/** Bottom navigation bar content height in px (without safe-area) */
export const BOTTOM_NAV_HEIGHT = 56;

/** CSS expression for total bottom offset (nav + safe area) */
export const BOTTOM_NAV_TOTAL = `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px))`;

/** CSS expression for safe-area bottom only (no nav) */
export const SAFE_AREA_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

/** CSS expression for safe-area top only */
export const SAFE_AREA_TOP = 'env(safe-area-inset-top, 0px)';

/**
 * Returns inline style for a fixed full-screen page with bottom nav clearance.
 */
export const fullScreenWithNav = (): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  paddingBottom: BOTTOM_NAV_TOTAL,
});

/**
 * Returns inline style for a fixed full-screen page WITHOUT bottom nav (e.g. Settings, Safety).
 */
export const fullScreenNoNav = (): React.CSSProperties => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  paddingBottom: SAFE_AREA_BOTTOM,
});

/**
 * Returns inline style for a full-screen overlay (Exercise Player, Editor).
 */
export const fullScreenOverlay = (): React.CSSProperties => ({
  paddingTop: SAFE_AREA_TOP,
  paddingBottom: SAFE_AREA_BOTTOM,
});
