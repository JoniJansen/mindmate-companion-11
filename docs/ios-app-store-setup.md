# MindMate iOS App Store Setup Guide

Diese Anleitung beschreibt, wie du MindMate für den Apple App Store vorbereitest und mit Xcode baust.

## Voraussetzungen

- macOS mit Xcode 15+ installiert
- Apple Developer Account ($99/Jahr)
- Node.js 18+
- Git

## 1. Projekt von GitHub klonen

```bash
# Repository klonen
git clone https://github.com/[your-username]/mindmate.git
cd mindmate

# Dependencies installieren
npm install
```

## 2. iOS-Plattform hinzufügen

```bash
# iOS-Plattform zu Capacitor hinzufügen
npx cap add ios

# Projekt bauen
npm run build

# Native Dateien synchronisieren
npx cap sync ios
```

## 3. Xcode öffnen

```bash
# Xcode-Projekt öffnen
npx cap open ios
```

## 4. Xcode-Konfiguration

### Bundle Identifier
- Gehe zu **Signing & Capabilities**
- Bundle Identifier: `de.mindmate.app`
- Team: Wähle dein Apple Developer Team

### App Icons
1. Öffne `App/Assets.xcassets/AppIcon.appiconset`
2. Füge die Icons aus `public/store/` hinzu:
   - 1024x1024 für App Store
   - Verschiedene Größen für Device

### Display Name
- Target → General → Display Name: `MindMate`

### Version & Build
- Version: `1.0.0`
- Build: `1`

## 5. In-App Purchases (für Stripe)

Da wir Stripe für Zahlungen verwenden und NICHT Apple In-App Purchases, beachte:

⚠️ **Wichtig**: Apple erlaubt externe Zahlungsanbieter für bestimmte App-Kategorien. Mental Health Apps können unter Umständen Stripe nutzen, aber prüfe die aktuellen Apple Guidelines.

**Alternative**: Wenn Apple Stripe nicht erlaubt, musst du StoreKit für iOS-Käufe implementieren.

## 6. App Store Connect Vorbereitung

### Erforderliche Assets
- Screenshots (6.5" und 5.5" iPhones)
- App-Icon (1024x1024)
- App-Beschreibung
- Datenschutzrichtlinie URL
- Support URL

### Kategorie
- Primär: Health & Fitness
- Sekundär: Lifestyle

### Altersfreigabe
- 4+ (keine anstößigen Inhalte)
- Hinweis: "Kein Ersatz für professionelle Hilfe"

## 7. Build für App Store

```bash
# Finaler Build
npm run build
npx cap sync ios
```

In Xcode:
1. Product → Archive
2. Wähle "Distribute App"
3. Wähle "App Store Connect"
4. Upload

## 8. App Store Review Guidelines

Beachte für Mental Health Apps:
- Klarer Disclaimer: "Kein Ersatz für Therapie"
- Keine medizinischen Versprechen
- Altersgerechte Inhalte
- Datenschutz-konforme Datenverarbeitung

## Zahlungsmethoden (Stripe)

Der aktuelle Checkout unterstützt:
- ✅ Kreditkarte (Visa, Mastercard, Amex)
- ✅ SEPA-Lastschrift
- ✅ PayPal

### 7-Tage kostenlose Testphase
- Nur für Monatsabo
- Jahresabo ohne Trial (bereits rabattiert)

## Checkliste vor dem Upload

- [ ] Bundle ID korrekt: `de.mindmate.app`
- [ ] App Icons in allen Größen
- [ ] Launch Screen konfiguriert
- [ ] Datenschutzerklärung URL eingetragen
- [ ] Support-Email eingetragen
- [ ] Screenshots erstellt
- [ ] App-Beschreibung in DE und EN
- [ ] Altersfreigabe korrekt
- [ ] Stripe Webhook für Produktion konfiguriert
- [ ] Test auf physischem Gerät durchgeführt

## Hilfreiche Links

- [Apple Developer Portal](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Capacitor iOS Docs](https://capacitorjs.com/docs/ios)
- [Stripe iOS Integration](https://stripe.com/docs/payments/checkout)
