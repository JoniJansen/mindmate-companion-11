import { useState, useEffect } from "react";

export type Language = "en" | "de";

interface Translations {
  [key: string]: {
    en: string;
    de: string;
  };
}

// Common translations used across the app
export const translations: Translations = {
  // Navigation & Common
  "nav.chat": { en: "Chat", de: "Chat" },
  "nav.journal": { en: "Journal", de: "Tagebuch" },
  "nav.toolbox": { en: "Toolbox", de: "Werkzeuge" },
  "nav.topics": { en: "Topics", de: "Themen" },
  "nav.mood": { en: "Mood", de: "Stimmung" },
  "nav.settings": { en: "Settings", de: "Einstellungen" },
  "nav.safety": { en: "Safety", de: "Sicherheit" },
  "nav.summary": { en: "Summary", de: "Zusammenfassung" },
  
  // Common actions
  "common.save": { en: "Save", de: "Speichern" },
  "common.cancel": { en: "Cancel", de: "Abbrechen" },
  "common.close": { en: "Close", de: "Schließen" },
  "common.back": { en: "Back", de: "Zurück" },
  "common.next": { en: "Next", de: "Weiter" },
  "common.done": { en: "Done", de: "Fertig" },
  "common.start": { en: "Start", de: "Starten" },
  "common.search": { en: "Search", de: "Suchen" },
  "common.loading": { en: "Loading...", de: "Laden..." },
  "common.error": { en: "Error", de: "Fehler" },
  "common.share": { en: "Share", de: "Teilen" },
  "common.export": { en: "Export", de: "Exportieren" },
  "common.pause": { en: "Pause", de: "Pause" },
  "common.resume": { en: "Resume", de: "Fortsetzen" },
  "common.again": { en: "Again", de: "Nochmal" },
  "common.finish": { en: "Finish", de: "Beenden" },
  "common.step": { en: "Step", de: "Schritt" },
  "common.of": { en: "of", de: "von" },
  "common.wellDone": { en: "Well done", de: "Gut gemacht" },
  "common.helpfulPrompts": { en: "Helpful prompts", de: "Hilfreiche Impulse" },

  // Chat page
  "chat.title": { en: "MindMate", de: "MindMate" },
  "chat.subtitle": { en: "Always here for you", de: "Immer für dich da" },
  "chat.inputPlaceholder": { en: "Type your message...", de: "Schreibe deine Nachricht..." },
  "chat.endSummarize": { en: "End & Summarize", de: "Beenden & Zusammenfassen" },
  "chat.nextSteps": { en: "Next steps", de: "Nächste Schritte" },
  "chat.saveToJournal": { en: "Save to journal", de: "Im Tagebuch speichern" },
  "chat.exercises": { en: "Exercises", de: "Übungen" },
  "chat.crisisHelp": { en: "Crisis help", de: "Krisenhilfe" },
  "chat.quickReply1": { en: "I'm feeling good today", de: "Mir geht es heute gut" },
  "chat.quickReply2": { en: "I'm a bit stressed", de: "Ich bin etwas gestresst" },
  "chat.quickReply3": { en: "I need someone to talk to", de: "Ich brauche jemanden zum Reden" },
  "chat.quickReply4": { en: "Help me relax", de: "Hilf mir zu entspannen" },
  "chat.connectionIssue": { en: "Connection issue", de: "Verbindungsproblem" },

  // Journal page
  "journal.title": { en: "Journal", de: "Tagebuch" },
  "journal.subtitle": { en: "Your private space", de: "Dein privater Raum" },
  "journal.searchPlaceholder": { en: "Search entries...", de: "Einträge durchsuchen..." },
  "journal.newEntry": { en: "New Entry", de: "Neuer Eintrag" },
  "journal.patterns": { en: "Patterns", de: "Muster" },
  "journal.noEntries": { en: "No entries yet", de: "Noch keine Einträge" },
  "journal.startWriting": { en: "Start writing to capture your thoughts", de: "Beginne zu schreiben, um deine Gedanken festzuhalten" },
  "journal.discoverThemes": { en: "Discover themes in your entries", de: "Entdecke Themen in deinen Einträgen" },
  "journal.todaysPrompt": { en: "Today's Prompt", de: "Heutiger Impuls" },
  "journal.notEnoughEntries": { en: "Not enough entries", de: "Nicht genug Einträge" },
  "journal.writeAtLeast2": { en: "Write at least 2 journal entries to see patterns.", de: "Schreibe mindestens 2 Tagebucheinträge, um Muster zu sehen." },
  "journal.writeAtLeast3": { en: "Write at least 3 journal entries to see themes.", de: "Schreibe mindestens 3 Tagebucheinträge, um Themen zu sehen." },
  "journal.reflectionError": { en: "Failed to get AI reflection. Please try again.", de: "KI-Reflexion konnte nicht abgerufen werden. Bitte versuche es erneut." },
  "journal.themesError": { en: "Failed to get themes. Please try again.", de: "Themen konnten nicht abgerufen werden. Bitte versuche es erneut." },
  "journal.howAreYouFeeling": { en: "How are you feeling?", de: "Wie fühlst du dich?" },
  "journal.titlePlaceholder": { en: "Give your entry a title (optional)", de: "Gib deinem Eintrag einen Titel (optional)" },
  "journal.contentPlaceholder": { en: "Start writing... This is your private space to express yourself freely.", de: "Beginne zu schreiben... Dies ist dein privater Raum, um dich frei auszudrücken." },
  "journal.emptyEntry": { en: "Empty entry", de: "Leerer Eintrag" },
  "journal.pleaseWriteSomething": { en: "Please write something before saving.", de: "Bitte schreibe etwas, bevor du speicherst." },
  "journal.saved": { en: "Saved", de: "Gespeichert" },
  "journal.entrySaved": { en: "Your journal entry has been saved.", de: "Dein Tagebucheintrag wurde gespeichert." },
  "journal.saveFailed": { en: "Failed to save entry. Please try again.", de: "Eintrag konnte nicht gespeichert werden. Bitte versuche es erneut." },
  "journal.reflect": { en: "Reflect", de: "Reflektieren" },
  "journal.saving": { en: "Saving...", de: "Speichern..." },

  // Journal prompts
  "journal.prompt1": { en: "What small moment brought you peace today?", de: "Welcher kleine Moment hat dir heute Frieden gebracht?" },
  "journal.prompt2": { en: "What are you grateful for right now?", de: "Wofür bist du gerade dankbar?" },
  "journal.prompt3": { en: "What's been on your mind lately?", de: "Was beschäftigt dich in letzter Zeit?" },
  "journal.prompt4": { en: "How are you really feeling today?", de: "Wie fühlst du dich heute wirklich?" },
  "journal.prompt5": { en: "What would make tomorrow better?", de: "Was würde morgen besser machen?" },

  // Toolbox page
  "toolbox.title": { en: "Toolbox", de: "Werkzeugkasten" },
  "toolbox.subtitle": { en: "Evidence-based exercises", de: "Evidenzbasierte Übungen" },
  "toolbox.suggestedForYou": { en: "Suggested for you", de: "Für dich empfohlen" },
  "toolbox.allExercises": { en: "All Exercises", de: "Alle Übungen" },
  "toolbox.noExercises": { en: "No exercises in this category", de: "Keine Übungen in dieser Kategorie" },
  "toolbox.tip": { en: "Tip", de: "Tipp" },
  "toolbox.tipText": { en: "Start with shorter exercises. Even 60 seconds of breathing can shift your state.", de: "Beginne mit kürzeren Übungen. Schon 60 Sekunden Atmen können deinen Zustand verändern." },
  "toolbox.exerciseCompleted": { en: "Exercise completed", de: "Übung abgeschlossen" },
  "toolbox.greatJob": { en: "Great job taking care of yourself.", de: "Toll, dass du auf dich achtest." },
  "toolbox.completedExercise": { en: "You completed the exercise.", de: "Du hast die Übung abgeschlossen." },

  // Categories
  "category.all": { en: "All", de: "Alle" },
  "category.breathing": { en: "Breathing", de: "Atmung" },
  "category.cognitive": { en: "Cognitive", de: "Kognitiv" },
  "category.grounding": { en: "Grounding", de: "Erdung" },
  "category.journaling": { en: "Journaling", de: "Schreiben" },
  "category.values": { en: "Values", de: "Werte" },
  "category.boundaries": { en: "Boundaries", de: "Grenzen" },

  // Topics page
  "topics.title": { en: "Topics", de: "Themen" },
  "topics.subtitle": { en: "Choose what to explore", de: "Wähle, was du erkunden möchtest" },
  "topics.searchPlaceholder": { en: "Search topics...", de: "Themen durchsuchen..." },
  "topics.noMatch": { en: "No topics match your search", de: "Keine Themen entsprechen deiner Suche" },
  "topics.stepCompleted": { en: "Step completed", de: "Schritt abgeschlossen" },
  "topics.greatProgress": { en: "Great progress! Keep going.", de: "Toller Fortschritt! Weiter so." },
  "topics.yourProgress": { en: "Your progress", de: "Dein Fortschritt" },
  "topics.steps": { en: "steps", de: "Schritte" },
  "topics.reflectionPath": { en: "Reflection Path", de: "Reflexionspfad" },
  "topics.exercises": { en: "Exercises", de: "Übungen" },
  "topics.noExercises": { en: "No exercises for this topic yet", de: "Noch keine Übungen für dieses Thema" },
  "topics.stepType.reflection": { en: "Reflection", de: "Reflexion" },
  "topics.stepType.exercise": { en: "Exercise", de: "Übung" },
  "topics.stepType.journal": { en: "Journal", de: "Tagebuch" },
  "topics.stepType.chat": { en: "Chat", de: "Chat" },

  // Settings page
  "settings.title": { en: "Settings", de: "Einstellungen" },
  "settings.subtitle": { en: "Customize your experience", de: "Passe dein Erlebnis an" },
  "settings.languageRegion": { en: "Language & Region", de: "Sprache & Region" },
  "settings.language": { en: "Language", de: "Sprache" },
  "settings.conversationStyle": { en: "Conversation Style", de: "Gesprächsstil" },
  "settings.conversationTone": { en: "Conversation Tone", de: "Gesprächston" },
  "settings.addressForm": { en: "Address Form", de: "Anredeform" },
  "settings.appearance": { en: "Appearance", de: "Erscheinungsbild" },
  "settings.darkMode": { en: "Dark Mode", de: "Dunkelmodus" },
  "settings.useDarkTheme": { en: "Use dark theme", de: "Dunkles Design verwenden" },
  "settings.reminders": { en: "Reminders", de: "Erinnerungen" },
  "settings.dailyCheckin": { en: "Daily check-in notifications", de: "Tägliche Check-in-Benachrichtigungen" },
  "settings.innerDialogue": { en: "Inner Dialogue", de: "Innerer Dialog" },
  "settings.innerDialogueDesc": { en: "Explore different inner perspectives", de: "Erkunde verschiedene innere Perspektiven" },
  "settings.support": { en: "Support", de: "Hilfe" },
  "settings.privacyData": { en: "Privacy & Data", de: "Datenschutz & Daten" },
  "settings.manageInfo": { en: "Manage your information", de: "Verwalte deine Informationen" },
  "settings.helpSupport": { en: "Help & Support", de: "Hilfe & Support" },
  "settings.faqContact": { en: "FAQs and contact us", de: "FAQ und Kontakt" },
  "settings.saved": { en: "Settings saved", de: "Einstellungen gespeichert" },
  "settings.preferencesUpdated": { en: "Your preferences have been updated.", de: "Deine Einstellungen wurden aktualisiert." },
  "settings.madeWithCare": { en: "Made with care for your wellbeing", de: "Mit Sorgfalt für dein Wohlbefinden erstellt" },

  // Tone options
  "tone.gentle": { en: "Gentle", de: "Sanft" },
  "tone.gentleDesc": { en: "Warm, soft, and nurturing", de: "Warm, sanft und fürsorglich" },
  "tone.balanced": { en: "Balanced", de: "Ausgewogen" },
  "tone.balancedDesc": { en: "Calm and supportive", de: "Ruhig und unterstützend" },
  "tone.structured": { en: "Structured", de: "Strukturiert" },
  "tone.structuredDesc": { en: "Clear and methodical", de: "Klar und methodisch" },

  // Address options
  "address.informal": { en: "Informal (Du)", de: "Informell (Du)" },
  "address.informalDesc": { en: "Casual and friendly", de: "Locker und freundlich" },
  "address.formal": { en: "Formal (Sie)", de: "Formell (Sie)" },
  "address.formalDesc": { en: "Professional and respectful", de: "Professionell und respektvoll" },

  // Summary page
  "summary.title": { en: "Session Summary", de: "Sitzungszusammenfassung" },
  "summary.generating": { en: "Generating...", de: "Wird erstellt..." },
  "summary.creating": { en: "Creating your summary...", de: "Deine Zusammenfassung wird erstellt..." },
  "summary.notEnough": { en: "Not enough conversation", de: "Nicht genug Gespräch" },
  "summary.haveAChatFirst": { en: "Have a chat first to generate a summary.", de: "Führe zuerst ein Gespräch, um eine Zusammenfassung zu erstellen." },
  "summary.noConversation": { en: "No conversation to summarize yet.", de: "Noch kein Gespräch zum Zusammenfassen." },
  "summary.startConversation": { en: "Start a conversation", de: "Starte ein Gespräch" },
  "summary.chatSession": { en: "Chat Session", de: "Chat-Sitzung" },
  "summary.messages": { en: "messages", de: "Nachrichten" },
  "summary.todayAt": { en: "Today at", de: "Heute um" },
  "summary.whatWeDiscussed": { en: "What We Discussed", de: "Was wir besprochen haben" },
  "summary.keyThemes": { en: "Key Themes", de: "Wichtige Themen" },
  "summary.moodJourney": { en: "Mood Journey", de: "Stimmungsverlauf" },
  "summary.yourNextStep": { en: "Your Next Step", de: "Dein nächster Schritt" },
  "summary.helpfulExercises": { en: "Helpful Exercises", de: "Hilfreiche Übungen" },
  "summary.breathingExercise": { en: "Breathing Exercise", de: "Atemübung" },
  "summary.calmYourMind": { en: "Calm your mind", de: "Beruhige deinen Geist" },
  "summary.journalThoughts": { en: "Journal Your Thoughts", de: "Schreibe deine Gedanken auf" },
  "summary.reflectDeeper": { en: "Reflect deeper", de: "Reflektiere tiefer" },
  "summary.regenerate": { en: "Regenerate summary", de: "Zusammenfassung neu erstellen" },
  "summary.exported": { en: "Summary exported", de: "Zusammenfassung exportiert" },
  "summary.downloaded": { en: "Your session summary has been downloaded.", de: "Deine Sitzungszusammenfassung wurde heruntergeladen." },
  "summary.copiedToClipboard": { en: "Copied to clipboard", de: "In Zwischenablage kopiert" },
  "summary.pasteAnywhere": { en: "Summary copied! You can paste it anywhere.", de: "Zusammenfassung kopiert! Du kannst sie überall einfügen." },
  "summary.couldntGenerate": { en: "Couldn't generate summary", de: "Zusammenfassung konnte nicht erstellt werden" },
  "summary.tryAgain": { en: "Please try again.", de: "Bitte versuche es erneut." },

  // Safety page
  "safety.title": { en: "Safety & Support", de: "Sicherheit & Unterstützung" },
  "safety.subtitle": { en: "You're not alone", de: "Du bist nicht allein" },
  "safety.immediateDANGER": { en: "If you're in immediate danger", de: "Wenn du in unmittelbarer Gefahr bist" },
  "safety.callEmergency": { en: "Please call emergency services (112) or go to your nearest emergency room.", de: "Bitte rufe den Notruf (112) an oder gehe zur nächsten Notaufnahme." },
  "safety.call112": { en: "Call 112", de: "112 anrufen" },
  "safety.crisisLines": { en: "Crisis Support Lines", de: "Krisentelefone" },
  "safety.okToAskForHelp": { en: "It's okay to ask for help", de: "Es ist okay, um Hilfe zu bitten" },
  "safety.reachingOut": { en: "Reaching out takes courage. Whatever you're going through, trained professionals are ready to listen and support you without judgment.", de: "Es braucht Mut, sich Hilfe zu holen. Was auch immer du durchmachst, geschulte Fachleute sind bereit, dir zuzuhören und dich ohne Vorurteile zu unterstützen." },
  "safety.additionalResources": { en: "Additional Resources", de: "Weitere Ressourcen" },
  "safety.24_7": { en: "24/7", de: "24 Stunden" },
  "safety.variesByLocation": { en: "Varies by location", de: "Abhängig vom Standort" },

  // Crisis lines (German)
  "crisis.telefonseelsorge": { en: "Telefonseelsorge", de: "Telefonseelsorge" },
  "crisis.telefonseelsorgeNum": { en: "0800 111 0 111", de: "0800 111 0 111" },
  "crisis.telefonseelsorgeDesc": { en: "Free, 24/7 crisis support in German", de: "Kostenlose Krisenunterstützung rund um die Uhr" },
  "crisis.telefonseelsorge2": { en: "Telefonseelsorge (Alternative)", de: "Telefonseelsorge (Alternativ)" },
  "crisis.telefonseelsorge2Num": { en: "0800 111 0 222", de: "0800 111 0 222" },
  "crisis.nummerGegenKummer": { en: "Nummer gegen Kummer", de: "Nummer gegen Kummer" },
  "crisis.nummerGegenKummerNum": { en: "116 111", de: "116 111" },
  "crisis.nummerGegenKummerDesc": { en: "Children and youth helpline", de: "Kinder- und Jugendtelefon" },
  "crisis.nummerGegenKummerHours": { en: "Mon-Sat 2-8pm", de: "Mo-Sa 14-20 Uhr" },
  "crisis.international": { en: "International Association for Suicide Prevention", de: "Internationale Gesellschaft für Suizidprävention" },
  "crisis.findLocalResources": { en: "Find local resources", de: "Lokale Ressourcen finden" },
  "crisis.crisisCentersWorldwide": { en: "Crisis centers worldwide", de: "Krisenzentren weltweit" },

  // Resources
  "resource.findTherapist": { en: "Find a Therapist Near You", de: "Finde einen Therapeuten in deiner Nähe" },
  "resource.findTherapistDesc": { en: "Search for licensed mental health professionals", de: "Suche nach zugelassenen psychischen Fachkräften" },
  "resource.understandingSigns": { en: "Understanding Crisis Signs", de: "Krisenzeichen verstehen" },
  "resource.understandingSignsDesc": { en: "Learn about warning signs and how to help", de: "Lerne Warnzeichen kennen und wie du helfen kannst" },
  "resource.selfCare": { en: "Self-Care During Difficult Times", de: "Selbstfürsorge in schwierigen Zeiten" },
  "resource.selfCareDesc": { en: "Coping strategies and immediate relief techniques", de: "Bewältigungsstrategien und Techniken zur sofortigen Entlastung" },

  // Emotional Timeline
  "timeline.title": { en: "Emotional Timeline", de: "Emotionale Zeitleiste" },
  "timeline.description": { en: "Notice gentle patterns over time", de: "Bemerke sanfte Muster über die Zeit" },
  "timeline.notEnoughData": { en: "Not enough entries yet", de: "Noch nicht genug Einträge" },
  "timeline.writeMore": { en: "Write at least 5 journal entries to see your emotional timeline.", de: "Schreibe mindestens 5 Tagebucheinträge, um deine emotionale Zeitleiste zu sehen." },
};

// Exercise translations
export const exerciseTranslations: Record<string, { en: { title: string; description: string; longDescription: string }; de: { title: string; description: string; longDescription: string } }> = {
  "breathing-60": {
    en: { title: "60-Second Breathing", description: "Quick calm when you need it most", longDescription: "A rapid relaxation technique using deep diaphragmatic breathing. Perfect for moments of acute stress or before important situations." },
    de: { title: "60-Sekunden-Atmung", description: "Schnelle Ruhe, wenn du sie am meisten brauchst", longDescription: "Eine schnelle Entspannungstechnik mit tiefer Zwerchfellatmung. Perfekt für Momente akuten Stresses oder vor wichtigen Situationen." }
  },
  "thought-reframing": {
    en: { title: "Thought Reframing", description: "Challenge unhelpful thinking patterns", longDescription: "Based on Cognitive Behavioral Therapy (CBT), this exercise helps you identify, examine, and reframe thoughts that may be causing distress." },
    de: { title: "Gedanken umformulieren", description: "Hinterfrage nicht hilfreiche Denkmuster", longDescription: "Basierend auf der Kognitiven Verhaltenstherapie (KVT) hilft dir diese Übung, Gedanken zu identifizieren, zu untersuchen und umzuformulieren, die Stress verursachen könnten." }
  },
  "journaling-prompts": {
    en: { title: "Guided Journaling", description: "Reflective prompts for self-discovery", longDescription: "Structured prompts to help you explore your thoughts and feelings. Writing helps process emotions and gain clarity." },
    de: { title: "Geführtes Tagebuchschreiben", description: "Reflektierende Impulse zur Selbstentdeckung", longDescription: "Strukturierte Impulse, die dir helfen, deine Gedanken und Gefühle zu erkunden. Schreiben hilft, Emotionen zu verarbeiten und Klarheit zu gewinnen." }
  },
  "values-clarification": {
    en: { title: "Values Clarification", description: "Discover what truly matters to you", longDescription: "Understanding your core values helps guide decisions and brings meaning to daily life. This exercise helps you identify and prioritize what matters most." },
    de: { title: "Werteklärung", description: "Entdecke, was dir wirklich wichtig ist", longDescription: "Das Verstehen deiner Kernwerte hilft bei Entscheidungen und bringt Bedeutung in den Alltag. Diese Übung hilft dir, herauszufinden, was dir am wichtigsten ist." }
  },
  "boundary-prep": {
    en: { title: "Boundary Setting", description: "Prepare to communicate your limits", longDescription: "Setting boundaries can feel challenging but is essential for wellbeing. This exercise helps you prepare for boundary conversations with clarity and confidence." },
    de: { title: "Grenzen setzen", description: "Bereite dich darauf vor, deine Grenzen zu kommunizieren", longDescription: "Grenzen zu setzen kann sich herausfordernd anfühlen, ist aber wichtig für dein Wohlbefinden. Diese Übung hilft dir, Grenzgespräche mit Klarheit und Selbstvertrauen vorzubereiten." }
  },
  "grounding-54321": {
    en: { title: "5-4-3-2-1 Grounding", description: "Anchor to the present moment", longDescription: "A sensory-based grounding technique that quickly brings you back to the present moment. Especially helpful during anxiety or overwhelm." },
    de: { title: "5-4-3-2-1 Erdung", description: "Verankere dich im gegenwärtigen Moment", longDescription: "Eine sensorische Erdungstechnik, die dich schnell in den gegenwärtigen Moment zurückbringt. Besonders hilfreich bei Angst oder Überforderung." }
  }
};

// Topic translations
export const topicTranslations: Record<string, { en: { title: string; description: string; longDescription: string }; de: { title: string; description: string; longDescription: string } }> = {
  "stress-overwhelm": {
    en: { title: "Stress & Overwhelm", description: "When everything feels like too much", longDescription: "Stress is your body's natural response to demands, but chronic overwhelm can drain your energy and clarity. This path helps you understand your stress patterns and build sustainable coping strategies." },
    de: { title: "Stress & Überforderung", description: "Wenn alles zu viel wird", longDescription: "Stress ist die natürliche Reaktion deines Körpers auf Anforderungen, aber chronische Überforderung kann deine Energie und Klarheit aufzehren. Dieser Pfad hilft dir, deine Stressmuster zu verstehen und nachhaltige Bewältigungsstrategien aufzubauen." }
  },
  "relationships": {
    en: { title: "Relationships", description: "Navigating connections with others", longDescription: "Healthy relationships require communication, boundaries, and self-awareness. This path helps you explore your relationship patterns and develop deeper, more authentic connections." },
    de: { title: "Beziehungen", description: "Verbindungen mit anderen navigieren", longDescription: "Gesunde Beziehungen erfordern Kommunikation, Grenzen und Selbstbewusstsein. Dieser Pfad hilft dir, deine Beziehungsmuster zu erkunden und tiefere, authentischere Verbindungen zu entwickeln." }
  },
  "family": {
    en: { title: "Family", description: "Complex dynamics and healing", longDescription: "Family relationships can be our deepest source of both joy and pain. This path helps you navigate complex family dynamics with more clarity and peace." },
    de: { title: "Familie", description: "Komplexe Dynamiken und Heilung", longDescription: "Familienbeziehungen können unsere tiefste Quelle für Freude und Schmerz sein. Dieser Pfad hilft dir, komplexe Familiendynamiken mit mehr Klarheit und Frieden zu navigieren." }
  },
  "self-esteem": {
    en: { title: "Self-Esteem", description: "Building a kinder relationship with yourself", longDescription: "Self-esteem isn't about being perfect—it's about accepting yourself as you are while growing into who you want to become. This path helps you build genuine self-worth." },
    de: { title: "Selbstwertgefühl", description: "Eine freundlichere Beziehung zu dir selbst aufbauen", longDescription: "Selbstwertgefühl bedeutet nicht, perfekt zu sein – es geht darum, dich so zu akzeptieren, wie du bist, während du zu dem wirst, der du sein möchtest. Dieser Pfad hilft dir, echtes Selbstwertgefühl aufzubauen." }
  },
  "work-burnout": {
    en: { title: "Work & Burnout", description: "Finding balance and preventing exhaustion", longDescription: "Burnout happens when demands consistently exceed your resources. This path helps you recognize warning signs, set better boundaries, and rediscover meaning in your work." },
    de: { title: "Arbeit & Burnout", description: "Balance finden und Erschöpfung vorbeugen", longDescription: "Burnout entsteht, wenn Anforderungen dauerhaft deine Ressourcen übersteigen. Dieser Pfad hilft dir, Warnzeichen zu erkennen, bessere Grenzen zu setzen und den Sinn in deiner Arbeit wiederzuentdecken." }
  },
  "decisions-direction": {
    en: { title: "Decisions & Direction", description: "Finding clarity when feeling stuck", longDescription: "Making decisions can feel paralyzing, especially when you're unsure of what you want. This path helps you connect with your values and gain clarity on your next steps." },
    de: { title: "Entscheidungen & Richtung", description: "Klarheit finden, wenn du feststeckst", longDescription: "Entscheidungen zu treffen kann sich lähmend anfühlen, besonders wenn du unsicher bist, was du willst. Dieser Pfad hilft dir, dich mit deinen Werten zu verbinden und Klarheit über deine nächsten Schritte zu gewinnen." }
  },
  "loneliness": {
    en: { title: "Loneliness", description: "Feeling connected even when alone", longDescription: "Loneliness is a signal that our need for connection isn't being met. This path helps you understand your loneliness and find meaningful ways to connect—with others and yourself." },
    de: { title: "Einsamkeit", description: "Verbunden fühlen, auch wenn du allein bist", longDescription: "Einsamkeit ist ein Signal, dass unser Bedürfnis nach Verbindung nicht erfüllt wird. Dieser Pfad hilft dir, deine Einsamkeit zu verstehen und bedeutungsvolle Wege zu finden, dich zu verbinden – mit anderen und mit dir selbst." }
  },
  "boundaries": {
    en: { title: "Boundaries", description: "Protecting your energy and peace", longDescription: "Boundaries aren't walls—they're the guidelines that help you preserve your wellbeing while maintaining healthy relationships. This path helps you set and maintain boundaries with compassion." },
    de: { title: "Grenzen", description: "Deine Energie und deinen Frieden schützen", longDescription: "Grenzen sind keine Mauern – sie sind Richtlinien, die dir helfen, dein Wohlbefinden zu bewahren und gleichzeitig gesunde Beziehungen aufrechtzuerhalten. Dieser Pfad hilft dir, Grenzen mit Mitgefühl zu setzen und aufrechtzuerhalten." }
  },
  "breakups": {
    en: { title: "Breakups", description: "Healing and moving forward", longDescription: "Breakups can shake our sense of self and future. This path helps you process the pain, learn from the experience, and open yourself to new possibilities." },
    de: { title: "Trennungen", description: "Heilung und weitergehen", longDescription: "Trennungen können unser Selbstbild und unsere Zukunftsvorstellungen erschüttern. Dieser Pfad hilft dir, den Schmerz zu verarbeiten, aus der Erfahrung zu lernen und dich für neue Möglichkeiten zu öffnen." }
  },
  "anxiety": {
    en: { title: "Anxiety", description: "Calming the worried mind", longDescription: "Anxiety is your mind trying to protect you, but sometimes it goes into overdrive. This path helps you understand your anxiety, reduce its intensity, and find more peace." },
    de: { title: "Angst", description: "Den besorgten Geist beruhigen", longDescription: "Angst ist der Versuch deines Geistes, dich zu schützen, aber manchmal übertreibt er. Dieser Pfad hilft dir, deine Angst zu verstehen, ihre Intensität zu reduzieren und mehr Frieden zu finden." }
  }
};

export function useTranslation() {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mindmate-preferences");
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.language) {
          setLanguage(prefs.language);
        }
      }
    } catch {
      // Use default
    }

    // Listen for changes
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem("mindmate-preferences");
        if (stored) {
          const prefs = JSON.parse(stored);
          if (prefs.language) {
            setLanguage(prefs.language);
          }
        }
      } catch {
        // Ignore
      }
    };

    window.addEventListener("storage", handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      try {
        const stored = localStorage.getItem("mindmate-preferences");
        if (stored) {
          const prefs = JSON.parse(stored);
          if (prefs.language && prefs.language !== language) {
            setLanguage(prefs.language);
          }
        }
      } catch {
        // Ignore
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
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

  return { t, language, getExerciseTranslation, getTopicTranslation };
}
