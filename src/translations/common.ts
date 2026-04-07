import type { Translations } from "./types";

export const commonTranslations: Translations = {
  // Navigation
  "nav.chat": { en: "Chat", de: "Chat" },
  "nav.journal": { en: "Journal", de: "Tagebuch" },
  "nav.toolbox": { en: "Toolbox", de: "Werkzeuge" },
  "nav.topics": { en: "Topics", de: "Themen" },
  "nav.mood": { en: "Mood", de: "Stimmung" },
  "nav.settings": { en: "Settings", de: "Einstellungen" },
  "nav.safety": { en: "Safety", de: "Sicherheit" },
  "nav.summary": { en: "Summary", de: "Zusammenfassung" },
  "nav.home": { en: "Home", de: "Start" },

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
  "common.delete": { en: "Delete", de: "Löschen" },
  "common.retry": { en: "Retry", de: "Erneut versuchen" },
  "common.offline": { en: "You're offline", de: "Du bist gerade offline" },
  "common.offlineBody": { en: "Check your connection and try again.", de: "Prüfe deine Verbindung und versuche es nochmal." },
  "common.continue": { en: "Continue", de: "Weiter" },
  "common.clear": { en: "Clear", de: "Entfernen" },

  // Error messages
  "error.unauthorized": { en: "Session expired", de: "Sitzung abgelaufen" },
  "error.unauthorizedBody": { en: "Please sign in again to continue.", de: "Bitte melde dich erneut an, um fortzufahren." },
  "error.reauth": { en: "Sign in", de: "Anmelden" },
  "error.rateLimited": { en: "One moment", de: "Einen Moment" },
  "error.rateLimitedBody": { en: "Let's slow down a bit. Try again in a moment.", de: "Lass uns kurz durchatmen. Versuche es gleich nochmal." },
  "error.server": { en: "Something didn't work", de: "Etwas hat nicht geklappt" },
  "error.serverBody": { en: "That wasn't supposed to happen. Please try again.", de: "Das sollte nicht passieren. Bitte versuche es nochmal." },
  "error.unexpected": { en: "Something didn't work", de: "Etwas hat nicht geklappt" },
  "error.unexpectedBody": { en: "That wasn't supposed to happen. Please try again.", de: "Das sollte nicht passieren. Bitte versuche es nochmal." },
  "error.network": { en: "No connection", de: "Keine Verbindung" },
  "error.networkBody": { en: "Check your internet connection and try again.", de: "Prüfe deine Internetverbindung und versuche es nochmal." },

  // Not Found page
  "notFound.title": { en: "Page not found", de: "Seite nicht gefunden" },
  "notFound.description": { en: "This page doesn't exist. Let's take you back.", de: "Diese Seite gibt es nicht. Lass uns dich zurückbringen." },
  "notFound.goHome": { en: "Go to Home", de: "Zur Startseite" },
  "notFound.goBack": { en: "Go Back", de: "Zurück" },

  // Swipe hints
  "swipe.swipeBack": { en: "Swipe to go back", de: "Wischen zum Zurückgehen" },
  "swipe.tapDismiss": { en: "Tap to dismiss", de: "Tippen zum Schließen" },

  // Diagnostics
  "diagnostics.title": { en: "Diagnostics", de: "Diagnose" },
  "diagnostics.subtitle": { en: "System status & debugging", de: "Systemstatus & Debugging" },
  "diagnostics.copyAll": { en: "Copy All", de: "Alles kopieren" },
  "diagnostics.copied": { en: "Copied", de: "Kopiert" },
  "diagnostics.errorLog": { en: "Error Log", de: "Fehlerprotokoll" },
  "diagnostics.noErrors": { en: "No recent errors captured.", de: "Keine kürzlichen Fehler erfasst." },
};
