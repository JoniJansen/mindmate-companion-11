# i18n Migration Plan — Elite-Audit #9

## Situation

Soulvay has **395 inline `language === "de" ? "..." : "..."` ternaries** across 40+ files. Elite-Audit #9 flags this as "Hoch/Large" — high leverage but sprawling work.

Symptoms of leaving it:
- Two translations of the same idea drift out of sync
- Adding a new language means editing 40+ files
- No single place to review DE/EN parity
- Search-first developers can't find where a UI string lives

## Scope (measured, not estimated)

```bash
$ grep -rln 'language === "de"' src/ | wc -l
40+ files

$ grep -rc 'language === "de"' src/ | awk -F: '{s+=$2} END {print s}'
395 ternaries total
```

## Top 20 files by ternary count

| Count | File | Priority reason |
|---|---|---|
| 30 | `src/components/settings/NotificationSettings.tsx` | Settings screen — medium visibility |
| 27 | `src/components/premium/SubscriptionSection.tsx` | Premium mgmt — revenue-relevant |
| 21 | `src/components/settings/AccountSettings.tsx` | Settings |
| 19 | `src/pages/Upgrade.tsx` | **Paywall — highest revenue** |
| 16 | `src/pages/Auth.tsx` | First-impression |
| 16 | `src/components/journal/AISummaryDetail.tsx` | Journal reflection |
| 14 | `src/components/journal/WeeklyRecap.tsx` | Premium feature |
| 10 | `src/components/landing/DemoChat.tsx` | Landing — first impression |
| 10 | `src/components/home/RitualCard.tsx` | Home |
| 10 | `src/components/home/GrowthDashboard.tsx` | Home |
| 9 | `src/components/settings/SettingsVoiceSection.tsx` | Settings |
| 9 | `src/components/companion/CompanionSelector.tsx` | Onboarding-adjacent |
| 8 | `src/pages/CompanionSettings.tsx` | Settings |
| 8 | `src/hooks/useCompanionCheckins.ts` | Data layer (unusual — should be data-driven, not string-driven) |
| 7 | `src/pages/Onboarding.tsx` | First-impression |
| 7 | `src/pages/Journal.tsx` | Journal |
| 7 | `src/pages/Contact.tsx` | Static page |
| 7 | `src/components/premium/ProgressUnlock.tsx` | Premium |
| 7 | `src/components/mood/MoodInsights.tsx` | Mood |
| 7 | `src/components/home/ShareableInsightCard.tsx` | Home / sharing |

Everything below 7 has ≤6 ternaries and is thin.

## Migration priority (Elite-Audit order + revenue lens)

**Batch A — Revenue-critical** (~65 ternaries, ~2 hrs)
1. `src/pages/Upgrade.tsx` (19)
2. `src/components/premium/SubscriptionSection.tsx` (27)
3. `src/components/premium/ProgressUnlock.tsx` (7)
4. `src/components/journal/WeeklyRecap.tsx` (14) — premium feature

**Batch B — First-impression** (~55 ternaries, ~1.5 hrs)
1. `src/pages/Auth.tsx` (16)
2. `src/pages/Onboarding.tsx` (7)
3. `src/components/landing/DemoChat.tsx` (10)
4. `src/components/companion/CompanionSelector.tsx` (9)
5. Rest of `src/components/landing/*` and `src/pages/Landing.tsx`

**Batch C — Settings** (~85 ternaries, ~2.5 hrs)
1. `NotificationSettings.tsx` (30)
2. `AccountSettings.tsx` (21)
3. `SettingsVoiceSection.tsx` (9)
4. `CompanionSettings.tsx` (8)
5. Remaining settings files

**Batch D — Content & Info** (~50 ternaries, ~1.5 hrs)
1. `Contact.tsx` (7)
2. `Safety.tsx` (varies)
3. `Impressum / Privacy / Terms / FAQ` (static text)

**Batch E — Journal + Mood + Home** (~80 ternaries, ~2.5 hrs)
1. `AISummaryDetail.tsx` (16)
2. `RitualCard.tsx` (10)
3. `GrowthDashboard.tsx` (10)
4. `MoodInsights.tsx` (7)
5. `ShareableInsightCard.tsx` (7)
6. Rest of journal/mood/home components

**Batch F — Data / hooks** (~60 ternaries, ~2 hrs)
1. `useCompanionCheckins.ts` (8) — **anti-pattern**: strings in a data hook, should live in translations not code
2. Other hooks and data files

**Batch G — Long tail** (~30 ternaries) — anything with ≤3 ternaries per file. Efficient to batch.

**Total: ~13-14 hrs mechanical work.** Realistic timeline: 3-5 focused sessions, or 3-4 parallel agents each on separate batch.

## Migration pattern (per file)

For each `language === "de" ? "..." : "..."` occurrence:

1. Add a translation key to the appropriate domain file in `src/translations/`.
   Example — the `SubscriptionSection.tsx` string "Abo verwalten" / "Manage subscription" → `src/translations/settings.ts`:
   ```typescript
   "subscription.manage": { de: "Abo verwalten", en: "Manage subscription" },
   ```

2. In the component, replace the ternary with `t("subscription.manage")`.

3. Ensure `const { t } = useTranslation();` is already destructured (some files only pull `language` — need to add `t`).

4. When done, remove `language` from destructure if no longer used.

Naming convention for keys: `<domain>.<component>.<label>`, e.g.
`subscription.section.title`, `notification.settings.dailyReminderLabel`.

## Guardrail — ESLint rule (before starting migration)

To prevent NEW ternaries slipping in:

```js
// eslint.config.js — new rule
{
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-syntax": [
      "warn",
      {
        selector: "ConditionalExpression[test.left.name='language'][test.right.value='de']",
        message: "Use t('key') from useTranslation instead of inline language ternaries. See audit/I18N_MIGRATION_PLAN.md.",
      },
    ],
  },
}
```

Warning-level (not error) so migration in progress doesn't block CI. Once migration is done, upgrade to error.

## Parallelization strategy

Batches A-F are file-disjoint. Great candidate for parallel agents via `isolation: "worktree"`. Each agent:
1. Takes one batch
2. Works in own worktree
3. Produces one commit per file (Lesson 10 compliance)
4. Reports back with commit range

Main agent merges the branches sequentially. Merge conflicts unlikely (each batch owns different files); if they occur, the translation-index file (`src/translations/index.ts`) is the only likely shared spot, and it's a simple append.

## POC status

Migration pattern proven with one file in commit `[TBD]` — see that diff for the exact shape:
- Number of ternaries removed
- Number of translation keys added
- File LOC delta
- Test / build still green

## Definition of Done

- All 395 ternaries removed
- ESLint rule promoted from warn to error
- No `language === "de"` conditional in `src/**` (grep returns 0)
- Existing test suite still 125+/125+ green
- One follow-up PR: remove unused `language` destructures throughout
