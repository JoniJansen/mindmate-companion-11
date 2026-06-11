# Build 64 — Apple-Review-Submission Erfolgreich

## Datum
11. Juni 2026, ca. 16:00-17:30 CEST — Tag 4

## Submission-Status

**Build 64 Apple-Review-Submission abgeschlossen.**

| Item | Status |
|---|---|
| App Version 1.1 + Build 64 | ✅ Submitted, **Waiting for Review** |
| Subscription: Soulvay Plus Yearly | ✅ **Waiting for Review** (war bereits in Queue) |
| Subscription: Soulvay Plus Monthly | ✅ **Waiting for Review** (war bereits in Queue) |
| Apple Submission-Email | ⏳ Pending Propagation (erwartete Email bei joni.jansen00@gmail.com) |
| App Store Connect Status | ✅ Version 1.1 in "Warten auf Prüfung" |
| RevenueCat Status | ✅ Konfiguration korrekt, wartet auf Apple-Approval |

## Wie der ASC-UI-"Mystery" gelöst wurde

### Tag-3-Diagnose (gestern)
- IAP-Bereich auf Version 1.1 Seite erschien NICHT
- Apple-Banner verlangte "Subs im IAP-Bereich verknüpfen"
- Interpretation: Submission blockiert

### Tag-4-Klärung via Lovable's Web-Recherche
Quelle: Apple Developer Forums + DTS-Antwort (`audit/ASC_SUBS_WAITING_FOR_REVIEW_FINDINGS.md`)

**Apple DTS Engineer wörtlich**:
> *"The In-App Purchases and Subscriptions section only appears when you have one or more products with the **Ready to Submit** status. If their status is **Waiting for Review** or In Review, there is nothing to do. You already submitted them for review."*

**Bedeutung**:
- IAP-Bereich ist STATUS-GATED, nicht UI-broken
- Soulvay's Subs waren bereits in der Review-Queue ("Warten auf Prüfung")
- Banner-Anweisung war stale/misleading für diesen Status

### Tag-4-Aktion
**Direkter Submit ohne IAP-Verknüpfung** — weil Subs bereits in Review-Queue waren.

App-Version 1.1 mit Build 64 wurde submitted ohne weitere Sub-Verknüpfungs-Action. Apple reviewed App + Subs separat parallel.

## Was Build 64 enthält

### Code-Stack

| Layer | Was | Commits |
|---|---|---|
| Pipeline-Foundation | `build:ios` + `verify:ios` Scripts | `46b0264` (Build 61) |
| Layout-Stability | viewport-fix, CSS-zoom-guard, safe-area-padding, Journal-Mic-fixed-bottom | Lovable Build 62 prep |
| Abo-Blocker-Fix | `withTimeout` helper, getOfferings 15s timeout, purchasePackage 60s timeout, retry-banner | `506b042` (Build 63) |
| Apple-Review-Risk-Fix 1 (2.3.1) | CommunityInsights.tsx — fabrizierte Stats → qualitatives Wording | `298a535` (Lovable) |
| Apple-Review-Risk-Fix 2 (2.1) | Topics.tsx `handleStepAction` `case "reflection"` → Journal-Navigation | `3115950` (Senior-Cherry-Pick) |
| TopicDetail.tsx @deprecated | Verhindert zukünftige Wais-Patches | `3115950` |
| Safety.tsx | Authority-Claim verified (Jutta Jansen real mit Quellbeleg) | unverändert |

### Bundle-Marker (verifiziert vor Upload)

- `mic_free_attempt`: ✅ 1 Treffer (Item #1A Mic frei)
- `viele Menschen`: ✅ 1 Treffer (Apple 2.3.1 Fix wirksam)
- `journal_prompt`: ✅ 1 Treffer in `Topics-Dw8H0kGF.js` (Apple 2.1 Fix wirksam — Senior-Cherry-Pick)
- `23%`: ✅ 0 Treffer (fabricated stat entfernt)
- `24 Jahre`: ✅ Beleg in Safety.tsx (Jutta Jansen verifiziert)

## Apple-Review-Wait

**Erwartete Review-Zeit**: 24-48h nach Submit.
**Erwartetes Apple-Approval**: Freitag 12. - Sonntag 14. Juni 2026.
**Erwartete Live-Time**: nach Approval + Cleared-for-Sale-Propagation, realistisch Samstag 14. - Montag 16. Juni 2026.

## Was Build 64 erstmals erreicht

**Soulvay's erste funktionierende Subscription-Submission seit Live-Gang.**

- Build 51-59 (Version 1.0): Subscriptions waren während Review nicht kaufbar (Silent-Failure-Pattern in `getOfferings()`)
- Build 60-63: Pipeline + Layout + Abo-Fix Iterations
- **Build 64**: Erster Binary der Apple Guideline 3.1.1 (functional IAPs) erfüllt

Nach Apple-Approval wird Soulvay erstmals Revenue aus Subscriptions generieren können.

## Risiken nach Submit

| Risiko | Wahrscheinlichkeit | Mitigation |
|---|---|---|
| Apple-Reviewer findet Apple 2.1 Reflection-Dead-Button | NIEDRIG | Cherry-Pick in Topics.tsx + Bundle-grep-Verifikation |
| Apple-Reviewer findet Apple 2.3.1 fabricated stats | NIEDRIG | CommunityInsights.tsx-Fix Bundle-verifiziert |
| Apple-Reviewer testet Abo-Flow + sieht Hang | NIEDRIG | Build-63-Abo-Fix mit Timeouts + retry-banner |
| Apple-Reviewer findet andere Bug | MITTEL | Build 51-59 hatten erfolgreichen App-Approval-Track-Record |
| Apple-Reviewer requires App-Side Sub-Verknüpfung in UI | NIEDRIG | DTS bestätigt: status-gated, nichts zu tun |

## Tomorrow-Anchor (12. Juni 2026)

**Apple-Review-Wait Modus**:
- Email-Notifications von Apple monitoren
- ASC Status-Updates beobachten
- Kein weiteres Code-Engineering nötig

**Bei "In Review"-Notification**:
- Standby — Apple-Reviewer testet App + Subs

**Bei "Approval"-Notification**:
- Subs auf "Cleared for Sale" propagiert
- Echter Sandbox-Test mit User-Account
- RevenueCat Customer-Session erwartet aktiv
- Pre-Marketing-Checklist-Run (siehe Lesson 9)

**Bei "Reject"-Notification**:
- Lovable + Forensik-Workflow für Diagnose
- Build 65 wenn nötig

## Tag-4-Bilanz

| Aspekt | Detail |
|---|---|
| Engineering-Aufwand heute | ~1.5 Std (Lovable-Recherche + Submit) |
| Code-Änderungen heute | 0 (nur Audit-Docs) |
| Strategischer Wert | Submission-Block aufgelöst, Velocity wiederhergestellt |
| Lessons heute | Lesson 14 (Apple Banner stale, IAP-Bereich status-gated) |

**Drei-Ebenen-System in Höchstform**: Lovable-Web-Recherche + User-Empirie + Berater-Strategie = ASC-UI-Mystery in 1.5 Std gelöst.

## Connection zu Build-60-Submission-Plan

Build 64 ist der Submission-Kandidat den `BUILD61_BLOCKER_SUBSCRIPTION_FLOW.md` seit Tag 3 als Action-Item hatte. Mit dieser Submission ist der Pfad von Build-59-Live (Subs broken) zu Build-64-Submission (Subs functional) abgeschlossen.

**Nächster Meilenstein**: Subs "Cleared for Sale" → Soulvay's erste funktionierende Monetization seit App-Store-Launch.
