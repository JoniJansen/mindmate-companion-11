// Weekly Recap Language Guidelines
// Defines tone, structure, and example outputs for AI-generated recaps

export const recapStyleGuide = {
  // Core principles
  principles: [
    "Observational, never diagnostic",
    "Coherent narrative, not just bullet lists",
    "Fewer is better - 3-5 patterns max",
    "Numbers only if meaningful (not '3 times this week' but 'repeatedly')",
    "Suggest, don't prescribe",
    "Acknowledge difficulty without dramatizing",
    "End with gentle forward momentum",
  ],

  // How to describe patterns
  patternLanguage: {
    good: [
      "You've been sitting with a lot this week",
      "There's a thread of [theme] running through your reflections",
      "Work seems to have taken up more emotional space than usual",
      "You mentioned [topic] several times—it seems present for you",
      "A sense of [feeling] appears in different contexts",
    ],
    avoid: [
      "You showed signs of depression",
      "You experienced anxiety 4 times",
      "You have a pattern of negative thinking",
      "Your mood was significantly low",
      "You appear to be struggling with...",
    ],
  },

  // How to phrase potential needs
  needsLanguage: {
    good: [
      "You might benefit from some quiet time this week",
      "There may be a need for clearer boundaries somewhere",
      "Perhaps some space for processing would help",
      "It sounds like connection might feel nourishing right now",
      "Rest seems like it could be welcome",
    ],
    avoid: [
      "You need to work on your boundaries",
      "You should seek professional help",
      "You require more self-care",
      "You must address your anxiety",
      "You have unmet emotional needs",
    ],
  },

  // How to suggest next steps
  nextStepLanguage: {
    good: [
      "If you feel like it, the [exercise] might offer some grounding",
      "The [topic] path could be worth exploring when you're ready",
      "A few minutes of [exercise] might create some space",
      "When you have a moment, journaling about [theme] could help",
      "No pressure, but [suggestion] is there if you want it",
    ],
    avoid: [
      "You should try the breathing exercise",
      "Complete the anxiety module",
      "You need to do more grounding",
      "Make sure to journal daily",
      "Follow this self-care plan",
    ],
  },
};

// Example recaps - these show the target quality
export const exampleRecaps = {
  sevenDay: {
    en: {
      patterns: [
        "Work has been emotionally heavy this week—multiple entries touched on feeling overwhelmed by deadlines and expectations.",
        "There's a thread of self-doubt running through your reflections, particularly around whether you're 'doing enough.'",
        "Evening seemed to be when you felt most reflective, often after the busyness had settled.",
        "You mentioned wanting more connection but feeling too drained to reach out.",
      ],
      potentialNeeds: [
        "Some space to just be, without the pressure to produce or perform",
        "Perhaps a way to feel connected without it requiring so much energy",
      ],
      suggestedNextStep:
        "If you feel like it, the 5-4-3-2-1 grounding exercise might offer a quick reset when things feel overwhelming. It's just 2 minutes.",
      summaryParagraph:
        "This week held a lot of weight—mostly around work and self-expectations. You showed up anyway, even when tired. The recurring theme of wanting connection but feeling drained is worth noticing. Next week, maybe one small moment of rest could help more than pushing through.",
    },
    de: {
      patterns: [
        "Die Arbeit war diese Woche emotional belastend—mehrere Einträge berührten das Gefühl, von Deadlines und Erwartungen überwältigt zu sein.",
        "Ein Faden von Selbstzweifeln zieht sich durch deine Reflexionen, besonders in Bezug darauf, ob du 'genug tust.'",
        "Der Abend schien die Zeit zu sein, in der du am meisten reflektiert hast, oft nachdem die Geschäftigkeit sich gelegt hatte.",
        "Du hast erwähnt, mehr Verbindung zu wollen, dich aber zu erschöpft zu fühlen, um dich zu melden.",
      ],
      potentialNeeds: [
        "Etwas Raum, einfach zu sein, ohne den Druck, zu produzieren oder zu performen",
        "Vielleicht ein Weg, sich verbunden zu fühlen, ohne dass es so viel Energie erfordert",
      ],
      suggestedNextStep:
        "Wenn du magst, könnte die 5-4-3-2-1 Erdungsübung einen schnellen Reset bieten, wenn sich alles überwältigend anfühlt. Sie dauert nur 2 Minuten.",
      summaryParagraph:
        "Diese Woche trug viel Gewicht—hauptsächlich rund um Arbeit und Selbsterwartungen. Du hast dich trotzdem gezeigt, auch wenn müde. Das wiederkehrende Thema, Verbindung zu wollen, aber sich erschöpft zu fühlen, ist es wert, bemerkt zu werden. Nächste Woche könnte vielleicht ein kleiner Moment der Ruhe mehr helfen als durchzupowern.",
    },
  },
  thirtyDay: {
    en: {
      patterns: [
        "Over the past month, work-life boundaries emerged as a consistent theme—something that seems hard to protect but clearly matters to you.",
        "Your mood has had natural fluctuations, with a noticeable dip mid-month that gradually lifted as you made more time for rest.",
        "Relationships came up often, particularly around feeling unseen or unheard in certain contexts.",
        "There's a quiet but persistent pull toward something more creative or meaningful—mentioned in different ways across several entries.",
        "Morning energy seemed highest at the start of the month, shifting toward evening reflection by week three.",
      ],
      potentialNeeds: [
        "Clearer boundaries around when work ends and personal time begins",
        "More moments where you feel genuinely heard, not just present",
      ],
      suggestedNextStep:
        "The Boundaries topic path might resonate—it's not about becoming rigid, but about noticing where your energy goes and whether that feels right.",
      summaryParagraph:
        "A month of noticing. Work showed up a lot, often taking more than its share. Relationships asked for attention too—specifically around feeling heard. The mid-month dip is worth remembering: it lifted when you rested, not when you pushed. That creative pull keeps appearing in the margins. Maybe it's asking for a bit more space.",
    },
    de: {
      patterns: [
        "Im letzten Monat tauchten Arbeit-Leben-Grenzen als durchgängiges Thema auf—etwas, das schwer zu schützen scheint, aber dir offensichtlich wichtig ist.",
        "Deine Stimmung hatte natürliche Schwankungen, mit einem spürbaren Einbruch Mitte des Monats, der sich allmählich hob, als du dir mehr Zeit für Ruhe genommen hast.",
        "Beziehungen kamen oft vor, besonders rund um das Gefühl, in bestimmten Kontexten nicht gesehen oder gehört zu werden.",
        "Es gibt einen leisen, aber beharrlichen Zug zu etwas Kreativerem oder Bedeutsamerem—in verschiedenen Einträgen unterschiedlich erwähnt.",
        "Die Morgenenergie schien zu Beginn des Monats am höchsten, mit einer Verschiebung zur Abendreflexion ab Woche drei.",
      ],
      potentialNeeds: [
        "Klarere Grenzen, wann Arbeit endet und persönliche Zeit beginnt",
        "Mehr Momente, in denen du dich wirklich gehört fühlst, nicht nur anwesend",
      ],
      suggestedNextStep:
        "Der Grenzen-Themenpfad könnte anklingen—es geht nicht darum, starr zu werden, sondern zu bemerken, wohin deine Energie geht und ob sich das richtig anfühlt.",
      summaryParagraph:
        "Ein Monat des Bemerkens. Arbeit tauchte oft auf, nahm oft mehr als ihren Anteil. Beziehungen verlangten auch Aufmerksamkeit—besonders rund um gehört werden. Der Einbruch zur Monatsmitte ist es wert, erinnert zu werden: er hob sich, als du dich ausruhtest, nicht als du durchgedrückt hast. Dieser kreative Zug erscheint immer wieder am Rand. Vielleicht bittet er um etwas mehr Raum.",
    },
  },
};
