#!/usr/bin/env bash
# ============================================================
# Soulvay — Build 13 Preparation Script
# Führe dies im Mac-Terminal aus, VOR du Xcode öffnest.
# Usage:  bash scripts/prepare-build13.sh
# ============================================================
set -e  # stop on first error

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
echo ""
echo "🔧 Soulvay Build-13-Vorbereitung startet in $ROOT"
echo ""

# ── Step 1: Dependencies installieren ────────────────────────
echo "▶ 1/4 npm install (Apple Sign-In Plugin & Co.)"
npm install

# ── Step 2: Web-App bauen ────────────────────────────────────
echo ""
echo "▶ 2/4 Web-App bauen (npm run build)"
npm run build

# ── Step 3: Binary-Scan — keine dritt-Plattform-Strings ──────
echo ""
echo "▶ 3/4 Binary-Scan (Guideline 2.3.10 Absicherung)"
if grep -qr "Google Play\|google-play\|Play Store" dist/ 2>/dev/null; then
  echo "❌ FEHLER: dist/ enthält 'Google Play' / 'Play Store' Referenzen. Abbruch."
  grep -rn "Google Play\|google-play\|Play Store" dist/ | head -5
  exit 1
fi
if grep -qr "\"Android\"" dist/index.html 2>/dev/null; then
  echo "❌ FEHLER: dist/index.html enthält 'Android' als User-Text. Abbruch."
  exit 1
fi
echo "   ✅ Keine verbotenen Plattform-Strings gefunden"

# ── Step 4: Capacitor Sync ───────────────────────────────────
echo ""
echo "▶ 4/4 npx cap sync ios (Plugins ins iOS-Projekt verlinken)"
npx cap sync ios

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "✅ FERTIG. Als Nächstes:"
echo "   1) Apple Developer Portal → Sign In with Apple für com.jonathanjansen.mindmate aktivieren"
echo "   2) Supabase → Apple Provider aktivieren (falls noch nicht)"
echo "   3) 'npx cap open ios' → Xcode → Build 42 → Archive → Upload"
echo "   4) App Store Connect → EULA + Build 42 + Review Notes → Submit"
echo ""
echo "📄 Komplette Anleitung: docs/apple-rejection-fixes-build13.md"
echo ""
