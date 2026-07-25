import type { Translations } from "./types";

/**
 * Empty-state copy for the shared <EmptyState /> component
 * (src/components/shared/EmptyState.tsx).
 * One calm sentence per state, plus optional CTA labels.
 */
export const emptyStatesTranslations: Translations = {
  // Journal — list view
  "emptyState.journal.noEntries": { en: "Start with your first entry", de: "Beginne mit deinem ersten Eintrag" },
  "emptyState.journal.noResults": { en: "No entries found", de: "Keine Einträge gefunden" },
  "emptyState.journal.noEntriesOnDay": { en: "No entries on this day", de: "Keine Einträge an diesem Tag" },
  "emptyState.journal.cta": { en: "Write your first entry", de: "Ersten Eintrag schreiben" },

  // Chat history — saved conversations
  "emptyState.chatHistory.description": { en: "Your conversations will appear here once you start chatting with Soulvay.", de: "Deine Gespräche erscheinen hier, sobald du mit Soulvay chattest." },
  "emptyState.chatHistory.cta": { en: "Start a conversation", de: "Gespräch starten" },

  // Timeline — day view
  "emptyState.timeline.noThoughtsDay": { en: "No thoughts on this day.", de: "Keine Gedanken an diesem Tag." },
  "emptyState.timeline.cta": { en: "Add thoughts", de: "Gedanken hinzufügen" },
  "emptyState.timeline.selectDay": { en: "Select a day", de: "Wähle einen Tag" },
};
