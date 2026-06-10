# REJECT27_SUMMARY.md — Konsolidierter Befund Reject #27 (Build 58)

**Datum**: 2026-05-29
**App**: Soulvay (`com.jonathanjansen.mindmate` / ASC App ID `6758252676`)
**Build**: 58 (UUID `dbed1a00-e3f8-40bc-9bb0-8fd66e44ff27`)
**Reject-Datum**: 2026-05-28 unter Guideline 2.1(b)
**Reject-Wortlaut (Apple)**: *„we noticed an error when we tried to complete an In App Purchase"* — vage, kein konkreter Error-Text, kein Screenshot.

---

## 1. Telemetrie-Befund — Szenario **D** (Keine Telemetrie-Daten findbar)

Volle Details: [`RC_TELEMETRY_BUILD58.md`](RC_TELEMETRY_BUILD58.md) und [`REJECT27_CLASSIFICATION.md`](REJECT27_CLASSIFICATION.md).

**Kurzfassung**:
- RC-Projekt `bcbc58fb` (Soulvay) wurde inspiziert.
- Public API Key im iOS-Code (`appl_VatNsFmCDlJPOPkBGnzmhHyZrYy`) stimmt mit RC-Dashboard für MindMate (App Store) überein ✅.
- **In den letzten 90 Tagen ist KEIN einziger Customer-Record** in diesem Projekt entstanden — weder Production, noch Sandbox, weder mit noch ohne Abo.
- Damit sind ALLE in Build 58 instrumentierten Subscriber-Attributes (`rc_configure_success`, `purchase_last_outcome`, `build_number`, …) **nicht erhebbar**, weil kein Subscriber-Datensatz für den Reviewer existiert.

**Implikation**: Wir können nicht beweisen, welcher Punkt in `handleUpgrade` / `purchasePackage` auf dem Reviewer-iPad genau gescheitert ist. Die wahrscheinlichste Erklärung — datenkonsistent, aber nicht bewiesen — ist, dass `Purchases.configure()` auf dem Reviewer-iPad nie zur Ausführung kam oder vor dem setAttributes-Aufruf abgebrochen wurde.

**Nebenbefund**: ASC API Key (für Produktimport von ASC → RC) ist in der RC-MindMate-Config noch nicht hochgeladen (P8 file Required, leer). Das blockiert nicht den Kauf an sich, aber es ist ein Setup-Loch.

---

## 2. Account-Hygiene-Befund — **ALLES AKTIV, kein BLOCKER**

Volle Details: [`ACCOUNT_HYGIENE.md`](ACCOUNT_HYGIENE.md).

| Stelle | Status | BLOCKER? |
|---|---|---|
| Paid Apps Agreement (Vertrag für gebührenpflichtige Apps) | Aktiv 24.04.2026 – 24.01.2027 | Nein |
| Free Apps Agreement | Aktiv 06.04.2026 – 24.01.2027 | Nein |
| Tax Forms (U.S. Form W-8BEN + U.S. Certificate of Foreign Status) | Beide Aktiv seit 24.04.2026 | Nein |
| Banking (Jonathan Jansen 5690, DE, EUR/USD) | Aktiv | Nein |
| Compliance DSA + DAC7 (27 EU-Länder) | Aktiv | Nein |
| Account Holder identity (Jonathan Jansen = User) | Korrekt | Nein |

→ Die in Apples Reject-Mail erwähnte Paid-Apps-Agreement ist **mit hoher Sicherheit nur Boilerplate** und nicht der Reject-Grund.

---

## 3. Phone Call Status — **Draft bereit, wartet auf User-Absendung**

Voller Draft: [`PHONE_CALL_REQUEST_DRAFT.md`](PHONE_CALL_REQUEST_DRAFT.md).

- Apple-Formular wurde geöffnet auf `developer.apple.com/contact/request/app-review/call/?teamId=N8CCLYYYSL&appId=6758252676&platform=ios&guideline=124716`.
- Vorbefüllt: Name (Jonathan Jansen), Time Zone (CET), App (Soulvay iOS), Issue (3.1.2 Subscriptions).
- **NICHT** vom Agenten ausgefüllt oder abgesendet — das macht der User, weil Apple den User selbst zurückruft.
- Empfehlung: Vor Absendung zusätzlich „2.1 - App Completeness" und „3.1.1 - In-App Purchase" als Issue ankreuzen.

---

## 4. Resolution Center Reply — **Draft bereit, wartet auf User-Entscheidung**

Voller Draft: [`RESOLUTION_CENTER_REPLY_DRAFT.md`](RESOLUTION_CENTER_REPLY_DRAFT.md).

- Reply-Text wortwörtlich nach Spec vorbereitet.
- Frägt gezielt nach Error-Text + Screenshot + Failure-Step a)–e).
- **NICHT** gesendet. Strategie-Empfehlung in der Draft-Datei: Phone-Call zuerst, RC-Reply danach (oder parallel, wenn Phone-Call-Slot weit weg).

---

## 5. Empfehlung für die nächste Aktion (datenbasiert, keine Vermutung)

### Was Daten direkt zeigen
- Account-Hygiene ist sauber.
- Code + API Key in RC stimmen überein.
- Aber: kein Reviewer-Session-Footprint in RC, also keine harte Info über den genauen Fehlerpfad.

### Daraus folgende rationale Reihenfolge

| # | Aktion | Wer | Wann |
|---|---|---|---|
| 1 | Phone-Call-Request an Apple absenden (`PHONE_CALL_REQUEST_DRAFT.md`) | **User** | so schnell wie möglich (3-5 Werktage Antwortzeit) |
| 2 | Resolution-Center-Reply absenden (`RESOLUTION_CENTER_REPLY_DRAFT.md`) | **User** | direkt nach (1), parallel ist OK |
| 3 | Apple-Antwort abwarten | beide | Antwortzeit variiert |
| 4 | Wenn Apple konkrete Error-Info liefert → Build 59 mit gezielter Fix-Maßnahme (z.B. Configure-Timeout 30s + Auto-Retry, oder Offerings-Verifikations-Screen vor Purchase) | (Code-Agent nach User-GO) | nach Schritt 3 |
| 5 | Wenn Apple weiterhin vage bleibt → echten Sandbox-Test-Account aufsetzen, App über TestFlight installieren, Demo-Login durchspielen, RC-Dashboard inspizieren um zu verstehen warum der Simulator-Test grün war aber das Distribution-Bundle keine Events sendet | User + Agent | nach Schritt 3 |

### Was NICHT jetzt passiert
- **Kein Build 59**. Es gibt keine Daten-basierte Hypothese, die einen weiteren Code-Fix rechtfertigt. Apples vage Wortlaut + 0 RC-Records = wir wissen nicht, was wir fixen sollen. „Im Zweifel Timeout erhöhen / Retry hinzufügen" wäre Rate-Versuch Nr. 28.
- **Keine Code-Änderungen**.
- **Keine Reply-Versendung** ohne User-GO.
- **Keine neue Spekulation**.

---

## 6. Zusammenfassung in einem Satz

Build-58-Telemetrie konnte nicht ausgelesen werden, weil im RC-Dashboard kein Reviewer-Footprint existiert; Account-Hygiene ist sauber; nächste rationale Schritte sind Phone-Call-Request und Resolution-Center-Detail-Anfrage, beide vom User abzusenden — Build 59 wird erst entworfen, wenn Apple konkrete Fehlerinformationen liefert.
