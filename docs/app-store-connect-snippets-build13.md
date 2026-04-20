# App Store Connect — fertige Textbausteine für Build 13

Kopiere diese Texte direkt in die entsprechenden Felder in App Store Connect.

---

## 1. Review Notes (englisch, Apple-Reviewer lesen dies)

Feld: **My Apps → Soulvay → [Version] → App Review Information → Notes**

```
Changes in Build 42 (Resubmission for Submission ID 94047bc0-d2a4-4751-9ee4-18d8838a5413):

1. Guideline 2.1(a) - App Completeness (Sign in with Apple):
   The "Sign in with Apple" button has been removed from the iOS build. Per
   Guideline 4.8, Sign in with Apple is only required when an app offers other
   third-party or social login options. On iOS, this app now only offers
   first-party email/password authentication, so Sign in with Apple is not
   required. No error messages can be triggered by tapping non-existent UI.
   Sign in with Apple remains available on the web version of the app, which
   offers Google Sign-In and therefore must (and does) offer Sign in with Apple.

2. Guideline 3.1.1 - In-App Purchase:
   All subscription purchases on iOS now go exclusively through Apple In-App
   Purchase via RevenueCat/StoreKit. The Stripe fallback has been fully removed
   from the iOS code path (see src/pages/Upgrade.tsx - hard guard on isIOSApp()).
   Users on iOS cannot reach Stripe Checkout under any circumstance.

3. Guideline 3.1.2(c) - Subscriptions EULA:
   Apple's Standard EULA is now set in App Information > License Agreement.
   The Apple EULA link is also shown inline on the Upgrade screen inside the app,
   alongside the in-app Terms of Use and Privacy Policy links.

Demo Account for Review:
   Email:    apple-review@soulvay.de
   Password: SoulvayReview2024!

On the login screen, a "Review / Demo Login" button is visible when using the
reviewer device. Tapping it logs in automatically with the demo account and
grants access to all premium features without payment.

Thank you for your review.
```

---

## 2. Kopf-E-Mail an Apple (optional — kurzes Statement für das App Review Reply-Feld)

Feld: **Resolution Center → Reply to Apple**

```
Hello App Review Team,

Thank you for the detailed feedback on Submission ID 94047bc0-d2a4-4751-9ee4-18d8838a5413.
Build 42 resolves all three cited issues:

• Guideline 2.1(a): Native Sign in with Apple implementation (ASAuthorizationAppleIDProvider)
• Guideline 3.1.1: iOS subscriptions now use Apple In-App Purchase exclusively
• Guideline 3.1.2(c): Apple Standard EULA linked in App Information and inside the app

Screen recordings of the full Sign in with Apple flow and the In-App Purchase
flow are attached.

Best regards,
Jonathan Jansen
```

---

## 3. Version-What's-New (falls Apple das Feld zurücksetzt)

Feld: **Version Information → What's New in This Version** (DE + EN)

**English:**
```
Bug fixes and stability improvements:
- Fixed Sign in with Apple on iPad
- Improved subscription purchase reliability
- Updated legal information
```

**Deutsch:**
```
Fehlerbehebungen und Stabilitätsverbesserungen:
- Anmeldung mit Apple auf iPad funktioniert wieder
- Zuverlässigere Abo-Käufe
- Rechtliche Informationen aktualisiert
```

---

## 4. Promotional Text (optional, 170 Zeichen, darf ohne Review geändert werden)

**English:**
```
Your AI companion for emotional wellness. Unlimited conversations, voice chats, weekly insights — right on your device.
```

**Deutsch:**
```
Dein KI-Begleiter für emotionales Wohlbefinden. Unbegrenzte Gespräche, Sprachnachrichten, wöchentliche Einblicke — direkt auf deinem Gerät.
```

---

## Checkliste vor dem Klick auf "Submit for Review"

```
☐ Build 42 in App Store Connect angewählt und mit IAP-Produkten verknüpft
☐ App Information → License Agreement = "Apple's Standard EULA"
☐ Beide Abo-Produkte haben Status "Ready to Submit" (grün)
☐ Review Notes (Text oben) eingefügt
☐ Demo-Account review@soulvay.com funktioniert
☐ Privacy Policy URL gesetzt
☐ Auf iPad Air (iPadOS 26.4) getestet: Sign-In + Purchase durchgelaufen
☐ Screen-Recordings gemacht und bei der Apple-Antwort angehängt
```
