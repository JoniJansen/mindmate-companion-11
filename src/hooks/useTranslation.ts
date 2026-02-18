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
  "chat.title": { en: "Soulvay", de: "Soulvay" },
  "chat.subtitle": { en: "Always here for you", de: "Immer für dich da" },
  "chat.inputPlaceholder": { en: "Type something...", de: "Schreibe etwas..." },
  "chat.endSummarize": { en: "Wrap up", de: "Zusammenfassen" },
  "chat.nextSteps": { en: "What's next", de: "Wie weiter" },
  "chat.saveToJournal": { en: "Save to journal", de: "Im Tagebuch speichern" },
  "chat.exercises": { en: "Exercises", de: "Übungen" },
  "chat.crisisHelp": { en: "Need support?", de: "Brauchst du Hilfe?" },
  "chat.quickReply1": { en: "I'm feeling good today", de: "Mir geht es heute gut" },
  "chat.quickReply2": { en: "I'm a bit stressed", de: "Ich bin etwas gestresst" },
  "chat.quickReply3": { en: "I just want to talk", de: "Ich möchte einfach reden" },
  "chat.quickReply4": { en: "Help me relax", de: "Hilf mir zu entspannen" },
  "chat.connectionIssue": { en: "Connection paused", de: "Verbindung unterbrochen" },
  "chat.voiceFailed": { en: "Voice playback failed", de: "Sprachausgabe fehlgeschlagen" },
  "chat.modeSelectLabel": { en: "Select chat mode", de: "Chat-Modus wählen" },
  "chat.requiresPlus": { en: "Requires Soulvay Plus", de: "Soulvay Plus erforderlich" },
  "chat.disclaimer": { en: "Soulvay is a companion for self-reflection and does not replace professional therapy or counseling.", de: "Soulvay ist ein Begleiter für Selbstreflexion und ersetzt keine professionelle Therapie oder Beratung." },
  "chat.greetingDe": { en: "Hello. I'm Soulvay, and\nI'm here to listen.\n\nTake your time – share what's on your mind.", de: "Hallo. Ich bin Soulvay und\nhöre dir gerne zu.\n\nNimm dir Zeit – teile, was dich bewegt." },
  
  // Chat mode quick replies
  "chat.talk.reply1": { en: "I need someone to listen", de: "Ich brauche jemanden zum Zuhören" },
  "chat.talk.reply2": { en: "Something's been on my mind", de: "Mich beschäftigt etwas" },
  "chat.clarify.reply1": { en: "Help me organize my thoughts", de: "Hilf mir meine Gedanken zu ordnen" },
  "chat.clarify.reply2": { en: "I'm feeling confused about something", de: "Ich bin verwirrt über etwas" },
  "chat.calm.reply1": { en: "I'm feeling anxious", de: "Ich fühle mich ängstlich" },
  "chat.calm.reply2": { en: "Help me relax", de: "Hilf mir zu entspannen" },
  "chat.patterns.reply1": { en: "What patterns do you see in me?", de: "Welche Muster siehst du bei mir?" },
  "chat.patterns.reply2": { en: "Help me understand myself better", de: "Hilf mir mich besser zu verstehen" },
  
  // Calm mode exercises
  "chat.exercise.breathing": { en: "60s Breathing", de: "60s Atmung" },
  "chat.exercise.grounding": { en: "5-4-3-2-1 Grounding", de: "5-4-3-2-1 Erdung" },

  // Journal page
  "journal.title": { en: "Journal", de: "Tagebuch" },
  "journal.subtitle": { en: "Your thoughts, your space", de: "Deine Gedanken, dein Raum" },
  "journal.searchPlaceholder": { en: "Search...", de: "Suchen..." },
  "journal.newEntry": { en: "Free Entry", de: "Freier Eintrag" },
  "journal.patterns": { en: "Patterns", de: "Muster" },
  "journal.noEntries": { en: "Start with your first entry", de: "Beginne mit deinem ersten Eintrag" },
  "journal.startWriting": { en: "This is your private space to write freely", de: "Dies ist dein privater Raum zum freien Schreiben" },
  "journal.discoverThemes": { en: "Notice themes in your entries", de: "Bemerke Themen in deinen Einträgen" },
  "journal.todaysPrompt": { en: "A thought for today", de: "Ein Gedanke für heute" },
  "journal.notEnoughEntries": { en: "A few more entries", de: "Noch ein paar Einträge" },
  "journal.writeAtLeast2": { en: "After 2 entries, patterns may emerge.", de: "Nach 2 Einträgen können Muster erscheinen." },
  "journal.writeAtLeast3": { en: "After 3 entries, themes may become visible.", de: "Nach 3 Einträgen können Themen sichtbar werden." },
  "journal.reflectionError": { en: "Couldn't get reflection—try again in a moment.", de: "Reflexion nicht möglich—versuche es gleich nochmal." },
  "journal.themesError": { en: "Couldn't find themes—try again in a moment.", de: "Themen nicht gefunden—versuche es gleich nochmal." },
  "journal.howAreYouFeeling": { en: "How are you feeling?", de: "Wie fühlst du dich?" },
  "journal.titlePlaceholder": { en: "Title (optional)", de: "Titel (optional)" },
  "journal.contentPlaceholder": { en: "Write what's on your mind...", de: "Schreibe, was dich bewegt..." },
  "journal.emptyEntry": { en: "Empty entry", de: "Leerer Eintrag" },
  "journal.pleaseWriteSomething": { en: "Write something before saving.", de: "Schreibe etwas, bevor du speicherst." },
  "journal.saved": { en: "Saved", de: "Gespeichert" },
  "journal.entrySaved": { en: "Your entry has been saved.", de: "Dein Eintrag wurde gespeichert." },
  "journal.saveFailed": { en: "Couldn't save—try again.", de: "Speichern nicht möglich—versuche es nochmal." },
  "journal.reflect": { en: "Reflect", de: "Reflektieren" },
  "journal.saving": { en: "Saving...", de: "Speichern..." },
  "journal.yourPrompt": { en: "Your prompt:", de: "Deine Frage:" },
  "journal.whatsOnMind": { en: "What's on your mind?", de: "Was beschäftigt dich?" },
  "journal.tagsOptional": { en: "Tags (optional)", de: "Tags (optional)" },
  "journal.today": { en: "Today", de: "Heute" },
  "journal.yesterday": { en: "Yesterday", de: "Gestern" },
  "journal.reflectionPrompts": { en: "Reflection prompts", de: "Reflexionsfragen" },
  "journal.refreshPrompts": { en: "Refresh prompts", de: "Neue Fragen laden" },
  "journal.aiReflection": { en: "AI Reflection", de: "KI-Reflexion" },
  "journal.analyzingEntries": { en: "Reflecting on your entries...", de: "Analysiere deine Einträge..." },

  // Journal prompts
  "journal.prompt1": { en: "What small moment brought you peace today?", de: "Welcher kleine Moment hat dir heute Frieden gebracht?" },
  "journal.prompt2": { en: "What are you grateful for right now?", de: "Wofür bist du gerade dankbar?" },
  "journal.prompt3": { en: "What's been on your mind lately?", de: "Was beschäftigt dich in letzter Zeit?" },
  "journal.prompt4": { en: "How are you really feeling today?", de: "Wie fühlst du dich heute wirklich?" },
  "journal.prompt5": { en: "What would make tomorrow better?", de: "Was würde morgen besser machen?" },
  
  // Journal tags
  "journal.tag.anxious": { en: "Anxious", de: "Ängstlich" },
  "journal.tag.sad": { en: "Sad", de: "Traurig" },
  "journal.tag.angry": { en: "Angry", de: "Wütend" },
  "journal.tag.stressed": { en: "Stressed", de: "Gestresst" },
  "journal.tag.calm": { en: "Calm", de: "Ruhig" },
  "journal.tag.grateful": { en: "Grateful", de: "Dankbar" },
  "journal.tag.hopeful": { en: "Hopeful", de: "Hoffnungsvoll" },
  "journal.tag.overwhelmed": { en: "Overwhelmed", de: "Überfordert" },
  "journal.tag.work": { en: "Work", de: "Arbeit" },
  "journal.tag.relationships": { en: "Relationships", de: "Beziehungen" },
  "journal.tag.family": { en: "Family", de: "Familie" },
  "journal.tag.health": { en: "Health", de: "Gesundheit" },
  "journal.tag.selfworth": { en: "Self-worth", de: "Selbstwert" },
  "journal.tag.future": { en: "Future", de: "Zukunft" },

  // Toolbox page
  "toolbox.title": { en: "Toolbox", de: "Werkzeugkasten" },
  "toolbox.subtitle": { en: "Evidence-based techniques", de: "Evidenzbasierte Techniken" },
  "toolbox.suggestedForYou": { en: "For you", de: "Für dich" },
  "toolbox.allExercises": { en: "All", de: "Alle" },
  "toolbox.noExercises": { en: "No exercises in this category", de: "Keine Übungen in dieser Kategorie" },
  "toolbox.tip": { en: "💡", de: "💡" },
  "toolbox.tipText": { en: "Regular short practices are more effective than occasional long sessions.", de: "Regelmäßige kurze Übungen sind effektiver als gelegentliche lange Sitzungen." },
  "toolbox.exerciseCompleted": { en: "Exercise completed", de: "Übung abgeschlossen" },
  "toolbox.greatJob": { en: "Well done! Take a moment.", de: "Gut gemacht! Nimm dir einen Moment." },
  "toolbox.completedExercise": { en: "Exercise complete.", de: "Übung abgeschlossen." },
  "toolbox.tapToStart": { en: "Tap Start to begin, or Next to skip", de: "Tippe Starten oder Weiter" },
  "toolbox.autoProgress": { en: "Steps progress automatically", de: "Schritte gehen automatisch weiter" },
  "toolbox.whyHelps": { en: "Why it helps", de: "Warum hilft das?" },
  "toolbox.duration": { en: "Duration", de: "Dauer" },
  "toolbox.bestFor": { en: "Best for", de: "Am besten geeignet" },
  "toolbox.bestForDesc": { en: "When you feel stressed or overwhelmed", de: "Wenn du dich gestresst oder überfordert fühlst" },
  "toolbox.startNow": { en: "Start now", de: "Jetzt starten" },

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
  "topics.noMatch": { en: "No topics found", de: "Keine Themen gefunden" },
  "topics.stepCompleted": { en: "Step completed", de: "Schritt abgeschlossen" },
  "topics.greatProgress": { en: "Great progress! Keep going.", de: "Toller Fortschritt! Weiter so." },
  "topics.yourProgress": { en: "Your progress", de: "Dein Fortschritt" },
  "topics.steps": { en: "steps", de: "Schritte" },
  "topics.complete": { en: "complete", de: "abgeschlossen" },
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
  "settings.darkMode": { en: "Theme", de: "Design" },
  "settings.useDarkTheme": { en: "Use dark theme", de: "Dunkles Design verwenden" },
  "settings.accentColor": { en: "Accent Color", de: "Akzentfarbe" },
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

  // Safety page - refined calm tone
  "safety.title": { en: "Support & Resources", de: "Unterstützung & Ressourcen" },
  "safety.subtitle": { en: "You're not alone in this", de: "Du bist damit nicht allein" },
  "safety.intro": { en: "These resources are here whenever you need them. Reaching out takes courage—and it's always okay to ask for help.", de: "Diese Ressourcen sind hier, wann immer du sie brauchst. Es braucht Mut, sich Hilfe zu holen—und es ist immer okay, um Hilfe zu bitten." },
  "safety.immediateDANGER": { en: "If you need immediate help", de: "Wenn du sofortige Hilfe brauchst" },
  "safety.callEmergency": { en: "Emergency services are available around the clock.", de: "Notdienste sind rund um die Uhr erreichbar." },
  "safety.call112": { en: "Call emergency services", de: "Notruf anrufen" },
  "safety.crisisLines": { en: "Someone to talk to", de: "Jemand zum Reden" },
  "safety.okToAskForHelp": { en: "Reaching out is strength", de: "Sich Hilfe zu holen ist Stärke" },
  "safety.reachingOut": { en: "Whatever you're going through, trained professionals are ready to listen. No judgment, just support.", de: "Was auch immer du durchmachst, geschulte Fachleute sind bereit zuzuhören. Ohne Urteil, nur Unterstützung." },
  "safety.additionalResources": { en: "More ways to find support", de: "Weitere Wege zur Unterstützung" },
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

  // Not Found page
  "notFound.title": { en: "Page not found", de: "Seite nicht gefunden" },
  "notFound.description": { en: "The page you're looking for doesn't exist. Let's get you back on track.", de: "Die Seite, die du suchst, existiert nicht. Lass uns dich zurückbringen." },
  "notFound.goToChat": { en: "Go to Chat", de: "Zum Chat" },
  "notFound.goBack": { en: "Go Back", de: "Zurück" },

  // Emotional Timeline
  "timeline.title": { en: "Emotional Timeline", de: "Emotionale Zeitleiste" },
  "timeline.description": { en: "Notice gentle patterns over time", de: "Bemerke sanfte Muster über die Zeit" },
  "timeline.notEnoughData": { en: "Not enough entries yet", de: "Noch nicht genug Einträge" },
  "timeline.writeMore": { en: "Write at least 5 journal entries to see your emotional timeline.", de: "Schreibe mindestens 5 Tagebucheinträge, um deine emotionale Zeitleiste zu sehen." },

  // Voice Settings
  "voice.title": { en: "Voice", de: "Stimme" },
  "voice.subtitle": { en: "Voice interaction settings", de: "Spracheinstellungen" },
  "voice.voiceType": { en: "Voice Type", de: "Stimmtyp" },
  "voice.voiceTypeDesc": { en: "Choose the AI voice style", de: "Wähle den KI-Stimmstil" },
  "voice.female": { en: "Female", de: "Weiblich" },
  "voice.male": { en: "Male", de: "Männlich" },
  "voice.neutral": { en: "Neutral", de: "Neutral" },
  "voice.speed": { en: "Speaking Speed", de: "Sprechgeschwindigkeit" },
  "voice.speedDesc": { en: "Adjust how fast the AI speaks", de: "Passe an, wie schnell die KI spricht" },
  "voice.slow": { en: "Slower", de: "Langsamer" },
  "voice.normal": { en: "Normal", de: "Normal" },
  "voice.fast": { en: "Faster", de: "Schneller" },
  "voice.language": { en: "Voice Language", de: "Stimmsprache" },
  "voice.languageDesc": { en: "Language for voice responses", de: "Sprache für Sprachantworten" },
  "voice.auto": { en: "Auto (follows app)", de: "Auto (folgt App)" },
  "voice.autoPlay": { en: "Auto-play Replies", de: "Antworten automatisch abspielen" },
  "voice.autoPlayDesc": { en: "Speak AI responses automatically", de: "KI-Antworten automatisch vorlesen" },
  "voice.listening": { en: "Listening...", de: "Hört zu..." },
  "voice.tapToSpeak": { en: "Tap to speak", de: "Tippen zum Sprechen" },
  "voice.micPermissionDenied": { en: "Microphone access denied", de: "Mikrofonzugriff verweigert" },
  "voice.enableMic": { en: "Please enable microphone access in Settings → MindMate → Microphone", de: "Bitte aktiviere den Mikrofonzugriff unter Einstellungen → MindMate → Mikrofon" },
  "voice.send": { en: "Send", de: "Senden" },
  "voice.edit": { en: "Edit", de: "Bearbeiten" },
  "voice.play": { en: "Play", de: "Abspielen" },
  "voice.stop": { en: "Stop", de: "Stoppen" },
  "voice.generating": { en: "Generating...", de: "Wird generiert..." },
  "voice.notSupported": { en: "Voice input is not available", de: "Spracheingabe ist nicht verfügbar" },
  "voice.tryChrome": { en: "Voice features require microphone access in your device settings", de: "Sprachfunktionen benötigen Mikrofonzugriff in deinen Geräteeinstellungen" },
  "voice.speaking": { en: "MindMate speaking...", de: "MindMate spricht..." },
  "voice.listeningStatus": { en: "Listening...", de: "Ich höre zu..." },

  // Premium
  "premium.plusFeature": { en: "Plus feature", de: "Plus-Funktion" },
  "premium.maybeLater": { en: "Maybe later", de: "Vielleicht später" },
  "premium.upgradeAnytime": { en: "You can upgrade anytime. No pressure.", de: "Du kannst jederzeit upgraden. Kein Druck." },

  // Swipe hints
  "swipe.swipeBack": { en: "Swipe to go back", de: "Wischen zum Zurückgehen" },
  "swipe.tapDismiss": { en: "Tap to dismiss", de: "Tippen zum Schließen" },

  // Summary
  "summary.date": { en: "Date", de: "Datum" },
};

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
  en: { title: string; description: string; longDescription: string; steps?: { title: string; description: string }[] }; 
  de: { title: string; description: string; longDescription: string; steps?: { title: string; description: string }[] } 
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
      ]
    }
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
  }) => {
    const translation = topicTranslations[topicId];
    const lang = translation?.[language] || translation?.en;
    
    return {
      title: lang?.title || fallback.title,
      description: lang?.description || fallback.description,
      longDescription: lang?.longDescription || fallback.longDescription || "",
      steps: lang?.steps || fallback.steps || [],
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
