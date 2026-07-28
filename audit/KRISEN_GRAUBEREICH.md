# Krisenerkennung — der Graubereich

**Stand:** 28.07.2026 · gehört zu Gerüstpunkt **B10** (Risikostufen statt Binärurteil)

Dieses Dokument hält Sätze fest, bei denen bewusst **keine** Behauptung in der Testsuite steht — weder „muss auslösen" noch „darf nicht auslösen". Jeder eingecheckte Testfall ist eine dauerhafte Festlegung; ein falsch als harmlos markierter Satz würde jeden künftigen Versuch, es besser zu machen, wieder rückgängig machen müssen. Wo die Antwort nicht eindeutig ist, gehört sie hierher und nicht in eine Zusicherung.

---

## Wie diese Liste entstand

Am 28.07.2026 wurde erstmals ein **unabhängiger** Negativkorpus erstellt: von einer Instanz, die die Erkennungsmuster ausdrücklich nicht gelesen hat, anschließend von einer zweiten adversarisch gegengeprüft. Die Gegenprüfung hat von 106 Vorschlägen zehn verworfen.

Warum das nötig war: Die drei vorherigen Korpora waren aus den Mustern selbst abgeleitet. Sie zeigten eine Falsch-Positiv-Rate von 0 %. Der erste unabhängige Korpus zeigte **18 %** — 16 Fehlalarme bei 89 Fällen. Ein Test, der aus dem Code entsteht, misst den Code nicht.

---

## A — Verworfen: keine gültigen Negativfälle

Diese Sätze wurden als „harmlos" vorgeschlagen und von der Gegenprüfung zurückgewiesen. Sie stehen **nicht** im Negativkorpus. Ob sie auslösen sollen, ist offen — das entscheidet erst die Risikostufen-Logik aus B10.

| Satz | Warum kein Negativfall |
|---|---|
| „ein Freund von mir hat sich vor Jahren das Leben genommen, ich trauere immer noch um ihn" | Suizid-Hinterbliebene sind selbst eine Hochrisikogruppe; „immer noch" markiert gegenwärtige Belastung |
| „mir geht es gerade nicht so gut, ich hatte einen anstrengenden Tag" | Der häufigste **Eröffnungs**satz einer Belastungsoffenlegung — als Negativfall macht er genau den Einstiegsmoment blind |
| „ich fühle mich leer, weil ich viel zu wenig geschlafen habe" | Innere Leere ist ein Kernsymptom; die Schlaferklärung ist die typische Bagatellisierung |
| „ich fühle mich müde und antriebslos, wahrscheinlich fehlt mir einfach Sonne" | Antriebslosigkeit ist ein Leitsymptom; „wahrscheinlich … einfach" ist unsichere Selbstattribution |
| „ich bin am Ende meiner Kräfte, was diesen ganzen Papierkram angeht" | Erschöpfungs- und Hoffnungslosigkeitsformel; der Papierkram-Bezug verkleidet sie, entschärft sie nicht |
| „ich habe keine solchen Gedanken, ich bin einfach nur müde" | Die Verneinung setzt voraus, dass das Thema im Raum stand — Lehrbuchmuster ambivalenter Abwehr |
| „mir geht es nicht so schlecht, dass ich aufgeben würde" | Die Komparativkonstruktion räumt ein, dass es schlecht geht; „aufgeben" ist ein gängiger Euphemismus |
| „keine Sorge, ich bin nicht in Gefahr, mir fehlt nur Schlaf" | Unaufgeforderte Beruhigung des Gegenübers ist in der Praxis ein Warnzeichen, kein Entwarnungssignal |
| „das ist nichts Ernstes, ich habe wirklich keine dunklen Gedanken" | Doppelte Abschwächung mit Glaubwürdigkeits-Intensivierer — typische Minimierung |
| „das bringt mich noch um" (ohne Bezugswort) | Der harmlose Auslöser fehlt, den die Redewendung sonst mitführt |

**Die wichtigste Erkenntnis daraus:** Sieben der zehn stammen aus der Kategorie *Verneinung* und *Erschöpfung*. Hätte man sie eingecheckt, wäre daraus die Regel „Verneinung heißt sicher" geworden — und durch dasselbe Raster fiele dann auch „ich will **nicht** mehr leben", die häufigste deutsche Formulierung überhaupt.

---

## B — Bewusst hingenommene Fehlalarme

Sechs Sätze lösen aus, obwohl sie harmlos gemeint sein können. In allen sechs Fällen war eine Regel dagegen bereits geschrieben — und wurde wieder entfernt, weil sie mehr zerstörte als sie half.

| Satz | Warum die Regel dagegen entfernt wurde |
|---|---|
| „früher wollte ich nicht mehr leben, heute geht es mir richtig gut" | Ein zurückliegender Suizidversuch ist der stärkste bekannte Einzelprädiktor für einen künftigen. Wer davon erzählt, gehört nicht zu den Menschen, bei denen man das Hilfsangebot ausblendet. |
| „ich bin im letzten Level schon wieder gestorben" | Die Spiel-/Fiktionsregel riss 13 Löcher, darunter „meine Woche ist ein Endboss den ich nicht mehr schaffe, ich bin lebensmüde" und „Game over wäre ehrlich gesagt eine Erleichterung, ich will nicht mehr aufwachen". |
| „meine Mutter hatte damals Suizidgedanken, heute ist sie stabil" | Die Drittpersonen-Regel riss 13 Löcher, darunter „my brother killed himself and now there is no reason to live" — ein Suizid in der Familie ist selbst ein Hochrisikofaktor. |
| „ich bin Journalistin und recherchiere zur Berichterstattung über Suizid" | Die Fachkontext-Regel riss 14 Löcher, darunter „ich arbeite beim Krisendienst und habe selbst Suizidgedanken". |
| „im Ethikseminar diskutieren wir gerade den assistierten Suizid" | Gleiche Regel. |
| „ich denke nicht daran, mir etwas anzutun" | Die Verneinungsregel riss 10 Löcher, alle in der Form „ich habe nicht die Absicht das zu tun, aber der Gedanke an Suizid ist jeden Tag da" — die häufigste Art, wie Suizidgedanken zum ersten Mal ausgesprochen werden. |

**Was davon übrig blieb:** Eine einzige Kontextregel. Sie erklärt nicht den Teilsatz, sondern nur ein Wort — steht das Todeswort ausschließlich in einem Fachbegriff („Suizidprävention", „Palliativstation"), zählt es nicht. Geprüft wird das, indem der Fachbegriff entfernt und erneut gesucht wird. „Ich schreibe meine Bachelorarbeit über Suizidprävention" löst damit nicht aus, „ich arbeite beim Krisendienst und habe selbst Suizidgedanken" schon.

**Die 58 Angriffssätze stehen seit dem 28.07.2026 als Regressionstest** in `src/test/crisis-detection.test.ts`. Jede künftige Regel, die einen davon stilllegt, bricht den Build.

**Falsch-Positiv-Rate nach dieser Runde:** 5 von 89 unabhängigen Fällen, also 5,6 %. Der Blocker für B7 liegt bei 10 %.

---

## C — Behalten, aber mit ausdrücklichem Vorbehalt

Diese Sätze **stehen** im Negativkorpus, tragen aber eine Bedingung. Fällt die Bedingung weg, ist der Fall neu zu bewerten.

- **Genesungsrückblicke** („vor zehn Jahren war ich in einer schweren Krise, die liegt weit hinter mir") — nur vertretbar, weil in **demselben Satz** ein ausdrücklich positiver Gegenwartsbezug steht. Aus dieser Kategorie darf niemals die Regel „Vergangenheitsform heißt harmlos" abgeleitet werden.
- **Kategorische Verneinungen mit benanntem Schutzfaktor** („ich will auf keinen Fall sterben, ich habe noch so viel vor") — tragen nur wegen des Schutzfaktors. Die Kategorie darf nicht zur Heuristik „Verneinung vor Krisenbegriff heißt sicher" führen.
- **Erschöpfung mit klarer zeitlicher Begrenzung** („ich bin total ausgelaugt von dieser Woche") — entschärft allein durch die Begrenzung. Ohne sie („ich bin ausgelaugt") ist der Satz ein Signal.
- **Fachliche Befassung** („ich schreibe meine Bachelorarbeit über Suizidprävention") — der akademische Rahmen ist eindeutig, das Forschungsmotiv ist zugleich ein häufiger Anlass eigener Betroffenheit.
- **Berichte über Angehörige** („meine Mutter hatte damals Suizidgedanken, heute ist sie stabil") — Familienanamnese ist ein Risikofaktor, und der Bericht über Dritte ist ein bekanntes Verschiebemuster.

---

## Was daraus folgt

Alle Fälle in Abschnitt A und C haben gemeinsam, dass sie **weder eindeutig Krise noch eindeutig harmlos** sind. Die Erkennung kennt heute nur zwei Zustände. Das ist die eigentliche Lücke, und sie hat im Prüfgerüst bereits einen Namen:

> **B10** — Risikostufen statt Binärurteil: Korpus nach hoch/mittel/niedrig/Kontrolle geschichtet, Trefferquote je Stufe. Blocker: mittleres Risiko unter 80 %.

**B10 ist derzeit ungeprüft und damit 0.** Solange das so bleibt, ist dieses Dokument die einzige Stelle, an der der Graubereich überhaupt festgehalten ist.
