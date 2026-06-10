# BUILD60_TODO.md — Post-Build-59-Release-Roadmap

Diese Punkte wurden in `PRESUBMIT_FINAL.md` als 🟡 GELB klassifiziert und vor Build 59 bewusst NICHT gefixt. Falls Apple sie diesmal nicht flaggt, sind sie für Build 60 vorgemerkt.

## Aus PRESUBMIT_FINAL Build 59

### 1. App-eigenes PrivacyInfo.xcprivacy (A.10)

**Hintergrund**: Apple verlangt seit Mai 2024 ein App-spezifisches Manifest. Frameworks (Capacitor, Cordova, RevenueCat) haben ihre eigenen — App-Binary selbst hat keins. Bisher in 28 Reviews nie geflaggt.

**Fix-Aufwand**: ~10 Minuten

**Vorgehen**:
1. Datei `ios/App/App/PrivacyInfo.xcprivacy` anlegen mit leerem Manifest (Apple-Standard-Template):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>NSPrivacyTracking</key>
     <false/>
     <key>NSPrivacyTrackingDomains</key>
     <array/>
     <key>NSPrivacyCollectedDataTypes</key>
     <array/>
     <key>NSPrivacyAccessedAPITypes</key>
     <array>
       <dict>
         <key>NSPrivacyAccessedAPIType</key>
         <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
         <key>NSPrivacyAccessedAPITypeReasons</key>
         <array>
           <string>CA92.1</string>
         </array>
       </dict>
     </array>
   </dict>
   </plist>
   ```
2. In Xcode → Add Files to "App" → PrivacyInfo.xcprivacy auswählen, Target App aktivieren
3. Pbxproj wird Reference automatisch hinzufügen
4. Rebuild + Re-Upload

### 2. Englische Subscription Localizations (B.5)

**Hintergrund**: Nur `de-DE` Localization für beide Subs. US-Reviewer können Subscription-Details nicht auf englisch sehen. Bisher in 28 Reviews nie geflaggt.

**Fix-Aufwand**: ~5 Minuten (ASC UI oder REST API)

**Vorgehen** (per ASC API):
```
POST /v1/subscriptionLocalizations
  {
    "data": {
      "type": "subscriptionLocalizations",
      "attributes": {
        "name": "Soulvay Plus",
        "description": "Monthly subscription unlocking unlimited AI-guided conversations with your wellness companion Mira, voice input/output, weekly reflection summaries, and personalized themes.",
        "locale": "en-US"
      },
      "relationships": {
        "subscription": {
          "data": { "type": "subscriptions", "id": "6759344728" }
        }
      }
    }
  }
```
Analog für 6759345265 (yearly) mit anderer Description.

## Andere Roadmap-Items (NICHT aus Build-59-Audit, separate Iteration)

### 3. Preisstrategie evaluieren

**Datum-basierte Entscheidung**: Nach ersten Nutzerdaten in Build 60+. Aktuell 9,99 €/Monat + 79,99 €/Jahr.

### 4. AI-Provider-Audit

Datenschutz, Server-Standorte, Token-Limits — separate Review-Session sobald App live ist.

### 5. App-Performance + Caching

Currently RC offerings empty cache pattern, lazy-load patterns. Audit nach Release sinnvoll.

### 6. Build-Hygiene + CI

Auto-generierte Schemes vs Shared, Build-Number-Auto-Increment, Test-Coverage. Separate Session.

---

**Wichtig**: Diese Roadmap wird NACH Build 59 Release bearbeitet. Heute geht es nur darum, Build 59 zu submitten.
