# PLUGIN_LINKING.md — RC-Plugin im iOS-Native-Layer

## Package-Setup

| Frage | Antwort | Beweis |
|---|---|---|
| Ist `@revenuecat/purchases-capacitor` in package.json? | ✅ Ja, `^13.0.1` | `package.json` grep |
| CocoaPods oder SPM? | **SPM** (Swift Package Manager) | `ios/App/Podfile` fehlt, `ios/App/CapApp-SPM/Package.swift` existiert |
| Ist Podfile.lock vorhanden? | ❌ Nicht erforderlich (SPM-Pfad) | `ios/App/Podfile.lock` fehlt |
| Ist RC in der SPM-Dependency-Liste? | ✅ Ja | `CapApp-SPM/Package.swift` Zeile 13: `.package(name: "RevenuecatPurchasesCapacitor", path: "../../../node_modules/@revenuecat/purchases-capacitor")` |
| Ist RC im Target verlinkt? | ✅ Ja | dependencies array enthält `.product(name: "RevenuecatPurchasesCapacitor", package: "RevenuecatPurchasesCapacitor")` |
| Bringt RC PurchasesHybridCommon mit? | ✅ Ja, exact 18.1.0 | `node_modules/@revenuecat/purchases-capacitor/Package.swift` Zeile 14 |
| Sind die Swift-Plugin-Quellen vorhanden? | ✅ Ja | `node_modules/@revenuecat/purchases-capacitor/ios/Sources/RevenuecatPurchasesCapacitor/PurchasesPlugin.swift` + 3 Helper |

## Build-Artefakte

- `ios/App/CapApp-SPM/build/Release-iphonesimulator/PackageFrameworks/` ist leer (oder noch nicht erstellt). Letzter Build war 27. Apr. 2026 — älter als der Build-58-Submit. Das deutet darauf hin, dass Build 58 NICHT lokal über SPM gebaut wurde, sondern möglicherweise via Xcode Cloud oder einer anderen Toolchain. Wichtig zu verifizieren beim nächsten Build.

## Bundle-Forensik (JS-Seite)

- `dist/assets/web-YSOwoMTv.js` ist der **WEB-Fallback** der `@revenuecat/purchases-capacitor` Library — Mock-Implementierungen für non-iOS. Auf iOS-Devices wird stattdessen die Capacitor-Native-Bridge angesprochen, nicht dieser Code.
- API-Key `appl_VatNsFmCDlJPOPkBGnzmhHyZrYy` ist sichtbar in:
  - `dist/assets/index-ChubbLzV.js` (Source des useRevenueCat-Hook)
  - `dist/assets/Upgrade-C_3kVv6c.js` (Lazy Upgrade-Chunk)
  - `dist/assets/Privacy-BGJsgR3S.js` (vermutlich nur Text-Mention im Privacy-Markup)
- `dist/assets/ios/App/App/public/assets/` ist 1:1 mit `dist/assets/` synced (kein diff).

## Plugin-Registrierung in Capacitor

Capacitor-Konfiguration via SPM **registriert das Plugin automatisch** über die `RevenuecatPurchasesCapacitor` Library — kein expliziter `registerPlugin()` Call in JS notwendig. Die JS-Seite ruft `Purchases.configure(...)` direkt aus dem npm-Package, das wiederum den Capacitor-Bridge nutzt.

## Capacitor-Config

```ts
// capacitor.config.ts
appId: "com.jonathanjansen.mindmate",   // ✅ matched mit Xcode PRODUCT_BUNDLE_IDENTIFIER
appName: "Soulvay",
webDir: "dist",                          // ✅ matched mit npm run build output
ios: {
  contentInset: "automatic",
  backgroundColor: "#000000",
  scheme: "Soulvay",
  preferredContentMode: "mobile",
  scrollEnabled: true,
}
// plugins {} — KEIN „RevenueCat"-spezifischer Block. Korrekt; RC braucht keinen.
```

## Risikoeinschätzung Plugin-Linking

Niedrig. Es gibt **keine offensichtlichen Plumbing-Probleme** in der Plugin-Verbindung. SPM ist korrekt verdrahtet, der Native-Build sollte das RC-Framework ziehen.

ABER: Die Tatsache dass der letzte SPM-Build von Ende April ist und Build 58 trotzdem ohne offensichtliche Probleme uploaded werden konnte, deutet darauf hin, dass der eigentliche Build-Vorgang an einem anderen Pfad lief (Xcode Cloud, Archive via Xcode UI mit on-the-fly SPM resolution, etc.). Das ist nicht per se ein Problem, aber es bedeutet, dass das `Release-iphonesimulator` build cache nicht den Production-Bundle-Stand reflektiert.
