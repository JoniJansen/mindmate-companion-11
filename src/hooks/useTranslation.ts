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
  "common.loading": { en: "One moment...", de: "Einen Moment..." },
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
  "journal.entrySaved": { en: "Good that you took time for yourself.", de: "Gut, dass du dir Zeit genommen hast." },
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

  // Journal additional keys
  "journal.needMoreEntries": { en: "Need more entries", de: "Mehr Einträge nötig" },
  "journal.writeAtLeast3Entries": { en: "Write at least 3 entries.", de: "Schreibe mindestens 3 Einträge." },
  "journal.yourWeeklyRecap": { en: "Your Weekly Recap", de: "Dein Wochenrückblick" },
  "journal.weeklyRecap": { en: "Weekly Recap", de: "Wochenrückblick" },
  "journal.observedPatterns": { en: "Observed patterns", de: "Beobachtete Muster" },
  "journal.suggestion": { en: "Suggestion", de: "Vorschlag" },
  "journal.refresh": { en: "Refresh", de: "Aktualisieren" },
  "journal.generate": { en: "Generate", de: "Erstellen" },
  "journal.discoverPatternsInEntries": { en: "Discover patterns in your entries.", de: "Entdecke Muster in deinen Einträgen." },
  "journal.yourEntries": { en: "Your entries", de: "Deine Einträge" },
  "journal.noEntriesFound": { en: "No entries found", de: "Keine Einträge gefunden" },
  "journal.untitled": { en: "Untitled Entry", de: "Ohne Titel" },
  "journal.fromChat": { en: "Chat", de: "Chat" },
  "journal.discoverPatterns": { en: "Discover Patterns", de: "Muster entdecken" },
  "journal.continue": { en: "Continue", de: "Weiter" },

  // Journal filter chips
  "journal.filter.all": { en: "All", de: "Alle" },
  "journal.filter.free": { en: "Free", de: "Frei" },
  "journal.filter.chat": { en: "Chat", de: "Chat" },
  "journal.filter.summary": { en: "AI Summary", de: "KI-Zusammen\u00ADfassung" },
  "journal.filter.guided": { en: "Guided", de: "Geführt" },

  // Journal prompts
  "journal.prompt1": { en: "What small moment brought you peace today?", de: "Welcher kleine Moment hat dir heute Frieden gebracht?" },
  "journal.prompt2": { en: "What are you grateful for right now?", de: "Wofür bist du gerade dankbar?" },
  "journal.prompt3": { en: "What's been on your mind lately?", de: "Was beschäftigt dich in letzter Zeit?" },
  "journal.prompt4": { en: "How are you really feeling today?", de: "Wie fühlst du dich heute wirklich?" },
  "journal.prompt5": { en: "What would make tomorrow better?", de: "Was würde morgen besser machen?" },
  
  // Journal tags (stable IDs for DB storage)
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

  // Mood page
  "mood.title": { en: "Mood", de: "Stimmung" },
  "mood.subtitle": { en: "How are you feeling right now?", de: "Wie geht es dir gerade?" },
  "mood.checkedInToday": { en: "Checked in today ✓", de: "Heute eingecheckt ✓" },
  "mood.howDoYouFeel": { en: "How do you feel?", de: "Wie fühlst du dich?" },
  "mood.canUpdate": { en: "You can update", de: "Du kannst aktualisieren" },
  "mood.whatDescribesYou": { en: "What describes you now?", de: "Was beschreibt dich gerade?" },
  "mood.optional": { en: "optional", de: "optional" },
  "mood.addNote": { en: "Want to add anything?", de: "Möchtest du etwas hinzufügen?" },
  "mood.saving": { en: "Saving...", de: "Speichern..." },
  "mood.saved": { en: "Mood noted", de: "Stimmung notiert" },
  "mood.savedDesc": { en: "Noticing how you feel is a form of self-care.", de: "Wahrzunehmen, wie du dich fühlst, ist eine Form der Selbstfürsorge." },
  "mood.yourTrend": { en: "Your Trend", de: "Dein Verlauf" },
  "mood.average": { en: "Avg", de: "Ø" },
  "mood.exploreDifficultDays": { en: "Explore difficult days", de: "Schwierige Tage erkunden" },
  "mood.daysWithLowMood": { en: "days with low mood", de: "Tage mit niedriger Stimmung" },
  "mood.dayWithLowMood": { en: "day with low mood", de: "Tag mit niedriger Stimmung" },
  "mood.wantToTalk": { en: "Want to talk about it?", de: "Darüber sprechen?" },
  "mood.startConversation": { en: "Start a conversation about how you feel", de: "Starte ein Gespräch über deine Gefühle" },
  "mood.noCheckins": { en: "No check-ins in this period yet", de: "Noch keine Check-ins in diesem Zeitraum" },
  "mood.filter7d": { en: "7 days", de: "7 Tage" },
  "mood.filter30d": { en: "30 days", de: "30 Tage" },
  "mood.filter90d": { en: "90 days", de: "90 Tage" },
  "mood.heatmapTitle": { en: "90-Day Overview", de: "90-Tage-Übersicht" },
  "mood.insightsTitle": { en: "Your Patterns", de: "Deine Muster" },
  "mood.communityTitle": { en: "You're Not Alone", de: "Du bist nicht allein" },

  // Feeling tags (stable IDs for DB storage)
  "feeling.anxious": { en: "Anxious", de: "Ängstlich" },
  "feeling.stressed": { en: "Stressed", de: "Gestresst" },
  "feeling.overwhelmed": { en: "Overwhelmed", de: "Überfordert" },
  "feeling.sad": { en: "Sad", de: "Traurig" },
  "feeling.lonely": { en: "Lonely", de: "Einsam" },
  "feeling.frustrated": { en: "Frustrated", de: "Frustriert" },
  "feeling.grateful": { en: "Grateful", de: "Dankbar" },
  "feeling.hopeful": { en: "Hopeful", de: "Hoffnungsvoll" },
  "feeling.calm": { en: "Calm", de: "Ruhig" },
  "feeling.tired": { en: "Tired", de: "Müde" },
  "feeling.motivated": { en: "Motivated", de: "Motiviert" },
  "feeling.content": { en: "Content", de: "Zufrieden" },

  // Common additional
  "common.delete": { en: "Delete", de: "Löschen" },
  "common.retry": { en: "Retry", de: "Erneut versuchen" },
  "common.offline": { en: "You are offline", de: "Du bist offline" },
  "common.offlineBody": { en: "Check your connection", de: "Prüfe deine Verbindung" },
  "common.continue": { en: "Continue", de: "Weiter" },

  // Error messages
  "error.unauthorized": { en: "Session expired", de: "Sitzung abgelaufen" },
  "error.unauthorizedBody": { en: "Please sign in again.", de: "Bitte melde dich erneut an." },
  "error.reauth": { en: "Sign in", de: "Anmelden" },
  "error.rateLimited": { en: "Please wait", de: "Bitte warten" },
  "error.rateLimitedBody": { en: "Too many requests. Try again in a moment.", de: "Zu viele Anfragen. Versuche es gleich nochmal." },
  "error.server": { en: "Server error", de: "Serverfehler" },
  "error.serverBody": { en: "Something went wrong. Please try again.", de: "Etwas ist schiefgelaufen. Bitte versuche es erneut." },
  "error.unexpected": { en: "Unexpected error", de: "Unerwarteter Fehler" },
  "error.unexpectedBody": { en: "Something went wrong. Please try again.", de: "Etwas ist schiefgelaufen. Bitte versuche es erneut." },
  "error.network": { en: "Connection failed", de: "Verbindung fehlgeschlagen" },
  "error.networkBody": { en: "Check your internet connection and try again.", de: "Prüfe deine Internetverbindung und versuche es erneut." },

  // Chat additional
  "chat.streamError": { en: "Connection interrupted", de: "Verbindung unterbrochen" },
  "chat.streamErrorBody": { en: "The response was interrupted.", de: "Die Antwort wurde unterbrochen." },
  "chat.retryMessage": { en: "Retry", de: "Erneut versuchen" },
  "chat.continueMessage": { en: "Continue", de: "Fortsetzen" },
  "chat.howToStart": { en: "How would you like to start?", de: "Wie möchtest du starten?" },
  "chat.summary": { en: "Summary", de: "Zusammenfassung" },
  "chat.crisisHelp2": { en: "Crisis Help", de: "Krisenhilfe" },
  "chat.voiceModeActive": { en: "Voice mode active", de: "Sprachmodus aktiv" },
  "chat.startVoiceMode": { en: "Start voice mode", de: "Sprachmodus starten" },
  "chat.voiceConversationsPlus": { en: "Voice conversations – Plus", de: "Sprachgespräche – Plus" },
  "chat.aiSpeaksAuto": { en: "AI speaks automatically", de: "KI spricht automatisch" },
  "chat.textOnly": { en: "Text only", de: "Nur Text" },
  "chat.voiceOutputPlus": { en: "Voice output – Plus", de: "Sprachausgabe – Plus" },
  "chat.stopRecording": { en: "Stop recording", de: "Aufnahme stoppen" },
  "chat.voiceInput": { en: "Voice input", de: "Spracheingabe" },
  "chat.voiceInputPlus": { en: "Voice input – Plus", de: "Spracheingabe – Plus" },
  "chat.crisisResources": { en: "Crisis resources", de: "Krisenressourcen" },

  // Topics additional
  "topics.searchTopics": { en: "Search topics...", de: "Thema suchen..." },
  "topics.structuredPaths": { en: "Structured reflection paths", de: "Strukturierte Reflexionspfade" },

  // Toolbox page
  "toolbox.title": { en: "Toolbox", de: "Werkzeugkasten" },
  "toolbox.subtitle": { en: "Evidence-based techniques", de: "Evidenzbasierte Techniken" },
  "toolbox.suggestedForYou": { en: "For you", de: "Für dich" },
  "toolbox.allExercises": { en: "All", de: "Alle" },
  "toolbox.noExercises": { en: "No exercises in this category", de: "Keine Übungen in dieser Kategorie" },
  "toolbox.tip": { en: "💡", de: "💡" },
  "toolbox.tipText": { en: "Regular short practices are more effective than occasional long sessions.", de: "Regelmäßige kurze Übungen sind effektiver als gelegentliche lange Sitzungen." },
  "toolbox.exerciseCompleted": { en: "Well done", de: "Gut gemacht" },
  "toolbox.greatJob": { en: "You showed up for yourself. That takes strength.", de: "Du warst für dich da. Das braucht Stärke." },
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
  "topics.learn": { en: "Learn", de: "Lernen" },
  "topics.notes": { en: "Notes", de: "Notizen" },
  "topics.aiChat": { en: "Ask AI", de: "KI fragen" },
  "topics.noExercises": { en: "No exercises for this topic yet", de: "Noch keine Übungen für dieses Thema" },
  "topics.noLearnContent": { en: "No learning content yet", de: "Noch keine Lerninhalte" },
  "topics.reflectionQuestion": { en: "Reflection question", de: "Reflexionsfrage" },
  "topics.notesPlaceholder": { en: "Write your thoughts about this topic...", de: "Schreibe deine Gedanken zu diesem Thema..." },
  "topics.notesSaved": { en: "Note saved", de: "Notiz gespeichert" },
  "topics.saveToJournal": { en: "Save to Journal", de: "Im Tagebuch speichern" },
  "topics.savedToJournal": { en: "Saved to journal", de: "Im Tagebuch gespeichert" },
  "topics.askAboutTopic": { en: "Ask about this topic...", de: "Frage zu diesem Thema..." },
  "topics.topicChatIntro": { en: "Ask me anything about this topic. I'll help you understand it better and apply it to your situation.", de: "Frage mich alles zu diesem Thema. Ich helfe dir, es besser zu verstehen und auf deine Situation anzuwenden." },
  "topics.stepType.reflection": { en: "Reflection", de: "Reflexion" },
  "topics.stepType.exercise": { en: "Exercise", de: "Übung" },
  "topics.stepType.journal": { en: "Journal", de: "Tagebuch" },
  "topics.stepType.chat": { en: "Chat", de: "Chat" },
  
  // Chat save to journal
  "chat.saveMessage": { en: "Save to journal", de: "Im Tagebuch speichern" },
  "chat.saveChat": { en: "Save chat", de: "Chat speichern" },
  "chat.saveSummary": { en: "Save AI summary", de: "KI-Zusammenfassung speichern" },
  "chat.savedToJournal": { en: "Saved to journal", de: "Im Tagebuch gespeichert" },
  "chat.chatSavedDesc": { en: "Your conversation has been saved as a journal entry.", de: "Dein Gespräch wurde als Tagebucheintrag gespeichert." },
  "chat.messageSavedDesc": { en: "The message has been saved to your journal.", de: "Die Nachricht wurde in deinem Tagebuch gespeichert." },
  "chat.summarySavedDesc": { en: "AI summary has been saved to your journal.", de: "KI-Zusammenfassung wurde in deinem Tagebuch gespeichert." },
  "chat.generatingSummary": { en: "Generating summary...", de: "Zusammenfassung wird erstellt..." },
  "chat.pleaseWait": { en: "This may take a moment.", de: "Das kann einen Moment dauern." },

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
  "voice.enableMic": { en: "Please enable microphone access in Settings → Soulvay → Microphone", de: "Bitte aktiviere den Mikrofonzugriff unter Einstellungen → Soulvay → Mikrofon" },
  "voice.send": { en: "Send", de: "Senden" },
  "voice.edit": { en: "Edit", de: "Bearbeiten" },
  "voice.play": { en: "Play", de: "Abspielen" },
  "voice.stop": { en: "Stop", de: "Stoppen" },
  "voice.generating": { en: "Generating...", de: "Wird generiert..." },
  "voice.notSupported": { en: "Voice input is not available", de: "Spracheingabe ist nicht verfügbar" },
  "voice.tryChrome": { en: "Voice features require microphone access in your device settings", de: "Sprachfunktionen benötigen Mikrofonzugriff in deinen Geräteeinstellungen" },
  "voice.speaking": { en: "Soulvay speaking...", de: "Soulvay spricht..." },
  "voice.loading": { en: "One moment...", de: "Einen Moment..." },
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

  // Home page
  "home.greetingMorning": { en: "Good morning", de: "Guten Morgen" },
  "home.greetingAfternoon": { en: "Good afternoon", de: "Guten Tag" },
  "home.greetingEvening": { en: "Good evening", de: "Guten Abend" },
  "home.howAreYou": { en: "How are you?", de: "Wie geht es dir?" },
  "home.inputPlaceholder": { en: "What's on your mind? Just type or talk...", de: "Was geht dir durch den Kopf? Schreib oder sprich einfach drauf los..." },
  "home.listening": { en: "Listening...", de: "Ich höre zu..." },
  "home.save": { en: "Save", de: "Speichern" },
  "home.talk": { en: "Talk", de: "Reden" },
  "home.unloadThoughts": { en: "Unload your thoughts. No goal needed.", de: "Lade deine Gedanken ab. Kein Ziel nötig." },
  "home.talkToMe": { en: "Talk to me", de: "Mit mir reden" },
  "home.innerDialogue": { en: "Inner dialogue", de: "Innerer Dialog" },
  "home.myTimeline": { en: "My Timeline", de: "Meine Timeline" },
  "home.thoughtsPatterns": { en: "Thoughts & patterns", de: "Gedanken & Muster" },
  "home.recentThoughts": { en: "Recent thoughts", de: "Letzte Gedanken" },
  "home.all": { en: "All", de: "Alle" },
  "home.noThoughts": { en: "No thoughts yet. Just unload what's on your mind.", de: "Noch keine Gedanken. Lade einfach ab, was dir durch den Kopf geht." },
  "home.thoughtSaved": { en: "Thought captured", de: "Gedanke festgehalten" },
  "home.thoughtSavedDesc": { en: "It's good to let it out.", de: "Es tut gut, es rauszulassen." },
  "home.saveFailed": { en: "Could not save thought.", de: "Konnte nicht gespeichert werden." },
  "home.forYou": { en: "For you", de: "Für dich" },
  "home.lastExercise": { en: "Continue exercise", de: "Übung fortsetzen" },
  "home.startHere": { en: "Start here", de: "Starte hier" },
  "home.startHereDesc": { en: "Check in with your mood or write a thought.", de: "Checke deine Stimmung ein oder schreibe einen Gedanken." },
  "home.continueTitle": { en: "Pick up where you left off", de: "Mach weiter, wo du aufgehört hast" },
  "home.continueExercise": { en: "Continue exercise", de: "Übung fortsetzen" },
  "home.continueExerciseDesc": { en: "Resume your last exercise", de: "Letzte Übung fortsetzen" },
  "home.continueTopic": { en: "Continue topic", de: "Thema fortsetzen" },
  "home.continueTopicDesc": { en: "Resume your reflection path", de: "Reflexionspfad fortsetzen" },
  "home.continueJournalDraft": { en: "Continue writing", de: "Weiterschreiben" },
  "home.lastEdited": { en: "Last edited", de: "Zuletzt bearbeitet" },
  "common.clear": { en: "Clear", de: "Entfernen" },

   // Sentiment
  "journal.sentimentSuggestion": { en: "AI suggests tagging as", de: "KI schlägt vor zu taggen als" },
  "journal.sentimentInsight": { en: "Insight", de: "Einblick" },
  "journal.sentimentTagPrompt": { en: "Would you like to tag this?", de: "Möchtest du das markieren?" },
  "journal.sentimentJustSuggestion": { en: "Just a suggestion — you decide.", de: "Das ist nur ein Vorschlag — du entscheidest." },

  // Audio Library
  "audio.title": { en: "Audio Library", de: "Audio-Bibliothek" },
  "audio.subtitle": { en: "Guided sessions for inner peace", de: "Geführte Sessions für innere Ruhe" },
  "audio.premiumRequired": { en: "Premium feature — Upgrade for access", de: "Premium-Funktion — Upgrade für Zugang" },
  "audio.sleepMode": { en: "Sleep Mode", de: "Schlafmodus" },
  "audio.minimalUI": { en: "Minimal UI", de: "Minimales UI" },
  "audio.sleepWell": { en: "Sleep well", de: "Schlaf gut" },
  "audio.playing": { en: "Playing...", de: "Wird abgespielt..." },
  "audio.exit": { en: "Exit", de: "Beenden" },
  "audio.sleepEnded": { en: "Sleep mode ended. Good night.", de: "Schlafmodus beendet. Gute Nacht." },
  "audio.whyRecommended": { en: "Based on your recent check-ins", de: "Basierend auf deinen letzten Check-ins" },
  "audio.sleepRecommended": { en: "Wind down for tonight", de: "Komm heute Abend zur Ruhe" },
  "audio.stressRecommended": { en: "You seem tense — try this", de: "Du wirkst angespannt — probier das" },

  // Streak & Progress
  "streak.day": { en: "day", de: "Tag" },
  "streak.days": { en: "days", de: "Tage" },
  "streak.weeklyProgress": { en: "Your Week", de: "Deine Woche" },
  "streak.vsLastWeek": { en: "vs last week", de: "vs letzte Woche" },
  "streak.daysActive": { en: "days active", de: "Tage aktiv" },
  "streak.streak": { en: "streak", de: "Streak" },
  "streak.moodCheckins": { en: "Mood", de: "Stimmung" },
  "streak.journalEntries": { en: "Journal", de: "Tagebuch" },
  "streak.exercises": { en: "Exercises", de: "Übungen" },
  "streak.chatSessions": { en: "Chats", de: "Chats" },
  "streak.startToday": { en: "Start your day — check in, write, or chat.", de: "Starte deinen Tag — checke ein, schreib oder chatte." },
  "streak.validatingMessage": { en: "You showed up {days} days this week. That matters.", de: "Du warst diese Woche {days} Tage für dich da. Das zählt." },

  // Settings toasts
  "settings.tourReset": { en: "Tour reset", de: "Tour zurückgesetzt" },
  "settings.tourResetDesc": { en: "The app tour will start on your next chat visit.", de: "Die App-Einführung startet beim nächsten Chat-Besuch." },
  "settings.loggedOut": { en: "Logged out successfully", de: "Erfolgreich abgemeldet" },
  "settings.logoutError": { en: "Error logging out", de: "Fehler beim Abmelden" },
  "settings.welcomePlus": { en: "Welcome to Soulvay Plus!", de: "Willkommen bei Soulvay Plus!" },
  "settings.upgradeSuccess": { en: "Your upgrade was successful.", de: "Dein Upgrade war erfolgreich." },
  "settings.checkoutCanceled": { en: "Checkout canceled", de: "Checkout abgebrochen" },
  "settings.upgradeAnytime": { en: "You can upgrade anytime.", de: "Du kannst jederzeit upgraden." },

  // Settings UI - Support section
  "settings.supportResources": { en: "Support & Resources", de: "Unterstützung & Ressourcen" },
  "settings.crisisAlways": { en: "Crisis resources always available", de: "Krisenressourcen immer erreichbar" },
  "settings.installApp": { en: "Install App", de: "App installieren" },
  "settings.addToHome": { en: "Add to home screen", de: "Zum Startbildschirm hinzufügen" },
  "settings.restartTour": { en: "Restart Tour", de: "Tour neu starten" },
  "settings.repeatIntro": { en: "Repeat app introduction", de: "App-Einführung wiederholen" },
  "settings.adminPanel": { en: "Admin Panel", de: "Admin-Bereich" },
  "settings.manageUsers": { en: "Manage users & subscriptions", de: "Nutzer & Abos verwalten" },

  // Settings UI - Account section
  "settings.account": { en: "Account", de: "Konto" },
  "settings.logOut": { en: "Log out", de: "Abmelden" },
  "settings.endSession": { en: "End your session", de: "Sitzung beenden" },
  "settings.logOutConfirm": { en: "Log out?", de: "Abmelden?" },
  "settings.logOutDesc": { en: "You can log back in anytime. Your data will remain safely stored.", de: "Du kannst dich jederzeit wieder anmelden. Deine Daten bleiben sicher gespeichert." },
  "settings.loggingOut": { en: "Logging out...", de: "Wird abgemeldet..." },

  // Settings UI - Legal section
  "settings.legalInfo": { en: "Legal & Info", de: "Rechtliches & Info" },
  "settings.cookieSettings": { en: "Cookie Settings", de: "Cookie-Einstellungen" },
  "settings.privacyPolicy": { en: "Privacy Policy", de: "Datenschutz" },
  "settings.termsOfUse": { en: "Terms of Use", de: "AGB" },
  "settings.legalNotice": { en: "Legal Notice", de: "Impressum" },
  "settings.withdrawal": { en: "Withdrawal", de: "Widerruf" },
  "settings.aboutUs": { en: "About", de: "Über uns" },
  "settings.contact": { en: "Contact", de: "Kontakt" },

  // Settings UI - Voice
  "settings.avatarStyle": { en: "Avatar Style", de: "Avatar-Stil" },

  // Auth page
  "auth.back": { en: "Back", de: "Zurück" },
  "auth.welcomeBack": { en: "Welcome back", de: "Willkommen zurück" },
  "auth.signInContinue": { en: "Sign in to continue your journey", de: "Melde dich an, um fortzufahren" },
  "auth.signIn": { en: "Sign in", de: "Anmelden" },
  "auth.noAccount": { en: "Don't have an account?", de: "Noch kein Konto?" },
  "auth.signUp": { en: "Sign up", de: "Registrieren" },
  "auth.createAccount": { en: "Create your account", de: "Erstelle dein Konto" },
  "auth.startJourney": { en: "Start your mental wellness journey", de: "Starte deine Reise zu mehr Wohlbefinden" },
  "auth.keepSafe": { en: "Keep your reflections safe and synced across devices.", de: "Speichere deine Gedanken sicher und synchronisiere sie geräteübergreifend." },
  "auth.createAccountBtn": { en: "Create account", de: "Konto erstellen" },
  "auth.hasAccount": { en: "Already have an account?", de: "Bereits ein Konto?" },
  "auth.resetPassword": { en: "Reset password", de: "Passwort zurücksetzen" },
  "auth.resetSubtitle": { en: "We'll send you a reset link", de: "Wir senden dir einen Reset-Link" },
  "auth.sendResetLink": { en: "Send reset link", de: "Link senden" },
  "auth.rememberPassword": { en: "Remember your password?", de: "Passwort doch bekannt?" },
  "auth.yourName": { en: "Your name (optional)", de: "Dein Name (optional)" },
  "auth.yourNamePlaceholder": { en: "Your name", de: "Dein Name" },
  "auth.password": { en: "Password", de: "Passwort" },
  "auth.forgot": { en: "Forgot?", de: "Vergessen?" },
  "auth.secureEncrypted": { en: "Secure & private", de: "Sicher & privat" },
  "auth.welcomeBackToast": { en: "Welcome back!", de: "Willkommen zurück!" },
  "auth.nowLoggedIn": { en: "You are now logged in.", de: "Du bist jetzt eingeloggt." },
  "auth.accountCreated": { en: "Account created!", de: "Konto erstellt!" },
  "auth.welcomeToSoulvay": { en: "Welcome to Soulvay!", de: "Willkommen bei Soulvay!" },
  "auth.emailSent": { en: "Email sent", de: "E-Mail gesendet" },
  "auth.checkInbox": { en: "Check your inbox for the reset link.", de: "Überprüfe dein Postfach für den Link zum Zurücksetzen." },
  "auth.reviewLogin": { en: "Review / Demo Login", de: "Review / Demo Login" },
  "auth.reviewPurpose": { en: "For App Store Review and testing purposes", de: "Für App Store Review und Testzwecke" },

  // FAQ page
  "faq.stillQuestions": { en: "Still have questions?", de: "Noch Fragen?" },
  "faq.happyToHelp": { en: "We're happy to help!", de: "Wir helfen dir gerne weiter!" },
  "faq.contactUs": { en: "Contact Us", de: "Kontakt aufnehmen" },

  // Chat journal save titles
  "chat.journalTitle.message": { en: "Chat Message", de: "Chat-Nachricht" },
  "chat.journalTitle.conversation": { en: "Chat Conversation", de: "Chat-Gespräch" },
  "chat.journalTitle.summary": { en: "AI Summary", de: "KI-Zusammenfassung" },
  "chat.jumpToLatest": { en: "Latest", de: "Neueste" },
  "chat.summarySection.summary": { en: "Summary", de: "Zusammenfassung" },
  "chat.summarySection.themes": { en: "Themes", de: "Themen" },
  "chat.summarySection.moodJourney": { en: "Mood Journey", de: "Stimmungsverlauf" },
  "chat.summarySection.nextStep": { en: "Next Step", de: "Nächster Schritt" },

  // Reset Password page
  "resetPassword.title": { en: "Set new password", de: "Neues Passwort setzen" },
  "resetPassword.subtitle": { en: "Enter your new password.", de: "Gib dein neues Passwort ein." },
  "resetPassword.newPassword": { en: "New password", de: "Neues Passwort" },
  "resetPassword.confirmPassword": { en: "Confirm password", de: "Passwort bestätigen" },
  "resetPassword.submit": { en: "Update password", de: "Passwort ändern" },
  "resetPassword.tooShort": { en: "Password too short", de: "Passwort zu kurz" },
  "resetPassword.minChars": { en: "At least 6 characters required.", de: "Mindestens 6 Zeichen erforderlich." },
  "resetPassword.mismatch": { en: "Passwords don't match", de: "Passwörter stimmen nicht überein" },
  "resetPassword.checkInput": { en: "Please check your input.", de: "Bitte überprüfe deine Eingabe." },
  "resetPassword.success": { en: "Password updated", de: "Passwort geändert" },
  "resetPassword.successDesc": { en: "You can now sign in with your new password.", de: "Du kannst dich jetzt mit deinem neuen Passwort anmelden." },
  "resetPassword.successTitle": { en: "Password updated!", de: "Passwort geändert!" },
  "resetPassword.redirecting": { en: "Redirecting...", de: "Du wirst weitergeleitet..." },
  "resetPassword.linkExpired": { en: "Link expired", de: "Link abgelaufen" },
  "resetPassword.linkExpiredDesc": { en: "This link is no longer valid. Please request a new one.", de: "Dieser Link ist nicht mehr gültig. Bitte fordere einen neuen Link an." },
  "resetPassword.backToLogin": { en: "Back to login", de: "Zurück zum Login" },

  // RevenueCat / IAP
  "iap.notAvailable": { en: "Not available", de: "Nicht verfügbar" },
  "iap.onlyIOS": { en: "In-app purchases are only available in the iOS app", de: "In-App-Käufe sind nur in der iOS App verfügbar" },
  "iap.activated": { en: "Subscription activated", de: "Abo aktiviert" },
  "iap.activatedDesc": { en: "Your Soulvay Plus subscription is now active!", de: "Dein Soulvay Plus Abo ist jetzt aktiv!" },
  "iap.purchaseFailed": { en: "Purchase failed", de: "Kauf fehlgeschlagen" },
  "iap.purchaseFailedDesc": { en: "The purchase could not be completed", de: "Der Kauf konnte nicht abgeschlossen werden" },
  "iap.restoreOnly": { en: "This feature is only available in the iOS app", de: "Diese Funktion ist nur in der iOS App verfügbar" },
  "iap.restored": { en: "Purchases restored", de: "Käufe wiederhergestellt" },
  "iap.restoredDesc": { en: "Your subscription has been restored successfully", de: "Dein Abo wurde erfolgreich wiederhergestellt" },
  "iap.noPurchases": { en: "No purchases found", de: "Keine Käufe gefunden" },
  "iap.noPurchasesDesc": { en: "No previous purchases were found", de: "Es wurden keine vorherigen Käufe gefunden" },
  "iap.restoreFailed": { en: "Restore failed", de: "Wiederherstellung fehlgeschlagen" },
  "iap.restoreFailedDesc": { en: "Purchases could not be restored", de: "Käufe konnten nicht wiederhergestellt werden" },

  // Backup Reminder
  "backup.reminder": { en: "Backup Reminder", de: "Backup-Erinnerung" },
  "backup.neverCreated": { en: "You've never created a backup. Secure your data now!", de: "Du hast noch nie ein Backup erstellt. Sichere deine Daten jetzt!" },
  "backup.overdue": { en: "Your last backup was {days} days ago. Time for a new backup!", de: "Dein letztes Backup ist {days} Tage her. Zeit für ein neues Backup!" },
  "backup.notSupported": { en: "Notifications not supported", de: "Benachrichtigungen nicht unterstützt" },
  "backup.notSupportedDesc": { en: "Your browser doesn't support notifications.", de: "Dein Browser unterstützt keine Benachrichtigungen." },
  "backup.enabled": { en: "Notifications enabled", de: "Benachrichtigungen aktiviert" },
  "backup.enabledDesc": { en: "You'll receive backup reminders.", de: "Du erhältst Backup-Erinnerungen." },
  "backup.blocked": { en: "Notifications blocked", de: "Benachrichtigungen blockiert" },
  "backup.blockedDesc": { en: "Please enable notifications in your browser settings.", de: "Bitte aktiviere Benachrichtigungen in deinen Browsereinstellungen." },

  // Timeline
  "timeline.notEnoughDataTitle": { en: "Not enough data", de: "Nicht genug Daten" },
  "timeline.notEnoughDataDesc": { en: "Write at least 3 thoughts for pattern recognition.", de: "Schreibe mindestens 3 Gedanken für Muster-Erkennung." },
  "timeline.insightError": { en: "Could not generate patterns.", de: "Konnte keine Muster erkennen." },

  // Diagnostics
  "diagnostics.title": { en: "Diagnostics", de: "Diagnose" },
  "diagnostics.subtitle": { en: "System status & debugging", de: "Systemstatus & Debugging" },
  "diagnostics.copyAll": { en: "Copy All", de: "Alles kopieren" },
  "diagnostics.copied": { en: "Copied", de: "Kopiert" },
  "diagnostics.errorLog": { en: "Error Log", de: "Fehlerprotokoll" },
  "diagnostics.noErrors": { en: "No recent errors captured.", de: "Keine kürzlichen Fehler erfasst." },

  // Daily Prompts & Insights
  "home.dailyPrompt": { en: "A thought for you", de: "Ein Gedanke für dich" },
  "home.sessionInsight": { en: "From your last conversation", de: "Aus deinem letzten Gespräch" },
  "home.patterns": { en: "What I notice", de: "Was mir auffällt" },
  "home.saveInsight": { en: "Save to journal", de: "Im Tagebuch speichern" },
  "home.refreshPatterns": { en: "Refresh", de: "Aktualisieren" },
  "home.detectingPatterns": { en: "Looking for patterns...", de: "Suche nach Mustern..." },

  // Home — Memory Moments
  "home.memoryMoment": { en: "Memory Moment", de: "Erinnerung" },
  "home.memoryMomentIntro": { en: "A while back you mentioned:", de: "Vor einiger Zeit hast du erwähnt:" },
  "home.memoryMomentQuestion": { en: "How has that been for you lately?", de: "Wie geht es dir damit heute?" },
  "home.talkAboutIt": { en: "Talk about it", de: "Darüber sprechen" },
  "home.notNow": { en: "Not now", de: "Nicht jetzt" },
  "home.history": { en: "History", de: "Verlauf" },
  "home.recentConversations": { en: "Recent conversations", de: "Letzte Gespräche" },
  "home.conversation": { en: "Conversation", de: "Gespräch" },
  "home.appExploreQuestion": { en: "What can I do in this app?", de: "Was kann ich in der App machen?" },
  "home.memoryMomentMsg": { en: "A while back I mentioned:", de: "Vor einiger Zeit habe ich erwähnt:" },
  "home.memoryMomentContinue": { en: "I'd like to talk about how that's been going.", de: "Ich möchte darüber sprechen, wie es mir damit jetzt geht." },

  // Nav
  "nav.home": { en: "Home", de: "Zuhause" },

  // Chat History
  "chatHistory.title": { en: "Conversation History", de: "Gesprächsverlauf" },
  "chatHistory.emptyState": { en: "Your conversations will appear here once you start chatting with Soulvay.", de: "Deine Gespräche erscheinen hier, sobald du mit Soulvay chattest." },
  "chatHistory.startConversation": { en: "Start a conversation", de: "Gespräch starten" },
  "chatHistory.today": { en: "Today", de: "Heute" },
  "chatHistory.yesterday": { en: "Yesterday", de: "Gestern" },

  // Chat — header tooltips
  "chat.conversationHistory": { en: "Conversation history", de: "Gesprächsverlauf" },
  "chat.newConversation": { en: "New conversation", de: "Neues Gespräch" },
  "chat.chatMessage": { en: "Chat Message", de: "Chat-Nachricht" },
  "chat.chatConversation": { en: "Chat Conversation", de: "Chat-Gespräch" },

  // Timeline
  "timeline.title": { en: "My Timeline", de: "Meine Timeline" },
  "timeline.moodMap": { en: "Mood Map", de: "Stimmungskarte" },
  "timeline.moodMap90": { en: "90-Day Mood Map", de: "90-Tage Stimmungsverlauf" },
  "timeline.detectedPatterns": { en: "Detected Patterns", de: "Erkannte Muster" },
  "timeline.conversationReflections": { en: "Conversation Reflections", de: "Reflexionen aus Gesprächen" },
  "timeline.noThoughtsDay": { en: "No thoughts on this day.", de: "Keine Gedanken an diesem Tag." },
  "timeline.addThoughts": { en: "Add thoughts", de: "Gedanken hinzufügen" },
  "timeline.selectDay": { en: "Select a day", de: "Wähle einen Tag" },
  "timeline.today": { en: "Today", de: "Heute" },
  "timeline.loadMore": { en: "Load more", de: "Mehr laden" },
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
