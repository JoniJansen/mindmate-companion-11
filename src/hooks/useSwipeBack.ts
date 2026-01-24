import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface UseSwipeBackOptions {
  enabled?: boolean;
  threshold?: number;
  backTo?: string;
}

export function useSwipeBack({ 
  enabled = true, 
  threshold = 80,
  backTo 
}: UseSwipeBackOptions = {}) {
  const navigate = useNavigate();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only start tracking if swipe begins from the left edge (within 30px)
      if (touch.clientX <= 30) {
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - touchStartY.current);

      // Check if it's a horizontal swipe (more horizontal than vertical)
      // and if it exceeds the threshold
      if (deltaX > threshold && deltaY < deltaX * 0.5) {
        if (backTo) {
          navigate(backTo);
        } else {
          navigate(-1);
        }
      }

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;
    };

    const handleTouchCancel = () => {
      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [enabled, threshold, backTo, navigate]);
}
