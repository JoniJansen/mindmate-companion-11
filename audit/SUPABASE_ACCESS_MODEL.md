# Supabase Access Model — Wichtige Session-Erkenntnis

**Datum**: 2026-07-21
**Kontext**: Beim Versuch den Sub-DB-Fix auszuführen ist aufgefallen, dass der User keinen direkten Supabase-Dashboard-Zugriff auf das Soulvay-Produktions-Projekt hat.

## Fakten

- **Repo-Config**: `supabase/config.toml` → `project_id = "djnbvnufmegiursvqbhp"`
- **Users Supabase-Account** (JoniJansen): sieht nur "JoniJansen's Org" (ID `xsznaswcuyeieuxleopm`) mit einem einzigen leeren Projekt "JoniJansen's Project" (`hlxwxwzfqrwexdexjoev`)
- **`djnbvnufmegiursvqbhp` gehört einem anderen Account** — vermutlich dem Lovable-Service-Account

## Konsequenzen

Alle folgenden Operationen können NICHT direkt vom User im Supabase-Dashboard ausgeführt werden:

- SQL-Migrationen (z.B. Sub-DB-Fix für `subscriptions.user_id` UNIQUE-Index)
- Edge Function Environment Variables setzen (z.B. `PREMIUM_GATE_MODE`)
- Edge Function Logs einsehen
- Server-side Debugging
- Backup-Management
- User-Data-Exports

Der User muss stattdessen einen der folgenden Wege gehen:

### Weg 1: Lovable-Dashboard-Backend-Integration

Falls Lovable im eigenen Dashboard SQL-Ausführung / Env-Var-Management anbietet (üblich bei Lovable-Cloud-Projekten):
- Direkt in Lovable ausführen
- Zu prüfen: existiert bei lovable.dev/projects/... ein Backend-Tab mit den Optionen?

### Weg 2: Supabase-Access-Transfer

- Lovable-Support kontaktieren
- Bitte um Admin-Zugriff auf das produktive Supabase-Projekt (`djnbvnufmegiursvqbhp`)
- Nach Transfer läuft alles wie Standard

### Weg 3: Lovable-Support-Ticket pro Operation

- Für jede Operation ein Ticket
- Nachhaltig unschön, aber im Notfall gangbar

## Was das strategisch ändert

Vor dieser Erkenntnis: "Ich mach schnell den Sub-DB-Fix und aktiviere Premium-Gate — 15 Minuten Arbeit."

Nach dieser Erkenntnis: Sub-DB-Fix erfordert Klärung des Zugriffsmodells zuerst. Realistisches Zeitfenster: 1-3 Tage bis Klärung, dann Ausführung.

## To-do für die Klärung

- [ ] Bei lovable.dev einloggen, Soulvay-Projekt öffnen
- [ ] Prüfen ob Backend-Tab mit SQL/Env-Vars existiert
- [ ] Falls nein: Support-Ticket erstellen, Zugang zum Supabase-Projekt anfordern
- [ ] Nach Klärung: Sub-DB-Fix ausführen
- [ ] Danach: `PREMIUM_GATE_MODE=log` setzen
- [ ] 1-2 Wochen beobachten
- [ ] Dann `PREMIUM_GATE_MODE=enforce`

## Ähnliche Situationen zu erwarten

Bei anderen Backend-Operationen die in Zukunft anstehen (BSI-Compliance-Nachweise, DiGA-Vorbereitung, ZPP-Antrag) wird immer wieder die Frage nach direkter Backend-Kontrolle aufkommen. Es lohnt sich, das jetzt strukturell zu klären statt jedes Mal neu.

## Empfehlung mittelfristig

Sobald Soulvay ökonomisch trägt: **Migration zu eigenverwaltetem Supabase-Account**. Vorteile:
- Volle Kontrolle über Backend
- Direkter Support-Kanal zu Supabase (nicht über Lovable)
- Bessere Compliance-Nachweise für Kassen-Partner
- Skalierungs-Freiheit (Compute-Tier-Upgrades ohne Lovable-Zwischenschritt)

Aufwand: Mittel. Datenbank-Restore vom Backup, Edge Function Redeploy, DNS-Update, Secrets neu setzen. Kein "in einem Nachmittag"-Job.

## Verweise

- `audit/SUBSCRIPTION_DB_FIX_RUNBOOK.md` — die SQL die eigentlich gelaufen wäre
- `audit/BUILD65_PREMIUM_GATE_LOG_ONLY.md` — der Env-Var-Setup-Flow
- `CLAUDE.md` — "Lovable stays connected as host/mirror" — die Doku-Zeile die vorher übersehen wurde
