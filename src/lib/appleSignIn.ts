/**
 * Native Apple Sign-In helper for iOS (Capacitor).
 *
 * On iOS, we MUST use Apple's native `ASAuthorizationAppleIDProvider` (via the
 * `@capacitor-community/apple-sign-in` plugin) — a web OAuth redirect does not
 * work inside a Capacitor app and is rejected by Apple (Guideline 2.1a).
 *
 * Flow:
 *   1. Native Apple Sign-In dialog → returns identityToken (JWT) + nonce
 *   2. Pass identityToken to Supabase `signInWithIdToken({provider: 'apple'})`
 *   3. Supabase verifies the token with Apple and creates / signs in the user
 *
 * Prerequisites (must be done ONCE, outside the code):
 *   - Apple Developer Portal: Sign In with Apple capability on the App ID
 *   - Xcode: `App.entitlements` contains `com.apple.developer.applesignin`
 *     (already created in this repo — see ios/App/App/App.entitlements)
 *   - Supabase: Apple provider configured (Services ID + key). No redirect URL
 *     is needed for the native ID-token flow.
 */
import { supabase } from "@/integrations/supabase/client";
import { isNativeIOS } from "@/lib/nativeDetect";

type NativeAppleResult = {
  user: string;
  identityToken?: string;
  authorizationCode?: string;
  givenName?: string | null;
  familyName?: string | null;
  email?: string | null;
};

/** Returns a cryptographically random string usable as a nonce. */
function generateNonce(length = 32): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

/** SHA-256 hash of a string, hex-encoded. Apple expects a SHA-256 hashed nonce. */
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Trigger the native Apple Sign-In sheet on iOS and sign the user into Supabase
 * using the returned identity token.
 *
 * @returns true on success; throws on hard errors; returns false if the user cancelled.
 */
export async function signInWithAppleNative(): Promise<boolean> {
  if (!isNativeIOS()) {
    throw new Error("Native Apple Sign-In is only available inside the iOS app");
  }

  // Generate a nonce. We send the HASHED nonce to Apple and verify the RAW
  // nonce matches the `nonce` claim in the returned ID token via Supabase.
  const rawNonce = generateNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  let result: NativeAppleResult;
  try {
    // Dynamic import to keep the plugin out of the web bundle.
    const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");

    const response = await SignInWithApple.authorize({
      clientId: "com.jonathanjansen.mindmate", // must match the iOS bundle ID
      redirectURI: "", // not used in native flow but required by the plugin type
      scopes: "email name",
      state: "signin",
      nonce: hashedNonce,
    });

    result = response.response as NativeAppleResult;
  } catch (e: any) {
    // The plugin throws on user cancel with code 1001 / message "The operation couldn't be completed"
    const msg = String(e?.message ?? e ?? "");
    if (
      msg.includes("1001") ||
      msg.toLowerCase().includes("canceled") ||
      msg.toLowerCase().includes("cancelled") ||
      e?.code === "ASAuthorizationErrorCanceled"
    ) {
      if (import.meta.env.DEV) console.info("[AppleSignIn] User cancelled");
      return false;
    }
    throw new Error(`Apple Sign-In failed: ${msg || "unknown error"}`);
  }

  if (!result.identityToken) {
    throw new Error("Apple returned no identity token");
  }

  // Sign into Supabase using the identity token + raw nonce.
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: result.identityToken,
    nonce: rawNonce,
  });

  if (error) {
    throw new Error(`Supabase sign-in failed: ${error.message}`);
  }

  return true;
}
