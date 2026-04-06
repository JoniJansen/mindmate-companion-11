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
  "common.offline": { en: "You are offline", de: "Du bist offline" },
  "common.offlineBody": { en: "Check your connection", de: "Prüfe deine Verbindung" },
  "common.continue": { en: "Continue", de: "Weiter" },
  "common.clear": { en: "Clear", de: "Entfernen" },

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

  // Not Found page
  "notFound.title": { en: "Page not found", de: "Seite nicht gefunden" },
  "notFound.description": { en: "The page you're looking for doesn't exist. Let's get you back on track.", de: "Die Seite, die du suchst, existiert nicht. Lass uns dich zurückbringen." },
  "notFound.goToChat": { en: "Go to Chat", de: "Zum Chat" },
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
