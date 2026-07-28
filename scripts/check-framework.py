#!/usr/bin/env python3
"""
Integritätsprüfung für audit/TEST_FRAMEWORK.md.

Entstanden, weil beim Einbau der Krisen-Erweiterung neun Prüfpunkte still
verloren gingen: das Einfüge-Skript meldete Erfolg, ohne zu prüfen, ob die
Ersetzung überhaupt gegriffen hatte. Aufgefallen ist es erst zufällig beim
Nachzählen für eine Grafik.

Ein Prüfgerüst, dessen eigene Vollständigkeit niemand prüft, ist wertlos.
Dieses Skript ist die Antwort darauf. Es läuft ohne Argumente und gibt
einen Bericht plus Exit-Code aus (0 = in Ordnung, 1 = Mängel).
"""

import re
import sys
from pathlib import Path

DOC = Path(__file__).resolve().parent.parent / "audit" / "TEST_FRAMEWORK.md"

# Erwartete Gruppen. Wird eine hier ergänzt, muss sie im Dokument existieren.
GRUPPEN = {
    "A": "Funktionale Korrektheit",
    "B": "Nutzersicherheit",
    "C": "Sicherheit & Datenschutz",
    "D": "Erlebnisqualität",
    "E": "Barrierefreiheit",
    "F": "Performance",
    "G": "Plattform & Geräte",
    "H": "Zuverlässigkeit & Betrieb",
    "I": "Geschäftslogik",
    "J": "Compliance & Recht",
    "K": "Testinfrastruktur",
    "L": "Regulatorische Qualifizierung",
    "N": "Wartbarkeit & Codequalität",
}

ZEILE = re.compile(r"^\|\s*([A-N])(\d+)\s*\|(.+)$")
GATE = Path(__file__).resolve().parent / "gate.mjs"


def main() -> int:
    if not DOC.exists():
        print(f"FEHLER: {DOC} nicht gefunden")
        return 1

    text = DOC.read_text(encoding="utf-8")
    zeilen = text.splitlines()

    punkte: dict[str, dict[int, str]] = {g: {} for g in GRUPPEN}
    ohne_blocker: list[str] = []
    doppelt: list[str] = []

    for zeile in zeilen:
        m = ZEILE.match(zeile)
        if not m:
            continue
        gruppe, nummer, rest = m.group(1), int(m.group(2)), m.group(3)

        if gruppe not in punkte:
            print(f"FEHLER: unbekannte Gruppe {gruppe}{nummer}")
            return 1
        if nummer in punkte[gruppe]:
            doppelt.append(f"{gruppe}{nummer}")
        punkte[gruppe][nummer] = rest

        # Ein Punkt ohne Blocker-Kriterium ist nicht entscheidbar.
        spalten = [s.strip() for s in rest.split("|")]
        inhalt = [s for s in spalten if s]
        if len(inhalt) < 3:
            ohne_blocker.append(f"{gruppe}{nummer}")

    mangel = False

    print("── Prüfpunkte je Gruppe ──")
    gesamt = 0
    for g, name in GRUPPEN.items():
        nummern = sorted(punkte[g])
        anzahl = len(nummern)
        gesamt += anzahl

        if anzahl == 0:
            print(f"  {g} {name:32s} ⚠️  KEINE PUNKTE")
            mangel = True
            continue

        # Lücken in der Nummerierung deuten auf verlorene Zeilen hin —
        # genau der Fehler, der diesen Prüfer nötig gemacht hat.
        erwartet = set(range(1, max(nummern) + 1))
        fehlend = sorted(erwartet - set(nummern))
        hinweis = f"  ⚠️  fehlt: {fehlend}" if fehlend else ""
        if fehlend:
            mangel = True
        print(f"  {g} {name:32s} {anzahl:2d} Punkte (1–{max(nummern)}){hinweis}")

    print(f"\n  Gesamt: {gesamt} Prüfpunkte")

    print("\n── Gruppenüberschriften vorhanden? ──")
    for g, name in GRUPPEN.items():
        # Überschrift darf "## B —" oder "## B+ —" lauten
        if not re.search(rf"^## {re.escape(g)}\+?\s+—", text, re.M):
            print(f"  ⚠️  Überschrift für Gruppe {g} fehlt")
            mangel = True
    if not mangel:
        print("  alle vorhanden")

    # K7 — Zuordnungstreue. Das Tor meldete fünf Punkte, die es nicht maß;
    # aufgefallen ist das nur, weil jemand von Hand nachschaute. Ab hier
    # vergleicht die Maschine die Ebene-1-Liste mit den Prüfungen im Tor.
    print("\n── Zuordnung Gerüst ↔ Tor (K7) ──")
    if not GATE.exists():
        print(f"  ⚠️  {GATE} nicht gefunden")
        mangel = True
    else:
        m = re.search(r"\*\*Ebene 1 — Tor[^\n]*\*\*\n([^\n]+)", text)
        if not m:
            print("  ⚠️  Ebene-1-Liste im Gerüst nicht gefunden")
            mangel = True
        else:
            im_geruest = set(re.findall(r"\b([A-N]\d+)\b", m.group(1)))
            im_tor: set[str] = set()
            for label in re.findall(r'pruefe\("([^"]+)"', GATE.read_text(encoding="utf-8")):
                im_tor.update(t for t in label.split("/") if re.fullmatch(r"[A-N]\d+", t))

            nur_geruest = sorted(im_geruest - im_tor)
            nur_tor = sorted(im_tor - im_geruest)
            erfunden = sorted(p for p in im_tor if int(p[1:]) not in punkte.get(p[0], {}))

            print(f"  Gerüst nennt {len(im_geruest)}, Tor meldet {len(im_tor)} Punkte")
            if erfunden:
                print(f"  ⚠️  Tor meldet Punkte, die im Gerüst nicht existieren: {erfunden}")
                mangel = True
            if nur_geruest:
                print(f"  ⚠️  in Ebene 1 gelistet, aber im Tor nicht geprüft: {nur_geruest}")
                mangel = True
            if nur_tor:
                print(f"  ⚠️  im Tor geprüft, aber in Ebene 1 nicht gelistet: {nur_tor}")
                mangel = True
            if not (erfunden or nur_geruest or nur_tor):
                print("  deckungsgleich")

    print("\n── Gewichtung ──")
    gewichte = re.findall(r"^\|\s*([A-N])\s+[^|]+\|\s*(\d+)\s*%", text, re.M)
    summe = sum(int(w) for _, w in gewichte)
    genannt = {g for g, _ in gewichte}
    print(f"  {len(gewichte)} Gruppen gewichtet, Summe {summe} %")
    if summe != 100:
        print(f"  ⚠️  Gewichte summieren sich auf {summe} %, nicht 100 %")
        mangel = True
    fehlende_gewichte = set(GRUPPEN) - genannt - {"K"}  # K ist Korrekturfaktor
    if fehlende_gewichte:
        print(f"  ⚠️  ohne Gewicht: {sorted(fehlende_gewichte)}")
        mangel = True

    if doppelt:
        print(f"\n⚠️  Doppelte Kennungen: {doppelt}")
        mangel = True

    if ohne_blocker:
        print(f"\n⚠️  Punkte ohne erkennbares Blocker-Kriterium: {ohne_blocker}")
        mangel = True

    print("\n" + ("⚠️  MÄNGEL GEFUNDEN" if mangel else "✅ Gerüst vollständig und widerspruchsfrei"))
    return 1 if mangel else 0


if __name__ == "__main__":
    sys.exit(main())
