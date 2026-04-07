import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generates a signed URL for a private avatar bucket.
 * Handles both legacy full-URL format and new path-only format.
 */
export function useAvatarUrl(avatarPath: string | null | undefined): string | undefined {
  const [signedUrl, setSignedUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!avatarPath) {
      setSignedUrl(undefined);
      return;
    }

    // Extract just the path if a full URL was stored (legacy)
    let path = avatarPath;
    const bucketMarker = "/avatars/";
    const idx = avatarPath.indexOf(bucketMarker);
    if (idx !== -1) {
      path = avatarPath.substring(idx + bucketMarker.length).split("?")[0];
    }

    let cancelled = false;

    supabase.storage
      .from("avatars")
      .createSignedUrl(path, 3600) // 1 hour
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          if (import.meta.env.DEV) console.warn("Signed URL error:", error);
          setSignedUrl(undefined);
        } else {
          setSignedUrl(data.signedUrl);
        }
      });

    return () => { cancelled = true; };
  }, [avatarPath]);

  return signedUrl;
}
