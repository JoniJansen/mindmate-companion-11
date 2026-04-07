/**
 * Translation index — merges all domain-specific translation modules
 * into a single lookup object. The useTranslation hook consumes this.
 */
import type { Translations } from "./types";
import { commonTranslations } from "./common";
import { chatTranslations } from "./chat";
import { journalTranslations } from "./journal";
import { moodTranslations } from "./mood";
import { homeTranslations } from "./home";
import { companionTranslations } from "./companion";
import { settingsTranslations } from "./settings";
import { paymentsTranslations } from "./payments";
import { contentTranslations } from "./content";
import { authTranslations } from "./auth";

export const allTranslations: Translations = {
  ...commonTranslations,
  ...chatTranslations,
  ...journalTranslations,
  ...moodTranslations,
  ...homeTranslations,
  ...companionTranslations,
  ...settingsTranslations,
  ...paymentsTranslations,
  ...contentTranslations,
  ...authTranslations,
};

export type { Translations } from "./types";
