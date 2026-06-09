import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { SpeechRecognition } from "@capacitor-community/speech-recognition";

// ============================================================================
// Platform-Detection
// ============================================================================

export const isNativeSpeechPlatform = (): boolean => Capacitor.isNativePlatform();

// ============================================================================
// Permissions + Availability
// ============================================================================

export async function nativeAvailable(): Promise<boolean> {
  const result = await SpeechRecognition.available();
  return result.available;
}

export async function nativeCheckPermissions(): Promise<string> {
  const result = await SpeechRecognition.checkPermissions();
  return result.speechRecognition;
}

export async function nativeRequestPermissions(): Promise<string> {
  const result = await SpeechRecognition.requestPermissions();
  return result.speechRecognition;
}

// ============================================================================
// Lifecycle: start / stop / isListening
// ============================================================================

export interface NativeStartOptions {
  language: string;
  maxResults?: number;
  prompt?: string;
  partialResults: boolean;
  popup?: boolean;
}

export async function nativeStart(opts: NativeStartOptions): Promise<void> {
  await SpeechRecognition.start(opts);
}

export async function nativeStop(): Promise<void> {
  await SpeechRecognition.stop();
}

export async function nativeIsListening(): Promise<boolean> {
  const result = await SpeechRecognition.isListening();
  return result.listening;
}

// ============================================================================
// Listener Management — KRITISCH: Handles speichern für Cleanup
// ============================================================================

/**
 * ============================================================================
 * THENABLE-TRAP-MITIGATION
 * ============================================================================
 * Background: Build 59 had a critical bug where a Capacitor plugin's proxy
 * object was incorrectly treated as a thenable, causing useRevenueCat hook
 * to hang indefinitely on initial mount.
 *
 * Mitigation for this wrapper:
 * 1. Every addListener() call uses explicit `await` — never return the bare
 *    Promise<PluginListenerHandle> to consumers, always resolve it first.
 * 2. Return types are explicit: `Promise<PluginListenerHandle>` not `any`.
 * 3. Consumers (useSpeech hook) are expected to store the resolved handle
 *    and call `.remove()` on it during cleanup.
 * 4. removeAllListeners() is provided as a safety-net for component unmount.
 *
 * If you modify this file, do NOT remove the explicit await on addListener
 * calls — this is the failure mode we are explicitly preventing.
 * ============================================================================
 */

export async function nativeOnPartial(
  cb: (data: { matches: string[] }) => void
): Promise<PluginListenerHandle> {
  return await SpeechRecognition.addListener("partialResults", cb);
}

export async function nativeOnListening(
  cb: (data: { status: string }) => void
): Promise<PluginListenerHandle> {
  return await SpeechRecognition.addListener("listeningState", cb);
}

export async function nativeRemoveAllListeners(): Promise<void> {
  await SpeechRecognition.removeAllListeners();
}
