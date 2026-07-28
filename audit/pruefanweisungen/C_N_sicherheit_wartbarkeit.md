# Prüfanweisungen — Gruppen C (Sicherheit & Datenschutz) und N (Wartbarkeit)

### C1 — Mandantentrennung: echter Fremdzugriffs-Nachweis

**Ebene:** 1 (Tor) — der statische Teil läuft bereits, der Nachweis fehlt
**Zeitbedarf:** 4–6 h Aufbau einmalig, danach ~90 s je Lauf

**Durchführung:**

Das Tor (`scripts/gate.mjs`, Prüfung „C1 · Jede Tabelle hat RLS") liest die 32 Dateien in `supabase/migrations/` per Regex und meldet grün, wenn zu jedem `CREATE TABLE` ein `ALTER TABLE … ENABLE ROW LEVEL SECURITY` existiert. Das ist eine Aussage über einen Schalter, nicht über Zugriff. Ob eine der 138 `CREATE POLICY`-Regeln `USING (true)` schreibt, ob eine der 11 `SECURITY DEFINER`-Funktionen die Trennung umgeht, ob der Storage-Bucket `avatars` fremde Ordner freigibt — nichts davon wird gemessen. Die folgenden Schritte sind der fehlende Teil.

1. **Container-Laufzeit herstellen.** `docker info` schlägt auf dieser Maschine fehl, `docker` ist nicht installiert. Ohne Docker Desktop oder Colima startet keine lokale Instanz. Die Supabase-CLI ist mit 2.84.2 vorhanden (`supabase --version`).
2. `supabase start` im Repo-Wurzelverzeichnis. Die CLI wendet alle 32 Migrationen auf eine frische Postgres-Instanz an. `supabase status -o env` liefert `API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DB_URL` — festhalten.
3. **Zwei Konten anlegen**, ohne Umweg über die App:
   ```bash
   curl -s "$API_URL/auth/v1/signup" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
     -d '{"email":"a@pruefung.test","password":"Pruefung-A-2026!"}'
   curl -s "$API_URL/auth/v1/signup" -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
     -d '{"email":"b@pruefung.test","password":"Pruefung-B-2026!"}'
   ```
   Die `access_token` beider Antworten sichern, die UUIDs aus dem `sub`-Claim ebenfalls.
4. **Konto A befüllen** — in jeder Tabelle mit `user_id`-Spalte mindestens eine Zeile, inhaltlich als Fremddaten erkennbar (z. B. Journaltext `"KONTO-A-GEHEIM"`). Die Tabellenliste maschinell erzeugen, damit keine neue Tabelle durchrutscht:
   ```bash
   psql "$DB_URL" -Atc "select table_name from information_schema.columns
     where table_schema='public' and column_name='user_id' order by 1"
   ```
   Heute sind das u. a. `journal_entries`, `mood_checkins`, `conversations`, `session_insights`, `user_memories`, `emotional_patterns`, `companion_profiles`, `voice_sessions`, `weekly_recaps`, `subscriptions`, `user_roles`, `user_activity_log`, `analytics_events`, `daily_chat_usage`, `profiles`.
5. **Der eigentliche Angriff — Variante schnell (SQL, kein HTTP).** Für jede Tabelle:
   ```sql
   BEGIN;
   SET LOCAL ROLE authenticated;
   SET LOCAL "request.jwt.claims" = '{"sub":"<UUID-B>","role":"authenticated"}';
   SELECT count(*) FROM public.journal_entries;              -- muss 0 sein
   UPDATE public.journal_entries SET content='übernommen';   -- muss 0 Zeilen treffen
   DELETE FROM public.journal_entries;                       -- muss 0 Zeilen treffen
   ROLLBACK;
   ```
   Jede Zahl ungleich 0 ist ein Fremdzugriff. `SELECT`, `UPDATE`, `DELETE` **und** `INSERT` mit fremder `user_id` einzeln prüfen — eine Policy kann Lesen korrekt und Schreiben falsch regeln.
6. **Variante über die echte Kette (PostgREST)**, weil Schritt 5 den API-Layer überspringt: dieselben Zugriffe mit dem Bearer-Token von Konto B gegen `$API_URL/rest/v1/<tabelle>?select=*`. Erwartung: leeres Array oder 401/403, nie eine Zeile von A.
7. **`SECURITY DEFINER`-Funktionen einzeln.** Diese elf Funktionen laufen mit den Rechten ihres Erstellers und hebeln RLS per Konstruktion aus:
   ```bash
   grep -l "SECURITY DEFINER" supabase/migrations/*.sql
   ```
   Jede davon als Konto B mit der `user_id` von Konto A als Argument aufrufen. Wo eine Funktion `auth.uid()` nicht selbst prüft, sondern eine übergebene ID vertraut, ist das ein Fremdzugriff — unabhängig von jeder Policy.
8. **Storage.** Als Konto B lesend und schreibend auf `avatars/<UUID-A>/` zugreifen. Der Bucket wird von `supabase/functions/delete-account/index.ts` (Zeile 88–95) nach Nutzerordnern adressiert; die Trennung muss auch für Fremdzugriff gelten.
9. **Als Test festschreiben.** Schritte 3–8 nach `src/test/rls-cross-tenant.test.ts` überführen, Tabellenliste zur Laufzeit aus `information_schema` ziehen (nicht hart eintippen — sonst prüft der Test nur den Stand von heute). In `scripts/gate.mjs` neben der bestehenden C1-Prüfung als zweite C1-Prüfung eintragen. Ist keine lokale Instanz erreichbar, muss die Prüfung **rot** melden, nicht übersprungen werden — sonst entsteht genau die Buchführung, die das Gerüst am 28.07. korrigiert hat.

**Belegt durch:** Ein Protokoll je Tabelle, Operation und Funktion mit der Gegenzahl (0 Zeilen / HTTP-Status), erzeugt von `src/test/rls-cross-tenant.test.ts`, plus der Testlauf im Tor-Protokoll.

**Bewertung:**

- **100** — Der Cross-Tenant-Test läuft in `scripts/gate.mjs`, deckt alle Tabellen mit `user_id`, alle vier Operationen, alle `SECURITY DEFINER`-Funktionen und den Storage-Bucket ab, zieht die Tabellenliste zur Laufzeit und bricht den Build bei einer einzigen fremden Zeile. Eine absichtlich gelockerte Policy (`USING (true)`) macht ihn nachweislich rot.
- **70** — Der Test existiert und läuft grün, aber nur über den SQL-Weg (Schritt 5) oder nur für die Kerntabellen; Storage oder die `SECURITY DEFINER`-Funktionen sind ungeprüft, die Lücke ist dokumentiert. Ebenfalls 70, solange der Test nach der Implementierung entstand (Deckelregel).
- **0** — **Ein Fremdzugriff.** Konto B liest, ändert, löscht oder schreibt an einer einzigen Stelle eine Ressource von Konto A. Ebenfalls 0, solange nur die statische RLS-Prüfung existiert: Sie misst nicht, was C1 fordert.

---

### C2 — Authentifizierung, Sitzungen, Rechteausweitung

**Ebene:** 1 (Tor) — das Gerüst fordert „jeder PR"; im Tor steht dazu heute nichts
**Zeitbedarf:** 3–4 h Aufbau, danach ~60 s je Lauf

**Durchführung:**

C2 galt bis zum 28.07. als automatisiert, gemessen wurde tatsächlich `tsc --noEmit` (jetzt korrekt als N3 verbucht). Der Punkt ist **ungeprüft**. Der Ausgangsbefund ist unbequem: In `supabase/config.toml` steht für **alle 23** Edge-Functions `verify_jwt = false`. Die Plattform prüft also bei keiner einzigen Funktion das Token — jede Funktion muss das selbst tun.

1. **Bestandsaufnahme, welche Funktion überhaupt prüft.**
   ```bash
   for f in supabase/functions/*/index.ts; do
     grep -q "requireUser\|requireAIConsent" "$f" || echo "OHNE: $f"
   done
   ```
   Heutiges Ergebnis: `admin`, `analytics-dashboard`, `auth-email-hook`, `process-email-queue`, `revenuecat-webhook`, `send-transactional-email`, `setup-review-account`, `stripe-webhook`, `text-to-speech`, `track-event`. Für jede dieser zehn muss begründet und im Code kommentiert sein, warum: Webhook mit Signaturprüfung (Stripe, RevenueCat), interner Cron, oder — der Fehlerfall — schlicht ungeschützt.
2. **Fünf Sonden je Funktion**, per `curl` gegen die lokale Instanz aus C1 (Schritt 2) oder gegen `https://djnbvnufmegiursvqbhp.supabase.co/functions/v1/<name>`:
   - kein `Authorization`-Header → 401 erwartet
   - `Authorization: Bearer ungültig` → 401
   - abgelaufenes Token (aus einer alten Sitzung, oder `exp` in der Vergangenheit selbst signiert) → 401
   - gültiges Token von Konto B, im Rumpf aber `user_id` von Konto A → die Funktion muss die ID aus dem Token nehmen, nie aus dem Rumpf. `delete-account/index.ts` macht das vorbildlich (Zeile 17: „get user_id from token (never from body)") — genau dieses Verhalten ist bei jeder Funktion zu belegen.
   - `anon`-Key als Bearer-Token → 401
3. **Rechteausweitung.** `supabase/functions/admin/index.ts` prüft die Rolle über `user_roles` (Zeile 46–51). Als Konto B (ohne Adminrolle) jeden Zweig der Funktion aufrufen. Zusätzlich: Kann ein Nutzer sich selbst eine Zeile in `user_roles` mit `role='admin'` schreiben? Das ist der klassische Weg und gehört als eigener Fall in den Test.
4. **`setup-review-account`** ohne Token aufrufen. Die Funktion legt Konten mit festen Zugangsdaten aus Umgebungsvariablen an; sie darf von außen nicht auslösbar sein.
5. **`text-to-speech`** ohne Token aufrufen. Ohne Authentifizierung ist das ein fremdfinanzierter ElevenLabs-Endpunkt.
6. **Sitzungsablauf im Client.** Token in `localStorage` künstlich verfallen lassen, App neu laden: erwartet wird eine saubere Neuanmeldung, kein weißer Bildschirm, kein Zugriff auf zwischengespeicherte Fremdinhalte.
7. **Als Test festschreiben** in `src/test/edge-function-auth.test.ts`, Funktionsliste aus `readdirSync("supabase/functions")` erzeugt, damit jede neue Funktion den Test automatisch mitbringt. In `scripts/gate.mjs` als C2-Prüfung eintragen und die Ebene-1-Liste in `audit/TEST_FRAMEWORK.md` ergänzen — sonst schlägt `scripts/check-framework.py` (K7) zu Recht fehl.

**Belegt durch:** Eine Matrix Funktion × Sonde mit dem beobachteten HTTP-Status, erzeugt von `src/test/edge-function-auth.test.ts`; dazu eine Liste der zehn Funktionen ohne `requireUser` mit je einer Begründung im Quelltext.

**Bewertung:**

- **100** — Der Test läuft im Tor, deckt alle Funktionen aus `supabase/functions/` ab (Liste zur Laufzeit erzeugt), prüft alle fünf Sonden, und jede Funktion ohne `requireUser` trägt eine geprüfte Begründung. Eine testweise entfernte Auth-Prüfung macht den Build rot.
- **70** — Alle Funktionen sind einmal von Hand durchsondiert und der Befund ist dokumentiert, aber nichts verhindert, dass die nächste neue Funktion ungeschützt hinzukommt.
- **0** — **Umgehung möglich.** Ein Endpunkt liefert ohne oder mit fremdem Token Nutzerdaten aus, führt eine Aktion für einen anderen Nutzer aus, oder ein Nutzer kann sich selbst eine Rolle zuweisen. Ebenfalls 0, solange der Punkt ungeprüft ist — heute der Fall.

---

### C3 — Secrets: was der Scanner im Tor nicht sieht

**Ebene:** 1 (Tor) — der Scanner läuft, sein Sichtfeld ist zu klein
**Zeitbedarf:** 30 min Einrichtung, danach ~40 s je Lauf; 1 h für den Historienlauf einmalig

**Durchführung:**

Die C3-Prüfung in `scripts/gate.mjs` (Zeile 169–183) sucht **vier** Muster in **`src/**/*.ts(x)` plus `android/app/build.gradle`**. Nicht durchsucht werden: die 23 Deno-Functions unter `supabase/functions/`, `ios/`, `android/` jenseits der einen Gradle-Datei, `scripts/`, `.github/workflows/`, die getrackte `.env` — und die gesamte Git-Historie. Das Gerüst nennt in Zeile 325 ausdrücklich `gitleaks` in der CI als „einmalig automatisieren, danach kostenlos"; in `.github/workflows/ci.yml` steht es nicht. Der folgende Teil ist der ungedeckte.

1. **Scanner beschaffen** (keiner ist installiert):
   ```bash
   brew install gitleaks
   ```
2. **Arbeitsstand vollständig** — nicht nur `src`:
   ```bash
   gitleaks detect --no-git --source . --redact --report-path /tmp/gitleaks-worktree.json
   ```
   Node-Module und Build-Ausgaben über `.gitleaksignore` ausschließen, **nicht** `supabase/functions/`, `ios/`, `android/`.
3. **Historie** — der Teil, den kein Regex über den Arbeitsstand je findet:
   ```bash
   gitleaks detect --redact --report-path /tmp/gitleaks-history.json
   ```
   Läuft über alle Commits. Ein einmal committeter und später gelöschter Schlüssel ist weiterhin abrufbar und gilt als Fund.
4. **`.env` bewerten.** Die Datei ist getrackt (`git ls-files | grep .env`), `.gitignore` hält das ausdrücklich fest („already-committed .env stays as-is"). Inhalt sind vier `VITE_`-Variablen (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SENTRY_DSN`) — alle landen ohnehin im ausgelieferten Bundle und sind damit keine Geheimnisse. Das ist **zu belegen, nicht zu vermuten**: Jede Zeile einzeln einordnen als „öffentlich (Bundle)" oder „geheim". Eine einzige nicht-`VITE_`-Variable in dieser Datei wäre ein Fund.
5. **Serverseitige Geheimnisse gegenzeichnen.** Zugang zur Supabase-Konsole nötig (Projekt `djnbvnufmegiursvqbhp`, Lovable-Cloud-verwaltet):
   ```bash
   supabase secrets list --project-ref djnbvnufmegiursvqbhp
   ```
   Abgleich, dass `SUPABASE_SERVICE_ROLE_KEY`, `ELEVENLABS_API_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, die Review-Konto-Passwörter aus `setup-review-account/index.ts` und die RevenueCat-Schlüssel **nur** dort liegen und in keiner Datei des Repos vorkommen.
6. **Keystore.** `audit/KEYSTORE_SETUP.md` beschreibt die Android-Signatur. Prüfen, dass weder `.jks`/`.keystore` noch `keystore.properties` getrackt sind (`git ls-files | grep -iE '\.jks|\.keystore|keystore.properties'`) — der Gate-Regex fängt nur die eine Schreibweise `storePassword "…"` in `build.gradle`.
7. **In die CI heben.** Job `secret-scan` in `.github/workflows/ci.yml`, `gitleaks/gitleaks-action@v2`, blockierend (kein `continue-on-error` — der Lint-Job daneben ist der Gegenbeweis, wozu das führt). Alternativ die zwei Aufrufe aus Schritt 2 und 3 in `scripts/gate.mjs` neben die bestehende C3-Prüfung setzen.

**Belegt durch:** `gitleaks`-Berichte über Arbeitsstand **und** Historie mit null Funden, ein CI-Lauf mit blockierendem `secret-scan`-Job, und eine zeilenweise Einordnung der getrackten `.env`.

**Bewertung:**

- **100** — `gitleaks` läuft blockierend in der CI über den vollen Arbeitsstand, die Historie ist einmal sauber durchgelaufen und dokumentiert, ein testweise eingefügter Dummy-`sk_live_…` bricht den Build nachweislich.
- **70** — Der Scanner ist einmal von Hand über alles gelaufen und sauber, in der CI läuft aber weiterhin nur die vierfache Regex-Prüfung des Tors über `src/`.
- **0** — **Ein Fund.** Ein serverseitiges Geheimnis (Service-Role-Key, Anbieter-API-Schlüssel, Keystore-Passwort, Review-Konto-Passwort) steht im Klartext im Arbeitsstand, in der Historie oder in einem Build-Artefakt.

---

### C4 — Datenabfluss: welcher Inhalt erreicht welchen Dritten

**Ebene:** 3 (Quartals-Audit, zusammengelegt mit C5 und J1 zum Datenschutz-Durchlauf)
**Zeitbedarf:** 3–4 h

**Durchführung:**

1. **Register lesen.** `docs/gdpr-processor-register.md` führt sieben Empfänger: Google (Gemini), Supabase, ElevenLabs, Stripe, Apple, RevenueCat, Resend. Stand „March 2026", nächste Prüfung „March 2027". Die Verzeichnisse unter `compliance/gdpr-documents/`, `compliance/processor-agreements/` und `compliance/legal-pages/` enthalten nur `.gitkeep.md` — die unterzeichneten AV-Verträge liegen also nicht im Repo. Wo sie liegen, ist festzuhalten (gehört zu J1).
2. **Gegenrichtung — vom Code zum Empfänger, nicht vom Register zum Code.** Nur so fällt ein *undokumentierter* Empfänger auf:
   ```bash
   grep -rhoE 'https://[a-zA-Z0-9.-]+' supabase/functions --include="*.ts" | sort -u
   grep -rhoE 'https://[a-zA-Z0-9.-]+' src --include="*.ts" --include="*.tsx" | sort -u
   ```
   Jede Domäne, die kein `esm.sh`/`deno.land` (Modulbezug) ist, muss im Register stehen. Umgekehrt jeden Registereintrag mit einer Codestelle belegen.
3. **Je Empfänger den tatsächlichen Nutzlastinhalt festhalten** — nicht die Absicht, sondern das gesendete Objekt. Für die drei Funktionen, die Art.-9-Inhalte weitergeben, den Rumpf des ausgehenden `fetch` zeilengenau zitieren: `supabase/functions/chat/index.ts` (Gesprächsverlauf → Lovable AI Gateway/Gemini), `supabase/functions/journal-reflect/index.ts` (Tagebuchtext), `supabase/functions/text-to-speech/index.ts` (Antworttext → ElevenLabs). Dazu `session-insight`, `extract-memories`, `detect-patterns`, `generate-summary`, `weekly-recap`.
4. **Krisendaten gesondert.** B5 fordert, dass Krisentext das Gerät nicht verlässt bzw. nicht in Logs Dritter landet. Hier die Gegenprobe von der Empfängerseite: Prüfen, ob eine Krisennachricht in einer Sentry-Nutzlast, in `analytics_events` (`event_payload jsonb`, Tabelle aus `20260317142723_…sql`) oder in `console.error` einer Edge-Function auftauchen kann. `supabase/functions/track-event/index.ts` schreibt beliebige `event_payload`-Objekte mit Service-Role; welche Felder der Client dort füllt, ist am Aufrufer zu belegen.
5. **Sentry.** `src/lib/sentry.ts` setzt `sendDefaultPii: false` (Zeile 128) und filtert über `scrubEvent` (Zeile 82). Die Filterliste gegen die tatsächlich auftretenden Ereignisse halten: einen Fehler im Chat auslösen, das ausgehende Ereignis im Netzwerk-Reiter mitlesen und Feld für Feld prüfen. „Best-effort PII scrubbing" (Kommentar Zeile 78) ist eine Absicht, kein Nachweis.
6. **Drittlandtransfer.** Alle sieben Empfänger sitzen in den USA. Für jeden die im Register genannte Garantie (DPF/SCC) gegen den aktuellen Stand prüfen und das Prüfdatum eintragen.
7. **Gegen die Nutzeraussage halten.** `src/pages/Privacy.tsx` (493 Zeilen) und die Datensicherheits-Formulare in App Store Connect und Play Console müssen dieselbe Empfängerliste nennen (Übergang zu J4).

**Belegt durch:** Eine aktualisierte Tabelle in `docs/gdpr-processor-register.md` mit Spalte „Codestelle" je Empfänger, plus mitgeschnittene Netzwerk-Nutzlasten für Gemini, ElevenLabs und Sentry.

**Bewertung:**

- **100** — Register und Code sind maschinell abgeglichen: eine Skriptprüfung sammelt alle ausgehenden Zieldomänen aus `src/` und `supabase/functions/` und bricht den Build, wenn eine Domäne auftaucht, die nicht in einer Positivliste im Register steht.
- **70** — Register vollständig und je Empfänger mit einer Codestelle belegt, Abgleich aber von Hand und damit ab dem nächsten `fetch` wieder offen.
- **0** — **Ein undokumentierter Empfänger.** Eine Zieldomäne im Code ohne Registereintrag, oder ein Registereintrag, dessen tatsächlich gesendeter Inhalt weiter reicht als beschrieben.

---

### C5 — Betroffenenrechte: Auskunft, Export, Berichtigung, Löschung

**Ebene:** 3 (Quartals-Audit, Datenschutz-Durchlauf)
**Zeitbedarf:** 3 h

**Durchführung:**

1. **Wegwerf-Konto anlegen** und über die Oberfläche mit Daten in **jeder** Klasse füllen: Onboarding, Companion anlegen, mindestens 10 Chat-Nachrichten (davon eine mit erkennbarer Krisenformulierung), 3 Tagebucheinträge, 5 Stimmungseinträge, eine Sprachsitzung, eine Übung, Avatar hochladen, einen Wochenrückblick erzeugen lassen. Danach in der Datenbank die tatsächlich befüllten Tabellen festhalten:
   ```bash
   psql "$DB_URL" -Atc "select table_name from information_schema.columns
     where table_schema='public' and column_name='user_id'"
   ```
2. **Export durchführen** über Einstellungen → Konto → Daten exportieren, in beiden Formaten (`json` und `csv`; `src/components/settings/AccountSettings.tsx` bietet beides an).
3. **Export gegen die Datenklassen halten.** Der Zähler `exportStats` in derselben Datei (Zeile 92) führt genau drei Klassen: `journal`, `mood`, `recaps`. Nicht enthalten sind damit Chat-Nachrichten, `user_memories`, `emotional_patterns`, `session_insights`, `companion_profiles`, `voice_sessions`, `user_activity_log`, `analytics_events` und das Profil selbst. Art. 15/20 DSGVO verlangt **alle** personenbezogenen Daten. Diese Lücke ist zu bestätigen oder zu widerlegen, indem der exportierten Datei Zeile für Zeile die Tabellen aus Schritt 1 gegenübergestellt werden.
4. **Berichtigung** prüfen: Profilfelder, Companion-Name, ein Tagebucheintrag — jeweils ändern und die Änderung nach Neuanmeldung gegenprüfen. Was nicht änderbar ist, ist zu benennen (KI-Erinnerungen in `user_memories` sind Ableitungen aus Nutzertext und fallen ebenfalls unter Art. 16).
5. **Löschung auslösen** (Einstellungen → Konto → Löschen, Bestätigung durch Eingabe von `DELETE`).
6. **Restlosigkeit prüfen — der entscheidende Schritt.** `supabase/functions/delete-account/index.ts` löscht namentlich 14 Tabellen (Zeile 55–70) plus `chat_messages`, Avatare, `profiles` und den Auth-Nutzer. Nach der Löschung mit Service-Role-Rechten gegenzählen:
   ```sql
   -- je Tabelle aus Schritt 1
   SELECT count(*) FROM public.<tabelle> WHERE user_id = '<UUID>';
   -- und die drei E-Mail-Tabellen, die nicht über user_id adressiert sind:
   SELECT count(*) FROM public.email_send_log        WHERE recipient_email = '<E-Mail>';
   SELECT count(*) FROM public.suppressed_emails     WHERE email = '<E-Mail>';
   SELECT count(*) FROM public.email_unsubscribe_tokens WHERE email = '<E-Mail>';
   ```
   Die letzten drei Tabellen stehen **nicht** in der Löschliste der Funktion und sind über die E-Mail-Adresse verschlüsselt, nicht über `user_id`. Ob dort nach der Kontolöschung noch Zeilen stehen, ist die Kernfrage dieses Punktes — und mit `email_send_log.recipient_email` eine personenbezogene Restmenge.
7. **Auskunft (Art. 15) als Prozess**, nicht als Knopf: Gibt es eine Adresse, an die sich ein Nutzer wenden kann, und eine dokumentierte Frist? `src/pages/Privacy.tsx` und `src/pages/FAQ.tsx` gegenprüfen.
8. **Anschlussprüfung C14** (Sicherungen) mit demselben Konto durchführen — sonst braucht es zwei Testkonten.

**Belegt durch:** Ein Protokoll mit Zeitstempel: exportierte Datei, Gegenüberstellung Datenklassen ↔ Exportinhalt, und die SQL-Zählungen nach der Löschung mit dem Ergebnis je Tabelle.

**Bewertung:**

- **100** — Export deckt alle Datenklassen ab, Löschung hinterlässt in **keiner** Tabelle eine Zeile, und ein Test (etwa in `src/test/` gegen die lokale Instanz) vergleicht die Löschliste in `delete-account/index.ts` automatisch mit den Tabellen aus `information_schema` und bricht bei jeder neuen, nicht abgedeckten Tabelle.
- **70** — Löschung ist restlos, der Export deckt aber nur einen Teil der Datenklassen ab; die Lücke ist in `docs/gdpr-data-retention-policy.md` benannt und mit Frist versehen.
- **0** — **Daten bleiben zurück.** Nach der Löschung steht in irgendeiner Tabelle, im Storage oder bei einem Auftragsverarbeiter noch eine Zeile mit Bezug zum Konto. Nach heutigem Codestand sind `email_send_log`, `suppressed_emails` und `email_unsubscribe_tokens` die Kandidaten.

---

### C6 — Einwilligungen: einholbar, widerrufbar, wirksam

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 30 min auf dem Gerät, 20 min für die maschinelle Hälfte

**Durchführung:**

Drei Einwilligungen sind zu prüfen, jede mit eigenem Mechanismus:

| Einwilligung | Speicherort | Durchsetzung |
|---|---|---|
| KI-Datenverarbeitung | `profiles.ai_consent_given` (Migration `20260515120000_ai_consent.sql`) + `localStorage` als Cache | `requireAIConsent` in `supabase/functions/_shared/auth.ts` |
| Crash-Reports (nativ) | `localStorage["soulvay-crash-consent-native"]` | `beforeSend` in `src/lib/sentry.ts` |
| Cookies / Crash-Reports (Web) | `localStorage["cookie_consent"]` | `src/components/gdpr/CookieConsent.tsx` |

1. **Frischer Zustand.** App deinstallieren bzw. `localStorage` leeren. Beim ersten Start dürfen weder ein Gemini-Aufruf noch ein Sentry-Ereignis das Gerät verlassen, bevor die jeweilige Einwilligung erteilt ist. Mit dem Netzwerk-Mitschnitt belegen, nicht mit dem Anblick des Dialogs.
2. **KI-Einwilligung serverseitig gegenprüfen.** Das ist der Punkt, an dem Apple im Mai 2026 abgelehnt hat (Kommentar in `_shared/auth.ts`: parallel abgefeuerte Anfragen verließen das Gerät vor dem Dialog). Gegenprobe per `curl`: mit gültigem Token, aber `ai_consent_given = false` in der Datenbank die Funktion `chat` aufrufen. Erwartet: HTTP 403 mit `{"error":"AI_CONSENT_REQUIRED"}`. Denselben Aufruf für alle Funktionen wiederholen, die Nutzertext an Gemini geben: `chat`, `journal-reflect`, `session-insight`, `extract-memories`, `detect-patterns`, `generate-summary`, `weekly-recap`, `generate-companion`. Eine einzige Funktion, die `requireUser` statt `requireAIConsent` verwendet, ist die Lücke.
3. **Widerruf — der eigentliche Prüfgegenstand.** Für jede der drei Einwilligungen: erteilen, nutzen, widerrufen, **erneut nutzen**. Nach dem Widerruf darf kein weiteres Ereignis an den betroffenen Empfänger gehen. Bei Sentry ist zusätzlich zu prüfen, dass der Listener auf `cookie_consent_updated` (`src/lib/sentry.ts`, Zeile 147) tatsächlich `flush + close` auslöst — also auch die bereits gepufferten Ereignisse nicht mehr abgehen. Beleg ist der Netzwerk-Mitschnitt, nicht der Zustand des Schalters.
4. **Widerruf über Neustart hinweg.** App beenden, neu starten, erneut nutzen. Ein Widerruf, der nur bis zum nächsten Kaltstart hält, ist unwirksam.
5. **Widerruf der KI-Einwilligung** gegen den Server prüfen: Setzt der Widerruf `profiles.ai_consent_given` zurück, oder nur den `localStorage`-Cache? Nur der Serverwert ist maßgeblich (so steht es im Migrationskommentar).
6. **Maschinelle Hälfte.** Ein Test in `src/test/`, der über `supabase/functions/*/index.ts` läuft und für jede Funktion mit einem Gemini-Aufruf (`grep -l "ai.gateway\|generateContent\|LOVABLE_API"`) die Verwendung von `requireAIConsent` erzwingt. Läuft ohne Netz und ohne Gerät, gehört ins Tor.

**Belegt durch:** Netzwerk-Mitschnitt je Einwilligung in vier Zuständen (nie erteilt / erteilt / widerrufen / widerrufen + Neustart), plus die `curl`-Antworten der acht KI-Funktionen ohne Einwilligung.

**Bewertung:**

- **100** — Alle drei Einwilligungen sind vor Erteilung wirksam sperrend und nach Widerruf sofort und dauerhaft wirksam; der Test aus Schritt 6 läuft im Tor und bricht den Build, sobald eine KI-Funktion an `requireAIConsent` vorbeigebaut wird.
- **70** — Alle drei funktionieren im Gerätetest, die serverseitige Durchsetzung ist aber nur für `chat` belegt und für die übrigen Funktionen angenommen.
- **0** — **Widerruf ohne Wirkung.** Nach dem Widerruf geht noch ein Ereignis an den betroffenen Empfänger — sei es ein Sentry-Ereignis, ein Gemini-Aufruf oder ein ElevenLabs-Aufruf. Ebenso 0, wenn Daten das Gerät vor der Erteilung verlassen.

---

### C7 — Lokale Speicherung: was liegt unverschlüsselt auf dem Gerät

**Ebene:** 3 (Quartals-Audit); der Inventarschritt gehört ins Tor
**Zeitbedarf:** 2–3 h einmalig, danach 45 min

**Durchführung:**

Ausgangslage: 187 `localStorage`-Zugriffe in über 40 Dateien, kein Secure-Storage-Plugin in `package.json` (weder `@capacitor/preferences` noch ein Keychain-Plugin). Bei einer Capacitor-App ist `localStorage` eine unverschlüsselte SQLite/WebKit-Datei im App-Container.

1. **Inventar erzeugen** — welche Schlüssel überhaupt existieren:
   ```bash
   grep -rhoE 'localStorage\.(get|set|remove)Item\(\s*[`"'"'"']([^`"'"'"']+)' src \
     --include="*.ts" --include="*.tsx" | sed -E 's/.*[`"'"'"']//' | sort -u
   ```
2. **Jeden Schlüssel einstufen** in: Technik (Theme, Tour-Status, Onboarding-Flag), Metadaten (letzter Export, Erinnerungszeiten), **Art.-9-Inhalt** (Gesprächstext, Tagebuchtext, Stimmungswerte, Krisenzustand), Zugangsdaten (Supabase-Sitzungstoken). Die dritte und vierte Kategorie sind der Prüfgegenstand. Auffällige Kandidaten aus dem Dateisatz: `src/hooks/useLastState.ts`, `src/hooks/useReturnState.ts`, `src/components/journal/JournalChatBridge.tsx`, `src/components/mood/MoodChatBridge.tsx`, `src/hooks/useChatComposer.ts`, `src/hooks/useChatSaveActions.ts`.
3. **Auf dem Gerät nachsehen, nicht im Code.** iOS: App-Container über Xcode → Devices and Simulators → App → „Download Container", darin `AppData/Library/WebKit/…/LocalStorage/*.localstorage` mit `sqlite3` öffnen und nach Klartext des Testinhalts suchen. Android: `adb shell run-as com.jonathanjansen.mindmate` und dasselbe unter `app_webview/Local Storage/leveldb`. Der Testinhalt muss eine eindeutige Zeichenkette sein (z. B. `KONTO-A-GEHEIM`), damit `grep` genügt.
4. **Denselben Griff für die übrigen Ablagen**: IndexedDB, WebKit-Cache, Service-Worker-Cache (PWA), `Documents/`, `tmp/`. Der Supabase-Client legt seine Sitzung standardmäßig in `localStorage` ab — der Token ist damit im Klartext im Container.
5. **Bewerten, nicht nur finden.** Für ein unverschlüsseltes iOS-Gerät gilt Dateisystemverschlüsselung nur bis zum ersten Entsperren; bei einem entsperrten oder gejailbreakten Gerät ist der Container lesbar. Die Frage ist damit: Welche Art.-9-Inhalte müssen überhaupt lokal liegen? Wo nur ein Zwischenzustand gepuffert wird (Chat-Entwurf, Bridge-Übergabe), gehört ein Löschzeitpunkt definiert.
6. **Maßnahme, falls Fund:** Keychain/Keystore über ein Plugin, oder — meist billiger — den betroffenen Zustand gar nicht persistieren. Bis dahin ist der Befund in `docs/gdpr-data-protection-impact-assessment.md` einzutragen.
7. **Rückfallschutz.** Eine Lint-Regel oder Skriptprüfung im Tor, die neue `localStorage.setItem`-Aufrufe außerhalb einer Positivliste bekannter, unkritischer Schlüssel meldet. Ohne das wächst das Inventar mit jedem Feature weiter.

**Belegt durch:** Die Schlüsselliste mit Einstufung je Schlüssel, plus ein Hex- oder Textauszug aus dem heruntergeladenen App-Container, der zeigt, ob der Testinhalt dort im Klartext steht.

**Bewertung:**

- **100** — Kein Art.-9-Inhalt und kein Zugangstoken liegt unverschlüsselt im Container; die Positivlisten-Prüfung läuft im Tor und bricht bei jedem neuen Schlüssel außerhalb der Liste.
- **70** — Inventar vollständig, Art.-9-Inhalte sind ausgelagert oder werden nach Gebrauch gelöscht, das Sitzungstoken liegt aber weiterhin in `localStorage` (Standardverhalten von `@supabase/supabase-js`) und die Entscheidung ist begründet dokumentiert.
- **0** — **Art.-9-Daten im Klartext.** Gesprächsinhalt, Tagebuchtext, Stimmungswert oder ein Krisenzustand ist im heruntergeladenen App-Container im Klartext lesbar.

---

### C8 — WebView-Konfiguration und Deep Links

**Ebene:** 3 (Quartals-Audit); die statischen Teile gehören ins Tor
**Zeitbedarf:** 1,5 h

**Durchführung:**

1. **Capacitor-Konfiguration lesen.** `capacitor.config.ts`: `server.url` und `server.cleartext` sind auskommentiert (Zeile 11–12) — genau richtig, aber ein Auskommentieren ist keine Zusicherung. Prüfen, dass kein Build mit aktiviertem Live-Reload ausgeliefert werden kann:
   ```bash
   grep -n "cleartext\|server\s*:" ios/App/App/capacitor.config.json android/app/src/main/assets/capacitor.config.json
   ```
   Diese beiden Dateien sind das, was tatsächlich im Bundle landet. Sie werden von `bun run build:ios` (`npx cap sync`) erzeugt — die Prüfung muss deshalb **nach** dem Sync stattfinden, nicht am TypeScript-Original.
2. **Android-WebView-Einstellungen.** In `android/app/src/main/java/**/MainActivity.java` und in etwaigen Plugin-Overrides nach `setAllowFileAccess`, `setAllowFileAccessFromFileURLs`, `setAllowUniversalAccessFromFileURLs`, `setJavaScriptEnabled`, `addJavascriptInterface` und `setWebContentsDebuggingEnabled` suchen. Capacitor 8 setzt sichere Vorgaben; jede Abweichung ist zu begründen. `setWebContentsDebuggingEnabled(true)` in einem Release-Build ist ein Fund.
3. **iOS-WebView.** `ios/App/App/Info.plist` enthält `CAPACITOR_DEBUG` (Zeile 5) — den Wert prüfen und sicherstellen, dass er in der Release-Konfiguration nicht `YES` ist.
4. **Deep Links.** Heute existieren keine: In `Info.plist` fehlt `CFBundleURLTypes`, in `android/app/src/main/AndroidManifest.xml` gibt es keinen `intent-filter` mit `VIEW`/`BROWSABLE`, und in `src/` gibt es keinen `appUrlOpen`-Listener. Das ist der sichere Zustand. Der Prüfpunkt lautet damit: **Sobald ein Deep Link eingeführt wird** (z. B. für Passwort-Reset oder Stripe-Rückkehr), muss er ein `assetlinks.json`/`apple-app-site-association` haben und der Zielpfad muss serverseitig validiert werden. Bis dahin ist die Prüfung: „kein Deep Link vorhanden" maschinell festhalten.
5. **JS-Brücken.** Die eingebundenen Capacitor-Plugins auflisten (`package.json`, Zeile 20–30) und für jedes prüfen, ob es Daten aus dem WebView an nativen Code gibt. Besonders `@capacitor-community/speech-recognition` — eingebunden als **Fork über eine GitHub-URL** (`github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.5`), also ohne npm-Registry und ohne Signatur. Dessen nativer Code ist einmal von Hand durchzusehen; ein Fork ist eine eigene Vertrauensentscheidung.
6. **Rückfallschutz.** Prüfung in `scripts/gate.mjs`: `capacitor.config.ts` darf kein aktives `server.url` und kein `cleartext: true` enthalten, `AndroidManifest.xml` kein `android:debuggable="true"`, `Info.plist` kein `CAPACITOR_DEBUG` mit `YES` im Release-Zweig. Fünf Zeilen Regex, danach kostenlos.

**Belegt durch:** Die drei tatsächlich ausgelieferten Konfigurationsdateien (`capacitor.config.json` je Plattform, `AndroidManifest.xml`, `Info.plist`) mit markierten geprüften Schlüsseln, plus die Liste der JS-Brücken mit Bewertung.

**Bewertung:**

- **100** — Alle Einstellungen entsprechen den Capacitor-8-Vorgaben oder sind begründet abweichend, kein Deep Link ohne Validierung, und die Regex-Prüfung im Tor macht ein reaktiviertes `server.url` oder `cleartext: true` sofort rot.
- **70** — Alles geprüft und sauber, aber nur von Hand; der Fork des Speech-Recognition-Plugins ist noch nicht durchgesehen und die Lücke ist notiert.
- **0** — **Eine unsichere Voreinstellung.** Aktives `server.url`/`cleartext` im ausgelieferten Bundle, `allowFileAccess`, eine offene `addJavascriptInterface`-Brücke, aktiviertes WebView-Debugging im Release, oder ein Deep Link ohne Zielvalidierung.

---

### C9 — Transportsicherheit

**Ebene:** 3 (Quartals-Audit); die statische Hälfte gehört ins Tor
**Zeitbedarf:** 1 h

**Durchführung:**

1. **Android: Cleartext ausschließen — ausdrücklich, nicht per Vorgabe.** In `android/app/src/main/AndroidManifest.xml` fehlen sowohl `android:usesCleartextTraffic` als auch ein `android:networkSecurityConfig`; es existiert keine `res/xml/network_security_config.xml`. Seit API 28 ist Cleartext standardmäßig aus — das gilt aber nur, solange `targetSdkVersion` hoch genug ist und keine Bibliothek das überschreibt. Prüfen:
   ```bash
   grep -n "targetSdkVersion\|minSdkVersion" android/variables.gradle android/app/build.gradle
   ```
   Empfohlene Maßnahme: `network_security_config.xml` mit `cleartextTrafficPermitted="false"` anlegen und im Manifest referenzieren. Damit wird aus einer Vorgabe eine Zusicherung.
2. **iOS: ATS.** `ios/App/App/Info.plist` enthält keinen `NSAppTransportSecurity`-Schlüssel — das ist der sichere Zustand (ATS voll aktiv). Der Prüfschritt ist die Gegenprobe, dass niemand ihn nachträglich mit `NSAllowsArbitraryLoads` einführt:
   ```bash
   grep -c "NSAppTransportSecurity\|NSAllowsArbitraryLoads" ios/App/App/Info.plist   # muss 0 sein
   ```
3. **Alle Zieldomänen auf TLS prüfen.** Aus der Domänenliste aus C4 (Schritt 2) für jede Domäne:
   ```bash
   echo | openssl s_client -connect <host>:443 -servername <host> 2>/dev/null | \
     openssl x509 -noout -dates -issuer
   ```
   Zusätzlich per `nmap --script ssl-enum-ciphers -p 443 <host>` oder SSL Labs prüfen, dass keine Protokollversion unter TLS 1.2 angeboten wird. Die Zieldomänen liegen alle bei Dritten (Supabase, Google, ElevenLabs, Stripe, Resend) — die Prüfung ist damit eine Feststellung, keine Änderungsmöglichkeit; ein negativer Befund ist ein Anbieterthema.
4. **Mitschnitt-Gegenprobe.** Mit mitmproxy oder Charles ein Zertifikat auf dem Testgerät installieren und den Verkehr mitlesen. Was hier sichtbar wird, sieht auch ein Angreifer mit einem untergeschobenen Zertifikat. Ergebnis dieser Probe ist zugleich die Grundlage für Schritt 5.
5. **Pinning-Entscheidung dokumentieren.** MASVS-NETWORK-2 verlangt keine Umsetzung, aber eine **dokumentierte Entscheidung**. Für eine App mit Art.-9-Daten ist zu begründen, warum kein Certificate Pinning eingesetzt wird (übliche Gründe: Lovable-Cloud-verwaltete Supabase-Zertifikate rotieren außerhalb unserer Kontrolle; ein falsch gepinntes Zertifikat sperrt alle Nutzer aus). Diese Begründung gehört als datierter Absatz nach `docs/technical-app-documentation.md`.
6. **Rückfallschutz.** Zwei Regex-Prüfungen im Tor: `usesCleartextTraffic="true"` im Manifest und `NSAllowsArbitraryLoads` in der `Info.plist` — beide müssen null Treffer liefern.

**Belegt durch:** `openssl`-Ausgabe je Zieldomäne, der Mitschnitt-Versuch mit Ergebnis, und der datierte Pinning-Absatz in der technischen Dokumentation.

**Bewertung:**

- **100** — Cleartext ist auf beiden Plattformen ausdrücklich ausgeschlossen (nicht nur per Vorgabe), alle Zieldomänen bieten mindestens TLS 1.2, die Pinning-Entscheidung ist datiert dokumentiert, und die zwei Regex-Prüfungen laufen blockierend im Tor.
- **70** — Cleartext ist faktisch ausgeschlossen, aber nur über die Plattformvorgabe; `network_security_config.xml` fehlt weiterhin und die Lücke ist notiert. Pinning-Entscheidung dokumentiert.
- **0** — **Cleartext möglich.** `usesCleartextTraffic="true"`, `NSAllowsArbitraryLoads`, ein aktives `server.cleartext` in der Capacitor-Konfiguration, oder eine Zieldomäne, die HTTP ohne Weiterleitung beantwortet.

---

### C10 — Abhängigkeits-Schwachstellen und Stückliste

**Ebene:** 1 (Tor) — der Punkt verlangt wörtlich „SCA und Stückliste (SBOM) **in der CI**"
**Zeitbedarf:** 1 h Einrichtung, danach ~30 s je Lauf

**Durchführung:**

Heute existiert weder ein SCA-Lauf noch eine SBOM. `.github/workflows/ci.yml` hat drei Jobs: `test`, `gate`, `lint` (letzterer `continue-on-error`).

1. **SCA sofort verfügbar, ohne neue Abhängigkeit.** Bun 1.3.14 bringt es mit:
   ```bash
   bun audit --json > /tmp/audit.json
   ```
   Auswertung nach Schweregrad; `critical` und `high` sind der Blocker-Bereich.
2. **Zweite Quelle**, weil `bun audit` und die npm-Advisory-Datenbank unterschiedlich schnell sind:
   ```bash
   bunx --bun osv-scanner@latest scan --lockfile=bun.lock
   ```
   Läuft über `bunx` ohne Eintrag in `package.json`.
3. **Deno-Seite nicht vergessen.** Die 23 Edge-Functions ziehen ihre Abhängigkeiten per URL (`https://esm.sh/@supabase/supabase-js@2.89.0`, `https://deno.land/std@0.190.0/http/server.ts`) — kein Lockfile, kein `bun audit`. Die verwendeten Versionen einsammeln und einzeln gegen Advisories prüfen:
   ```bash
   grep -rhoE 'https://(esm\.sh|deno\.land|jsr\.io)/[^"'"'"']+' supabase/functions | sort -u
   ```
   Auffällig: `deno.land/std@0.190.0` ist eine alte Standardbibliothek-Version. Ob eine neuere nötig ist, ist zu entscheiden und zu datieren.
4. **SBOM erzeugen.** CycloneDX ohne neue Abhängigkeit:
   ```bash
   bunx @cyclonedx/cyclonedx-npm --output-file sbom.json --omit dev
   ```
   Die Datei als CI-Artefakt je Release ablegen — sie ist zugleich die Grundlage für J2 (Store-Datensicherheitsformular) und für Kassen-Anfragen.
5. **Behandlung, nicht nur Fund.** Jede gemeldete Schwachstelle bekommt einen von drei Zuständen: behoben (Version angehoben), nicht anwendbar (mit Begründung — z. B. Build-Zeit-Abhängigkeit ohne Laufzeitwirkung), oder terminiert (mit Datum). Eine Liste ohne Zustände erfüllt den Punkt nicht — das Blocker-Kriterium lautet „bekannte Lücke **ohne Behandlung**".
6. **In die CI heben.** Neuer Job `sca` in `.github/workflows/ci.yml`, blockierend bei `high`/`critical`, plus wöchentlicher `schedule`-Trigger — Schwachstellen entstehen ohne Push.

**Belegt durch:** `bun audit`-Bericht und `osv-scanner`-Bericht mit Zustand je Fund, `sbom.json` als CI-Artefakt, und ein CI-Lauf mit rotem `sca`-Job bei einem testweise eingefügten verwundbaren Paket.

**Bewertung:**

- **100** — SCA läuft blockierend in der CI (Push **und** Wochenplan), SBOM wird je Release erzeugt und abgelegt, die Deno-URLs sind mit erfasst, und jeder offene Fund hat einen datierten Zustand.
- **70** — SCA läuft manuell und der aktuelle Stand ist sauber behandelt, aber nicht in der CI; die Deno-Seite ist ungeprüft und die Lücke ist notiert.
- **0** — **Eine bekannte Lücke ohne Behandlung.** `bun audit` oder `osv-scanner` meldet `high` oder `critical`, und dazu existiert weder eine Behebung noch eine begründete Nicht-Anwendbarkeit noch ein Termin. Ebenfalls 0, solange kein SCA-Lauf stattgefunden hat — heute der Fall.

---

### C11 — Wiederherstellung, Sicherung, Gerätespuren

**Ebene:** 2 (Release-Karte, im Geräte-Smoke)
**Zeitbedarf:** 45 min je Plattform

**Durchführung:**

1. **Android-Backup — der wahrscheinlichste Blocker.** `android/app/src/main/AndroidManifest.xml`, Zeile 4: `android:allowBackup="true"`. Damit werden App-Daten in Google Drive gesichert. Bei einer App mit Gesundheitsdaten ist das der Fall, den C11 ausdrücklich als Blocker benennt. Nachweis führen, nicht annehmen:
   ```bash
   adb shell bmgr backupnow com.jonathanjansen.mindmate
   adb backup -f /tmp/soulvay.ab -noapk com.jonathanjansen.mindmate
   # Archiv entpacken und nach dem Testinhalt suchen
   dd if=/tmp/soulvay.ab bs=24 skip=1 | zlib-flate -uncompress > /tmp/soulvay.tar
   tar tf /tmp/soulvay.tar | grep -i "localstorage\|leveldb"
   ```
   Findet sich der Testtext (`KONTO-A-GEHEIM`, angelegt wie in C7) im Archiv, ist das Kriterium erfüllt. Maßnahme: `android:allowBackup="false"` oder ein `data_extraction_rules.xml`/`full_backup_content` mit ausdrücklichem Ausschluss des WebView-Verzeichnisses.
2. **iOS-Backup.** Verschlüsseltes iTunes/Finder-Backup des Testgeräts erstellen, mit einem Backup-Browser den App-Container öffnen und nach dem Testtext suchen. Für Dateien, die nicht ins Backup gehören, ist `NSURLIsExcludedFromBackupKey` zu setzen; `localStorage` des WebView lässt sich so nicht ausnehmen — das führt zurück auf C7 (Inhalt gar nicht erst persistieren).
3. **Task-Switcher-Vorschau.** App im Chat mit sichtbarem Gesprächstext öffnen, zum Startbildschirm wechseln, App-Umschalter öffnen. iOS und Android erstellen dabei ein Bildschirmfoto. Ist der Gesprächstext darin lesbar, braucht es eine Verdeckung beim Wechsel in den Hintergrund (iOS: Overlay in `applicationWillResignActive`; Android: `FLAG_SECURE`). Dieser Punkt überschneidet sich mit B18 und ist einmal für beide zu protokollieren.
4. **Zwischenablage.** Text aus dem Chat oder Tagebuch kopieren und in einer fremden App einfügen. Prüfen, ob die App irgendwo selbst in die Zwischenablage schreibt (`grep -rn "Clipboard\|writeText" src`). Auf iOS ist außerdem das systemweite Einfüge-Banner zu beachten.
5. **Geräte-Logs.** App im Krisenpfad benutzen, parallel mitlesen:
   ```bash
   adb logcat | grep -i mindmate        # Android
   # iOS: Konsole.app, Gerät auswählen, nach Prozessnamen filtern
   ```
   Kein Gesprächsinhalt und kein Krisentext darf dort auftauchen. `console.log` im WebView landet in beiden Logs.
6. **Rückfallschutz.** Regex-Prüfung im Tor: `android:allowBackup="true"` in `AndroidManifest.xml` muss null Treffer liefern.

**Belegt durch:** Das entpackte Android-Backup mit dem Suchergebnis nach dem Testtext, ein Bildschirmfoto der Task-Switcher-Vorschau, und ein `logcat`-Auszug aus einer Krisensitzung.

**Bewertung:**

- **100** — Backup schließt die App-Daten ausdrücklich aus, Task-Switcher-Vorschau ist verdeckt, Logs enthalten keinen Inhalt, und die `allowBackup`-Regex läuft blockierend im Tor.
- **70** — Backup ist ausgeschlossen und Logs sind sauber, die Task-Switcher-Vorschau zeigt aber weiterhin Inhalt und die Maßnahme ist terminiert notiert.
- **0** — **Gesundheitsdaten im Backup.** Der Testtext ist in einem Geräte-Backup wiederfindbar. Nach heutigem Manifest (`allowBackup="true"`) ist das der zu erwartende Befund; er ist zu bestätigen oder zu widerlegen, bevor Android startet.

---

### C12 — Zweite Bestätigung für Export und Löschung

**Ebene:** 2 (Release-Karte)
**Zeitbedarf:** 30 min

**Durchführung:**

1. **Ist-Zustand feststellen.** In `src/components/settings/AccountSettings.tsx` ist die Löschung durch Eingabe des Wortes `DELETE` abgesichert (Zeile 728, 1243). Der Export (Zeile 86–92) hat keine zweite Stufe. Beides ist eine Tipp-Hürde bzw. gar keine — keine Authentifizierung. Wer ein entsperrtes Gerät mit angemeldeter App in die Hand bekommt, kann das Konto löschen oder alle Tagebuchdaten exportieren.
2. **Angriffsprobe.** Testgerät mit angemeldeter App, ohne Kenntnis des Passworts: Export auslösen und Datei herunterladen; Löschung auslösen und bis zum Ende durchführen. Gelingt beides, ist das Kriterium erfüllt.
3. **Was eine zweite Bestätigung wäre**, in aufsteigender Stärke: erneute Passworteingabe gegen `supabase.auth.signInWithPassword` mit der eigenen E-Mail; biometrische Freigabe über ein Capacitor-Plugin (neue Abhängigkeit); E-Mail-Bestätigungslink über die vorhandene `send-transactional-email`-Funktion. Für eine App mit Art.-9-Daten und einer Zielgruppe, in der häusliche Gewalt vorkommt (siehe B18), ist die Passwort-Wiederholung die Untergrenze.
4. **Serverseitig prüfen, nicht nur in der Oberfläche.** Die Bestätigung muss die Edge-Function erreichen. `supabase/functions/delete-account/index.ts` nimmt heute jedes gültige Token entgegen (Zeile 20). Ein direkter `curl`-Aufruf mit einem aus `localStorage` gelesenen Token umgeht jede Oberflächenhürde. Die zweite Bestätigung ist deshalb serverseitig zu erzwingen — etwa über einen kurzlebigen, gesondert ausgestellten Nachweis.
5. **Gegenprobe** nach der Umsetzung: derselbe `curl`-Aufruf ohne den Nachweis muss 403 liefern.
6. **Umkehrbarkeit mitprüfen** (Überschneidung mit D6): Gibt es nach der Löschung eine Karenzzeit, oder ist sie sofort endgültig? Beides ist vertretbar, aber der Nutzer muss es vorher wissen.

**Belegt durch:** Das Protokoll der Angriffsprobe aus Schritt 2 (gelungen/abgewehrt) und die `curl`-Antwort aus Schritt 5.

**Bewertung:**

- **100** — Export und Löschung verlangen eine erneute Authentifizierung, die serverseitig erzwungen wird; ein Test in `src/test/` oder im Tor belegt, dass der direkte Funktionsaufruf ohne Nachweis 403 liefert.
- **70** — Die Löschung ist durch erneute Authentifizierung abgesichert, der Export nur durch einen Bestätigungsdialog; die Lücke ist dokumentiert und terminiert.
- **0** — **Ohne zweite Bestätigung möglich.** Export oder Löschung lassen sich an einem entsperrten Gerät ohne Kenntnis des Passworts vollständig durchführen — heute der Fall für beide.

---

### C13 — Löschkonzept

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 2 h für die Prüfung; die fehlende Regel zu schreiben ist eigene Arbeit

**Durchführung:**

Anders als bei anderen Punkten dieser Gruppe existiert hier bereits ein Dokument: `docs/gdpr-data-retention-policy.md` mit einer Tabelle „Retention Schedule" über 17 Datenklassen. Es ist also **nicht** von null zu beginnen — es ist zu prüfen, ob das Vorhandene die Anforderung erfüllt.

1. **Datenklassen im Dokument gegen die Datenbank halten.** Das Dokument nennt 17 Klassen; die Datenbank hat 21 Tabellen. Fehlend im Dokument sind mindestens `analytics_events`, `daily_prompts`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`. Jede Tabelle aus
   ```bash
   psql "$DB_URL" -Atc "select tablename from pg_tables where schemaname='public' order by 1"
   ```
   muss eine Zeile im Löschkonzept haben.
2. **Die Kernlücke prüfen: inaktive Konten.** Das Dokument trägt für alle Gesundheitsdatenklassen „Active account lifetime" ein. Eine Suche nach `inactive`/`inaktiv` in `docs/gdpr-data-retention-policy.md` liefert null Treffer. Damit gibt es **keine Speicherbegrenzung** für ein Konto, das nie gelöscht und nie wieder benutzt wird — Art. 5(1)(e) DSGVO verlangt genau die. Zu schaffen ist: eine Frist (üblich sind 24–36 Monate Inaktivität), eine Vorwarnung per E-Mail, und ein Löschlauf.
3. **Löschregel gegen Löschcode halten.** Die Tabellenliste in `supabase/functions/delete-account/index.ts` (Zeile 55–70) mit der Tabelle im Dokument vergleichen. Die drei E-Mail-Tabellen (`email_send_log`, `suppressed_emails`, `email_unsubscribe_tokens`) sind über die E-Mail-Adresse verschlüsselt, nicht über `user_id`, und stehen nicht in der Liste — das Dokument nennt für „Email send logs" 90 Tage mit „Automated purge". Ob dieser automatische Lauf existiert, ist zu belegen:
   ```bash
   grep -rn "cron\|pg_cron\|schedule" supabase/migrations/*.sql supabase/functions
   ```
   Ein „Automated purge" ohne Cron-Job im Repo ist eine Behauptung, kein Prozess. `suppressed_emails` hat zudem einen legitimen Grund für unbegrenzte Aufbewahrung (Unterdrückungsliste nach Abmeldung) — der gehört als Ausnahme mit Rechtsgrundlage ins Dokument, nicht als Auslassung.
4. **Löschnachweis definieren.** Was wird protokolliert, wenn gelöscht wird — und wie wird das Protokoll selbst wieder gelöscht? Ein Löschprotokoll mit `user_id` ist selbst ein personenbezogenes Datum. Heute schreibt `delete-account` nur `console.error` bei Fehlern; ein positiver Nachweis existiert nicht.
5. **Fristen datieren.** Jede Zeile bekommt Frist, Rechtsgrundlage, Löschmethode und einen belegbaren Auslöser (Cron, Kaskade, manuell mit Termin). Das Dokument ist auf Stand „March 2026" und benennt kein nächstes Prüfdatum.

**Belegt durch:** Ein aktualisiertes `docs/gdpr-data-retention-policy.md`, in dem jede der 21 Tabellen eine Zeile hat, jede Zeile eine Frist trägt und jede Frist einen im Repo auffindbaren Auslöser nennt.

**Bewertung:**

- **100** — Löschkonzept vollständig, jede Frist hat einen Auslöser im Code, und ein Test vergleicht die Tabellen aus `information_schema` automatisch mit den Zeilen des Dokuments und wird rot, sobald eine Tabelle ohne Löschregel hinzukommt.
- **70** — Alle 21 Tabellen sind erfasst und mit Fristen versehen, die Frist für inaktive Konten ist definiert, aber der automatische Löschlauf fehlt noch und ist terminiert.
- **0** — **Keine Speicherbegrenzung definiert.** Für eine Datenklasse fehlt eine Frist oder es gibt keine Regel für Konten, die nie gelöscht und nie wieder genutzt werden. Nach heutigem Stand des Dokuments trifft das zu.

---

### C14 — Sicherungen machen Löschung nicht rückgängig

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 2 h — Zugang zur Produktivumgebung erforderlich

**Durchführung:**

Dieser Punkt ist **nicht lokal prüfbar**. Er misst das Verhalten der Sicherungen des verwalteten Supabase-Projekts. Nötig ist Zugriff auf die Supabase-Konsole des Projekts `djnbvnufmegiursvqbhp` mit Owner-Rechten — bei Lovable-Cloud-verwalteten Projekten ist zuerst zu klären, wer diese Rechte hält (siehe `audit/SUPABASE_ACCESS_MODEL.md`). Ohne diesen Zugang lautet der Status `nicht prüfbar`, mit genau dieser Begründung.

1. **Sicherungslage feststellen.** In der Konsole unter Database → Backups: Welche Art (tägliche Momentaufnahme / Point-in-Time-Recovery), welche Aufbewahrungsdauer, welche Wiederherstellungsgranularität. Das Ergebnis nach `docs/gdpr-data-retention-policy.md` übernehmen — dort steht heute nur der Satz, dass Daten „within 30 days (including backup rotation)" entfernt werden. Das ist die zu prüfende Behauptung.
2. **Testkonto anlegen und mit erkennbarem Inhalt füllen** — darunter ausdrücklich ein Krisentext mit eindeutiger Zeichenkette (`KRISE-PRUEF-2026-07`). Datum und Uhrzeit notieren.
3. **Warten, bis mindestens eine Sicherung nach diesem Zeitpunkt gelaufen ist** (bei täglichen Momentaufnahmen: einen Tag).
4. **Konto über die App löschen.** Zeitpunkt notieren.
5. **Wiederherstellungspunkt einspielen** — auf eine **Kopie**, nie auf die Produktivdatenbank. Supabase erlaubt das Klonen eines Projekts aus einer Sicherung; ist das im Tarif nicht enthalten, ist der Weg über `pg_dump` der Sicherung in eine lokale Instanz zu gehen.
6. **In der wiederhergestellten Kopie suchen:**
   ```sql
   SELECT count(*) FROM public.chat_messages WHERE content ILIKE '%KRISE-PRUEF-2026-07%';
   SELECT count(*) FROM auth.users WHERE email = '<Testkonto>';
   ```
   Jede gefundene Zeile beantwortet die Frage dieses Punktes mit Ja.
7. **Wenn Daten zurückkehren — was daraus folgt.** Das ist der Normalfall bei jedem Sicherungssystem und für sich noch kein Rechtsverstoß. Der Verstoß entsteht, wenn kein Verfahren existiert, das die Löschung auf wiederhergestellte Stände nachzieht. Zu schaffen ist: eine Liste gelöschter Nutzerkennungen mit Löschzeitpunkt (die die Nutzerdaten selbst nicht enthält), und eine feste Regel, dass nach jeder Wiederherstellung diese Liste erneut angewandt wird. Diese Regel gehört in `docs/gdpr-incident-response-plan.md` und muss bei jeder tatsächlichen Wiederherstellung abgehakt werden.
8. **Auftragsverarbeiter mitprüfen.** Dieselbe Frage stellt sich bei Sentry (Ereignisaufbewahrung), Resend (`email_send_log` liegt auch dort) und RevenueCat. Je Empfänger die Aufbewahrungsdauer aus dem AV-Vertrag in das Löschkonzept übernehmen.

**Belegt durch:** Das SQL-Ergebnis aus Schritt 6 gegen eine wiederhergestellte Kopie, mit Datum und dem Namen des eingespielten Wiederherstellungspunkts; dazu der Nachzieh-Prozess als datierter Abschnitt im Incident-Response-Plan.

**Bewertung:**

- **100** — Der Wiederherstellungsversuch bringt keine Nutzerdaten zurück, **oder** ein dokumentierter, geprobter Nachzieh-Prozess entfernt sie unmittelbar nach jeder Wiederherstellung; der Prozess ist Teil der Wiederherstellungs-Checkliste und wurde mindestens einmal echt durchlaufen.
- **70** — Der Prozess ist beschrieben und die Sicherungslage bekannt, aber ein echter Wiederherstellungsversuch hat nie stattgefunden; die Aussage stützt sich auf die Konsolenkonfiguration.
- **0** — **Daten kehren zurück.** Der Krisentext oder der Auth-Nutzer ist im wiederhergestellten Stand vorhanden und es existiert kein Verfahren, das ihn dort entfernt. Ohne Produktivzugang gilt der Punkt als `nicht prüfbar` und zählt nach der Regel „ungeprüfte Punkte zählen als 0".

---

### C15 — Datenmigration mit RLS-Regressionslauf

**Ebene:** 1 (Tor) — der Punkt fordert einen Lauf „nach jeder Migration"
**Zeitbedarf:** 2 h Aufbau (baut vollständig auf C1 auf), danach ~2 min je Migration

**Durchführung:**

C15 galt bis zum 28.07. als automatisiert; gemessen wurde die statische RLS-Prüfung (jetzt korrekt als C1 verbucht). Der Punkt ist **ungeprüft**. Der Kern der Anforderung — „eine geänderte Policy ist ein lautloses Cross-Tenant-Leck" — lässt sich erst prüfen, wenn der Cross-Tenant-Test aus C1 existiert. **C1 ist damit Vorbedingung für C15.**

1. **Vorwärtslauf.** Auf einer frischen Instanz alle 32 Migrationen anwenden (`supabase db reset`), danach den Cross-Tenant-Test aus C1 ausführen. Grün ist die Grundvoraussetzung.
2. **Vorwärtslauf auf Produktivkopie** — der eigentlich fordernde Teil, weil eine Migration an leeren Tabellen anders läuft als an gefüllten. Anonymisierte Kopie ziehen:
   ```bash
   supabase db dump --db-url "$PROD_DB_URL" --data-only -f /tmp/prod.sql
   ```
   Vor der Verwendung alle Freitextfelder (`chat_messages.content`, `journal_entries.content`, `mood_checkins`, `user_memories`) durch Platzhalter ersetzen — sonst werden Art.-9-Produktivdaten in eine Testumgebung getragen, was C4 verletzt. Erfordert Produktivzugang; ohne ihn ist dieser Teilschritt `nicht prüfbar`.
3. **Rückwärtslauf.** Für jede Migration muss ein Rücknahmeweg existieren. Im Repo gibt es keine `down`-Migrationen — Supabase-CLI-Migrationen sind einbahnig. Der praktische Ersatz ist ein dokumentierter Rückrollweg je Migration (H4 fordert ohnehin einen). Zu prüfen: Lässt sich der Stand vor der Migration innerhalb der Sicherungsaufbewahrung wiederherstellen, und ist die App-Version davor damit noch lauffähig? Beim Migrationspaar `20260515120000_ai_consent.sql` (fügt zwei Spalten hinzu) ist das trivial; bei einer Migration, die Spalten entfernt oder Daten umformt, nicht.
4. **RLS-Regression nach der Migration.** Der C1-Test läuft erneut — und zwar so, dass er neue Tabellen automatisch mitnimmt (Tabellenliste aus `information_schema`, nicht hart eingetippt). Eine Migration, die eine Tabelle anlegt und die Policy vergisst, muss dadurch rot werden.
5. **Als Tor-Prüfung eintragen.** Bedingung: Läuft nur, wenn `git diff --name-only origin/main...HEAD -- supabase/migrations/` Änderungen meldet. Dann `supabase db reset` + C1-Test. Ohne Migrationsänderung überspringen — aber sichtbar als „übersprungen, keine Migration", nicht stillschweigend.
6. **Ebene-1-Liste ergänzen** in `audit/TEST_FRAMEWORK.md`, sonst schlägt `scripts/check-framework.py` (K7) fehl.

**Belegt durch:** Der Tor-Lauf eines PR, der eine Migration enthält, mit Protokoll: angewandte Migrationen, Ergebnis des RLS-Regressionslaufs, und der dokumentierte Rückrollweg je Migration.

**Bewertung:**

- **100** — Jeder PR mit einer Änderung unter `supabase/migrations/` löst automatisch `supabase db reset` plus den vollständigen C1-Cross-Tenant-Test aus; eine Migration mit fehlender Policy macht den Build nachweislich rot; je Migration ist ein Rückrollweg dokumentiert.
- **70** — Der Regressionslauf existiert und wird von Hand vor jedem Merge einer Migration ausgeführt; die Prüfung auf einer anonymisierten Produktivkopie hat nie stattgefunden und die Lücke ist notiert.
- **0** — **Eine Migration ohne RLS-Nachprüfung.** Eine Migration ist gemergt worden, ohne dass danach ein Cross-Tenant-Test lief. Nach heutigem Stand trifft das auf alle 32 zu.

---

### C16 — Kontowiederherstellung: Aussperrung und Übernahme

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 1,5 h

**Durchführung:**

Vorhanden ist genau ein Weg: `supabase.auth.resetPasswordForEmail` und `supabase.auth.updateUser` in `src/contexts/AuthContext.tsx` (Zeile 341, 348). Beide Richtungen — der ausgesperrte Berechtigte und der Übernahmeversuch — sind an demselben Mechanismus zu prüfen.

1. **Richtung Aussperrung — kommt der Berechtigte zurück?**
   - Passwort vergessen, E-Mail-Zugang vorhanden: Reset-Link anfordern, ankommende E-Mail prüfen (Absender, Sprache — die Zielgruppe ist deutschsprachig, die Vorlagen liegen unter `supabase/functions/_shared/email-templates/`), Link klicken, neues Passwort setzen, anmelden. Zeit bis zur Zustellung notieren.
   - Passwort vergessen **und** E-Mail-Zugang verloren: Hier gibt es heute keinen Weg. Das ist eine bewusste Entscheidung — bei Art.-9-Daten ist ein Support-gestützter Weg ein Übernahmerisiko. Die Entscheidung muss aber **dokumentiert und dem Nutzer vorher kommuniziert** sein, sonst ist das Konto samt aller Tagebuchdaten stillschweigend verloren.
   - Anbieter-Anmeldung (Apple/Google, falls in `src/pages/Auth.tsx` angeboten): Was passiert, wenn dieser Anbieter das Konto sperrt?
2. **Richtung Übernahme — kommt ein Unberechtigter rein?**
   - Reset-Link **nach Gebrauch** erneut aufrufen: muss abgelehnt werden.
   - Reset-Link nach Ablauf der Gültigkeit aufrufen: muss abgelehnt werden. Gültigkeitsdauer in der Supabase-Konsole unter Authentication → Email ablesen und dokumentieren.
   - Zwei Reset-Links nacheinander anfordern: Der ältere muss ungültig werden.
   - Nach erfolgreichem Reset: Werden bestehende Sitzungen auf anderen Geräten beendet? Zweites Gerät angemeldet lassen, Reset auf dem ersten durchführen, am zweiten weiterarbeiten. Bleibt es angemeldet, kann ein Angreifer, der einmal drin war, es nach dem Reset des Berechtigten bleiben — der klassische stille Übernahmefall. Der zugehörige Gegenmechanismus („von allen Geräten abmelden") wird von B18 gefordert; hier ist zu prüfen, ob er existiert und beim Reset ausgelöst wird.
   - E-Mail-Adresse ändern: Wird die **alte** Adresse benachrichtigt? Ohne diese Benachrichtigung ist die Adressänderung der schnellste Übernahmeweg.
3. **Ratenbegrenzung.** 20 Reset-Anfragen in einer Minute für dieselbe Adresse absetzen. Ohne Begrenzung ist das eine Belästigungsmöglichkeit gegenüber einer belasteten Person und zugleich ein Kostenrisiko bei Resend.
4. **Den Weg beschreiben.** Ergebnis ist ein Abschnitt in `docs/` (oder `src/pages/FAQ.tsx`), der beide Richtungen benennt: wie man zurückkommt, und was ausdrücklich **nicht** geht.

**Belegt durch:** Ein Protokoll mit je einer Zeile pro Sonde aus Schritt 2 (Ergebnis: abgelehnt/akzeptiert), die abgelesene Gültigkeitsdauer des Reset-Links, und der geschriebene Wiederherstellungs-Abschnitt.

**Bewertung:**

- **100** — Beide Richtungen sind geprüft und dokumentiert, Reset-Links sind einmalig und befristet, ein Reset beendet alle bestehenden Sitzungen, die alte E-Mail-Adresse wird bei Änderung benachrichtigt, und die Sonden aus Schritt 2 laufen als Test gegen die lokale Instanz im Tor.
- **70** — Der Weg zurück funktioniert und ist dokumentiert, die Übernahme-Sonden sind geprüft, aber ein Reset beendet fremde Sitzungen nicht und die Lücke ist mit Termin notiert.
- **0** — **Kein definierter Weg.** Es existiert kein dokumentierter Wiederherstellungsweg, oder eine Übernahme-Sonde gelingt (wiederverwendbarer Reset-Link, E-Mail-Änderung ohne Benachrichtigung der alten Adresse).

---

### C17 — Tod des Nutzers

**Ebene:** 3 (Quartals-Audit)
**Zeitbedarf:** 3 h, davon der Großteil Rechtsklärung — heute nicht prüfbar

**Durchführung:**

**Der Punkt ist heute nicht prüfbar, weil es den Gegenstand nicht gibt.** Eine Suche über `docs/`, `compliance/` und `src/pages/` nach `deceased`, `Nachlass`, `Erbe`, `Angehörige` liefert keinen Treffer. `docs/gdpr-data-retention-policy.md` kennt den Fall nicht. Damit ist die Prüfung dieses Quartals eine Erstellungsaufgabe, nicht eine Messung. Was zuerst entstehen muss:

1. **Rechtsposition klären.** Der BGH hat 2018 (III ZR 183/17, „Facebook-Fall") entschieden, dass ein Nutzerkonto Teil des Nachlasses ist und Erben Zugang verlangen können — wie bei einem gedruckten Tagebuch. Für Soulvay ist die Besonderheit: Der Inhalt sind Gesprächsprotokolle über psychische Belastung, möglicherweise mit Krisenäußerungen, und die häufigste Konstellation ist der Tod durch Suizid. Der Zugangsanspruch der Erben trifft hier auf ein besonders geschütztes Interesse. Diese Kollision muss anwaltlich bewertet werden — sie ist nicht durch eine Produktentscheidung auflösbar.
2. **Prozess schreiben**, mindestens mit diesen Festlegungen:
   - Wer meldet den Todesfall, an welche Adresse, und welcher Nachweis wird verlangt (Sterbeurkunde, Erbschein)?
   - Was passiert sofort nach glaubhafter Meldung — wird das Konto gesperrt, laufen Erinnerungen weiter? Push-Erinnerungen an das Gerät einer verstorbenen Person sind der Schaden, der ohne diesen Prozess mit Sicherheit eintritt. `src/hooks/usePushNotifications.ts` und die Erinnerungsplanung (`src/test/notification-schedule.test.ts`) laufen ohne jede Abbruchbedingung dieser Art.
   - Wird ein laufendes Abo gekündigt und ab wann? Bei Apple/RevenueCat läuft es sonst weiter.
   - Wird Zugang gewährt, verweigert oder nur ein Teil herausgegeben — und nach welchem Maßstab?
   - Welche Frist gilt für die Entscheidung?
   - Wo wird der Vorgang aktenkundig (Überschneidung mit B19, Schadensmeldungen — dieselbe Meldeadresse, dieselbe Vorfallakte)?
3. **Vorsorge im Produkt erwägen.** Die saubere Auflösung der Kollision aus Schritt 1 ist eine Nutzerentscheidung zu Lebzeiten: eine Einstellung „Was soll mit meinen Daten geschehen, wenn ich sterbe?" mit den Optionen Löschen / Freigabe an eine benannte Person. Damit wird aus einer Rechtsfrage eine dokumentierte Willenserklärung. Ob das gebaut wird, ist eine Produktentscheidung; dass die Frage entschieden ist, ist die Anforderung.
4. **Erst wenn 2 existiert, ist der Punkt prüfbar.** Die Prüfung ist dann ein Trockenlauf: Meldung an die vorgesehene Adresse absetzen, Frist messen, Kontosperrung und Erinnerungsstopp am Testkonto belegen, Abokündigung in der RevenueCat-Konsole belegen.

**Belegt durch:** Ein datiertes Dokument `docs/gdpr-deceased-user-process.md` mit den Festlegungen aus Schritt 2, die anwaltliche Einschätzung zu Schritt 1, und — nach dessen Existenz — das Protokoll des Trockenlaufs.

**Bewertung:**

- **100** — Der Prozess existiert, ist rechtlich bewertet, einmal im Trockenlauf durchlaufen, und die technische Seite (Erinnerungsstopp bei gesperrtem Konto) ist durch einen Test abgesichert, der bei Regression rot wird.
- **70** — Der Prozess ist geschrieben, die Meldeadresse ist erreichbar und die Fristen stehen fest, aber die anwaltliche Bewertung der BGH-Kollision steht aus und ist terminiert.
- **0** — **Kein Prozess.** Es existiert keine Regelung für Meldung, Nachweis, Kontosperrung, Abokündigung und Zugangsentscheidung. Heutiger Stand.

---

### N1 — Eine Quelle je Regel

**Ebene:** 1 (Tor) — das Gerüst begründet das ausdrücklich in seiner Anmerkung zu Gruppe N
**Zeitbedarf:** 2 h Aufbau, danach ~10 s je Lauf

**Durchführung:**

Das Tor prüft heute nur die Krisenmuster (Prüfung „B21 · Erkennung aus einer Quelle", `scripts/gate.mjs` Zeile 134–139): `supabase/functions/chat/index.ts` importiert `../_shared/crisisPatterns.ts` und definiert keine eigenen `HIGH_SEVERITY_PATTERNS`. Die drei übrigen von N1 genannten Regelarten — **Preise, Berechtigungen, Notfallnummern** — sind ungeprüft. Für zwei davon ist die Duplikation im heutigen Stand belegbar:

1. **Notfallnummern — vier Fundstellen.** Die Nummer `0800 111 0 111` steht in:
   - `src/lib/crisisResources.ts` (die Datei erklärt sich selbst zur alleinigen Quelle: „Phone numbers … live here as literals, never in src/translations/")
   - `src/translations/content.ts`, Zeile 218/220/222 (`crisis.telefonseelsorgeNum`, `crisis.telefonseelsorge2Num`, `crisis.nummerGegenKummerNum`) — also genau dort, wo `crisisResources.ts` sagt, dass sie nicht stehen dürfen
   - `src/data/companionAgentPrompts.ts`, Zeile 94–95 (im Systemprompt für den Sprachmodus, DE und US)
   - `supabase/functions/chat/index.ts`, Zeile 285–286 (im Systemprompt der Chat-Funktion)

   Damit wird dieselbe Regel an vier Stellen gepflegt. Ändert sich eine Nummer — der Kommentar in `crisisResources.ts` datiert die letzte Prüfung auf 2026-07-26 —, muss sie an vier Stellen nachgezogen werden, davon zwei serverseitig. Das ist bauartgleich mit dem Fehler, wegen dessen Gruppe N entstanden ist.

2. **Preise — zwei Quellen.** `src/pages/Upgrade.tsx` Zeile 267 und 284 halten die Werte `"€79,00"`, `"€9,99"` und `"€6,58"` als Rückfall fest, während der Normalfall die Preise aus den RevenueCat-Offerings zieht (Zeile 256–264). Der Rückfall ist bewusst gesetzt, aber er ist eine zweite Pflegestelle: Ändert sich der Preis in App Store Connect und Stripe, zeigt jeder Nutzer ohne RevenueCat-Verbindung den alten Wert. Die Produktkennungen liegen zusätzlich doppelt in `src/hooks/useRevenueCat.ts` (aktuell `soulvay_plus_*`, Legacy `mindmate_plus_*`) — hier ist die Doppelung durch die Umbenennung begründet und gehört als Ausnahme dokumentiert, nicht entfernt.

3. **Berechtigungen prüfen.** Wo wird entschieden, ob ein Nutzer Premium hat? Kandidaten: `src/lib/resolvePremium.ts`, `src/hooks/usePremium.ts` (471 Zeilen), `src/hooks/useEntitlementSimulator.ts`, dazu serverseitig `supabase/functions/chat/index.ts` (Tageslimit) und `manage-subscription`. Prüfen, ob Client und Server dieselbe Quelle für die Grenzwerte lesen oder jeder eigene Zahlen führt:
   ```bash
   grep -rn "daily_chat_usage\|DAILY_LIMIT\|freeLimit\|MAX_FREE" src supabase/functions --include="*.ts" --include="*.tsx"
   ```
   Eine Zahl, die im Client anders steht als im Server, ist derselbe Fehlertyp wie die Musterduplikation.

4. **Als Tor-Prüfung schreiben.** Erweiterung von `scripts/gate.mjs` um eine N1-Prüfung mit vier Regeln, jede als Zählung über den Quelltext:
   - Telefonnummern-Literale (`/0800\s*111\s*0\s*1?11|\b116\s*111\b|\b988\b/`) dürfen außerhalb von `src/lib/crisisResources.ts` und den zugehörigen Tests **nicht** vorkommen. Die Systemprompts müssen die Nummern zur Laufzeit aus der geteilten Quelle einsetzen — für die Deno-Seite heißt das: eine Datei `supabase/functions/_shared/crisisResources.ts` analog zu `crisisPatterns.ts`, aus der beide Seiten lesen.
   - Preisliterale (`/€\s*\d+[,.]\d{2}/`) dürfen nur in einer einzigen Datei stehen.
   - Grenzwerte für Berechtigungen dürfen nur in einer Datei definiert werden.
   - Die bestehende B21-Prüfung bleibt daneben stehen; sie misst die Krisenmuster, N1 die drei übrigen Regelarten.

5. **Ebene-1-Liste ergänzen** in `audit/TEST_FRAMEWORK.md` — N1 steht heute im Text als „im Tor", fehlt aber in der Aufzählung „Ebene 1 — Tor". `scripts/check-framework.py` vergleicht genau diese Liste mit den Punkten, die `gate.mjs` meldet; wer die Prüfung baut, ohne die Liste zu ergänzen, bricht K7.

**Belegt durch:** Die N1-Prüfung im Tor-Protokoll mit der Fundzahl je Regelart (Soll: 0 außerhalb der jeweils einen Quelle), plus die Umstellung der beiden Systemprompts auf die geteilte Notfallnummern-Quelle.

**Bewertung:**

- **100** — Alle vier Regelarten haben genau eine Quelle, die Prüfung läuft im Tor, und eine testweise wiedereingefügte Nummer in einem Systemprompt macht den Build nachweislich rot.
- **70** — Notfallnummern und Krisenmuster kommen aus je einer Quelle; die Preisliterale bleiben als bewusster Rückfall in `Upgrade.tsx` und sind dort als Ausnahme kommentiert und in einer Positivliste der Prüfung geführt.
- **0** — **Dieselbe Regel an zwei Stellen gepflegt.** Nach heutigem Stand erfüllt: Die Telefonseelsorge-Nummer steht in vier Dateien, zwei davon serverseitig.

---

### N2 — Toter Code

**Ebene:** 3 (Quartals-Audit; das Gerüst nennt „monatlich", es gibt keine monatliche Ebene)
**Zeitbedarf:** 2 h beim ersten Lauf, danach 30 min

**Durchführung:**

1. **Erreichbarkeitsanalyse ohne neue Abhängigkeit.** `knip` ist nicht installiert und muss es auch nicht werden:
   ```bash
   bunx knip@latest --reporter compact
   ```
   `bunx` lädt das Werkzeug in den Cache und führt es aus, ohne `package.json` zu ändern. Ohne Konfiguration nimmt knip die Vite-Einstiegspunkte (`index.html` → `src/main.tsx`) und meldet unbenutzte Dateien, Exporte, Typen und Abhängigkeiten. Beim ersten Lauf ist mit Fehlalarmen zu rechnen: `src/components/ui/**` (shadcn-Bausteine, teils auf Vorrat), `src/test/**`, `e2e/**`, `supabase/functions/**` (eigene Deno-Laufzeit, nicht Teil des Vite-Graphen). Diese Verzeichnisse in einer `knip.json` ausnehmen und die Ausnahme begründen — sonst misst man die Bibliothek statt der App.
2. **Anteil berechnen**, damit die 10-%-Schwelle des Blockers eine Zahl bekommt:
   ```bash
   # Nenner
   find src -name "*.ts" -o -name "*.tsx" | grep -v "/test/" | xargs wc -l | tail -1
   ```
   Bezugsgröße heute: 47.889 Zeilen über `src` gesamt. Zähler ist die Summe der Zeilen aller von knip als unerreichbar gemeldeten Dateien.
3. **Tote Routen — der zweite, härtere Teil des Blockers.** Die Routenliste aus `src/App.tsx` ziehen und gegen die Navigationsziele halten:
   ```bash
   grep -oE 'path="[^"]+"' src/App.tsx | sort -u
   grep -rhoE 'navigate\("[^"]+"|to="[^"]+"' src --include="*.tsx" | sort -u
   ```
   Zwei Richtungen prüfen: eine Route ohne jeden Verweis (toter Endpunkt) und ein Navigationsziel ohne Route (führt ins Leere). Der Blocker nennt ausdrücklich „eine tote Route im Navigationsmenü" — also einen Menüeintrag, der auf nichts zeigt. Die Menükomponenten sind deshalb gesondert durchzusehen, nicht nur die Gesamtmenge.
4. **Edge-Functions gesondert.** knip sieht sie nicht. Prüfen, welche der 23 Funktionen überhaupt aufgerufen werden:
   ```bash
   for d in supabase/functions/*/; do n=$(basename "$d");
     c=$(grep -rc "functions.invoke(\"$n\"\|functions/v1/$n" src --include="*.ts" --include="*.tsx" | \
         awk -F: '{s+=$2} END {print s+0}');
     [ "$c" -eq 0 ] && echo "OHNE AUFRUFER: $n"; done
   ```
   Erwartbare und legitime Treffer: `stripe-webhook`, `revenuecat-webhook`, `auth-email-hook`, `process-email-queue` (werden von außen bzw. per Zeitplan aufgerufen). Alles darüber hinaus ist ein toter, aber öffentlich erreichbarer Endpunkt — bei `verify_jwt = false` für alle 23 Funktionen ist das nicht nur Ballast, sondern Angriffsfläche (Übergang zu C2). `setup-review-account` ist hier der erste Kandidat.
5. **Ungenutzte Übersetzungsschlüssel.** Der Ratchet in `src/test/i18n-no-ghost-keys.test.ts` prüft die eine Richtung (Schlüssel im Code ohne Übersetzung). Die andere — Übersetzung ohne Verwendung — ist toter Text und gehört hierher.
6. **Befund verwerten, nicht nur erheben.** Jede gemeldete Datei bekommt eine von drei Entscheidungen: löschen, mit Begründung behalten (in `knip.json` als Ausnahme), oder anschließen. Ein knip-Bericht ohne Entscheidungen wiederholt sich im nächsten Quartal unverändert.

**Belegt durch:** Der `knip`-Bericht mit Entscheidung je Eintrag, die berechnete Prozentzahl mit Zähler und Nenner, und die Routen-Gegenüberstellung aus Schritt 3.

**Bewertung:**

- **100** — Anteil unter 10 %, keine tote Route, keine aufruferlose Edge-Function ohne Begründung, und `bunx knip --no-exit-code=false` läuft im Tor gegen eine gepflegte `knip.json`, sodass neuer toter Code den Build bricht.
- **70** — Anteil unter 10 % und Routen sauber, aber der Lauf ist manuell; die Edge-Functions sind nur einmalig geprüft.
- **0** — **Über 10 % toter Code oder eine tote Route im Navigationsmenü.** Ein Menüeintrag, der auf eine nicht registrierte Route zeigt, ist für sich allein 0 — unabhängig vom Prozentwert.

---

### N3 — Analysierbarkeit: was der Typprüfer nicht abdeckt

**Ebene:** 1 (Tor) — die Typhälfte läuft, die Lint-Hälfte fehlt
**Zeitbedarf:** 1 h Aufbau, danach ~40 s je Lauf

**Durchführung:**

N3 hat zwei Hälften: „Typprüfung ohne Fehler" **und** „Lint-Zähler fällt monoton". Die N3-Prüfung in `scripts/gate.mjs` (Zeile 158–166) führt ausschließlich `tsc --noEmit` aus. Der Ratchet existiert nicht. Der Lint-Job in `.github/workflows/ci.yml` läuft mit `continue-on-error: true` — also ohne jede Wirkung, was K4 („Gate ohne Wirkung") direkt berührt.

1. **Ist-Stand messen.**
   ```bash
   bunx eslint . 2>&1 | tail -3
   ```
   Ergebnis heute: **275 Probleme (221 Fehler, 54 Warnungen)**. Der Kommentar über dem Lint-Job in `ci.yml` nennt „~1087 pre-existing lint errors" — diese Zahl ist veraltet und stammt aus der Zeit vor der `ignores`-Korrektur in `eslint.config.js` (mitgescannte Arbeitskopien unter `.claude/worktrees`). Der Kommentar ist beim Umbau mit zu korrigieren, sonst führt er die nächste Person in die Irre.
2. **Ratchet-Datei anlegen.** Eine Datei `.lint-ratchet.json` mit `{"problems": 275}` im Repo-Wurzelverzeichnis, versioniert.
3. **Prüfung in `scripts/gate.mjs` ergänzen**, direkt neben der bestehenden N3-Prüfung:
   - `bunx eslint . -f json` ausführen, `errorCount + warningCount` über alle Dateien summieren.
   - Ist die Summe **größer** als der Wert in `.lint-ratchet.json` → rot.
   - Ist sie **kleiner** → grün, und die Datei wird auf den neuen Wert geschrieben (der Zähler kann nur fallen).
   - Die Umgebung ist wie bei den übrigen Prüfungen über `sh()` festzunageln (`CI=true`, `NO_COLOR=1`) — der ganze Grund für diese Hilfsfunktion war, dass ein Tor nicht vom Terminal abhängen darf (K8).
4. **Lint-Job in der CI blockierend machen** oder streichen. Ein Job mit `continue-on-error` neben einem Tor, das dasselbe blockierend prüft, ist verwirrend; die Ratchet-Prüfung im Tor ersetzt ihn.
5. **Deno-Seite.** Weder `tsc` noch `eslint` erfassen `supabase/functions/` — die 23 Funktionen laufen in Deno mit eigenen URL-Importen. Der Löwenanteil der Lint-Schuld liegt laut CI-Kommentar genau dort (`no-explicit-any`). Ergänzen:
   ```bash
   deno check supabase/functions/**/index.ts
   deno lint supabase/functions
   ```
   `supabase/functions/deno.json` existiert bereits. Ob `deno` in der CI verfügbar ist, muss der Workflow sicherstellen (`denoland/setup-deno@v2`). Ohne diesen Schritt ist die Hälfte des Backends von jeder statischen Prüfung ausgenommen.
6. **Fehlbarkeit belegen** (K9): Eine absichtliche `any`-Zuweisung einfügen und zeigen, dass der Zähler steigt und das Tor rot wird. Ohne diesen Nachweis ist ein Ratchet eine Zahl, die niemand je überschreitet.

**Belegt durch:** `.lint-ratchet.json` mit Verlauf über mehrere Commits, ein Tor-Protokoll mit der N3-Zeile „221 Fehler / 54 Warnungen, Ratchet 275", und ein absichtlich roter Lauf als Fehlbarkeitsnachweis.

**Bewertung:**

- **100** — `tsc --noEmit` fehlerfrei, `deno check` fehlerfrei, Lint-Zähler im Tor verankert und nachweislich fallend, ein eingefügter Verstoß macht den Build rot.
- **70** — Typprüfung fehlerfrei und der Lint-Zähler ist erfasst und dokumentiert, aber der Ratchet läuft nicht blockierend; die Deno-Seite ist ungeprüft.
- **0** — **Typfehler > 0 oder der Zähler steigt.** `tsc --noEmit` meldet einen Fehler, oder ein Merge erhöht die Lint-Summe gegenüber `.lint-ratchet.json`.

---

### N4 — Änderbarkeit: Dateigrößen im Kernpfad

**Ebene:** 1 (Tor; das Gerüst nennt „monatlich" — die Messung kostet unter einer Sekunde und gehört deshalb an die Stelle, die ohnehin läuft)
**Zeitbedarf:** 45 min Aufbau, danach vernachlässigbar

**Durchführung:**

1. **Kernpfad definieren** — das Gerüst nennt Chat, Krise, Abrechnung. Als Dateiliste festschreiben (in `scripts/gate.mjs` oder einer daneben liegenden `.core-paths.json`), damit die Prüfung nicht auslegbar ist:
   - Chat: `src/pages/Chat.tsx`, `src/hooks/useChatComposer.ts`, `src/hooks/useChatSaveActions.ts`, `src/components/chat/**`, `supabase/functions/chat/index.ts`
   - Krise: `src/lib/crisisDetection.ts`, `src/lib/crisisResources.ts`, `src/lib/region.ts`, `supabase/functions/_shared/crisisPatterns.ts`, `src/hooks/useConversationalVoice.ts`, `src/components/landing/DemoChat.tsx`
   - Abrechnung: `src/pages/Upgrade.tsx`, `src/hooks/useRevenueCat.ts`, `src/hooks/useAppleIAP.ts`, `src/hooks/usePremium.ts`, `src/lib/resolvePremium.ts`, `supabase/functions/{create-checkout,manage-subscription,revenuecat-webhook,stripe-webhook,verify-apple-receipt}/index.ts`
2. **Messen.**
   ```bash
   find src supabase/functions -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -25
   ```
   Stand heute, Dateien über 600 Zeilen im oder nahe am Kernpfad: `src/components/settings/AccountSettings.tsx` (1253), `src/pages/Journal.tsx` (879), `src/components/landing/DemoChat.tsx` (710), `src/pages/Chat.tsx` (704), `src/hooks/useConversationalVoice.ts` (686), `src/pages/Topics.tsx` (650), `src/components/toolbox/ExercisePlayer.tsx` (633), `src/pages/Upgrade.tsx` (631). Vier davon liegen im definierten Kernpfad. `src/integrations/supabase/types.ts` (822) ist erzeugt und gehört ausgenommen.
3. **Funktionsgrößen** — das Gerüst nennt sie ausdrücklich neben den Dateien. Ohne neues Werkzeug:
   ```bash
   bunx eslint . --no-eslintrc --rule '{"max-lines-per-function":["warn",{"max":80,"skipBlankLines":true,"skipComments":true}]}' \
     --ext .ts,.tsx src 2>&1 | tail -3
   ```
   Ein React-Komponentenkörper ist naturgemäß lang; die Schwelle ist deshalb erst nach dem ersten Lauf sinnvoll festzulegen. Der Wert dieses Schritts ist die Rangliste, nicht die absolute Zahl.
4. **Aufteilungsplan — der eigentliche Prüfgegenstand.** Der Blocker lautet nicht „> 600 Zeilen", sondern „> 600 Zeilen **ohne Aufteilungsplan**". Für jede überschreitende Kernpfad-Datei ist ein Absatz zu schreiben: welche Verantwortlichkeiten sie heute bündelt, wie der Schnitt aussieht, bis wann. Bei `useConversationalVoice.ts` (686 Zeilen) ist das besonders dringlich, weil dort zugleich der Sprachmodus und dessen Krisenüberwachung liegen — die Fläche, die laut Vorwort des Gerüsts zuletzt ohne Sicherheitsnetz war.
5. **Prüfung in `scripts/gate.mjs`:** Über die Kernpfad-Liste laufen, jede Datei über 600 Zeilen gegen die Einträge in einer `docs/aufteilungsplan.md` halten (Dateiname als Überschrift). Fehlt der Eintrag → rot. Damit blockiert die Prüfung Wachstum ohne Plan, nicht Größe an sich.

**Belegt durch:** Die `wc -l`-Rangliste über den definierten Kernpfad, `docs/aufteilungsplan.md` mit einem datierten Eintrag je überschreitender Datei, und die N4-Zeile im Tor-Protokoll.

**Bewertung:**

- **100** — Keine Kernpfad-Datei über 600 Zeilen, **oder** jede überschreitende Datei hat einen datierten Aufteilungsplan; die Prüfung läuft im Tor und wird rot, sobald eine Datei die Schwelle ohne Planeintrag überschreitet.
- **70** — Die Rangliste ist erhoben und die vier überschreitenden Kernpfad-Dateien sind benannt, aber nur zwei haben einen Plan.
- **0** — **Eine Datei im Kernpfad über 600 Zeilen ohne Aufteilungsplan.** Heutiger Stand: `Chat.tsx`, `useConversationalVoice.ts`, `DemoChat.tsx` und `Upgrade.tsx` überschreiten, ein Aufteilungsplan existiert nicht.

---

### N5 — Abhängigkeiten: Anzahl, Aktualität, Ungenutztes

**Ebene:** 3 (Quartals-Audit) — die Schwachstellenhälfte läuft über C10 im Tor
**Zeitbedarf:** 1,5 h

**Durchführung:**

N5 und C10 überschneiden sich in der Schwachstellenfrage. Damit hier nicht dasselbe zweimal gemessen wird: **C10 misst Schwachstellen und SBOM (Tor), N5 misst Anzahl, Aktualität und Ungenutztes (Quartal).** Der Blocker von N5 bleibt die ungepatchte Schwachstelle — er wird durch den C10-Lauf mitbeantwortet.

1. **Anzahl.**
   ```bash
   node -e "const p=require('./package.json');
     console.log('prod', Object.keys(p.dependencies).length,
                 'dev', Object.keys(p.devDependencies).length)"
   bun pm ls --all | wc -l    # transitiv
   ```
   Die direkte Zahl ist die steuerbare, die transitive die risikorelevante. Beide festhalten und über die Quartale fortschreiben — eine einzelne Zahl sagt nichts, eine Reihe schon.
2. **Aktualität.**
   ```bash
   bun outdated
   ```
   Jedes Paket mit einem Major-Rückstand einzeln bewerten. Zwei Einträge verdienen besondere Aufmerksamkeit:
   - `@sentry/react` ist auf `10.60.0` **festgenagelt** (ohne `^`), `@sentry/capacitor` auf `^4.2.0` — die beiden müssen zueinander passen, das ist vermutlich der Grund für die Festnagelung. Der Grund gehört als Kommentar in `package.json`, sonst hebt ihn jemand versehentlich an.
   - `@capacitor-community/speech-recognition` kommt aus einem GitHub-Fork (`github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.5`). Für dieses Paket gibt es weder `bun outdated` noch eine Advisory-Anbindung. Quartalsweise ist von Hand gegen das Ursprungsprojekt zu prüfen, ob dort Sicherheitskorrekturen aufgelaufen sind, und ob der Fork sie braucht.
3. **Ungenutztes.**
   ```bash
   bunx knip@latest --dependencies --reporter compact
   ```
   Aus demselben Lauf wie N2. Jedes gemeldete Paket entweder entfernen oder als Ausnahme begründen (typische Fehlalarme: Tailwind-Plugins, PostCSS, `lovable-tagger`).
4. **Deno-Abhängigkeiten.** Die URL-Importe der 23 Edge-Functions sind kein Teil von `package.json` und tauchen in keinem der obigen Läufe auf:
   ```bash
   grep -rhoE 'https://(esm\.sh|deno\.land|jsr\.io)/[^"'"'"']+' supabase/functions | sort | uniq -c | sort -rn
   ```
   Prüfen, ob dieselbe Bibliothek in verschiedenen Versionen importiert wird — `@supabase/supabase-js@2.89.0` und `deno.land/std@0.190.0` sind die beiden Kandidaten. Uneinheitliche Versionen über 23 Funktionen sind ein N1-Problem in Abhängigkeitsform.
5. **Lockfile-Lage bereinigen** (Überschneidung mit N6): Es liegen **drei** Lockdateien im Repo — `bun.lock` (aktuell), `bun.lockb` (Binärformat, veraltet, Stand April) und `package-lock.json` (npm, Stand Mai). Welche gilt, entscheidet heute das Werkzeug, das jemand zufällig aufruft. Zwei davon gehören gelöscht.

**Belegt durch:** Ein datierter Quartalsvermerk mit den Zahlen aus Schritt 1, der `bun outdated`-Ausgabe mit Bewertung je Major-Rückstand, der knip-Abhängigkeitsliste mit Entscheidungen, und der Deno-Versionsübersicht.

**Bewertung:**

- **100** — Keine offene Schwachstelle (belegt durch den C10-Lauf im Tor), keine ungenutzte Abhängigkeit, Deno-Importe einheitlich versioniert, genau eine Lockdatei, und der Fork ist gegen das Ursprungsprojekt abgeglichen.
- **70** — Schwachstellen behandelt und die Bestandsaufnahme vollständig, aber ungenutzte Pakete sind noch nicht entfernt und die Deno-Versionen driften; beides ist terminiert notiert.
- **0** — **Eine ungepatchte Schwachstelle mit hoher Bewertung.** `bun audit` oder `osv-scanner` meldet `high`/`critical` ohne Behebung, begründete Nicht-Anwendbarkeit oder Termin.

---

### N6 — Bauen ohne Sondergerät

**Ebene:** 2 (Release-Karte); der Trockenlauf gehört als CI-Job dahinter
**Zeitbedarf:** 1 h beim ersten Lauf, danach ~5 min in der CI

**Durchführung:**

1. **Trockenlauf im leeren Verzeichnis** — nicht im Arbeitsbaum, sonst misst man die eigene Maschine:
   ```bash
   cd "$(mktemp -d)"
   git clone --depth 1 <repo-url> soulvay && cd soulvay
   bun install --frozen-lockfile
   bun run build
   bun run test
   bun run gate
   ```
   Jeden Handgriff protokollieren, der zwischen diesen Zeilen nötig wird. Genau die sind der Prüfgegenstand.
2. **Vorhersehbare Stolperstellen im heutigen Stand:**
   - **Drei Lockdateien.** `bun.lock`, `bun.lockb` und `package-lock.json` liegen nebeneinander. `bun install --frozen-lockfile` entscheidet sich für eine; welche, ist nicht offensichtlich. Zwei entfernen.
   - **Fork-Abhängigkeit.** `@capacitor-community/speech-recognition` wird über `github:JoniJansen/capacitor-speech-recognition-spm#v7.0.1-spm.5` bezogen. Ist das Repository privat, scheitert `bun install` in jeder fremden Umgebung und in der CI ohne hinterlegten Token. Prüfen und, falls privat, entweder öffentlich stellen oder den Zugangsweg dokumentieren.
   - **`.env`.** Die Datei ist getrackt und enthält die vier `VITE_`-Variablen — ein Klon baut damit. Das ist heute der Grund, warum es funktioniert. Wird `.env` je aus dem Repo genommen (was C3 nahelegt), braucht es eine `.env.example` und einen Satz in der `README.md`, sonst bricht dieser Punkt genau dann.
   - **`python3` für das Tor.** `bun run gate` ruft `python3 scripts/check-framework.py` auf (`gate.mjs` Zeile 215). Auf einem System ohne Python3 ist das Tor nicht lauffähig. In der CI ist Python auf `ubuntu-latest` vorhanden; auf einem frischen Entwicklerrechner nicht zwingend. Entweder als Voraussetzung in der `README.md` nennen oder das Skript nach Node portieren.
   - **`tsc` über den lokalen Pfad.** `gate.mjs` Zeile 160 ruft `./node_modules/.bin/tsc` auf — funktioniert nach `bun install`, aber nicht, wenn jemand `gate.mjs` aus einem anderen Verzeichnis startet.
3. **Nativen Teil gesondert prüfen.** `bun run build:ios` (`rm -rf dist && vite build && npx cap sync ios`) und der Android-Build sind **nicht** ohne Sondergerät möglich: Xcode und ein Signaturzertifikat für iOS, ein Keystore für Android (siehe `audit/KEYSTORE_SETUP.md`). Das ist unvermeidbar und kein Mangel — es gehört als ausdrückliche Abgrenzung in die Bewertung. N6 misst den Web-/Testpfad; der native Pfad wird von H4 abgedeckt.
4. **Als CI-Job festschreiben.** Neuer Job `fresh-clone` in `.github/workflows/ci.yml`, der ohne Cache (`actions/cache` weglassen, `bun install --frozen-lockfile` ohne vorherigen Restore) durchläuft. Ohne diese Bedingung prüft der Job den Cache, nicht den frischen Klon.
5. **README gegenlesen.** Was in Schritt 1 an Handgriffen nötig war, muss dort stehen — und was dort steht, muss nötig gewesen sein. Ein Aufbauabschnitt, der Schritte nennt, die es nicht mehr gibt, ist genauso ein Mangel wie ein fehlender.

**Belegt durch:** Das vollständige Protokoll des Trockenlaufs aus Schritt 1 mit Ausgabe je Befehl und einer ausdrücklichen Zeile „keine manuellen Eingriffe", plus ein grüner `fresh-clone`-Job in der CI.

**Bewertung:**

- **100** — Klon, `bun install`, Build, Tests und Tor laufen ohne einen einzigen Handgriff; der `fresh-clone`-Job läuft ohne Cache in der CI und bricht, sobald eine neue Voraussetzung eingeführt wird.
- **70** — Der Trockenlauf gelingt, verlangt aber einen dokumentierten Handgriff (z. B. `brew install python3` oder das Hinterlegen eines Tokens für die Fork-Abhängigkeit); der Handgriff steht in der `README.md`.
- **0** — **Manueller Eingriff nötig.** Ein Schritt scheitert und ist nur durch eine nicht dokumentierte Handlung zu beheben — etwa ein privates Fork-Repository ohne beschriebenen Zugang, eine fehlende `.env` ohne Vorlage, oder eine der drei Lockdateien, die einen abweichenden Abhängigkeitsstand erzwingt.
