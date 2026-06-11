# ASC Research — Subscriptions "Warten auf Prüfung" + fehlender IAP-Bereich

## Datum
11. Juni 2026 — Web-Recherche (Apple Developer Forums, Original-Threads gelesen)

## Kernbefund: Offizielle Apple-DTS-Antwort (April 2026)

Quelle: https://developer.apple.com/forums/thread/786454 — identisches Problem
("'In-App Purchases and Subscriptions' section on the version page not showing",
Subs in "Waiting for Review", Banner verlangt Verknüpfung mit Version).

**Apple DTS Engineer, wörtlich:**

> "The In-App Purchases and Subscriptions section only appears when you have
> one or more products with the **Ready to Submit** status."

> "If their status is **Waiting for Review** or In Review, **there is nothing
> to do. You already submitted them for review.**"

**Bedeutung für Soulvay:**
- Der IAP-Bereich auf der Version-1.1-Seite fehlt NICHT wegen eines Bugs,
  sondern weil er status-gated ist: Er erscheint NUR für Produkte im Status
  "Bereit zur Übermittlung".
- Subs im Status "Warten auf Prüfung" sind bereits in Apples Review-Queue.
  Das Banner ("erstes Abo muss mit neuer Version übermittelt werden") ist in
  diesem Zustand irreführend/stale — laut DTS ist nichts weiter zu tun.

## Antworten auf die 6 Fragen

### 1. "Warten auf Prüfung" → "Bereit zur Übermittlung" zurücksetzen?
Es gibt **keinen UI-Button** dafür (kein Withdraw auf Sub-Ebene — deckt sich
mit unserer Beobachtung). Der einzige dokumentierte Hebel: Wenn die Subs Teil
einer noch offenen **ReviewSubmission** sind, kann diese via ASC REST API
gecancelt werden → Items fallen zurück auf "Ready to Submit".

Prüf-Kommandos (mit vorhandenem ASC-API-JWT, wie bei Build-59-Submission):
```bash
# Alle Review-Submissions der App listen
GET /v1/reviewSubmissions?filter[app]=6758252676&include=items

# Falls eine Submission mit den Sub-Items im State WAITING_FOR_REVIEW existiert:
PATCH /v1/reviewSubmissions/{id}  body: {"data":{"id":"...","type":"reviewSubmissions","attributes":{"canceled":true}}}
# → Items (Subs) flippen auf "Bereit zur Übermittlung"
```
Falls die Subs an KEINER offenen ReviewSubmission hängen (Standalone-IAP-Queue
über den Sub-Detail-Button vom 30. Mai): kein API-Reset möglich → Weg 2.

### 2. Versteckter UI-Workflow?
Nein. DTS bestätigt: Bereich ist rein status-gated. Keine Tab/URL-Tricks.

### 3. ASC-API-Lösung?
Nur über ReviewSubmission-Cancel (siehe 1). Es gibt keinen Endpoint, der den
Review-Status eines einzelnen Abo-Produkts direkt zurücksetzt.

### 4. "Lokalisierung Genehmigt" vs. "Sub Warten auf Prüfung"?
Ja, zwei separate Stati. Bestätigt in https://developer.apple.com/forums/thread/730304:
Ein Lokalisierungs-Edit (z.B. Leerzeichen anhängen) flippt nur den
Lokalisierungs-Status — **NICHT** den Status des Abos selbst. Unser
49→45-Zeichen-Fix gestern hat deshalb den Sub-Status nicht bewegt. Erwartet.

### 5. Indirekte Workarounds?
- "Aus Verkauf entfernen": ändert Availability, nicht den Review-Status. Riskant, nein.
- Subscription-Group editieren: kein dokumentierter Status-Effekt.
- Neue Lokalisierung (EN) hinzufügen: flippt nur Localization-Status (siehe 4).
→ Keiner der Workarounds setzt den Sub-Status zurück. Nicht machen.

### 6. Aktuelle Quellen
- https://developer.apple.com/forums/thread/786454 — **DTS-Antwort (autoritativ)**
- https://developer.apple.com/forums/thread/820856 — identischer Fall März 2026;
  Apple "App Store Commerce Engineer" (vor 3 Wochen): bei weiter bestehendem
  Problem **Feedback-Assistant-Ticket** (feedbackassistant.apple.com →
  iOS & iPadOS → App Store → "Incorrect & Unexpected behavior", FB-Nummer notieren)
- https://developer.apple.com/forums/thread/730304 — Localization-Edit-Trick
  flippt nur Localization, nicht Sub-Status

## Empfohlener Pfad für Soulvay (Priorität)

1. **API-Check (15 Min, kein Risiko):** ReviewSubmissions listen. Hängen die
   Subs an einer offenen Submission → canceln → Status "Bereit zur
   Übermittlung" → IAP-Bereich erscheint auf Version-1.1-Seite → verknüpfen →
   alles zusammen submitten. Sauberster Weg.
2. **Falls nicht cancelbar:** Der DTS-Antwort folgen — Version 1.1 JETZT
   submitten. Subs sind bereits in der Queue; Apple reviewt sie im Sandbox
   gegen Build 64 (wo sie kaufbar sind — Abo-Blocker-Fix Build 63). In den
   Review-Notes explizit erwähnen: "Both auto-renewable subscriptions are
   purchasable in this build (Build 64); please review them together with
   this version."
3. **Parallel:** Feedback-Assistant-Ticket (von Apple Commerce Engineer
   empfohlener Kanal) — kostenlos, dokumentiert den UI-Widerspruch.

## Neubewertung von "Weg A" (Submission ohne Verknüpfung)

Unsere bisherige Einstufung "riskant" basierte auf der Annahme, die Subs seien
NICHT in der Review-Queue. Die DTS-Antwort widerlegt das: "Waiting for Review"
= bereits submitted. Das 3.1.1-Reject von damals kam, weil die Subs gegen ein
Binary OHNE funktionierenden Kauf-Flow reviewt wurden. Build 64 hat den
funktionierenden Flow → das 3.1.1-Risiko ist materiell anders als damals.
Weg A ist damit nicht mehr "riskant", sondern der von Apple dokumentierte
Normalfall — sofern der API-Cancel (Pfad 1) nicht verfügbar ist.
