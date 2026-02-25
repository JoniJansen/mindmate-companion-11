/**
 * Stable tag/feeling ID system for i18n-safe DB storage.
 * 
 * Tags are stored in DB as stable English IDs (e.g., "anxious", "work").
 * UI always renders via t() using the corresponding i18n key.
 * Legacy entries that stored localized labels are reverse-mapped to IDs.
 */

// Journal emotion tag IDs → i18n keys
export const JOURNAL_EMOTION_TAG_IDS = [
  "anxious", "sad", "angry", "stressed", "calm", "grateful", "hopeful", "overwhelmed",
] as const;

// Journal topic tag IDs → i18n keys
export const JOURNAL_TOPIC_TAG_IDS = [
  "work", "relationships", "family", "health", "selfworth", "future",
] as const;

export const ALL_JOURNAL_TAG_IDS = [...JOURNAL_EMOTION_TAG_IDS, ...JOURNAL_TOPIC_TAG_IDS] as const;

export type JournalTagId = typeof ALL_JOURNAL_TAG_IDS[number];

// Map tag ID → i18n key
export function getTagI18nKey(tagId: string): string {
  return `journal.tag.${tagId}`;
}

// Feeling tag IDs (for mood checkins)
export const FEELING_TAG_IDS = [
  "anxious", "stressed", "overwhelmed", "sad", "lonely", "frustrated",
  "grateful", "hopeful", "calm", "tired", "motivated", "content",
] as const;

export type FeelingTagId = typeof FEELING_TAG_IDS[number];

// Map feeling ID → i18n key
export function getFeelingI18nKey(feelingId: string): string {
  return `feeling.${feelingId}`;
}

/**
 * Legacy reverse mapper: converts old localized labels to stable IDs.
 * Handles both DE and EN labels from pre-migration data.
 */
const LEGACY_LABEL_TO_ID: Record<string, string> = {
  // Journal tags - EN
  "Anxious": "anxious", "Sad": "sad", "Angry": "angry", "Stressed": "stressed",
  "Calm": "calm", "Grateful": "grateful", "Hopeful": "hopeful", "Overwhelmed": "overwhelmed",
  "Work": "work", "Relationships": "relationships", "Family": "family",
  "Health": "health", "Self-worth": "selfworth", "Future": "future",
  // Journal tags - DE
  "Ängstlich": "anxious", "Traurig": "sad", "Wütend": "angry", "Gestresst": "stressed",
  "Ruhig": "calm", "Dankbar": "grateful", "Hoffnungsvoll": "hopeful", "Überfordert": "overwhelmed",
  "Arbeit": "work", "Beziehungen": "relationships", "Familie": "family",
  "Gesundheit": "health", "Selbstwert": "selfworth", "Zukunft": "future",
  // Feelings - EN
  "Lonely": "lonely", "Frustrated": "frustrated", "Tired": "tired",
  "Motivated": "motivated", "Content": "content",
  // Feelings - DE
  "Einsam": "lonely", "Frustriert": "frustrated", "Müde": "tired",
  "Motiviert": "motivated", "Zufrieden": "content",
};

/**
 * Convert a tag (could be stable ID or legacy label) to stable ID.
 * Returns the input unchanged if it's already a known ID or unrecognized.
 */
export function toStableTagId(tagOrLabel: string): string {
  // Already a known stable ID?
  if (ALL_JOURNAL_TAG_IDS.includes(tagOrLabel as any) || FEELING_TAG_IDS.includes(tagOrLabel as any)) {
    return tagOrLabel;
  }
  // Legacy label?
  return LEGACY_LABEL_TO_ID[tagOrLabel] || tagOrLabel;
}

/**
 * Convert an array of tags (mix of IDs and legacy labels) to stable IDs.
 */
export function toStableTagIds(tags: string[]): string[] {
  return tags.map(toStableTagId);
}
