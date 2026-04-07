import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getArchetype } from "@/data/companions";

function isDirectAssetUrl(value: string) {
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

function getStorageTarget(value: string): { bucket: "avatars" | "companions"; path: string } {
  const trimmed = value.trim().replace(/^storage:\/\//, "");

  if (trimmed.startsWith("avatars/")) {
    return { bucket: "avatars", path: trimmed.slice("avatars/".length) };
  }

  if (trimmed.startsWith("companions/")) {
    return { bucket: "companions", path: trimmed.slice("companions/".length) };
  }

  for (const bucket of ["avatars", "companions"] as const) {
    const marker = `/${bucket}/`;
    const idx = trimmed.indexOf(marker);
    if (idx !== -1) {
      return {
        bucket,
        path: trimmed.substring(idx + marker.length).split("?")[0],
      };
    }
  }

  return { bucket: "avatars", path: trimmed };
}

/**
 * Resolves a companion/profile avatar.
 * - direct asset/public URLs are returned as-is
 * - storage paths are signed
 * - empty companion avatars fall back to the archetype asset
 */
export function useAvatarUrl(avatarPath: string | null | undefined, archetype?: string): string | undefined {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>();

  useEffect(() => {
    const trimmedPath = avatarPath?.trim();
    const fallbackUrl = archetype ? getArchetype(archetype)?.defaultAvatar : undefined;

    if (!trimmedPath) {
      setResolvedUrl(fallbackUrl);
      return;
    }

    if (isDirectAssetUrl(trimmedPath)) {
      setResolvedUrl(trimmedPath);
      return;
    }

    let cancelled = false;
    const { bucket, path } = getStorageTarget(trimmedPath);

    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          if (import.meta.env.DEV) console.warn("Signed URL error:", error);
          setResolvedUrl(fallbackUrl);
        } else {
          setResolvedUrl(data.signedUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [avatarPath, archetype]);

  return resolvedUrl;
}
