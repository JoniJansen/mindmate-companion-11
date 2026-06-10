# Build 64 — Submission blockiert durch App Store Connect UI-Issue

## Datum
10. Juni 2026, 21:45 CEST — Tag 3 Schluss

## Status zum Tag-3-Ende

**Build 64 erfolgreich uploaded zu Apple (20:25):**
- Bundle: `com.jonathanjansen.mindmate`
- Version 1.1, Build 64
- Pipeline-Fix (Build 61) + Layout-Stability (Build 62) + Abo-Blocker-Fix (Build 63) + Apple-Review-Fixes (Cherry-Pick Topics.tsx) + Safety.tsx Authority verified
- Status in ASC: "Bereit zur Übermittlung"

**Version 1.1 vollständig in ASC vorbereitet:**
- Version 1.1 angelegt
- Build 64 verknüpft
- "What's New" Text eingetragen (390 Zeichen)
- Promotional Text eingetragen (127 Zeichen)
- Screenshots, Beschreibung, Keywords, Support-URL, Copyright von 1.0 übernommen
- Demo-Account `apple-review@soulvay.de` mit Review-Notes (3.998 Zeichen)

**Subscriptions in ASC vorbereitet:**
- Soulvay Plus Yearly: Lokalisierung gefixt von 49 → 45 Zeichen "Sprachaufnahmen, lange Gespräche, Reflexionen"
- Soulvay Plus Monthly: gleicher Fix
- Status beide: "Warten auf Prüfung"
- Subscription-Group "Soulvay Pluss" Lokalisierung Genehmigt

## Blocker

ASC UI-Bereich "In-App-Käufe oder Abos" erscheint **NICHT** auf Version 1.1 Seite.

Apple's Banner-Anweisung (wörtlich):
> *"Dein erstes Abo muss mit einer neuen App-Version übermittelt werden. Erstelle dein Abo, wähle es dann im Bereich 'In-App-Käufe oder Abos' der App auf der Versionsseite aus, bevor du die Version an die App-Prüfung übermittelst."*

Dieser Bereich existiert in der UI nicht. "Hinzugefügte Inhalte" zeigt nur App-Symbol + Game Center.

## Was versucht wurde

1. **Submission-Dialog beobachtet**: Beim "Zur Prüfung hinzufügen" Klick erschien Übermittlungsentwurf-Dialog der NUR die App enthielt
2. **Reset durchgeführt**: Übermittlungsentwurf erfolgreich entfernt (Hover-Button)
3. **Reload + Re-Check**: IAP-Bereich erscheint auch nach Reset nicht

## Warum nicht trotzdem submitten?

| Pfad | Outcome |
|---|---|
| Submit Version 1.1 ohne Subscriptions | App wird approved → bleibt monetization-broken (Plus nicht kaufbar). Sandbox-Reject-Risiko fürs nächste Mal. |
| Submit + hoffen Apple verknüpft selbst | Apple Guideline 3.1.1 nicht erfüllt → Reject mit Loop |
| Submission-Workflow erst klären | Sicher, dauert 24-48h Apple-Support-Wait |

→ **Klären, dann submitten** ist der einzige Pfad ohne Reject-Risiko.

## Aktionsplan morgen früh (2026-06-11)

1. **Apple Developer Support kontaktieren** via https://developer.apple.com/contact/
   - Topic: App Store Connect → In-App Purchases & Subscriptions
   - Englischer Ticket-Text vorbereitet (siehe Chrome-Claude-Output, vom User lokal gesichert)
2. **Parallel**: Apple Developer Forums prüfen
   - Suchbegriffe: "In-App Purchases" section missing version page, subscription bundle first submission
3. **Parallel**: Lovable nach ASC-Workflow befragen
   - Frage: "Erfahrung mit Apple First-Subscription-Submission wo IAP-Bereich nicht erscheint?"
4. **Bei Klärung**: Subscriptions verknüpfen + Submission
5. **Bei keiner Klärung**: Apple-Support-Antwort abwarten (24-48h)

## Realistisches Live-Date

Verzögerung: 1-3 Tage durch Apple-Support-Wait.

**Erwartete Soulvay Plus Live-Time**: Samstag 14. - Montag 16. Juni 2026.

## Status für morgen früh — alle Voraussetzungen erfüllt

| Item | Status |
|---|---|
| Build 64 bei Apple uploaded | ✅ 2026-06-10 20:25 |
| Build 64 Bundle-Marker verifiziert (journal_prompt, viele Menschen, mic_free_attempt) | ✅ |
| ASC Version 1.1 angelegt | ✅ |
| Build 64 mit Version 1.1 verknüpft | ✅ |
| Texte komplett (What's New, Promotional, Beschreibung, Keywords, Support-URL) | ✅ |
| Screenshots übernommen von Version 1.0 | ✅ |
| Subscriptions Lokalisierung gefixt (49→45 Zeichen) | ✅ |
| Demo-Account + Review-Notes (3998 Zeichen) | ✅ |
| Apple-Support-Ticket-Text vorbereitet | ✅ (User-lokal) |
| Subscription-Verknüpfung in ASC UI | ⏸ BLOCKED |
| Submit for Review | ⏳ Pending Apple-Support |
| Apple-Review-Wait (24-48h nach Submit) | ⏳ |
| Subscriptions "Cleared for Sale" | ⏳ |

## Lehre

Apple-Submission war heute zu **95% erreicht**. Die letzten 5% sind blockiert durch eine ASC-UI-Inkonsistenz die nicht durch Code-Engineering lösbar ist — nur durch Apple-Support oder Workflow-Klarheit.

Das ist KEIN Engineering-Versagen. Das ist Apple-Workflow-Inkonsistenz. **Knowing when to stop is as important as knowing when to ship.**
