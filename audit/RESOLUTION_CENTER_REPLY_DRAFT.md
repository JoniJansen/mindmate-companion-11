# RESOLUTION_CENTER_REPLY_DRAFT.md

**Status**: Draft. **NICHT** gesendet. Wartet auf explizites User-GO.

**Wo eintragen**: App Store Connect → App → App Review → Resolution Center → Antwort auf Build-58-Rejection (Submission `89890ce6-6151-4c83-9c03-607ddf6218a4`).

## Empfohlener Reply-Text (exakt wie spezifiziert)

```
Hello,

Thank you for the review of Build 58. We appreciate that the previously identified "in-app purchases are only available on the iOS app" message no longer appears, indicating the root cause we fixed (a stale React closure in the purchase handler) was correctly identified.

Build 58 also includes RevenueCat subscriber attribute telemetry specifically designed to diagnose any remaining purchase failures. With your help, we can pinpoint exactly what went wrong.

Could you please share:

1. The exact text of the error message that appeared
2. A screenshot of the error if available
3. At which step the error appeared:
   a) Before the purchase sheet was displayed
   b) After tapping a subscription option but before the native StoreKit sheet appeared
   c) On the native StoreKit purchase sheet itself
   d) After authentication on the StoreKit sheet, during purchase completion
   e) After purchase appeared to complete

This level of detail will allow us to correlate with our telemetry data and resolve the issue conclusively in the next build. We have also requested a phone call from App Review to discuss this directly.

Thank you for your patience as we work to resolve this.

Submission ID: 89890ce6-6151-4c83-9c03-607ddf6218a4
```

## Strategie-Hinweis

- **Reihenfolge**: Empfohlen, dass User **zuerst** Phone Call beantragt (Task 3), **dann** Resolution-Center-Reply sendet. Begründung: Apple antwortet auf Resolution-Center-Replies oft mit Standardphrasen; ein Phone-Call kann konkreter werden und manche Reviewer-Notizen offenlegen, die im RC-Text fehlen.
- **Alternative**: Wenn der Phone-Call-Slot weit weg ist (3-5 Werktage), beide parallel senden — der Reply schadet nicht.
- **Wichtig**: In der Reply NICHT behaupten, dass alles funktioniert. Wir wissen aus `audit/RC_TELEMETRY_BUILD58.md`, dass im RC-Dashboard keine Reviewer-Session aufgetaucht ist. Das KANN bedeuten, dass der StoreKit-Sheet auf der Reviewer-Hardware gar nicht erschienen ist. Lassen wir uns also nicht zu Versprechen hinreißen.
