# StoreKit In-App Purchase Setup für MindMate

Diese Anleitung beschreibt die Einrichtung von Apple In-App Purchases für die iOS App.

## Voraussetzungen

1. **Apple Developer Account** (€99/Jahr)
2. **App Store Connect Zugang**
3. **Xcode 15+** auf einem Mac
4. **Capacitor iOS** eingerichtet

---

## 1. App Store Connect Konfiguration

### 1.1 App erstellen

1. Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
2. Klicke auf "Meine Apps" → "+" → "Neue App"
3. Wähle:
   - **Plattformen**: iOS
   - **Name**: MindMate
   - **Primärsprache**: Deutsch
   - **Bundle-ID**: `de.mindmate.app`
   - **SKU**: `mindmate-ios-001`

### 1.2 In-App Purchases erstellen

Gehe zu deiner App → **Funktionen** → **In-App-Käufe**

#### Monatliches Abo erstellen:

1. Klicke auf "+" → "Abo-Gruppe erstellen"
2. **Referenzname**: MindMate Plus Subscriptions
3. Klicke in der Gruppe auf "+" → "Abo erstellen"
4. Konfiguriere:
   - **Referenzname**: MindMate Plus Monatlich
   - **Produkt-ID**: `de.mindmate.app.plus.monthly`
   - **Abo-Laufzeit**: 1 Monat
   - **Preise**: €9,99 (Preis-Stufe 10)
   - **Kostenlose Testversion**: 7 Tage

#### Jährliches Abo erstellen:

1. In derselben Abo-Gruppe: "+" → "Abo erstellen"
2. Konfiguriere:
   - **Referenzname**: MindMate Plus Jährlich
   - **Produkt-ID**: `de.mindmate.app.plus.yearly`
   - **Abo-Laufzeit**: 1 Jahr
   - **Preise**: €79,00 (Preis-Stufe 79)
   - **Keine kostenlose Testversion** (bereits rabattiert)

### 1.3 Shared Secret generieren

1. Gehe zu **App Store Connect** → **Benutzer und Zugriff** → **Schlüssel** (obere Leiste)
2. Wähle **In-App-Käufe** Tab
3. Klicke auf "App-spezifisches Shared Secret generieren"
4. Kopiere den generierten Schlüssel
5. Speichere ihn als `APPLE_SHARED_SECRET` in deinen Supabase Secrets

---

## 2. Xcode Projekt Konfiguration

### 2.1 Capabilities hinzufügen

1. Öffne das Projekt in Xcode: `npx cap open ios`
2. Wähle das Target "App"
3. Gehe zu **Signing & Capabilities**
4. Klicke auf "+ Capability"
5. Füge hinzu:
   - **In-App Purchase**
   - **StoreKit Configuration** (optional, für Tests)

### 2.2 StoreKit Configuration File (für Tests)

1. In Xcode: **File** → **New** → **File**
2. Wähle **StoreKit Configuration File**
3. Name: `Configuration.storekit`
4. Füge deine Produkte hinzu:

```json
{
  "identifier": "de.mindmate.app.plus.monthly",
  "type": "Consumable",
  "referenceName": "MindMate Plus Monthly",
  "subscriptionPeriod": "P1M",
  "introductoryOffer": {
    "paymentMode": "freeTrial",
    "numberOfPeriods": 1,
    "subscriptionPeriod": "P1W"
  },
  "localizations": [{
    "locale": "de",
    "displayName": "MindMate Plus Monatlich",
    "description": "7 Tage kostenlos, dann €9,99/Monat"
  }]
}
```

---

## 3. Capacitor StoreKit Plugin

### 3.1 Plugin installieren

Da es kein offizielles Capacitor StoreKit 2 Plugin gibt, verwenden wir einen nativen Swift-Wrapper.

Erstelle die Datei `ios/App/App/StoreKitPlugin.swift`:

```swift
import Foundation
import Capacitor
import StoreKit

@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin {
    
    @MainActor
    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self) else {
            call.reject("Product IDs required")
            return
        }
        
        Task {
            do {
                let products = try await Product.products(for: productIds)
                let result = products.map { product -> [String: Any] in
                    return [
                        "productId": product.id,
                        "localizedTitle": product.displayName,
                        "localizedDescription": product.description,
                        "price": product.displayPrice,
                        "priceValue": NSDecimalNumber(decimal: product.price).doubleValue
                    ]
                }
                call.resolve(["products": result])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }
    
    @MainActor
    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Product ID required")
            return
        }
        
        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }
                
                let result = try await product.purchase()
                
                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        await transaction.finish()
                        
                        // Get receipt data
                        if let appStoreReceiptURL = Bundle.main.appStoreReceiptURL,
                           let receiptData = try? Data(contentsOf: appStoreReceiptURL) {
                            let receiptString = receiptData.base64EncodedString()
                            call.resolve([
                                "success": true,
                                "transactionId": String(transaction.id),
                                "productId": transaction.productID,
                                "receiptData": receiptString
                            ])
                        } else {
                            call.resolve([
                                "success": true,
                                "transactionId": String(transaction.id),
                                "productId": transaction.productID
                            ])
                        }
                        
                    case .unverified(_, let error):
                        call.reject("Transaction unverified: \(error.localizedDescription)")
                    }
                    
                case .pending:
                    call.reject("Purchase pending approval")
                    
                case .userCancelled:
                    call.resolve(["success": false, "cancelled": true])
                    
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }
    
    @MainActor
    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                
                var restoredTransactions: [[String: Any]] = []
                
                for await result in Transaction.currentEntitlements {
                    if case .verified(let transaction) = result {
                        restoredTransactions.append([
                            "transactionId": String(transaction.id),
                            "productId": transaction.productID,
                            "purchaseDate": transaction.purchaseDate.timeIntervalSince1970 * 1000
                        ])
                    }
                }
                
                // Get receipt data
                var receiptString: String? = nil
                if let appStoreReceiptURL = Bundle.main.appStoreReceiptURL,
                   let receiptData = try? Data(contentsOf: appStoreReceiptURL) {
                    receiptString = receiptData.base64EncodedString()
                }
                
                call.resolve([
                    "transactions": restoredTransactions,
                    "receiptData": receiptString ?? ""
                ])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }
}
```

### 3.2 Plugin registrieren

Erstelle `ios/App/App/StoreKitPlugin.m`:

```objc
#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(StoreKitPlugin, "StoreKit",
    CAP_PLUGIN_METHOD(getProducts, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchaseProduct, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restorePurchases, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
)
```

---

## 4. Apple Shared Secret konfigurieren

Füge das Secret zu deinem Supabase-Projekt hinzu:

1. Gehe zu Lovable → Dein Projekt → Secrets
2. Füge hinzu: `APPLE_SHARED_SECRET` mit dem Wert aus App Store Connect

---

## 5. Testen

### Sandbox-Umgebung

1. In App Store Connect: **Benutzer und Zugriff** → **Sandbox** → **Tester**
2. Erstelle einen Sandbox-Tester-Account
3. Auf dem Test-Gerät: Melde dich mit dem Sandbox-Account an
4. Käufe in der App verwenden die Sandbox (kein echtes Geld)

### Xcode StoreKit Testing

1. Wähle deine StoreKit Configuration File
2. In Xcode: **Product** → **Scheme** → **Edit Scheme**
3. Unter **Run** → **Options**: Wähle deine `.storekit` Datei
4. Starte die App im Simulator

---

## 6. App Store Review Checkliste

- [ ] Mindestens ein Screenshot mit Abo-Angebot
- [ ] Datenschutzrichtlinie verlinkt
- [ ] Nutzungsbedingungen verlinkt
- [ ] "Käufe wiederherstellen" Button vorhanden
- [ ] Abo-Preise klar dargestellt
- [ ] Kostenlose Testphase klar kommuniziert
- [ ] Kündigungs-Hinweise sichtbar

---

## Wichtige Links

- [App Store Connect](https://appstoreconnect.apple.com)
- [StoreKit 2 Documentation](https://developer.apple.com/documentation/storekit/in-app_purchase)
- [Testing In-App Purchases](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox)
- [Receipt Validation](https://developer.apple.com/documentation/storekit/in-app_purchase/original_api_for_in-app_purchase/validating_receipts_with_the_app_store)
