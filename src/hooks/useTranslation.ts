import { useState, useEffect } from "react";
import { allTranslations, type Translations } from "@/translations";

export type Language = "en" | "de";

// Re-export merged translations for backward compatibility
export const translations: Translations = allTranslations;

// Legacy marker — all flat key-value translations now live in src/translations/*.ts
// Only exerciseTranslations and topicTranslations remain here (different structure).



// Exercise translations
export const exerciseTranslations: Record<string, { 
  en: { title: string; description: string; longDescription: string; steps?: string[]; prompts?: string[] }; 
  de: { title: string; description: string; longDescription: string; steps?: string[]; prompts?: string[] } 
}> = {
  "breathing-60": {
    en: { title: "60-Second Breathing", description: "Quick calm when you need it most", longDescription: "A rapid relaxation technique using deep diaphragmatic breathing. Perfect for moments of acute stress or before important situations." },
    de: { 
      title: "60-Sekunden-Atmung", 
      description: "Schnelle Ruhe, wenn du sie am meisten brauchst", 
      longDescription: "Eine schnelle Entspannungstechnik mit tiefer Zwerchfellatmung. Perfekt für Momente akuten Stresses oder vor wichtigen Situationen.",
      steps: [
        "Mach es dir bequem. Wenn du möchtest, kannst du die Augen schließen. Die Stimme führt dich durch die Übung.",
        "Atme langsam durch die Nase ein... 1... 2... 3... 4...",
        "Halte sanft... 1... 2...",
        "Atme langsam durch den Mund aus... 1... 2... 3... 4... 5... 6...",
        "Atme ein... spüre, wie Ruhe in deinen Körper fließt...",
        "Halte...",
        "Atme aus... lass Anspannung los...",
        "Atme ein... 1... 2... 3... 4...",
        "Halte...",
        "Atme vollständig aus... 1... 2... 3... 4... 5... 6...",
        "Noch ein Atemzug... tief und langsam...",
        "Halte...",
        "Und loslassen... vollständig entspannen...",
        "Die Übung ist beendet. Öffne sanft deine Augen und nimm wahr, wie du dich jetzt fühlst."
      ]
    }
  },
  "thought-reframing": {
    en: { title: "Thought Reframing", description: "Challenge unhelpful thinking patterns", longDescription: "Based on Cognitive Behavioral Therapy (CBT), this exercise helps you identify, examine, and reframe thoughts that may be causing distress." },
    de: { 
      title: "Gedanken umformulieren", 
      description: "Hinterfrage nicht hilfreiche Denkmuster", 
      longDescription: "Basierend auf der Kognitiven Verhaltenstherapie (KVT) hilft dir diese Übung, Gedanken zu identifizieren, zu untersuchen und umzuformulieren, die Stress verursachen könnten.",
      steps: [
        "Denke an eine Situation, die dich beschäftigt",
        "Welcher Gedanke kommt bei dieser Situation auf?",
        "Wie lässt dich dieser Gedanke fühlen? (Intensität 1-10)",
        "Welche Beweise unterstützen diesen Gedanken?",
        "Welche Beweise sprechen gegen diesen Gedanken?",
        "Gibt es eine andere Art, diese Situation zu betrachten?",
        "Was würdest du einem Freund sagen, der diesen Gedanken hat?",
        "Formuliere einen ausgewogeneren Gedanken zu dieser Situation",
        "Wie fühlst du dich jetzt? (Intensität 1-10)",
        "Bemerke jede Veränderung in deinen Gefühlen. Auch kleine Änderungen zählen."
      ],
      prompts: [
        "Welcher Gedanke beschäftigt dich gerade?",
        "Ist dieser Gedanke zu 100% wahr, oder gibt es Ausnahmen?",
        "Was ist das Schlimmste, das passieren könnte? Könntest du damit umgehen?",
        "Was ist das Beste, das passieren könnte?",
        "Was passiert am wahrscheinlichsten?"
      ]
    }
  },
  "journaling-prompts": {
    en: { title: "Guided Journaling", description: "Reflective prompts for self-discovery", longDescription: "Structured prompts to help you explore your thoughts and feelings. Writing helps process emotions and gain clarity." },
    de: { 
      title: "Geführtes Tagebuchschreiben", 
      description: "Reflektierende Impulse zur Selbstentdeckung", 
      longDescription: "Strukturierte Impulse, die dir helfen, deine Gedanken und Gefühle zu erkunden. Schreiben hilft, Emotionen zu verarbeiten und Klarheit zu gewinnen.",
      steps: [
        "Finde einen ruhigen Ort und etwas zum Schreiben",
        "Nimm 3 tiefe Atemzüge, um dich zu zentrieren",
        "Wähle einen Impuls, der dich anspricht",
        "Schreibe frei, ohne zu bearbeiten oder zu urteilen",
        "Lies, was du geschrieben hast, mit Mitgefühl",
        "Unterstreiche Erkenntnisse oder Muster, die dir auffallen",
        "Schreibe eine Sache auf, die du dir merken möchtest"
      ],
      prompts: [
        "Was fühle ich gerade und wo spüre ich es in meinem Körper?",
        "Was würde ich tun, wenn ich wüsste, dass ich nicht scheitern kann?",
        "Was vermeide ich und warum?",
        "Was muss ich mir selbst verzeihen?",
        "Was gibt mir Energie und was nimmt sie mir?",
        "Was würde mein weisestes Selbst mir jetzt sagen?",
        "Wofür bin ich heute dankbar, auch wenn es klein ist?"
      ]
    }
  },
  "values-clarification": {
    en: { title: "Values Clarification", description: "Discover what truly matters to you", longDescription: "Understanding your core values helps guide decisions and brings meaning to daily life. This exercise helps you identify and prioritize what matters most." },
    de: { 
      title: "Werteklärung", 
      description: "Entdecke, was dir wirklich wichtig ist", 
      longDescription: "Das Verstehen deiner Kernwerte hilft bei Entscheidungen und bringt Bedeutung in den Alltag. Diese Übung hilft dir, herauszufinden, was dir am wichtigsten ist.",
      steps: [
        "Denke an eine Zeit, in der du dich lebendig und erfüllt gefühlt hast",
        "Was ist passiert? Welche Werte hast du gelebt?",
        "Denke jetzt an eine Zeit, als du frustriert oder vom Weg abgekommen warst",
        "Welcher Wert könnte verletzt worden sein?",
        "Wähle aus der Liste unten deine Top 10 Werte",
        "Reduziere auf deine Top 5",
        "Identifiziere deine 3 Kernwerte",
        "Schreibe für jeden Wert eine Möglichkeit, wie du ihn diese Woche leben kannst",
        "Reflektiere: Wie sehr stimmt dein Leben mit diesen Werten überein?"
      ],
      prompts: [
        "Authentizität • Abenteuer • Balance • Mitgefühl • Mut",
        "Kreativität • Familie • Freiheit • Wachstum • Gesundheit",
        "Ehrlichkeit • Unabhängigkeit • Freude • Gerechtigkeit • Freundlichkeit",
        "Wissen • Liebe • Frieden • Sinn • Sicherheit",
        "Dienst • Spiritualität • Erfolg • Vertrauen • Weisheit"
      ]
    }
  },
  "boundary-prep": {
    en: { title: "Boundary Setting", description: "Prepare to communicate your limits", longDescription: "Setting boundaries can feel challenging but is essential for wellbeing. This exercise helps you prepare for boundary conversations with clarity and confidence." },
    de: { 
      title: "Grenzen setzen", 
      description: "Bereite dich darauf vor, deine Grenzen zu kommunizieren", 
      longDescription: "Grenzen zu setzen kann sich herausfordernd anfühlen, ist aber wichtig für dein Wohlbefinden. Diese Übung hilft dir, Grenzgespräche mit Klarheit und Selbstvertrauen vorzubereiten.",
      steps: [
        "Denke an eine Situation, in der du eine Grenze setzen musst",
        "Was genau passiert, das sich nicht okay anfühlt?",
        "Wie beeinflusst dich diese Situation? (emotional, körperlich, praktisch)",
        "Was brauchst du stattdessen?",
        "Nutze dieses Format: \"Wenn [Verhalten], fühle ich [Emotion], und ich brauche [Grenze]\"",
        "Übe es laut zu sagen, ruhig und klar",
        "Antizipiere mögliche Reaktionen. Wie bleibst du standhaft?",
        "Erinnere dich: Grenzen setzen ist ein Akt der Selbstachtung",
        "Visualisiere, wie das Gespräch gut verläuft",
        "Bemerke, wie es sich anfühlt, für dich einzustehen"
      ],
      prompts: [
        "\"Das ist für mich nicht verfügbar.\"",
        "\"Ich brauche etwas Zeit, um darüber nachzudenken.\"",
        "\"Das funktioniert für mich nicht.\"",
        "\"Ich verstehe, und meine Antwort ist weiterhin nein.\"",
        "\"Du bist mir wichtig, und ich muss auch auf mich achten.\""
      ]
    }
  },
  "grounding-54321": {
    en: { title: "5-4-3-2-1 Grounding", description: "Anchor to the present moment", longDescription: "A sensory-based grounding technique that quickly brings you back to the present moment. Especially helpful during anxiety or overwhelm." },
    de: { 
      title: "5-4-3-2-1 Erdung", 
      description: "Verankere dich im gegenwärtigen Moment", 
      longDescription: "Eine sensorische Erdungstechnik, die dich schnell in den gegenwärtigen Moment zurückbringt. Besonders hilfreich bei Angst oder Überforderung.",
      steps: [
        "Nimm einen langsamen, tiefen Atemzug",
        "Schau dich um und benenne 5 Dinge, die du SEHEN kannst",
        "Beachte Details: Farben, Formen, Texturen...",
        "Konzentriere dich jetzt auf 4 Dinge, die du BERÜHREN kannst",
        "Spüre die Texturen, Temperaturen, Empfindungen...",
        "Höre auf 3 Dinge, die du HÖREN kannst",
        "Bemerke Geräusche nah und fern...",
        "Identifiziere 2 Dinge, die du RIECHEN kannst",
        "Und 1 Sache, die du SCHMECKEN kannst",
        "Nimm noch einen tiefen Atemzug",
        "Bemerke, wie du dich jetzt fühlst, geerdet in diesem Moment"
      ]
    }
  }
};

// Topic translations with steps
export const topicTranslations: Record<string, { 
  en: { title: string; description: string; longDescription: string; steps?: { title: string; description: string }[]; learn?: { title: string; content: string; reflectionQuestion?: string }[] }; 
  de: { title: string; description: string; longDescription: string; steps?: { title: string; description: string }[]; learn?: { title: string; content: string; reflectionQuestion?: string }[] } 
}> = {
  "stress-overwhelm": {
    en: { title: "Stress & Overwhelm", description: "When everything feels like too much", longDescription: "Stress is your body's natural response to demands, but chronic overwhelm can drain your energy and clarity. This path helps you understand your stress patterns and build sustainable coping strategies." },
    de: { 
      title: "Stress & Überforderung", 
      description: "Wenn alles zu viel wird", 
      longDescription: "Stress ist die natürliche Reaktion deines Körpers auf Anforderungen, aber chronische Überforderung kann deine Energie und Klarheit aufzehren. Dieser Pfad hilft dir, deine Stressmuster zu verstehen und nachhaltige Bewältigungsstrategien aufzubauen.",
      steps: [
        { title: "Benenne, was dich belastet", description: "Identifiziere die spezifischen Quellen deines Stresses" },
        { title: "Erkunde deine Stresssignale", description: "Erkenne, wie sich Stress in deinem Körper und Geist zeigt" },
        { title: "Probiere eine Erdungsübung", description: "Übe eine beruhigende Technik, um sofortige Anspannung zu reduzieren" },
        { title: "Finde eine kleine Veränderung", description: "Finde eine Sache, die du anpassen oder loslassen kannst" },
        { title: "Erstelle einen Stressbewältigungsplan", description: "Baue ein personalisiertes Werkzeugset zum Umgang mit Überforderung" }
      ],
      learn: [
        { title: "Was ist Stress eigentlich?", content: "Stress ist die Alarmreaktion deines Nervensystems. Wenn dein Gehirn eine Bedrohung wahrnimmt – real oder eingebildet – löst es die Kampf-oder-Flucht-Reaktion aus und flutet deinen Körper mit Cortisol und Adrenalin. Das war nützlich, als wir physischen Gefahren gegenüberstanden, aber heute aktiviert sich dasselbe System bei E-Mails, Deadlines und sozialen Konflikten.\n\nChronischer Stress hält deinen Körper in einem Zustand erhöhter Wachsamkeit, was mit der Zeit zu Erschöpfung, Angst, Konzentrationsschwierigkeiten und sogar körperlichen Symptomen wie Kopfschmerzen oder Muskelverspannungen führen kann.", reflectionQuestion: "Wenn du gestresst bist, wo bemerkst du es zuerst in deinem Körper?" },
        { title: "Der Stresszyklus", content: "Dr. Emily Nagoski beschreibt Stress als einen Zyklus, der abgeschlossen werden muss. Der Stressor (das, was Stress verursacht) und die Stressreaktion (was dein Körper fühlt) sind zwei verschiedene Dinge. Selbst nachdem der Stressor weg ist, kann der Stress noch in deinem Körper leben.\n\nKörperliche Bewegung, tiefes Atmen, kreativer Ausdruck, Lachen und menschliche Verbindung sind alles Wege, den Stresszyklus zu \"vollenden\" und deinem Nervensystem Sicherheit zu signalisieren.", reflectionQuestion: "Was hilft dir normalerweise, Anspannung loszulassen? Erlaubst du es dir?" },
        { title: "Überforderung vs. Stress", content: "Überforderung entsteht, wenn die Anforderungen deine wahrgenommene Bewältigungskapazität übersteigen. Es geht nicht nur darum, zu viel zu tun zu haben – es geht um das Gefühl, es nicht bewältigen zu können. Diese Wahrnehmung ist der Schlüssel: Manchmal kann es helfen, umzudenken, was wirklich dringend ist, Perfektionismus loszulassen oder um Hilfe zu bitten.\n\nEine praktische Technik: Die \"2-Minuten-Regel\". Wenn etwas weniger als 2 Minuten dauert, mach es jetzt. Sonst schreib es auf und plane es ein. Das reduziert die mentale Belastung erheblich.", reflectionQuestion: "Was auf deiner Liste ist wirklich dringend, und was könnte warten?" }
      ]
    }
  },
  "relationships": {
    en: { title: "Relationships", description: "Navigating connections with others", longDescription: "Healthy relationships require communication, boundaries, and self-awareness. This path helps you explore your relationship patterns and develop deeper, more authentic connections." },
    de: { 
      title: "Beziehungen", 
      description: "Verbindungen mit anderen navigieren", 
      longDescription: "Gesunde Beziehungen erfordern Kommunikation, Grenzen und Selbstbewusstsein. Dieser Pfad hilft dir, deine Beziehungsmuster zu erkunden und tiefere, authentischere Verbindungen zu entwickeln.",
      steps: [
        { title: "Reflektiere über eine Beziehung", description: "Wähle eine Beziehung, die du tiefer erkunden möchtest" },
        { title: "Identifiziere deine Bedürfnisse", description: "Was brauchst du von dieser Beziehung?" },
        { title: "Erkunde Kommunikationsmuster", description: "Wie drückst du dich aus? Was könnte sich ändern?" },
        { title: "Übe ein Gespräch", description: "Bereite dich auf ein schwieriges oder wichtiges Gespräch vor" },
        { title: "Setze eine Intention", description: "Definiere einen kleinen Schritt zur Verbesserung dieser Verbindung" }
      ],
      learn: [
        { title: "Bindungsstile", content: "Deine frühen Beziehungen zu Bezugspersonen haben geprägt, wie du heute mit anderen in Verbindung trittst. Der Psychologe John Bowlby identifizierte vier Bindungsstile:\n\n• Sicher: Wohl mit Nähe und Unabhängigkeit\n• Ängstlich: Angst vor Verlassenwerden, Bedürfnis nach Bestätigung\n• Vermeidend: Unbehagen mit Nähe, Wertschätzung von Unabhängigkeit\n• Desorganisiert: Mischung aus ängstlichen und vermeidenden Mustern\n\nDeinen Bindungsstil zu verstehen bedeutet nicht, dich zu etikettieren – es geht darum, Muster zu erkennen, damit du bewusst wählen kannst, wie du reagierst.", reflectionQuestion: "Welches Bindungsmuster fühlt sich für dich am vertrautesten an?" },
        { title: "Die vier Reiter des Konflikts", content: "Beziehungsforscher John Gottman identifizierte vier Kommunikationsmuster, die Beziehungsbrüche vorhersagen:\n\n1. Kritik: Den Charakter angreifen statt Verhalten anzusprechen\n2. Verachtung: Spott, Augenrollen, Überlegenheit\n3. Defensivität: Verantwortung abwehren\n4. Mauern: Abschalten und Rückzug\n\nDie Gegenmittel: Verwende \"Ich\"-Aussagen, drücke Wertschätzung aus, übernimm Verantwortung und nimm dir Pausen, wenn du überfordert bist.", reflectionQuestion: "Welches dieser Muster erkennst du in deiner eigenen Kommunikation?" },
        { title: "Gesunde vs. ungesunde Verbindung", content: "Gesunde Beziehungen beinhalten gegenseitigen Respekt, Vertrauen, ehrliche Kommunikation und Raum für individuelles Wachstum. Sie erfordern keine Perfektion – Konflikte sind normal. Was zählt, ist wie ihr nach Meinungsverschiedenheiten repariert.\n\nZeichen ungesunder Dynamiken: Auf Eierschalen laufen, ständig eigene Bedürfnisse opfern, sich kontrolliert oder manipuliert fühlen, oder den Kontakt zur eigenen Identität verlieren.", reflectionQuestion: "Fühlst du dich in deinen engsten Beziehungen frei, du selbst zu sein?" }
      ]
    }
  },
  "family": {
    en: { title: "Family", description: "Complex dynamics and healing", longDescription: "Family relationships can be our deepest source of both joy and pain. This path helps you navigate complex family dynamics with more clarity and peace." },
    de: { 
      title: "Familie", 
      description: "Komplexe Dynamiken und Heilung", 
      longDescription: "Familienbeziehungen können unsere tiefste Quelle für Freude und Schmerz sein. Dieser Pfad hilft dir, komplexe Familiendynamiken mit mehr Klarheit und Frieden zu navigieren.",
      steps: [
        { title: "Kartiere deine Familienlandschaft", description: "Erkunde die wichtigsten Beziehungen und Dynamiken" },
        { title: "Identifiziere vererbte Muster", description: "Welche Verhaltensweisen oder Überzeugungen hast du von der Familie gelernt?" },
        { title: "Verarbeite eine bestimmte Erinnerung", description: "Arbeite einen Moment durch, der dich noch beeinflusst" },
        { title: "Schreibe eine Erzählung um", description: "Finde eine neue Perspektive auf eine alte Geschichte" },
        { title: "Wähle deine Reaktion", description: "Entscheide, wie du in Zukunft auftreten möchtest" },
        { title: "Übe Selbstmitgefühl", description: "Lass Schuld oder Scham bezüglich Familienbeziehungen los" }
      ],
      learn: [
        { title: "Systemisches Denken in der Familie", content: "Familientherapeut Murray Bowen schlug vor, dass Familien als emotionale Systeme funktionieren. Jedes Mitglied spielt eine Rolle, und wenn eine Person sich ändert, verschiebt sich das gesamte System. Rollen wie \"der Kümmerer\", \"der Friedensstifter\" oder \"der Rebell\" entwickeln sich oft unbewusst, um das Familiengleichgewicht aufrechtzuerhalten.\n\nDiese Rollen zu erkennen kann dir helfen zu verstehen, warum du in Familiensituationen auf bestimmte Weise reagierst, und dir die Freiheit geben, dich anders zu entscheiden.", reflectionQuestion: "Welche Rolle hast du in deiner Familie als Kind gespielt? Spielst du sie noch?" },
        { title: "Generationenübergreifende Muster", content: "Forschung zeigt, dass Trauma, Kommunikationsstile und emotionale Muster über Generationen weitergegeben werden können – nicht nur durch DNA, sondern durch erlerntes Verhalten. Deine Eltern haben dich wahrscheinlich mit den Werkzeugen erzogen, die sie hatten, die durch ihre eigene Erziehung geprägt waren.\n\nEs geht nicht um Schuld – es geht um Verständnis. Wenn du vererbte Muster erkennst, gewinnst du die Kraft, Kreisläufe zu durchbrechen und neue, gesündere zu schaffen.", reflectionQuestion: "Welche Muster aus deiner Familie möchtest du behalten, und welche möchtest du ändern?" }
      ]
    }
  },
  "self-esteem": {
    en: { title: "Self-Esteem", description: "Building a kinder relationship with yourself", longDescription: "Self-esteem isn't about being perfect—it's about accepting yourself as you are while growing into who you want to become. This path helps you build genuine self-worth." },
    de: { 
      title: "Selbstwertgefühl", 
      description: "Eine freundlichere Beziehung zu dir selbst aufbauen", 
      longDescription: "Selbstwertgefühl bedeutet nicht, perfekt zu sein – es geht darum, dich so zu akzeptieren, wie du bist, während du zu dem wirst, der du sein möchtest. Dieser Pfad hilft dir, echtes Selbstwertgefühl aufzubauen.",
      steps: [
        { title: "Bemerke deinen inneren Kritiker", description: "Werde dir negativer Selbstgespräche bewusst" },
        { title: "Hinterfrage einen einschränkenden Glauben", description: "Stelle eine Sache in Frage, die du über dich glaubst" },
        { title: "Erkenne deine Stärken an", description: "Erkenne, was du der Welt gibst" },
        { title: "Übe Selbstmitgefühl", description: "Behandle dich so, wie du einen guten Freund behandeln würdest" },
        { title: "Feiere kleine Erfolge", description: "Bemerke und schätze deine täglichen Leistungen" },
        { title: "Erstelle eine Affirmation", description: "Schreibe eine Aussage, die deinen wahren Wert widerspiegelt" }
      ],
      learn: [
        { title: "Selbstwert vs. Selbstmitgefühl", content: "Selbstwert ist, wie du dich bewertest – oft im Vergleich mit anderen. Das Problem? Er schwankt mit Erfolg und Misserfolg. Dr. Kristin Neff schlägt vor, dass Selbstmitgefühl nachhaltiger ist: Dich selbst so zu behandeln, wie du einen guten Freund behandeln würdest.\n\nSelbstmitgefühl hat drei Komponenten:\n• Selbstfreundlichkeit (statt Selbstkritik)\n• Gemeinsame Menschlichkeit (erkennen, dass jeder kämpft)\n• Achtsamkeit (Schmerz anerkennen, ohne sich damit zu identifizieren)", reflectionQuestion: "Wie sprichst du mit dir selbst, wenn du einen Fehler machst? Würdest du dasselbe zu einem Freund sagen?" },
        { title: "Der innere Kritiker", content: "Jeder hat einen inneren Kritiker – eine Stimme, die urteilt, vergleicht und katastrophisiert. Diese Stimme entwickelte sich oft als Schutzmechanismus: Indem du dich selbst zuerst kritisierst, versuchtest du, Kritik von anderen zu vermeiden.\n\nDer Schlüssel ist nicht, den Kritiker zum Schweigen zu bringen, sondern ihn zu bemerken, seinen Ursprung zu verstehen und bewusst eine andere Reaktion zu wählen. Wenn du dich bei Selbstkritik ertappst, versuche: \"Ich bemerke, dass ich gerade hart zu mir bin. Wie würde Mitgefühl stattdessen klingen?\"", reflectionQuestion: "Was sagt dein innerer Kritiker am häufigsten? Woher könnte diese Stimme stammen?" },
        { title: "Echtes Selbstvertrauen aufbauen", content: "Echtes Selbstvertrauen bedeutet nicht, nie an sich zu zweifeln – es bedeutet darauf zu vertrauen, dass du mit dem umgehen kannst, was kommt. Es wächst durch:\n\n• Kleine Risiken eingehen und das Ergebnis überleben\n• Versprechen an dich selbst halten\n• Deine Stärken und Bemühungen anerkennen (nicht nur Ergebnisse)\n• Grenzen setzen, die deine Werte ehren\n• Unvollkommenheit als Teil des Menschseins akzeptieren", reflectionQuestion: "Was ist ein kleines Versprechen, das du dir heute geben – und halten – könntest?" }
      ]
    }
  },
  "work-burnout": {
    en: { title: "Work & Burnout", description: "Finding balance and preventing exhaustion", longDescription: "Burnout happens when demands consistently exceed your resources. This path helps you recognize warning signs, set better boundaries, and rediscover meaning in your work." },
    de: { 
      title: "Arbeit & Burnout", 
      description: "Balance finden und Erschöpfung vorbeugen", 
      longDescription: "Burnout entsteht, wenn Anforderungen dauerhaft deine Ressourcen übersteigen. Dieser Pfad hilft dir, Warnzeichen zu erkennen, bessere Grenzen zu setzen und den Sinn in deiner Arbeit wiederzuentdecken.",
      steps: [
        { title: "Bewerte dein Burnout-Level", description: "Erkenne, wo du auf dem Erschöpfungsspektrum stehst" },
        { title: "Identifiziere Energiefresser", description: "Welche Aspekte der Arbeit erschöpfen dich am meisten?" },
        { title: "Finde deine Energiequellen", description: "Entdecke, was dich bei der Arbeit und außerhalb auflädt" },
        { title: "Setze eine Grenze", description: "Wähle eine Grenze zum Schutz deines Wohlbefindens" },
        { title: "Verbinde dich wieder mit deinem Sinn", description: "Erinnere dich, warum deine Arbeit für dich wichtig ist" }
      ],
      learn: [
        { title: "Die drei Dimensionen von Burnout", content: "Die WHO klassifiziert Burnout als berufsbedingtes Phänomen mit drei Dimensionen:\n\n1. Erschöpfung: Körperliche und emotionale Erschöpfung\n2. Zynismus: Distanz zur Arbeit, negative oder gleichgültige Einstellung\n3. Reduzierte Wirksamkeit: Gefühl von Inkompetenz oder Unproduktivität\n\nBurnout passiert nicht über Nacht – es ist ein schrittweiser Prozess. Frühe Warnzeichen sind Montags-Angst, emotionale Taubheit bei der Arbeit, Schlafprobleme und Verlust des Interesses an Dingen, die man früher genossen hat.", reflectionQuestion: "Auf einer Skala von 1-10, wie würdest du dich bei jeder dieser drei Dimensionen einschätzen?" },
        { title: "Erholung ist nicht nur Urlaub", content: "Forschung zeigt, dass Urlaub allein Burnout nicht heilt – die Effekte lassen innerhalb von Wochen nach. Nachhaltige Erholung erfordert strukturelle Veränderungen:\n\n• Mikro-Erholung: Regelmäßige Pausen über den Tag (nicht Scrollen – echte Ruhe)\n• Grenzen setzen: Klare Start-/Endzeiten, \"Nein\" zu nicht-essentiellen Anfragen\n• Sinn-Wiederverbindung: Erinnere dich, warum deine Arbeit wichtig ist\n• Soziale Unterstützung: Verbindung mit Kollegen, die verstehen\n• Körperliche Fürsorge: Schlaf, Bewegung, Ernährung\n\nDas Ziel ist nicht, produktiver zu werden – es ist, nachhaltiger zu werden.", reflectionQuestion: "Welche Grenze bei der Arbeit hattest du Angst zu setzen?" }
      ]
    }
  },
  "decisions-direction": {
    en: { title: "Decisions & Direction", description: "Finding clarity when feeling stuck", longDescription: "Making decisions can feel paralyzing, especially when you're unsure of what you want. This path helps you connect with your values and gain clarity on your next steps." },
    de: { 
      title: "Entscheidungen & Richtung", 
      description: "Klarheit finden, wenn du feststeckst", 
      longDescription: "Entscheidungen zu treffen kann sich lähmend anfühlen, besonders wenn du unsicher bist, was du willst. Dieser Pfad hilft dir, dich mit deinen Werten zu verbinden und Klarheit über deine nächsten Schritte zu gewinnen.",
      steps: [
        { title: "Definiere die Entscheidung", description: "Werde dir klar, worüber du eigentlich entscheidest" },
        { title: "Erkunde deine Ängste", description: "Wovor hast du Angst?" },
        { title: "Verbinde dich mit deinen Werten", description: "Was ist dir in dieser Situation am wichtigsten?" },
        { title: "Stelle dir beide Wege vor", description: "Visualisiere dich in jedem Szenario" },
        { title: "Höre auf deinen Körper", description: "Bemerke, was sich körperlich richtig anfühlt" },
        { title: "Mache einen kleinen Schritt", description: "Verpflichte dich zur nächsten kleinen Handlung" }
      ],
      learn: [
        { title: "Warum Entscheidungen schwer fallen", content: "Entscheidungslähmung entsteht oft aus Angst – Angst, die falsche Wahl zu treffen, etwas zu verpassen oder das Ergebnis zu bereuen. Der Psychologe Barry Schwartz nennt dies das \"Paradox der Wahl\": Mehr Optionen können zu weniger Zufriedenheit und mehr Angst führen.\n\nDie Wahrheit ist, dass die meisten Entscheidungen umkehrbar oder anpassbar sind. Und Forschung zeigt, dass Menschen, die \"gut genug\"-Entscheidungen treffen, generell glücklicher sind als diejenigen, die die \"beste\" Entscheidung suchen.", reflectionQuestion: "Was ist das Schlimmste, das realistisch passieren könnte, wenn du \"falsch\" wählst?" },
        { title: "Werte als Kompass", content: "Wenn du dir über deine Werte klar bist, werden Entscheidungen einfacher. Werte sind keine Ziele – sie sind Richtungen. Ein Ziel ist \"befördert werden\", aber der zugrundeliegende Wert könnte \"Wachstum\", \"Sicherheit\" oder \"Anerkennung\" sein.\n\nVersuche dies: Frage bei jeder Entscheidung: \"Welche Option bringt mich näher an die Person, die ich sein möchte?\" Dies verlagert den Fokus von Ergebnissen (die unsicher sind) auf Ausrichtung (die du jetzt spüren kannst).", reflectionQuestion: "Was sind die 3 Werte, die dir im Leben gerade am wichtigsten sind?" }
      ]
    }
  },
  "loneliness": {
    en: { title: "Loneliness", description: "Feeling connected even when alone", longDescription: "Loneliness is a signal that our need for connection isn't being met. This path helps you understand your loneliness and find meaningful ways to connect—with others and yourself." },
    de: { 
      title: "Einsamkeit", 
      description: "Verbunden fühlen, auch wenn du allein bist", 
      longDescription: "Einsamkeit ist ein Signal, dass unser Bedürfnis nach Verbindung nicht erfüllt wird. Dieser Pfad hilft dir, deine Einsamkeit zu verstehen und bedeutungsvolle Wege zu finden, dich zu verbinden – mit anderen und mit dir selbst.",
      steps: [
        { title: "Erkenne das Gefühl an", description: "Erlaube dir, dich einsam zu fühlen" },
        { title: "Erkunde, was fehlt", description: "Welche Art von Verbindung sehnst du dir?" },
        { title: "Übe Selbstverbindung", description: "Baue eine Beziehung zu dir selbst auf" },
        { title: "Identifiziere Verbindungsmöglichkeiten", description: "Wo könntest du die Verbindung finden, die du brauchst?" },
        { title: "Mache einen kleinen sozialen Schritt", description: "Melde dich auf eine kleine Art und Weise" }
      ],
      learn: [
        { title: "Die Wissenschaft der Einsamkeit", content: "Einsamkeit ist nicht dasselbe wie Alleinsein. Du kannst von Menschen umgeben sein und dich dennoch einsam fühlen, oder allein und zutiefst zufrieden sein. Neurowissenschaftler John Cacioppo zeigte, dass Einsamkeit tatsächlich ein biologisches Alarmsignal ist – wie Hunger oder Durst – das uns sagt, dass wir soziale Verbindung brauchen.\n\nChronische Einsamkeit beeinträchtigt die Gesundheit so stark wie 15 Zigaretten pro Tag. Aber die Lösung ist nicht einfach \"unter Menschen sein\" – es geht um die Qualität und Tiefe der Verbindung.", reflectionQuestion: "Fühlst du dich einsamer, wenn du allein bist, oder wenn du mit anderen zusammen bist?" },
        { title: "Arten der Verbindung, die wir brauchen", content: "Forschung identifiziert drei Arten sozialer Verbindung:\n\n• Intim: Tiefes, verletzliches Teilen mit einer nahen Person\n• Relational: Regelmäßige Interaktion mit Freunden, Kollegen\n• Kollektiv: Zugehörigkeit zu einer Gruppe, Gemeinschaft oder Sache\n\nDie meisten Menschen, die sich einsam fühlen, vermissen nicht alle drei – sie vermissen einen bestimmten Typ. Zu identifizieren, welche Art von Verbindung du brauchst, hilft dir, gezielt zu handeln.", reflectionQuestion: "Welche Art von Verbindung fehlt dir in deinem Leben gerade am meisten?" }
      ]
    }
  },
  "boundaries": {
    en: { title: "Boundaries", description: "Protecting your energy and peace", longDescription: "Boundaries aren't walls—they're the guidelines that help you preserve your wellbeing while maintaining healthy relationships. This path helps you set and maintain boundaries with compassion." },
    de: { 
      title: "Grenzen", 
      description: "Deine Energie und deinen Frieden schützen", 
      longDescription: "Grenzen sind keine Mauern – sie sind Richtlinien, die dir helfen, dein Wohlbefinden zu bewahren und gleichzeitig gesunde Beziehungen aufrechtzuerhalten. Dieser Pfad hilft dir, Grenzen mit Mitgefühl zu setzen und aufrechtzuerhalten.",
      steps: [
        { title: "Erkenne, wo Grenzen gebraucht werden", description: "Identifiziere Situationen, in denen du dich erschöpft oder verärgert fühlst" },
        { title: "Verstehe deinen Grenzenstil", description: "Erkunde, wie du aktuell mit Grenzen umgehst" },
        { title: "Definiere eine spezifische Grenze", description: "Werde dir klar, welche Grenze du setzen möchtest" },
        { title: "Übe Nein zu sagen", description: "Übe die Sprache des Grenzensetzens" },
        { title: "Umgang mit Widerstand", description: "Bereite dich auf Widerstand von anderen vor" },
        { title: "Halte deine Grenze aufrecht", description: "Bleibe über die Zeit konsequent" }
      ],
      learn: [
        { title: "Warum Grenzen schwer fallen", content: "Viele Menschen haben Schwierigkeiten mit Grenzen, weil ihnen beigebracht wurde, dass \"Nein\" sagen egoistisch oder unkind ist. In Wirklichkeit sind Grenzen ein Akt der Selbstachtung und machen Beziehungen letztlich gesünder.\n\nSchwierigkeiten mit Grenzen stammen oft von:\n• Angst vor Ablehnung oder Konflikt\n• People-Pleasing-Mustern aus der Kindheit\n• Schuldgefühle beim Priorisieren eigener Bedürfnisse\n• Unklares Gefühl für eigene Bedürfnisse\n\nDenk dran: Du kannst freundlich sein und Grenzen haben. Sie schließen sich nicht aus.", reflectionQuestion: "Welche Botschaft hast du über Grenzen in deiner Kindheit erhalten?" },
        { title: "Arten von Grenzen", content: "Grenzen existieren in vielen Bereichen:\n\n• Physisch: Persönlicher Raum, Berührung, körperliche Bedürfnisse\n• Emotional: Deine emotionale Energie schützen, nicht die Gefühle anderer absorbieren\n• Zeit: Wie du deine Zeit verbringst, Nein sagen zu Verpflichtungen\n• Digital: Bildschirmzeit, soziale Medien, Erreichbarkeitserwartungen\n• Gesprächsbasiert: Themen, über die du nicht reden möchtest\n\nEine gute Grenze hat drei Teile: das Verhalten identifizieren, dein Bedürfnis kommunizieren, die Konsequenz benennen.", reflectionQuestion: "In welchem Lebensbereich brauchst du gerade am meisten eine Grenze?" }
      ]
    }
  },
  "breakups": {
    en: { title: "Breakups", description: "Healing and moving forward", longDescription: "Breakups can shake our sense of self and future. This path helps you process the pain, learn from the experience, and open yourself to new possibilities." },
    de: { 
      title: "Trennungen", 
      description: "Heilung und weitergehen", 
      longDescription: "Trennungen können unser Selbstbild und unsere Zukunftsvorstellungen erschüttern. Dieser Pfad hilft dir, den Schmerz zu verarbeiten, aus der Erfahrung zu lernen und dich für neue Möglichkeiten zu öffnen.",
      steps: [
        { title: "Erlaube dir zu trauern", description: "Gib allen Emotionen Raum" },
        { title: "Verarbeite die Geschichte", description: "Verstehe, was passiert ist" },
        { title: "Gewinne deine Identität zurück", description: "Erinnere dich, wer du außerhalb der Beziehung bist" },
        { title: "Übe Selbstfürsorge", description: "Nähre dich durch den Übergang" },
        { title: "Finde die Lektionen", description: "Was hast du über dich und die Liebe gelernt?" },
        { title: "Stelle dir deine Zukunft vor", description: "Öffne dich für neue Möglichkeiten" },
        { title: "Schaffe Abschluss", description: "Lass die Vergangenheit mit Intention los" }
      ],
      learn: [
        { title: "Warum Trennungen so wehtun", content: "Gehirnbildgebungsstudien zeigen, dass der Schmerz einer Trennung dieselben neuronalen Bahnen aktiviert wie physischer Schmerz. Dein Gehirn trauert buchstäblich um den Verlust eines Partners wie eine körperliche Wunde. Zudem löst Liebe das Belohnungssystem des Gehirns (Dopamin) aus, sodass der Verlust eines Partners sich wie Entzug anfühlen kann.\n\nDeshalb funktioniert \"komm einfach drüber hinweg\" nicht. Dein Gehirn braucht Zeit zum Umverdrahten. Der Trauerprozess ist real, berechtigt und notwendig.", reflectionQuestion: "Welche Emotion ist bei dir gerade am stärksten – Traurigkeit, Wut, Erleichterung oder etwas anderes?" },
        { title: "Die Phasen der Herzschmerz-Erholung", content: "Erholung verläuft nicht linear, aber häufige Phasen sind:\n\n1. Schock & Verleugnung: \"Das kann nicht passieren\"\n2. Verhandeln: \"Was wenn ich es anders gemacht hätte?\"\n3. Wut: \"Wie konnte er/sie das tun?\"\n4. Traurigkeit: Tiefe Trauer um das Verlorene\n5. Akzeptanz: Frieden schließen mit der Realität\n6. Wachstum: Entdecken, wer du jetzt bist\n\nDu wirst diese möglicherweise mehrmals durchlaufen. Jeder Zyklus fühlt sich normalerweise weniger intensiv an. Sei geduldig mit dir – Heilung dauert länger, als du denkst.", reflectionQuestion: "Welche Phase resoniert am meisten mit dem, wo du gerade stehst?" }
      ]
    }
  },
  "anxiety": {
    en: { title: "Anxiety", description: "Calming the worried mind", longDescription: "Anxiety is your mind trying to protect you, but sometimes it goes into overdrive. This path helps you understand your anxiety, reduce its intensity, and find more peace." },
    de: { 
      title: "Angst", 
      description: "Den besorgten Geist beruhigen", 
      longDescription: "Angst ist der Versuch deines Geistes, dich zu schützen, aber manchmal übertreibt er. Dieser Pfad hilft dir, deine Angst zu verstehen, ihre Intensität zu reduzieren und mehr Frieden zu finden.",
      steps: [
        { title: "Identifiziere deine Auslöser", description: "Bemerke, welche Situationen deine Angst auslösen" },
        { title: "Verstehe deine Angst", description: "Erkunde, was deine Angst dir sagen will" },
        { title: "Lerne eine Beruhigungstechnik", description: "Übe ein Werkzeug, um Angst im Moment zu reduzieren" },
        { title: "Hinterfrage ängstliche Gedanken", description: "Stelle die Richtigkeit besorgter Gedanken in Frage" },
        { title: "Baue dein Werkzeugset", description: "Erstelle einen personalisierten Angstbewältigungsplan" }
      ],
      learn: [
        { title: "Dein ängstliches Gehirn verstehen", content: "Angst ist im Wesentlichen das Bedrohungserkennungssystem deines Gehirns in Überstunden. Die Amygdala – das Alarmzentrum deines Gehirns – kann nicht zwischen einer echten Bedrohung und einer eingebildeten unterscheiden. So reagiert dein Körper auf \"Was wenn ich versage?\" genauso wie auf eine tatsächliche Gefahr.\n\nDas ist kein Fehler – es ist eine Funktion, die unsere Vorfahren am Leben hielt. Aber im modernen Leben feuert sie oft zu häufig und zu intensiv. Das zu verstehen kann dir helfen, Angst mit Neugier statt mit Furcht zu begegnen.", reflectionQuestion: "Wovor versucht deine Angst dich normalerweise zu schützen?" },
        { title: "Kognitive Verzerrungen bei Angst", content: "Ängstliches Denken folgt vorhersehbaren Mustern, die Therapeuten \"kognitive Verzerrungen\" nennen:\n\n• Katastrophisieren: Das schlimmstmögliche Ergebnis vorstellen\n• Gedankenlesen: Annehmen zu wissen, was andere denken\n• Wahrsagen: Negative Zukunft mit Sicherheit vorhersagen\n• Schwarz-Weiß-Denken: \"Wenn es nicht perfekt ist, ist es ein Versagen\"\n• Sollte-Aussagen: \"Ich sollte das bewältigen können\"\n\nDie Technik der kognitiven Umstrukturierung beinhaltet, diese Muster zu fangen und zu fragen: \"Ist dieser Gedanke eine Tatsache oder eine Interpretation?\"", reflectionQuestion: "Welches dieser Denkmuster ist dir am vertrautesten?" },
        { title: "Das Toleranzfenster", content: "Dr. Dan Siegel beschreibt das \"Toleranzfenster\" als die Zone, in der du klar denken, Emotionen fühlen ohne überwältigt zu werden, und reagieren statt zu reagieren kannst. Angst drückt dich über dein Fenster (Hyperarousal: rasende Gedanken, Panik) oder darunter (Hypoarousal: Taubheit, Dissoziation).\n\nDas Ziel ist nicht, Angst zu eliminieren – es ist, dein Toleranzfenster zu erweitern, damit du mehr bewältigen kannst, ohne deine Mitte zu verlieren. Dies wächst durch regelmäßige Praktiken wie Achtsamkeit, Erdung und schrittweise Exposition.", reflectionQuestion: "Was hilft dir, in dein \"Toleranzfenster\" zurückzukehren, wenn Angst hochkommt?" }
      ]
    }
  }
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>(() => {
    // Default to German for DACH region, unless user explicitly chose English
    try {
      const stored = localStorage.getItem("soulvay-preferences") || localStorage.getItem("mindmate-preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.language) return prefs.language;
      }
    } catch {}
    // No stored preference: detect browser language, default to German
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("en")) return "en";
    return "de"; // Default to German for DACH and all other locales
  });

  useEffect(() => {
    const readLang = () => {
      try {
        const stored = localStorage.getItem("soulvay-preferences") || localStorage.getItem("mindmate-preferences");
        if (stored) {
          const prefs = JSON.parse(stored);
          if (prefs.language) setLanguage(prefs.language);
        }
      } catch {}
    };

    readLang();

    // Listen for cross-tab and same-tab preference changes
    const handleStorageChange = () => readLang();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("soulvay-preferences-changed", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("soulvay-preferences-changed", handleStorageChange);
    };
  }, []);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      if (import.meta.env.DEV) console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language] || translation.en;
  };

  const getExerciseTranslation = (id: string) => {
    const translation = exerciseTranslations[id];
    if (!translation) return null;
    return translation[language] || translation.en;
  };

  const getTopicTranslation = (id: string) => {
    const translation = topicTranslations[id];
    if (!translation) return null;
    return translation[language] || translation.en;
  };

  /**
   * Single source of truth for exercise display strings.
   * Always use this instead of accessing exercise properties directly.
   */
  const getExerciseDisplay = (exerciseId: string, fallback: { 
    title: string; 
    description: string; 
    longDescription?: string;
    duration?: string;
    steps?: { instruction: string; duration?: number }[];
    prompts?: string[];
  }) => {
    const translation = exerciseTranslations[exerciseId];
    const lang = translation?.[language] || translation?.en;
    
    return {
      title: lang?.title || fallback.title,
      description: lang?.description || fallback.description,
      longDescription: lang?.longDescription || fallback.longDescription || "",
      steps: lang?.steps || fallback.steps?.map(s => s.instruction) || [],
      prompts: lang?.prompts || fallback.prompts || [],
      durationLabel: fallback.duration || "",
    };
  };

  /**
   * Single source of truth for topic display strings.
   * Always use this instead of accessing topic properties directly.
   */
  const getTopicDisplay = (topicId: string, fallback: {
    title: string;
    description: string;
    longDescription?: string;
    steps?: { title: string; description: string }[];
    learn?: { title: string; content: string; reflectionQuestion?: string }[];
  }) => {
    const translation = topicTranslations[topicId];
    const lang = translation?.[language] || translation?.en;
    
    return {
      title: lang?.title || fallback.title,
      description: lang?.description || fallback.description,
      longDescription: lang?.longDescription || fallback.longDescription || "",
      steps: lang?.steps || fallback.steps || [],
      learn: lang?.learn || fallback.learn || [],
    };
  };

  return { 
    t, 
    language, 
    getExerciseTranslation, 
    getTopicTranslation,
    getExerciseDisplay,
    getTopicDisplay,
  };
}
