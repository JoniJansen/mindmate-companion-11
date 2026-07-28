# Android-Signaturschlüssel — Einrichtung

**Anlass:** In `android/app/build.gradle` standen Passwort und Alias im Klartext — seit Commit `13ea5e8` (20.04.2026) und damit in der Historie eines **öffentlichen** Repositories. Befund A4-1 aus `audit/P0_FINDINGS.md`.

**Was das konkret bedeutet:**
- Die Keystore-**Datei** (`.jks`) lag **nie** im Git (geprüft über `git log --all -- '*.jks'` und einen Objekt-Scan). Ohne sie ist das Passwort allein nicht verwertbar.
- Das Passwort ist trotzdem als **verbrannt** zu behandeln, weil es öffentlich einsehbar war — und es wurde für Store- und Key-Passwort **gleichzeitig** verwendet.
- **Entscheidend:** Android ist noch nicht veröffentlicht. Ein neuer Signaturschlüssel ist **nur jetzt** möglich. Mit dem ersten Play-Release wird er unwiderruflich festgelegt — danach bedeutet ein Schlüsselwechsel, dass bestehende Installationen keine Updates mehr erhalten.

---

## Was bereits erledigt ist

`android/app/build.gradle` liest die Signaturdaten jetzt aus `android/keystore.properties`. Diese Datei ist über `.gitignore` gesperrt. Fehlt sie, baut Gradle bewusst **unsigniert**, statt auf ein fest verdrahtetes Passwort zurückzufallen. Debug-Builds sind unberührt.

Die Vorlage liegt in `android/keystore.properties.example`.

---

## Was du einmalig tun musst

### 1. Neuen Keystore erzeugen

```bash
cd /Users/jonathanjansen/soulvay/android/app

"/Applications/Android Studio.app/Contents/jbr/Contents/Home/bin/keytool" \
  -genkeypair -v \
  -keystore soulvay-release.jks \
  -alias soulvay \
  -keyalg RSA -keysize 4096 \
  -validity 10000
```

`keytool` fragt interaktiv nach einem Passwort und nach Name, Organisation und Land. Verwende ein Passwort aus deinem Passwortmanager — **nicht** das alte, und für Store und Key dasselbe (Android erlaubt beides getrennt, aber `keytool` fragt nur einmal, wenn du Enter drückst).

Warum 4096 Bit und 10000 Tage: Google verlangt eine Gültigkeit bis mindestens 2033; 4096 Bit ist der heutige Standard für einen Schlüssel, der die Lebensdauer der App überdauern muss.

### 2. Zugangsdaten hinterlegen

```bash
cd /Users/jonathanjansen/soulvay/android
cp keystore.properties.example keystore.properties
```

Danach `keystore.properties` öffnen und bei `storePassword` und `keyPassword` das eben vergebene Passwort eintragen.

### 3. Prüfen

```bash
cd /Users/jonathanjansen/soulvay
git status --short android/    # weder .jks noch keystore.properties dürfen auftauchen
bun run gate                   # C3 muss jetzt grün sein
```

### 4. Sichern

Der Keystore ist unersetzlich. Geht er verloren, kann die veröffentlichte App **nie wieder aktualisiert** werden.

- `soulvay-release.jks` und das Passwort **getrennt voneinander** an einem zweiten sicheren Ort ablegen (Passwortmanager für das Passwort, verschlüsselter Speicher für die Datei).
- Zusätzlich **Play App Signing** aktivieren: Google verwahrt dann den eigentlichen Signaturschlüssel, dein Keystore wird zum Upload-Schlüssel und ist im Verlustfall ersetzbar. Dringend empfohlen — das ist die einzige Absicherung gegen einen Totalverlust.

---

## Was bewusst NICHT getan wurde

**Die Git-Historie wurde nicht umgeschrieben.** Ein `filter-repo` über die Historie würde alle Commit-Hashes ändern und jeden vorhandenen Klon und Fork brechen. Da die Keystore-Datei selbst nie im Git lag, bringt das Entfernen des Passwortes aus der Historie kaum Sicherheitsgewinn — der Schlüssel wird ohnehin ersetzt. Sollte die Historie später aus anderen Gründen bereinigt werden, kann dieser Punkt mitlaufen.

**Das alte Passwort wurde nirgends wiederverwendet** — geprüft über den gesamten Arbeitsbaum, es kam ausschließlich an den beiden Stellen in `build.gradle` vor.
