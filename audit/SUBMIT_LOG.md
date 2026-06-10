# SUBMIT_LOG.md — Build 59 Complete Submit (FINAL)

**Submit-Datum**: 2026-06-01T11:43:04Z UTC (App+Build) + 30. Mai abends (Subs via UI)

## ✅ Komplett — alle Items in Apple Review-Queue

| Item | State | Detail |
|---|---|---|
| **ReviewSubmission** | `WAITING_FOR_REVIEW` | UUID `ccb6834f-6a85-4e88-a44a-34ca87cc4c39`, submittedDate `2026-06-01T11:43:04.857Z` |
| **App Version 1.0** | `WAITING_FOR_REVIEW` | gebunden an Build 59 |
| **Build 59** | `VALID`, `APP_STORE_ELIGIBLE` | UUID `8a0ffb87-049b-4b8a-9209-20fd20b6a69e` |
| **Sub Monthly** (`6759344728`) | `WAITING_FOR_REVIEW` | productId `Soulvay_plus_monthly` |
| **Sub Yearly** (`6759345265`) | `WAITING_FOR_REVIEW` | productId `Soulvay_plus_yearly` |
| **Loc de-DE Monthly** | `WAITING_FOR_REVIEW` | minimal edit: `&` → `+` |
| **Loc de-DE Yearly** | `WAITING_FOR_REVIEW` | minimal edit: `&` → `+` |
| **Review Notes** | gepatched | 3998/4000 chars, mentions Build 59 + Wrapper-Fix |

## Workflow-Notizen

- App+Build via REST API submitted (REST funktionierte sauber)
- Subs via ASC-UI (REST hatte Limitierungen):
  - Localization-Edit (Description-Modifikation) → flippt Localization-State von REJECTED auf editierbar
  - "Zur Prüfung übermitteln"-Button auf Sub-Detail-Seite → flippt Sub-State auf WAITING_FOR_REVIEW
- Old submission `89890ce6` via REST canceled → state COMPLETE

## Erwartete Apple-Review-Zeit

Typisch 24-48 Stunden. Apple reviewt:
- App Version 1.0 + Build 59 (Wrapper-Fix-Logik testen)
- Beide Subscriptions (Metadata + StoreKit-Integration)
- Demo-Login `apple-review@soulvay.de`

## Was als nächstes passiert

1. Apple bearbeitet die Review-Queue
2. Apple-Antwort kommt via E-Mail an `joni.jansen00@gmail.com` + im Resolution Center
3. Falls Approval: App wird im App Store live (manuell oder automatisch je nach Setting)
4. Falls Reject: Resolution-Center-Reply vorbereiten (Draft in `audit/RESOLUTION_CENTER_REPLY_DRAFT.md`, **NICHT** ohne User-GO senden)

## Aufräumen (zukünftiges Build 60)

Siehe `audit/BUILD60_TODO.md`:
- App-eigenes `PrivacyInfo.xcprivacy` anlegen (GELB-Befund A.10)
- Englische Subscription-Localizations hinzufügen (GELB-Befund B.5)
- Beide nicht jetzt fixen — separate Iteration nach Build-59-Outcome
