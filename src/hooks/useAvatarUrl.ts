import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getArchetype } from "@/data/companions";
import { Capacitor } from "@capacitor/core";

/**
 * Build a stable URL for companion assets.
 * - Bundled web assets in /public stay regular web URLs on all platforms
 * - Real device file paths use Capacitor.convertFileSrc() only when needed
 */
export function resolveLocalAssetUrl(relativePath: string): string {
  const trimmedPath = relativePath.trim();

  // Already a full URL — pass through
  if (isDirectUrl(trimmedPath)) {
    return trimmedPath;
  }

  // Real device file paths must be rewritten for the WebView
  if (isDeviceFilePath(trimmedPath)) {
    return Capacitor.isNativePlatform()
      ? Capacitor.convertFileSrc(trimmedPath)
      : trimmedPath;
  }

  // Bundled assets from public/ must stay normal WebView URLs
  const cleanPath = trimmedPath.replace(/^\.?\//, "");
  const absolutePath = `/${cleanPath}`;

  if (typeof window !== "undefined") {
    const origin = window.location?.origin;
    if (origin && origin !== "null") {
      try {
        return new URL(absolutePath, origin).toString();
      } catch {
        // Fall through to root-relative path
      }
    }
  }

  return absolutePath;
}

function isDirectUrl(value: string) {
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("capacitor://") ||
    value.startsWith("ionic://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  );
}

function isDeviceFilePath(value: string) {
  return (
    value.startsWith("file://") ||
    value.startsWith("content://") ||
    value.startsWith("ph://") ||
    value.startsWith("assets-library://") ||
    /^\/(private|var|Users)\//.test(value)
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

function getFallbackAvatarUrl(archetype?: string) {
  const arch = archetype ? getArchetype(archetype) : undefined;
  return arch?.defaultAvatar ? resolveLocalAssetUrl(arch.defaultAvatar) : undefined;
}

function resolveAvatarTarget(
  avatarPath: string | null | undefined,
  archetype?: string,
):
  | { kind: "static"; url: string | undefined }
  | { kind: "storage"; bucket: "avatars" | "companions"; path: string; fallbackUrl: string | undefined } {
  const trimmedPath = avatarPath?.trim() || null;
  const fallbackUrl = getFallbackAvatarUrl(archetype);

  if (!trimmedPath) {
    return { kind: "static", url: fallbackUrl };
  }

  if (isDirectUrl(trimmedPath) || isLocalAssetPath(trimmedPath) || isDeviceFilePath(trimmedPath)) {
    return { kind: "static", url: resolveLocalAssetUrl(trimmedPath) };
  }

  const { bucket, path } = getStorageTarget(trimmedPath);
  return { kind: "storage", bucket, path, fallbackUrl };
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
  const target = useMemo(
    () => resolveAvatarTarget(avatarPath, archetype),
    [avatarPath, archetype],
  );
  const [resolvedUrl, setResolvedUrl] = useState<string | undefined>(
    target.kind === "storage" ? target.fallbackUrl : undefined,
  );

  useEffect(() => {
    if (target.kind !== "storage") {
      setResolvedUrl(undefined);
      return;
    }

    let cancelled = false;
    setResolvedUrl(target.fallbackUrl);

    supabase.storage
      .from(target.bucket)
      .createSignedUrl(target.path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          if (import.meta.env.DEV) console.warn("Signed URL error:", error);
          setResolvedUrl(target.fallbackUrl);
        } else {
          setResolvedUrl(data.signedUrl);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [target]);

  return target.kind === "storage" ? resolvedUrl : target.url;
}
