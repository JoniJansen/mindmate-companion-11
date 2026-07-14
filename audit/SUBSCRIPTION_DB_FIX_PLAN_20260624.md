# Soulvay — Abo-Datenbank: Analyse & Fix-Plan

*Stand: 2026-06-24. Ergebnis einer Mehr-Agenten-Analyse (4 Ermittler → Entwurf → 3 adversariale Prüfer → Synthese). **Nichts hiervon ist live angewendet** — alles unten sind fertige, geprüfte Vorschläge. Auslöser: Prod-Query bestätigte, dass auf `public.subscriptions.user_id` kein UNIQUE-Index existiert, obwohl der Code mit `onConflict:'user_id'` schreibt.*

## 1. Befund

Auf `subscriptions.user_id` fehlt der UNIQUE-Index. Die einzigen eindeutigen Indizes sind `subscriptions_pkey (id)` und `subscriptions_revenuecat_customer_id_key (revenuecat_customer_id)` (Phantom-Spalte, von keinem Code beschrieben, immer NULL). `idx_subscriptions_user` ist ein **gewöhnlicher** Index auf `user_id`. Vier Code-Pfade upserten aber mit `onConflict:'user_id'` → Postgres-Fehler **42P10**.

## 2. Reale Auswirkung

**Zahlende Nutzer merken nichts** — die Premium-Anzeige hängt am **RevenueCat-SDK**, nicht an der DB (`usePremium.ts:408`, iOS-Short-circuit `usePremium.ts:161-167`, `useRevenueCat.ts:219-220`). Die DB wird für die Anzeige gar nicht gelesen.

**Im Stillen kaputt — die DB wird serverseitig nicht mehr gefüttert:**

| Schreibstelle | Verhalten heute | Folge |
|---|---|---|
| RevenueCat-Webhook (`revenuecat-webhook/index.ts:154`) | Fehler → HTTP 500 | RevenueCat wiederholt endlos |
| Apple-Beleg (`verify-apple-receipt/index.ts:141`) | Fehler → HTTP 400 | schlägt jedes Mal fehl |
| Client-Sync (`useRevenueCat.ts:197`) | nur im DEV geloggt | lautlos verschluckt |
| Stripe-Checkout (`stripe-webhook/index.ts:101`) | Fehler ignoriert → HTTP 200 | Stripe wiederholt nie → Verlust |

Betroffen: Abo-Verwaltungs-Anzeige (Laufzeitende/gekündigt), Web/Stripe-Pfad, jede serverseitige Auswertung. **App-Anzeige gesund, serverseitige Buchführung nicht.**

**Korrektur der Erst-Diagnose (durch Prüfer verifiziert):** Es existiert bereits `user_session_id TEXT NOT NULL UNIQUE`, und **alle** Writer setzen `user_session_id = user_id`. Eine zweite Zeile pro Nutzer wird also schon heute abgelehnt → die gefürchteten Duplikate gibt es vermutlich gar nicht, die destruktive Dedup-Logik ist im Normalfall ein No-Op.

## 3. Empfohlener Fix (nach adversarialer Härtung)

Was die Prüfer am ersten Entwurf zerlegt und was korrigiert wurde:

- **Dedup statusbewusst** statt „neuestes `updated_at` gewinnt" — sonst hätte eine *gekündigte* Zeile eine *aktive* verdrängt (ein Trigger bumpt `updated_at` bei jedem Update).
- **Idempotenz-Stempel NACH dem Schreiben** (nicht davor) — sonst gilt ein Event als erledigt, obwohl das Abo bei einem Crash nie geschrieben wurde.
- **Out-of-Order-Guard (Laufzeitende-Vergleich) entfernt** — er verschluckte legitime Status-Wechsel (Kündigung, Zahlungsproblem, Downgrade ändern das Laufzeitende oft nicht). Replay-Schutz übernimmt allein der Event-ID-Stempel.
- **Cross-Provider-Kollision offengelegt** (offene Entscheidung, siehe §6) — `create-checkout` daher **noch nicht** umstellen.
- **Stripe-Fehlerbehandlung:** echte DB-Fehler → 500 (Stripe retry) statt stillem 200.

### Pre-Check (NUR LESEN — zuerst ausführen, ändert nichts)

```sql
-- 1) Zeilenzahl
SELECT count(*) AS total_rows FROM public.subscriptions;

-- 2) Aktuelle eindeutige Indizes
SELECT i.relname AS index_name, ix.indisunique AS is_unique,
       pg_get_indexdef(ix.indexrelid) AS index_def
FROM pg_index ix
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
WHERE t.relname = 'subscriptions' AND t.relnamespace = 'public'::regnamespace
ORDER BY i.relname;

-- 3) KERNFRAGE: user_id mit mehr als einer Zeile? (Erwartung: 0)
SELECT user_id, count(*) AS dupe_count
FROM public.subscriptions GROUP BY user_id HAVING count(*) > 1
ORDER BY dupe_count DESC;

-- 4) Zeilen, in denen user_session_id <> user_id? (Erwartung: 0)
SELECT count(*) AS mismatch_rows FROM public.subscriptions
WHERE user_session_id IS DISTINCT FROM user_id::text;

-- 5) NULL-user_id-Zeilen? (Erwartung: 0)
SELECT count(*) AS null_user_id_rows FROM public.subscriptions WHERE user_id IS NULL;
```

**Entscheidungsregel:** Abfrage 3 = 0 **und** 4 = 0 → Migration ist rein additiv und ungefährlich. Sonst: stopp, zuerst klären.

### Schritt 0 — Backup

```sql
CREATE TABLE public.subscriptions_backup_20260624 AS SELECT * FROM public.subscriptions;
```

### Migration (eine Transaktion, nach erfolgreichem Pre-Check)

```sql
BEGIN;
LOCK TABLE public.subscriptions IN SHARE ROW EXCLUSIVE MODE;

-- A.1 Sicherheitsnetz-Dedup: statusbewusst, aktive Zeile gewinnt (im Normalfall No-Op)
WITH ranked AS (
  SELECT id, row_number() OVER (
           PARTITION BY user_id
           ORDER BY (status IN ('active','past_due','paused')) DESC,
                    current_period_end DESC NULLS LAST,
                    updated_at DESC NULLS LAST, id DESC) AS rn
  FROM public.subscriptions
)
DELETE FROM public.subscriptions s USING ranked r WHERE s.id = r.id AND r.rn > 1;

-- A.2 Letzter Schutz + UNIQUE-Constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.subscriptions GROUP BY user_id HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Doppelte user_id-Zeilen vorhanden — Dedup zuerst klaeren';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.subscriptions'::regclass AND conname = 'subscriptions_user_id_key') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- Plain-Index jetzt redundant (Prod-Name lt. Pre-Check Abfrage 2 prüfen: idx_subscriptions_user)
DROP INDEX IF EXISTS public.idx_subscriptions_user;

-- B) Idempotenz-Ledger gegen Doppelverarbeitung
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  provider text NOT NULL, event_id text NOT NULL, event_type text,
  processed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, event_id)
);
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at
  ON public.processed_webhook_events (processed_at);

COMMIT;
```

### Code-Änderungen (übernimmt der `supabase-edge`-Agent bei der Umsetzung)

In `revenuecat-webhook` und `stripe-webhook`:
- **Event-ID-Idempotenz:** zu Beginn `INSERT INTO processed_webhook_events ... ON CONFLICT DO NOTHING`; bei Duplikat (23505) früh mit 200 raus. **Eintrag aber erst NACH erfolgreichem Abo-Write** (Crash-Sicherheit) — idealerweise Write + Stempel atomar in einer RPC.
- **`event.id` ins Interface aufnehmen**; fehlt sie, **fail-closed** (500 → Retry) statt riskantem Ersatzschlüssel. Gegen echten RevenueCat-Sandbox-Payload prüfen.
- **Stripe-Upsert-Fehler prüfen** und bei echtem Fehler 500 werfen (statt stillem 200).
- **Stabile E-Mail-Idempotenz-Keys** (`...-${eventId}` statt `crypto.randomUUID()`).
- **Kein** Laufzeitende-basierter Out-of-Order-Guard (verworfen, s. o.).

## 4. Was nur du tun kannst
- Pre-Check + Migration im Supabase-Dashboard ausführen/freigeben.
- Empfohlen: RevenueCat-/Stripe-Webhooks im Migrationsfenster kurz pausieren, danach wieder aktivieren (Retries sind dank Idempotenz dann gefahrlos).
- E2E-Test auf echtem iOS-Gerät: Premium zeigt weiter (SDK-Pfad unverändert), danach genau **eine** frische Zeile pro Nutzer in `subscriptions`.
- **App Store:** keine neue Einreichung nötig — reine Server-/DB-Änderung.

## 5. Verifikation nach Deploy
RevenueCat-Sandbox-Event: Erstzustellung → 200 + Zeile geschrieben; sofortiger Replay → 200 „Duplicate ignored", Zeile unverändert. Webhook-Log zeigt keine 42P10/500 mehr.

## 6. Restrisiken / offene Entscheidungen
1. **Cross-Provider-Kollision (deine Entscheidung):** Mit einer Zeile/Nutzer können Stripe (Web) und RevenueCat (iOS) sich überschreiben, da `stripe_customer_id` mit `rc_…`-Werten überladen wird und Stripe-Updates darüber matchen. Frage: Hat je jemand **beides** genutzt? Falls nein → theoretisch. Falls ja → eigene Provider-Spalte oder Eindeutigkeit pro `(user_id, provider)`. Deshalb `create-checkout` vorerst nicht umstellen.
2. **Migrationsweg-Alternative:** `onConflict:'user_session_id'` (bereits eindeutig, von allen Writern identisch befüllt) würde die Upserts **ohne Migration und ohne Tabellensperre** sofort reparieren. UNIQUE(user_id) ist das sauberere Endziel, erfordert aber die Migration. Beide funktionieren — Entscheidung, welcher Schlüssel kanonisch ist.
3. **Nebenläufigkeit:** Read-then-Upsert ist nicht atomar; bei echter Parallelität echte Last-Writer-Wins-Logik (Vergleich in der `WHERE`-Klausel eines einzelnen `UPDATE`) erwägen.
4. **Phantom-Spalte `revenuecat_customer_id`** + **Stripe-Status-Mapping** (`trialing`/`past_due` → `inactive`): bei nächster Gelegenheit mitnehmen.
5. **Backup nie überspringen** (Schritt 0).
