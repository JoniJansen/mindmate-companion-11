# PHONE_CALL_REQUEST_DRAFT.md

Form-URL (bereits geöffnet, **nicht** ausgefüllt, **nicht** abgesendet):
`https://developer.apple.com/contact/request/app-review/call/?teamId=N8CCLYYYSL&appId=6758252676&platform=ios&guideline=124716`

Form-Beobachtung:
- **Name**: vorausgefüllt „Jonathan Jansen"
- **Time zone**: vorausgewählt „Central European time"
- **App Name**: vorausgewählt „Soulvay (iOS)"
- **Rejection issues** (Multi-Check): nur „3.1.2 - Subscriptions" vor-aktiviert. Du solltest zusätzlich **2.1 - App Completeness** und **3.1.1 - In-App Purchase** ankreuzen — beide treffen für Reject #27 ebenfalls zu.
- **Reason for call** (Textfeld, 2000 Zeichen): leer, hier den unten stehenden Text einfügen.
- Telefonnummer + Intl. Code: musst du selbst eintragen (Apple ruft dich dort an).
- Bottom: **Submit**-Button.

## Anweisung an den User
**Du** musst Telefonnummer eintragen und Submit klicken — Apple ruft DICH an, nicht uns. Ich darf das Formular nicht selbst abschicken.

## Vorgeschlagener „Reason for call"-Text (exakt wie spezifiziert):

```
Subject: Build 58 rejected under 2.1(b) despite root-cause fix and instrumented telemetry

We have received the 27th rejection for our app Soulvay (Bundle ID com.jonathanjansen.mindmate, App ID 6758252676) under Guideline 2.1(b). Build 58 specifically addressed the previously identified root cause (a stale React closure in the purchase handler that caused a misleading fallback toast) — verified locally on iPad Air 11" M3 simulator, where the native StoreKit sheet appears as expected. We also instrumented RevenueCat subscriber attributes in Build 58 to deterministically diagnose any remaining purchase failures.

The Build 58 rejection note states only "we noticed an error when we tried to complete an In App Purchase" without further detail. We respectfully request a phone call to discuss:

1. What specific error message or behavior did the reviewer observe?
2. Did the native StoreKit purchase sheet appear before the error?
3. Did the reviewer use the provided demo account apple-review@soulvay.de or a different sandbox account?
4. Are there any pending account-level requirements (Paid Apps Agreement, tax forms, banking) that we may have missed?

We have RevenueCat telemetry from the reviewer's session that should pinpoint the failure, but we need to correlate it with what the reviewer observed.

Submission ID: 89890ce6-6151-4c83-9c03-607ddf6218a4
Review Date: May 28, 2026
```

Zeichenzahl (ohne den optionalen „Subject:"-Header, der nicht zum Apple-Formfeld gehört, aber unten den Subject-Text mitlässt für Klarheit): ~1450 — passt in die 2000-Zeichen-Grenze.

## Anmerkung zur Account-Hygiene-Frage (Punkt 4 im Text oben)

Wir haben heute (2026-05-29) bereits selbst verifiziert: Paid Apps Agreement, Tax Forms (W-8BEN + Foreign Status), Banking, Compliance — **alles aktiv**, siehe `audit/ACCOUNT_HYGIENE.md`. Punkt 4 im Text steht trotzdem drin, damit Apple uns das ggf. bestätigt oder ein nicht-öffentliches Account-Flag aufdeckt, das wir im ASC-UI nicht sehen.
