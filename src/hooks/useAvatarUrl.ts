import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getArchetype } from "@/data/companions";
import { Capacitor } from "@capacitor/core";

/**
 * Build a platform-safe URL for a local companion asset.
 * - Web: relative path works fine
 * - Capacitor native: uses Capacitor.convertFileSrc() for correct file:// resolution
 */
export function resolveLocalAssetUrl(relativePath: string): string {
  // Already a full URL — pass through
  if (/^https?:\/\/|^capacitor:\/\/|^ionic:\/\//.test(relativePath)) {
    return relativePath;
  }

  // Normalise to /clean/path
  const cleanPath = relativePath.replace(/^\.?\//, "");
  const absolutePath = `/${cleanPath}`;

  if (Capacitor.isNativePlatform()) {
    return Capacitor.convertFileSrc(absolutePath);
  }

  return absolutePath;
}

function isDirectUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("capacitor://") ||
    value.startsWith("ionic://")
  );
}

function isLocalAssetPath(value: string) {
  // Paths like /companions/mira.jpg or ./companions/mira.jpg
  return /^\.?\/companions\//.test(value);
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
 * Resolves a companion/profile avatar to a usable URL.
 *
 * Priority:
 * 1. Direct http(s)/capacitor URLs → use as-is
 * 2. Local asset paths (/companions/*.jpg) → resolve for current platform
 * 3. Storage references → sign via Supabase
 * 4. null/empty → fall back to archetype default asset
 */
export function useAvatarUrl(
  avatarPath: string | null | undefined,
  archetype?: string,
): string | undefined {
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>();

  useEffect(() => {
    const trimmedPath = avatarPath?.trim() || null;

    // Build platform-safe fallback from archetype data
    const arch = archetype ? getArchetype(archetype) : undefined;
    const fallbackUrl = arch?.defaultAvatar
      ? resolveLocalAssetUrl(arch.defaultAvatar)
      : undefined;

    // --- Nothing stored → archetype fallback ---
    if (!trimmedPath) {
      setResolvedUrl(fallbackUrl);
      return;
    }

    // --- Full URL (http/capacitor) → use directly ---
    if (isDirectUrl(trimmedPath)) {
      setResolvedUrl(trimmedPath);
      return;
    }

    // --- Local asset path (/companions/...) → resolve for platform ---
    if (isLocalAssetPath(trimmedPath)) {
      setResolvedUrl(resolveLocalAssetUrl(trimmedPath));
      return;
    }

    // --- Supabase storage reference → sign ---
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
