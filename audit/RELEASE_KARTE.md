# Release-Karte — vor jeder Einreichung abhaken

**Ebene 2 des Prüfgerüsts** · Zeitfenster 90 Minuten · ausführliche Fassung je Punkt in [`pruefanweisungen/`](pruefanweisungen/README.md)

> **Regel:** Abhaken oder Release stoppen. Ein Punkt, der nicht abgehakt werden kann, ist kein Schönheitsfehler — er ist der Grund, warum diese Karte existiert.

---

## Vorbereitung (5 min)

- [ ] `bun run gate` — muss **13 von 13** melden. Bricht hier etwas, hat der Release-Check noch nicht angefangen.
- [ ] `git status` sauber, alles auf `main` gepusht, CI grün
- [ ] Build-Nummer in `ios/App/App/Info.plist` erhöht (`CFBundleVersion`), Version in `CFBundleShortVersionString` gesetzt
- [ ] Testgeräte bereit: ein iPhone **und** ein Samsung Galaxy A50, beide mit dem neuen Build

**Notiere hier:** Version ______ · Build ______ · Datum ______ · Prüfer ______

---

## 1 · Krisenpfad — die sechs Gates (20 min) → B2, B3

Für jedes Gate: „ich will nicht mehr leben" senden, prüfen ob die Hilfekarte **binnen 2 Sekunden** erscheint und **116 123** zeigt.

- [ ] **Tageslimit** — mit Gratis-Konto bis zur Limit-Meldung senden, dann den Satz. Karte statt Upgrade-Aufforderung.
- [ ] **Paywall** — aus `/upgrade` ohne Kauf zurück in den Chat, Satz senden
- [ ] **Einwilligung entzogen** — Einstellungen → KI-Datenverarbeitung abwählen, Satz senden. Karte erscheint auch ohne KI-Antwort.
- [ ] **Abgemeldet** — Landing-Seite, Demo-Chat, Satz senden, auch nach dem 3-Nachrichten-Limit
- [ ] **Offline** — Flugmodus, Satz senden. Karte da, Nummern tippbar, `/safety` lädt.
- [ ] **LLM-Ausfall** — Netzwerk drosseln oder Gateway auf HTTP 500. Karte unabhängig von der Fehlermeldung.

**Und alle sechs Eingabeflächen** — je einmal denselben Satz:

- [ ] Text-Chat · [ ] Diktat · [ ] Sprachmodus · [ ] Demo-Chat · [ ] Tagebuch · [ ] Stimmungs-Notiz

- [ ] **Kartenzeile prüfen:** In Deutschland zeigt die Karte **116 123** *und* **116 111 (Kinder und Jugendliche)** — nicht zweimal dieselbe Organisation.
- [ ] Zeitzone des Geräts auf `Europe/Vienna` stellen, App neu starten, `/safety` öffnen: **142** und **147** müssen erscheinen, keine 0800-Nummern.

---

## 2 · Kernfluss auf dem Gerät (15 min) → A1

Einmal durchgehend, ohne Abkürzung, auf **beiden** Plattformen je einmal:

- [ ] Onboarding von der frischen Installation bis zum Ende
- [ ] Chat: Nachricht senden, Antwort kommt, in der **richtigen Sprache**
- [ ] Tagebuch: Eintrag schreiben, speichern, App beenden, neu starten — Eintrag ist noch da
- [ ] Stimmung erfassen, Übung starten und zu Ende führen
- [ ] Sprachmodus starten, ein paar Sätze, sauber beenden

---

## 3 · Geräte-Smoke (15 min, je Plattform) → G1–G5

**iOS** (12 von 15 min)
- [ ] Sichere Bereiche: kein Inhalt unter der Dynamic Island oder der Home-Leiste
- [ ] Tastatur verdeckt kein Eingabefeld
- [ ] Swipe-Back funktioniert auf jeder Unterseite
- [ ] Dunkelmodus auf allen Hauptbildschirmen ohne Stilbruch
- [ ] Bei 320 px Breite (kleinstes iPhone) scrollt nichts waagerecht

**Android — Galaxy A50** (15 von 15 min)
- [ ] Zurück-Geste verlässt keinen Bildschirm ins Leere
- [ ] Statusleiste passt zum App-Thema
- [ ] Mikrofon ablehnen → Erklärung erscheint, kein Absturz, kein Sackgassen-Zustand
- [ ] Benachrichtigung ablehnen → Schalter springt zurück
- [ ] PWA: installieren, offline öffnen, Service-Worker aktualisiert

---

## 4 · Was der Nutzer liest (15 min) → B6, D3, D4, J10

- [ ] **Nicht-Therapie-Hinweis** sichtbar auf: Landing · Demo-Chat · Onboarding · Chat
- [ ] **KI-Kennzeichnung** sichtbar auf: Chat · Demo-Chat · Sprachmodus · Stimmungserfassung — und sie sagt *KI*, nicht nur *keine Therapie*
- [ ] Den Hinweis im Chat schließen, App beenden, neu starten: bleibt eine dauerhafte Kennzeichnung sichtbar?
- [ ] Einen Fehler erzwingen (Flugmodus beim Senden): Meldung ist menschlich, nennt einen Ausweg, steht in der richtigen Sprache
- [ ] Stichprobe von 10 Texten quer durch die App: keiner belehrend, keiner alarmierend, keiner beschämend

---

## 5 · Bezahlen und Wahrhaftigkeit (10 min) → I1, I4

- [ ] Kauf im Sandbox-Konto durchführen — Abo wird erkannt
- [ ] „Kauf wiederherstellen" funktioniert nach Neuinstallation
- [ ] Kündigen und Ablauf durchspielen
- [ ] **Jede Zeile der Preistabelle** gegen die App halten: existiert die Funktion, und ist sie so gesperrt wie behauptet?

---

## 6 · Gerätekontext (5 min) → B18

- [ ] Sperrbildschirm-Vorschau auf „Immer" stellen, Erinnerung auslösen, Gerät sperren: **kein** Tagebuch-, Chat- oder Stimmungsinhalt lesbar
- [ ] App-Umschalter öffnen mit sichtbarem Krisentext im Chat: ist die Vorschaukachel lesbar?

---

## 7 · Auslieferung (5 min) → H4

- [ ] Build aus einem sauberen Stand erzeugt, nicht aus dem Arbeitsbaum mit Änderungen
- [ ] Bundle-Version höher als der letzte Store-Build (sonst lehnt Apple ab)
- [ ] Rückrollweg bekannt: welcher Build wäre der Ersatz, wenn dieser bricht?
- [ ] „Was ist neu"-Text geschrieben, in beiden Sprachen

---

## Bewusst **nicht** auf dieser Karte

Diese Punkte gehören ins Quartals-Audit, nicht vor jeden Release — sie hier zu führen würde die 90 Minuten sprengen und die Karte damit unbrauchbar machen:

**B4** Nummern anrufen · **B8–B11**, **B13**, **B14** Antwortqualität und Red-Team · **C4**, **C5**, **J1** Datenschutz-Durchlauf · **C13**, **C14**, **C16**, **C17** Löschen, Sicherungen, Wiederherstellung, Nachlass · **L1–L5** regulatorische Qualifizierung · **J6–J9** Wirksamkeit, Ethik, Nachmarkt, externe Begutachtung

**Und diese fehlen noch ganz** — sie sind nicht abhakbar, weil es sie nicht gibt: **B12** Sicherheitsplan · **B15** Altersfeststellung · **B20** Modell-Drift-Überwachung.

---

## Ergebnis

- [ ] Alle Punkte abgehakt → Einreichung freigegeben
- [ ] Ein Punkt offen → **Release gestoppt**, Grund hier notieren:

_____________________________________________________________
