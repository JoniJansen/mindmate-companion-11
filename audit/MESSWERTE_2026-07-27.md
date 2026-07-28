# Messwerte — Stand 2026-07-27

Alle Zahlen stammen aus ausgeführten Befehlen, nicht aus Schätzungen. Grundlage für das Bewertungsblatt nach `TEST_FRAMEWORK.md`. Von der Hauptsession stichprobenartig nachgeprüft.

## Umfang

| Größe | Wert | Ermittelt durch |
|---|---|---|
| Zeilen Quellcode in `src/` | 47.760 | `find src -name '*.ts' -o -name '*.tsx' \| xargs wc -l` |
| Seiten | 33 (32 geroutet) | `ls src/pages` |
| Komponenten | 143 (94 eigene, 50 shadcn) | `find src/components -name '*.tsx'` |
| Routen | 34 (33 konkret + Catch-all) | `grep -oE '<Route path="[^"]*"' src/App.tsx` |
| Edge Functions | 23 (+ `_shared`) | `ls -d supabase/functions/*/` |
| Übersetzungsmodule | 12, zwei Sprachen | `src/translations/` |
| Tests | 442 in 17 Dateien, alle grün | `bunx vitest run` |

## Toter Code

| Kategorie | Dateien | Zeilen |
|---|---|---|
| Komponenten ohne Importeur | 42 (davon 17 eigene) | 5.031 |
| Weitere Module ohne Importeur | 8 | 1.184 |
| **Gesamt** | **50** | **6.215 = 13,0 %** |

Darunter fertige, aber abgeklemmte Bausteine: `GrowthDashboard`, `AdaptiveSuggestions`, `RitualCard`, `ContinueModule` (zusammen 570 Zeilen Home-Module), `useAppleIAP.ts` (322 Zeilen, kompletter zweiter Kaufpfad), `src/lib/premium.ts` (128 Zeilen, zweites widersprüchliches Free/Premium-Modell), `src/lib/brand.ts` (158 Zeilen, Trust-Boundary-Texte).

## Erreichbarkeit

- **25 von 33** Routen haben einen antippbaren Einstiegspunkt.
- **7 ohne jeden Einstieg:** `/onboarding`, `/timeline`, `/delete-account`, `/review-instructions`, `/review-status`, `/dev-qa`, `/diagnostics`.
- **1 nur per E-Mail-Link:** `/reset-password`.
- **`/toolbox` fehlt in der Hauptnavigation** — die Leiste führt nur `/home`, `/chat`, `/journal`, `/topics`, `/mood`. Die Übungen sind ausschließlich über Querverweise erreichbar, obwohl das Onboarding sie als eigenen Bereich einführt.
- **`/timeline`** (490 Zeilen: 90-Tage-Stimmungskarte, erkannte Muster, Gesprächsreflexionen) ist gebaut, geroutet, getestet — und für Nutzer nicht auffindbar, weil ihr einziger Verweis in einer nicht eingebundenen Komponente liegt.

## Fehlende Domänen-Bausteine

Jeweils **0 Treffer** über das gesamte `src/`-Verzeichnis:

| Fehlt | Warum es zählt |
|---|---|
| Sicherheits-/Notfallplan | Standardintervention der Suizidprävention (Safety Planning Intervention) |
| Vertrauens-/Notfallkontakt | Eskalationsweg über die reine Nummernanzeige hinaus |
| Validiertes Screening (PHQ-9, GAD-7, WHO-5) | Grundlage für belastbare Verlaufsmessung und Kassen-Nachweise |
| Altersabfrage | DSGVO Art. 8, Store-Richtlinien, Jugendschutz |
| Krisennummern für AT/CH | Deutschsprachige Zielgruppe, aber nur DE und US gepflegt |

## Bezahlschranke

- `FeatureMatrix.tsx` zeigt 14 Zeilen, 9 mit Schloss für Gratis-Nutzer.
- **5 davon haben clientseitig kein Gate:** `grep -n "isPremium\|usePremium"` liefert in `src/pages/Journal.tsx`, `src/pages/Mood.tsx`, `src/pages/Topics.tsx` **0 Treffer**.
- Serverseitig steht `enforcePremium` im Modus `"off"` (`supabase/functions/_shared/auth.ts:140`), gesetzt ist `"log"` — beides lässt durch.
- **Folge heute:** Gratis-Nutzer erhalten beworbene Bezahlfunktionen kostenlos.
- **Folge beim Umschalten auf `enforce`:** Der 402 wird in `Journal.tsx:258-261` und `:288-291` nur als `t("common.error")`-Hinweis abgefangen — kein Upgrade-Dialog. Das Einschalten der Bezahlschranke würde den Gratis-Pfad also mit einer nackten Fehlermeldung brechen.

## Offline-Verhalten

| Seite | prüft Netzstatus |
|---|---|
| Chat | ja (2 Stellen) |
| Journal | **nein** — schreibt direkt nach Supabase |
| Mood | **nein** — schreibt direkt nach Supabase |
| Toolbox | nein |

## Krisenpfad

- Erkennung: 40 von 40 unabhängigen Fällen korrekt (20 Krisen, 20 Alltag), Stand nach dem Umbau auf Wortstämme.
- Abgedeckte Flächen: Chat (über den Composer, deckt alle Aufrufer ab), Demo-Chat, Tagebuch, Stimmungsnotiz, Echtzeit-Sprachmodus.
- Regionen: nur `DE`, `US`, `unknown`. AT und CH erhalten die deutschen 0800-Nummern, die von dort nicht erreichbar sind.
- `detect-patterns` hat als einzige der KI-Funktionen **keine** Krisensperre.
- Serverseitig läuft `requireAIConsent` weiterhin **vor** der Erkennung.

## Qualitäts-Gates

| Gate | Stand |
|---|---|
| `tsc --noEmit` | 0 Fehler |
| `bunx vitest run` | 442/442 grün |
| `bun run build` | grün |
| `bun run lint` | 275 Probleme (221 Fehler, 54 Warnungen) — real, nach Konfigurationsfix |
| CI auf `main` | grün |
| E2E in CI | **nicht vorhanden** |

## Auslieferungsstand

| Artefakt | Alter | Enthält aktuellen Stand |
|---|---|---|
| `dist/` | aktuell | ja |
| Android-APK | 27.07. 15:18 | nein — mehrere Commits älter |
| iOS-Bundle im Repo | 25.07. 19:10 | nein |
| iOS `CURRENT_PROJECT_VERSION` | 60 | App Store führt Build 64 |
| Edge Functions deployt | **nicht verifizierbar** | kein Deploy-Schritt in der CI |

---

# Erlebnisqualität — Messwerte (Nachtrag)

Aus der Prüfrunde zu Optik, Nutzergefühl, Sprache, Barrierefreiheit, Performance und nativen Feinheiten. Kontrastwerte von der Hauptsession mit eigener WCAG-Rechnung nachgeprüft und bestätigt.

## Kontrast — drei Verstöße gegen WCAG AA

| Element | Gemessen | Gefordert | Betroffen |
|---|---|---|---|
| Fokusring `ring-primary/20` (`src/index.css:280`) | **1,30:1** hell · 1,27:1 dunkel | 3,00:1 (SC 1.4.11) | jede Tastaturbedienung |
| `--muted-foreground` hell (`src/index.css:50`) | **4,17:1** | 4,50:1 (SC 1.4.3) | 507 Verwendungen |
| Kartenrand `--border` (`src/index.css:72`) | **1,22:1** | 3,00:1 | alle Karten |

**Bemerkenswert:** Ohne die Transparenz `/20` läge derselbe Fokusring bei **4,89:1** — er würde die Anforderung deutlich übertreffen. Die Deckkraft-Angabe allein macht aus einem konformen Ring einen nicht wahrnehmbaren.

## Zustände — Hover fehlt systemisch

- `src/components/ui/button.tsx` enthält **genau eine** `hover:`-Regel im gesamten Bauteil (Unterstreichung bei `variant="link"`).
- Die Variante `ghost` ist ein **leerer String** (`button.tsx:16`) — und mit **70 Verwendungen** die meistgenutzte überhaupt.
- **97 native `<button>`-Elemente** umgehen das Bauteil, 83 % davon ohne eigenes Hover.
- Relevant, weil PWA und Desktop ausdrücklich Zielkanäle sind.

## Radius-Skala ist nicht monoton

`tailwind.config.ts:80-86` leitet nur `lg`, `md`, `sm` aus `--radius` (0,875rem) ab und lässt `xl` auf dem Tailwind-Standard. Im ausgelieferten CSS:

| Klasse | Wert | Verwendungen |
|---|---|---|
| `rounded-lg` | 14 px | 37 |
| `rounded-xl` | **12 px** | **184** |
| `rounded-md` | 12 px | 34 |

`rounded-xl` ist damit **kleiner** als `rounded-lg` und **identisch** mit `rounded-md`. Die meistgenutzte Rundung der App ist die, deren Name das Gegenteil verspricht.

## Typografie

- **16 verschiedene Schriftgrößen** real im Einsatz: die 9-stufige Skala plus 8 freie Werte (9, 10, 11, 13, 13.5, 14, 14.5, 15 px) mit 64 Vorkommen.
- `text-[14px]` (8×) ist größengleich mit `text-sm`, erbt aber die Body-Zeilenhöhe 1,65 statt 1,25rem → gleiche Schrift, 23,1 px statt 20 px Zeilenabstand.

## Farbdisziplin

- Nur **22 Hex-Farben** in 4 von 176 Dateien — davon 8 Markenlogos, 5 in vendorter Datei, **9 echte Verstöße** (`src/components/chat/VoiceAvatar.tsx:221-274`).
- Aber **130 Verwendungen roher Tailwind-Farben über 17 Farbfamilien** (amber 52, green 15, red 12, emerald 12, orange 10 …) — in einer App, deren Gestaltungsprinzip laut `src/index.css:25` ausdrücklich „sophisticated green accents" ist.
- Dark Mode ist architektonisch sauber: nur 8 von 127 Dateien brauchen `dark:`-Varianten, `bg-white` kommt 3× vor, `text-black` gar nicht.

## Abstände

- Grundraster sauber: erkennbares 4-px-System (`gap-2` 188×, `gap-3` 150×, `p-4` 73×).
- **Aber die fünf Haupt-Tabs verwenden unterschiedliche Seitenränder:** Home `px-6` ganz ohne Breitenbegrenzung, Journal/Topics/Mood `px-4 md:px-6 lg:px-8` mit gestaffelter Maximalbreite, Toolbox `px-4` ohne Stufen, Settings `px-4 py-4`. Beim Tabwechsel springt der Inhalt.

## Positiv

- 44-px-Mindestgröße für alle antippbaren Elemente (`src/index.css:253-263`).
- Globale Press-Zustände, 41 explizite `disabled:`-Regeln.
- Icon-Größen eng gefasst (vier Werte decken 489 Verwendungen ab).
- Design-Token durchgängig als HSL-Variablen für beide Themes gepflegt.

---

# Zustandsverlust — Befunde der Gegenprobe (2026-07-28)

Drei Fehler derselben Familie, die allen sechs Fachprüfungen entgangen sind. Von der Hauptsession am Code nachgeprüft.

## 1. Stiller Datenverlust beim Tagebuch-Speichern — schwerwiegend

`src/pages/Journal.tsx:212-221`:
```
await supabase.from("journal_entries").insert({ ... } as any);
```
Der Rückgabewert wird **nicht ausgewertet**. Der Supabase-Client liefert Fehler als `{ data, error }` zurück, statt zu werfen — ein fehlgeschlagener Schreibvorgang läuft hier also durch, als wäre er erfolgreich. Gleiches Muster beim Aktualisieren (`:213`).

**Folge:** Jemand schreibt einen Tagebucheintrag, bekommt die Erfolgsmeldung, und der Text ist weg. In einer App, in der Menschen Dinge festhalten, die sie sonst niemandem sagen, ist das der schädlichste mögliche Fehler.

Verschärfend: `AppLayout.tsx:47` zeigt zeitgleich ein Offline-Band an — die App weiß also, dass keine Verbindung besteht, und meldet trotzdem Erfolg.

## 2. Ladefehler wird als „noch keine Einträge" ausgegeben

`src/pages/Journal.tsx:189-193`: Der `catch`-Block protokolliert nur in der Entwicklungsumgebung, `entries` bleibt `[]`, `isLoading` wird im `finally` auf `false` gesetzt. Gerendert wird daraufhin der Leer-Zustand mit der Aufforderung, den **ersten** Eintrag zu schreiben.

**Folge:** Ein kurzer Netzaussetzer teilt einem Menschen mit 200 Einträgen mit, sein Tagebuch sei leer — ohne Fehlermeldung, ohne Wiederholen-Möglichkeit.

Zusätzlich: `.limit(200)` (`:181`) ohne jede Paginierung. `Timeline.tsx:97,143` macht es mit `.range()` richtig — im selben Projekt.

## 3. Der Chat verwirft das laufende Gespräch bei jedem Tab-Wechsel

`src/components/layout/BottomNav.tsx:41-44` rendert `<NavLink to={item.to}>` **ohne `state`**. `src/pages/Chat.tsx:188` liest `location.state?.conversationId` und stellt nur bei gesetztem Wert wieder her. `messages` startet leer (`useChatComposer.ts:45`).

**Folge:** Wer mitten im Gespräch kurz aufs Tagebuch tippt und zurückkehrt, steht vor einem leeren Chat mit Standardbegrüßung. Der Verlauf liegt serverseitig vor — es ist reiner Verlust in der Oberfläche.

Wiederaufnahme existiert nur über zwei Nebenwege (`Home.tsx:379`, `ChatHistory.tsx:52`), nicht über die Hauptnavigation.

**Einordnung:** Bei einem Begleiter ist die Kontinuität des Gesprächs das Produkt. Ein Kontrastfehler ärgert; ein verworfenes Gespräch bricht die Beziehung — und trifft jeden Nutzer in jeder Sitzung.

## 4. Keine Scroll-Wiederherstellung

`grep -rn "scrollRestoration\|ScrollRestoration\|useScrollRestore" src/` → **0 Treffer**, bei `#root { position: fixed; overflow: hidden }` (`src/index.css:186-194`). Jede Seite scrollt in einem eigenen Container, der beim Verlassen verfällt.

## Bewertungskorrektur

Die Gegenprobe hält die Note der visuellen Qualität (62) für zu mild und schlägt 45–50 vor. Begründung: Dieselbe Bewertung nennt den Fokusring selbst einen Auslieferungs-Blocker, während Barrierefreiheit und Performance für teils dieselben Befunde 42 vergeben. Zusätzlich sitzt der Radius-Defekt in `button.tsx:6` — also im meistgenutzten Baustein der App.

**Eigene Gesamtnote der Gegenprobe für die Erlebnisqualität: 44/100.**
