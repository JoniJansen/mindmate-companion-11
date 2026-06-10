# Build 64 — Apple-Review-Risk Fixes

**Datum**: 2026-06-10 Abend (Tag-3-Abschluss)
**Build-Status**: Apple-Review-Fixes auf origin/main (commits `298a535`, `374eb47`, `412f5b0`)
**Archive-Status**: Pending — morgen früh (2026-06-11)
**Discovery-Methode**: Apple-Guideline-Forensik + Lovable-Implementation

---

## Übersicht — Zwei Apple-Review-Risiken behoben

| Fix | Apple Guideline | File | Status |
|---|---|---|---|
| Fix 1 | **2.3.1** — Accurate Metadata, no fabricated claims | `src/components/mood/CommunityInsights.tsx` | ✅ |
| Fix 2 | **2.1** — App Completeness, no dead features | `src/components/topics/TopicDetail.tsx` | ✅ |
| Fix 3 | **5.1.1** — Privacy / Consent | `Sentry-Consent-Modal` (no code change) | ✅ verifiziert |

---

## Fix 1 — Apple Guideline 2.3.1: Fabricated User Statistics entfernt

### Risk-Analyse

Apple-Guideline 2.3.1 ("Accurate Metadata"):
> *"You should ensure that we know about features in your app that are not immediately obvious to users... Accurate descriptions and screenshots that help us understand how your app works."*

Plus Apple-Praxis: Behauptungen wie "X% of users do Y" ohne tatsächliche Datenbasis sind Marketing-Misleading und führen zu Reject.

### Was im Code war (Pre-Fix)

`src/components/mood/CommunityInsights.tsx` hatte drei fabrizierte Statistiken:

```typescript
// FALSCH (Pre-Fix):
const pct = 58 + (minDay * 7) % 15; // 58-72%  ← deterministisch aus Day-Index berechnet
"Du bist nicht allein: ${pct}% der Nutzer berichten ähnliche Gefühle..."

// FALSCH (Pre-Fix):
"Many users share the feeling..."  ← "users" implies aggregate data we don't have

// FALSCH (Pre-Fix):
"Du trackst regelmäßig — das machen nur 23% der Nutzer so konsequent."
"You track consistently — only 23% of users are this dedicated."
```

→ Drei separate fabrizierte Prozentwerte (58-72%, 23%, plus "many users" claim).

### Lovable's Fix (commit `298a535`)

```typescript
// KORREKT (Post-Fix):
// Apple 2.3.1: no fabricated user statistics — use qualitative wording.
"Du bist nicht allein — viele Menschen berichten ähnliche Gefühle am ${dayNames[minDay]}."
"You're not alone — many people report similar feelings on ${dayNames[minDay]}s."

"Viele Menschen teilen das Gefühl..."  ← "users" → "Menschen/people"

// General encouragement based on consistency (no fabricated percentages — Apple 2.3.1)
"Du trackst regelmäßig — das ist eine starke Leistung. Weiter so!"
"You track consistently — that takes real dedication. Keep it up!"
```

**Approach**: Qualitative Wording statt quantitative Behauptung. Apple-2.3.1-Kommentar als Doc-Marker im Code.

**Plus**: Lovable hat eigenständig `rg`-Sweep (ripgrep) gemacht nach weiteren Claims → keine weiteren gefunden. Über Anforderung hinaus.

### Verifikation

| Check | Status |
|---|---|
| `grep "23%"` im File | ✅ 0 Treffer |
| `grep "2.3.1"` Doc-Marker | ✅ 2 Treffer |
| Marketing-Risiko-Wording entfernt | ✅ |
| Encouragement-Tone bleibt erhalten | ✅ |

---

## Fix 2 — Apple Guideline 2.1: Dead-Button "Stresssignale erkennen"

### Risk-Analyse

Apple-Guideline 2.1 ("App Completeness"):
> *"Apps should be fully functional when reviewed."*

Dead Buttons / Features die einfach nichts tun (oder nur Toast zeigen ohne tatsächliche Aktion) sind Reject-Risiko.

### Was im Code war (Pre-Fix)

`src/components/topics/TopicDetail.tsx` hatte für `step.type === 'reflection'` nur:
```typescript
// FALSCH (Pre-Fix):
} else {
  // For reflection and exercise, mark as complete and show a toast
  onStepComplete(step.id);
}
```

→ Reflection-Steps zeigten Toast aber **navigierten nirgends hin** — User wurde nicht ins Journal/Tagebuch geführt, hatte keine Möglichkeit die Reflection durchzuführen. Stresssignale-erkennen-Button war ein Symbol für eine ganze Klasse von broken-Reflections.

### Lovable's Fix (commit `374eb47`)

```typescript
// KORREKT (Post-Fix):
} else if (step.type === 'journal' || step.type === 'reflection') {
  // Apple 2.1: reflection steps now route to journal with the step's
  // description as prompt instead of silently completing (was dead-button).
  localStorage.setItem('journal_prompt', `${stepDisplay.title} — ${stepDisplay.description}`);
  onStepComplete(step.id);
  navigate('/journal');
} else {
  // exercise → mark complete + toast (handled by parent)
  onStepComplete(step.id);
}
```

**Approach**:
- Reflection-Steps werden im gleichen Branch wie Journal-Steps behandelt
- Step-Title + Description werden als Journal-Prompt vorgefüllt
- User wird zum Tagebuch navigiert
- Plus `onStepComplete(step.id)` wird trotzdem aufgerufen → Step-Progress bleibt erhalten
- Verwendet bestehende Journal-Prompt-Infrastruktur — keine neue UI, kein Code-Duplikat

**Side-Effect**: Plus alle Reflection-Steps in anderen Topics (Relationships, Self-worth) sind damit auch gefixt. Topic-Level-Bug-Fix, nicht Button-Level-Bug-Fix.

### Verifikation

| Check | Status |
|---|---|
| `step.type === 'reflection'` jetzt im journal-Branch | ✅ |
| `navigate('/journal')` für reflection | ✅ |
| `localStorage.setItem('journal_prompt')` mit Title + Description | ✅ |
| Apple-2.1-Doc-Marker | ✅ |

---

## Fix 3 — Sentry-Consent-Modal: Verifikation ohne Code-Change

### Risk-Analyse

Apple-Guideline 5.1.1 ("Data Collection and Storage"):
> *"Privacy Policy ... must be displayed to users prior to any data collection."*

Plus Apple Privacy-Manifest-Requirement (since May 2024): SDKs die User-Daten sammeln müssen consent-flow haben + im PrivacyInfo.xcprivacy gelistet sein.

### Verifikation

Lovable hat geprüft und bestätigt:
- ✅ `PrivacyInfo.xcprivacy` ist im Bundle (registriert in pbxproj via Build-60-Fix `8356dc4`)
- ✅ Sentry-Consent-Modal "Hilfst du uns, Soulvay stabiler zu machen?" wird beim App-Start gezeigt
- ✅ User-Test auf Build 61 hatte das Modal verifiziert (C1 ✅)
- ✅ Sentry-Confirmation-Email "You've sent a few events to Sentry" bestätigt End-to-End-Pipeline

**Code-Änderung nicht nötig.** Privacy-Manifest ist konform.

---

## Build-64-Ready-Status

### Submission-Infrastruktur (verifiziert komplett in ASC)

| Item | Status |
|---|---|
| Demo-Account | ✅ `apple-review@soulvay.de` konfiguriert |
| Paywall-Screenshots | ✅ Beide Subscriptions in ASC hochgeladen |
| Review-Notes | ✅ MindMate→Soulvay-Rename-Context dokumentiert |
| Sandbox-Tester | ✅ `sandbox-tester@soulvay.com` aktiv |
| Bundle-ID | ✅ `com.jonathanjansen.mindmate` |
| Apple Privacy Manifest | ✅ PrivacyInfo.xcprivacy im Bundle |
| In-app purchase P8-Key | ✅ "Valid credentials" in RC |

### Build-64-Code-Stack

- **Foundation** (Build 61): Pipeline-Hardening `build:ios` + `verify:ios` Scripts
- **Layout-Stability** (Build 62 prep): viewport-fix, CSS-zoom-guard, safe-area-padding, Journal-Mic-fixed-bottom
- **Abo-Blocker Fix** (Build 63): `withTimeout` helper, getOfferings 15s timeout, purchasePackage 60s timeout, retry-banner
- **Apple-Review-Fixes** (Build 64): Apple Guideline 2.3.1 (CommunityInsights) + 2.1 (TopicDetail-Reflection-Routing)

---

## Critical Update — Forensik-Befund + Manuelle Korrekturen (10. Juni 2026, ~20:00)

### Befund — Lovable's Fix 2 war Wais-Patch

`src/components/topics/TopicDetail.tsx` ist **tote File**:
- 0 Importer in der Codebase (`grep -rln "from.*components/topics" src/` = 0 Treffer)
- Vite tree-shaked sie aus dem Production-Bundle
- Lovable's reflection-step-Fix war im Source aber NICHT im Bundle

Echter Step-Handler: `src/pages/Topics.tsx` `handleStepAction` (Zeile 253-285).
Switch hatte keinen `case "reflection"` → `default` break ohne Action → Dead-Button bestätigt.

**Hätten wir Build 64 ohne Empirie-Check submitted → Apple-Reject mit Guideline 2.1 garantiert.**

### Forensik-Workflow Evidenz

Workflow Run `wf_b3e6dd0d-214` mit 3 parallel Forensik-Agents + Senior-Synthese:
1. Real-Handler-Trace: `Topics.tsx:253-285` `handleStepAction`
2. Step-Types-Handler: Switch fehlt `case "reflection"`
3. Fix1-And-Other-Fabricated: CommunityInsights ✅ wirksam in `Mood.tsx:394`

### Manuelle Korrekturen Build 64

1. **`src/pages/Topics.tsx`**: 12-Zeilen-Diff
   - Neuer `case "reflection"` mit `localStorage.setItem('journal_prompt', ...)` + `navigate("/journal")`
   - `case "journal"` ergänzt um `localStorage.setItem` (war vorher leer)
   - Default-Branch: Reflection-Kommentar entfernt
2. **`src/components/topics/TopicDetail.tsx`**: @deprecated JSDoc-Marker am File-Anfang
   - Verhindert Wais-Patches durch Lovable/AI in Zukunft
   - File bleibt erhalten (sicherer Pfad)
3. **`src/pages/Safety.tsx`**: KEIN CHANGE
   - "24 Jahre Erfahrung" ist real → Jutta Jansen mit Website juttajansen.com belegbar
   - Apple-Reviewer kann verifizieren

### Bundle-Verifikation post-Patch (KRITISCH)

| Marker | Vorher | Nachher | Status |
|---|---|---|---|
| `mic_free_attempt` (Item #1A) | 1 | 1 | ✅ |
| `viele Menschen` (Fix 1 - Apple 2.3.1) | 1 | 1 | ✅ |
| `23%` (Pre-Fix-1 fabricated stat) | 0 | 0 | ✅ |
| **`journal_prompt` (Fix 2 - Apple 2.1)** | **0** | **1** (in `Topics-Dw8H0kGF.js`) | ✅ **CRITICAL FIX** |

### Git-Commits

- Lovable's commits (`298a535`, `374eb47`, `412f5b0`): bleiben — Fix 1 (CommunityInsights) ist wirksam, Fix 2 (TopicDetail) ist deprecated-markiert
- Manueller Patch: `src/pages/Topics.tsx` + `src/components/topics/TopicDetail.tsx`
- Info.plist: 63 → 64
- Audit-Doc-Update: dieses File
- Lesson 11 zu `BUILD60_ENGINEERING_LESSONS_MASTER.md`

---

## Tomorrow-Plan (2026-06-11 morgens)

### Phase 1: Build 64 Vorbereitung (10 Min)

```bash
cd /Users/jonathanjansen/soulvay
git pull origin main  # Sicherstellen alles aktuell
# Info.plist Bump: 63 → 64
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion 64" ios/App/App/Info.plist
plutil -lint ios/App/App/Info.plist

# Fresh build
bun run build:ios
bun run verify:ios

# Plus check Apple-Review-Marker im Bundle
grep -l "Apple 2.3.1\|Apple 2.1" ios/App/App/public/assets/*.js
grep -l "viele Menschen\|many people" ios/App/App/public/assets/*.js
grep -l "journal_prompt" ios/App/App/public/assets/*.js

# Commit + Push (SELEKTIV)
git add ios/App/App/Info.plist
git commit -m "chore(release): Build 64 — Apple-Review-Fixes 2.3.1 + 2.1"
git push origin main
```

### Phase 2: Xcode Archive + Upload (20 Min, User-Hand)

1. Cmd+Ctrl+W (Close Workspace) → reopen `ios/App/App.xcodeproj`
2. Indexing abwarten (30-60s)
3. Cmd+Shift+K (Clean Build Folder)
4. Product → Archive (5-15 Min)
5. Organizer: muss zeigen `1.1 (64)` — bei Abweichung STOP
6. Distribute App → App Store Connect → Upload

### Phase 3: ASC Version 1.1 Submission (15 Min, User-Hand mit Chrome-Claude)

1. Version 1.1 anlegen in ASC
2. Build 64 wählen
3. Beide Subscriptions als "Bundled In-App Purchase" anhaken
4. Submit for Review

### Phase 4: Apple-Review-Wait

24-48h. Erwartete Live-Time: **Freitag 13. - Sonntag 15. Juni 2026**.

### Phase 5: Post-Approval

- Subscriptions "Cleared for Sale"
- Soulvay's erste funktionierende Monetization live
- Marketing-Push-Vorbereitung beginnen

---

## Strategischer Bilanz Tag 3 (10. Juni 2026)

| Iteration | Was erreicht |
|---|---|
| Build 60 (Mittag) | Info.plist + pbxproj fixes, archive uploaded |
| Build 61 (Nachmittag) | Pipeline-Fix → frisches Bundle, B1+B2+C1 ✅ verifiziert |
| Build 62 (Spätnachmittag, prep only) | Lovable's Layout-Stability merged, nicht uploaded |
| Build 63 (Abend) | Abo-Blocker-Fix (Lovable timeout-pattern), uploaded |
| Build 64 (jetzt prep, morgen archive) | Apple-Review-Fixes 2.3.1 + 2.1 |

**4 Build-Iterationen in einem Tag.** Plus Pipeline-Hardening, ASC-Submission-Forensik, 10 Engineering-Lessons konsolidiert.

Pre-Tomorrow-Checklist:
- ✅ Build 64 Code auf origin/main
- ✅ Submission-Infrastruktur ASC komplett
- ✅ RC korrekt konfiguriert (Chrome-Claude-Verifikation)
- ✅ Audit-Trail vollständig (12+ Docs)
- ⏳ Build 64 Archive (morgen 8:30-9:30)

**Soulvay ist bereit für die erste funktionierende Subscription-Submission seit Live-Gang.**
