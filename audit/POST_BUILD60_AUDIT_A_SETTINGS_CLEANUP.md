# Audit A — Settings-Cleanup (Read-Only Bestandsaufnahme)

_Stand: 8. Juni 2026 · Build 60+ · Strang A · KEIN Code geändert_

---

## 1. Zweck

User-Beobachtung: "Die Einstellungen können auch noch mal 'n bisschen geleert werden, zum Beispiel Avatar-Stil, Orb gibt's ja gar nicht so mehr. Avatar-Stil kann da rausgenommen werden und alles, was da jetzt nicht auf Anhieb rein muss, wie zum Beispiel der Admin-Bereich."

Dieses Dokument inventarisiert **was aktuell in Settings sichtbar ist**, **was funktioniert**, **was tote Optionen sind** und **was raus / verschoben / versteckt gehört** — vor der Code-Änderung.

---

## 2. Inventar — Settings-Sektionen (von oben nach unten)

Aus `src/pages/Settings.tsx`:

| # | Sektion | Datei | Zweck |
|---|---|---|---|
| 1 | **Companion** | `SettingsCompanionSection.tsx` | Companion wechseln, Voice-Identity |
| 2 | **Subscription** | `SubscriptionSection.tsx` | Premium-Status, Upgrade-CTA |
| 3 | **Language** | `SettingsLanguageSection.tsx` | DE / EN, Anredeform, Tone |
| 4 | **Appearance** | `SettingsAppearanceSection.tsx` | Theme-Mode, Accent-Color, Notifications, Inner Dialogue |
| 5 | **Voice** | `SettingsVoiceSection.tsx` | Mikrofon-Auswahl, Voice-Settings |
| 6 | **Support** | `SettingsSupportSection.tsx` | Safety, Privacy, FAQ, Install, Tour, **Admin (conditional)** |
| 7 | **AI Consent** | `SettingsAIConsentSection.tsx` | GDPR-Toggle |
| 8 | **Account** | `SettingsAccountSection.tsx` | Email, Passwort, Logout, Delete |
| 9 | **Legal** | `SettingsLegalSection.tsx` | Terms, Impressum, Cancellation |
| 10 | Version-Footer | inline | `Soulvay v1.0.0` |

---

## 3. Befunde — was raus / aufgeräumt gehört

### 🔴 3.1 Accent Color (Appearance) — **toter Pfad gegenüber Markenversprechen**

**Wo:** `SettingsAppearanceSection.tsx` Zeilen 94–119, Hook `useTheme` → `accentColorOptions`.

**Was passiert:** User kann zwischen mehreren Accent-Farben wählen (Sage, ...).

**Problem:**
- Markenidentität ist **#3D7A5E (Sage Primary)** — eingebrannt in `mem://design/style-guide/ios-premium-aesthetic`.
- User-Wahl einer alternativen Accent-Color verwässert die Marken-Konsistenz, ohne echten Mehrwert.
- B2B/App-Store-Wahrnehmung: Premium-Apps geben dem User KEINE Theme-Tinting-Optionen (Apple Health, Calm, Headspace haben keine).

**Empfehlung:** **Entfernen.** Theme-Mode (Light/Dark/System) bleibt, Accent-Color raus.

---

### 🔴 3.2 Inner Dialogue Toggle (Appearance) — **Funktion unklar / dead?**

**Wo:** `SettingsAppearanceSection.tsx` Zeilen 142–156. Toggle `preferences.innerDialogue`.

**Frage:** Was steuert dieser Toggle? Suche im Code zeigt: wird in Preferences gespeichert, aber Wirkung in Chat/Companion ist unklar.

**Empfehlung:** Lovable **prüft Verwendung** (`rg "innerDialogue"`) — wenn nirgends ausgewertet, raus. Wenn doch verwendet, an klarere Stelle (Companion-Section) mit besserer Beschriftung.

---

### 🔴 3.3 Admin-Eintrag in Support-Sektion — **falsche Stelle**

**Wo:** `SettingsSupportSection.tsx` Zeilen 111–126. Conditional auf `isAdmin`.

**Problem:**
- Admin-Panel ist Operator-Tool, nicht User-Setting.
- Sichtbar nur für Admins (gut), aber in "Support"-Sektion deplatziert.
- B2B-Wahrnehmung: Sieht aus, als wäre die App ein "halb-fertiges Admin-Tool".

**Empfehlung:**
- **Option 1 (sauber):** Admin-Eintrag aus Settings raus. Admins erreichen `/admin` direkt per URL oder über ein separates Operator-Menü (nicht im User-Settings-Stack).
- **Option 2 (Minimal-Eingriff):** Eigene Sektion ganz unten "Operator" — visuell klar abgegrenzt mit Trennlinie/Warnfarbe.

User-Anweisung: "Admin-Bereich kann da auch raus machen" → **Option 1**.

---

### 🟡 3.4 "Restart Tour" in Support-Sektion — **kalter Eintrag**

**Wo:** `SettingsSupportSection.tsx` Zeilen 96–109.

**Befund:** Nützlich, aber in der "Support"-Sektion zwischen Privacy und Install schwer auffindbar. Wenig benutzt nach Onboarding-Abschluss.

**Empfehlung:** Bleiben lassen, aber **nach unten** verschieben (unter Install). Keine Priorität.

---

### 🟡 3.5 "Install App" — korrekt platziert, aber Doppel-Touchpoint

**Wo:** `SettingsSupportSection.tsx` Zeilen 79–94, conditional auf `!isNative`.

**Befund:** Korrekt versteckt auf Native. Auf Web sichtbar. Keine Änderung nötig.

---

### 🟢 3.6 "Orb / Avatar-Stil" — User-Erinnerung, aber NICHT mehr im Code

**User-Aussage:** "Avatar-Stil, Orb gibt's ja gar nicht so mehr."

**Befund (Code-Recherche):** Aktueller `SettingsCompanionSection.tsx` zeigt KEINE "Orb"- oder "Avatar-Stil"-Option mehr. Companion-Section ist sauber.

**Mögliche Quelle der Verwirrung:**
- User könnte ältere Version (Build < 50) im Kopf haben.
- Oder es gibt einen Reststand in `SettingsCompanionSection` mit "Style"-Wahl, der heute degenerated ist (z.B. nur noch eine Option, aber UI noch als Liste).

**Lovable: bitte vor Code-Phase verifizieren** durch `rg -i "orb|avatar.?stil|avatarStyle" src/` und Companion-Section komplett lesen.

---

### 🟢 3.7 Tone & Address-Form (Language) — **funktioniert, aber redundant?**

**Wo:** `SettingsLanguageSection.tsx`, Preferences `tone` und `addressForm`.

**Befund:**
- `addressForm` (du/sie) wird im Onboarding gesetzt — sinnvoll, hier veränderbar zu lassen.
- `tone` (gentle/neutral/structured) — fragwürdig, ob User das aktiv nutzt. Companion-Persona ist eh "Soulvay Companion" (siehe `mem://ai/personality/soulvay-companion`).

**Empfehlung:** **Tone-Setting prüfen** — wird es ans Chat-System weitergereicht? Wenn nein → raus. Wenn ja → in Companion-Section verschieben, weil es persona-relevant ist, nicht sprach-relevant.

---

## 4. Sektion-Reihenfolge — Empfehlung

**Heute:** Companion · Subscription · Language · Appearance · Voice · Support · AI-Consent · Account · Legal

**Vorschlag (User-First):**
1. Companion (Identität)
2. Subscription (Premium-Status)
3. Voice & Sprache (zusammenlegen: Voice + Language)
4. Appearance (nur noch: Theme-Mode + Notifications)
5. Privatsphäre & Sicherheit (AI-Consent + Privacy-Link aus Support)
6. Account (Email/Passwort/Delete)
7. Hilfe (FAQ, Safety, Install, Restart Tour)
8. Rechtliches (Terms, Impressum, Cancellation)

→ **Support-Sektion auflösen** und Einträge thematisch verteilen. Admin-Eintrag komplett raus.

---

## 5. Risiko-Einschätzung der Cleanup-Phase

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| User vermisst entfernten Accent-Color | niedrig | niedrig | Telemetry-Check: wie oft wird er heute geändert? Wenn <1%, gefahrlos raus |
| Inner-Dialogue-Toggle entfernen bricht Funktion | mittel | niedrig | Vorher `rg` über Codebase, prüfen ob jemand `preferences.innerDialogue` ausliest |
| Admin-Pfad nicht mehr auffindbar für Admins | niedrig | niedrig | Admin-User kennen `/admin` URL, kein echter Verlust |
| Reihenfolge-Änderung verwirrt Bestandsuser | mittel | niedrig | Akzeptabel, Settings-Sektion ist nicht muscle-memory-kritisch |

**Gesamt: niedrig.** Cleanup ist der sicherste Build-60+-Strang.

---

## 6. Empfohlene Reihenfolge der Code-Änderungen (für später)

1. Admin-Eintrag aus Support raus (1 Zeile entfernen) → trivialer Quick-Win
2. Accent-Color raus + `useTheme` aufräumen → ~20 Zeilen
3. Inner-Dialogue-Toggle prüfen → entweder raus oder umziehen
4. Tone-Setting prüfen → analog
5. Companion-Section auf Reste von "Orb / Avatar-Stil" prüfen
6. Optional: Sektion-Neu-Reihenfolge (höheres Risiko, separater Sprint)

**Phase 1 (Schritte 1–4) ist ~1 Stunde Code + Test.**

---

## 7. Offene Fragen an User vor Implementation

1. **Accent-Color wirklich komplett raus** oder als "Hidden Power-User-Feature" (z.B. nur in Premium)?
2. **Tone-Setting:** Soll der User die Companion-Tonalität wirklich überschreiben können, oder ist das eine Companion-Persona-Wahl (= gehört in Companion-Section)?
3. **Restart-Tour:** Drin lassen oder ganz raus (kaum genutzt)?

---

**Ende Audit A.**
