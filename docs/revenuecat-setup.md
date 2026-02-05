# RevenueCat Integration für MindMate

## Übersicht

MindMate nutzt RevenueCat für iOS In-App-Purchases. Diese Dokumentation beschreibt die vollständige Setup-Anleitung.

## Phase 1: App Store Connect - Produkte erstellen

### 1.1 Subscription Group erstellen
1. **App Store Connect** → Deine App → **In-App-Käufe** (linkes Menü)
2. Klicke **Verwalten** neben "Abonnements"
3. Klicke **+** bei "Abonnementgruppen" → Name: `MindMate Plus`

### 1.2 Monatsabo erstellen
| Feld | Wert |
|------|------|
| Referenzname | MindMate Plus Monatlich |
| Produkt-ID | `mindmate_plus_monthly` |
| Abodauer | 1 Monat |
| Preis | €9,99 |

Lokalisierung (DE/EN):
- **Name**: MindMate Plus
- **Beschreibung**: Unbegrenzte Gespräche, Sprachfunktion, Wochenrückblicke

### 1.3 Jahresabo erstellen
| Feld | Wert |
|------|------|
| Referenzname | MindMate Plus Jährlich |
| Produkt-ID | `mindmate_plus_yearly` |
| Abodauer | 1 Jahr |
| Preis | €79,00 |

### 1.4 Shared Secret holen
1. App Store Connect → **Benutzer und Zugriff** → **Integrationen**
2. Tab: **App-spezifische geteilte Geheimnisse**
3. Für deine App → **Generieren** → Kopieren

---

## Phase 2: RevenueCat Dashboard

### 2.1 App Store verbinden
1. RevenueCat Dashboard → Dein Projekt → **Apps**
2. iOS App auswählen
3. **App Store Connect App-Specific Shared Secret** einfügen
4. **Bundle ID**: `app.lovable.dc1f364579304a628f999c8b700fe75a`

### 2.2 Produkte importieren
1. **Products** → **+ New**
2. `mindmate_plus_monthly` → Platform: App Store → Save
3. `mindmate_plus_yearly` → Platform: App Store → Save

### 2.3 Entitlement erstellen
1. **Entitlements** → **+ New**
2. Identifier: `premium`
3. Beide Produkte hinzufügen

### 2.4 Offering erstellen
1. **Offerings** → **+ New**
2. Identifier: `default`
3. Packages:
   - `monthly` → Product: `mindmate_plus_monthly`
   - `yearly` → Product: `mindmate_plus_yearly`

### 2.5 Webhook konfigurieren (Optional für Server-zu-Server)
1. **Integrations** → **Webhooks**
2. URL: `https://djnbvnufmegiursvqbhp.supabase.co/functions/v1/revenuecat-webhook`
3. Events: Alle Subscription Events aktivieren

---

## Phase 3: iOS Native Setup (Xcode)

### 3.1 Swift Package hinzufügen
1. Xcode → File → Add Package Dependencies
2. URL: `https://github.com/RevenueCat/purchases-ios-spm.git`

### 3.2 Capacitor Plugin konfigurieren
Das Plugin `@revenuecat/purchases-capacitor` ist bereits installiert.

Nach `npx cap sync ios` wird das Plugin automatisch verlinkt.

---

## Technische Details

### Produkt-IDs (müssen exakt übereinstimmen)
```
mindmate_plus_monthly
mindmate_plus_yearly
```

### Entitlement-ID
```
premium
```

### API Keys
- **Public Key** (iOS): `test_XfLDyAoqYoHpECgHSmWSaVkFwok` (als Secret gespeichert: `REVENUECAT_API_KEY`)

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `src/hooks/useRevenueCat.ts` | RevenueCat Hook für iOS |
| `src/hooks/usePremium.ts` | Premium-Status-Management |
| `src/pages/Upgrade.tsx` | Upgrade-Seite mit IAP |
| `supabase/functions/revenuecat-webhook/index.ts` | Webhook für Server-Sync |

---

## Testing

1. Erstelle einen **Sandbox Tester** in App Store Connect
2. Logge auf dem Test-Gerät mit dem Sandbox-Account ein
3. Kaufprozess testen - es werden keine echten Gebühren erhoben

---

## Checklist vor Submission

- [ ] Produkte in App Store Connect erstellt
- [ ] Produkte in RevenueCat importiert
- [ ] Entitlement `premium` erstellt
- [ ] Offering `default` mit Packages konfiguriert
- [ ] Shared Secret in RevenueCat hinterlegt
- [ ] Sandbox-Testing durchgeführt
- [ ] Review-Account hat Premium-Zugriff
