# TestFlight Release Notes

## Version 1.x.x – iOS Layout Polish & Localization

---

### 🇩🇪 Deutsch

**Was ist neu:**

• **Verbesserte Kopfzeile**: Die App-Kopfzeile sitzt nun näher am oberen Bildschirmrand und nutzt den verfügbaren Platz besser aus.

• **Chat-Modus-Auswahl**: Die Modus-Tabs (Freireden, Klären, Beruhigen, Muster) sind nun vollständig lesbar und scrollen sanft auf allen iPhone-Größen.

• **Einheitliches Safe-Area-Handling**: Kein doppelter Abstand mehr zwischen Statusleiste und Inhalt.

• **Vollständige Lokalisierung**: Alle Übungen, Themen und UI-Texte erscheinen nun in deutscher Sprache, wenn Deutsch eingestellt ist.

• **Besseres Scrollen in Einstellungen**: Die Einstellungsseite scrollt nun zuverlässig bis ganz nach unten.

**Bekannte Einschränkungen:**

• Sprachausgabe erfordert MindMate Plus.
• Einige Übungsvideos sind noch in Vorbereitung.

---

### 🇬🇧 English

**What's New:**

• **Improved Header Layout**: The app header now sits closer to the top of the screen, making better use of available space.

• **Chat Mode Selector**: Mode tabs (Talk, Clarify, Calm, Patterns) are now fully readable and scroll smoothly on all iPhone sizes.

• **Unified Safe-Area Handling**: No more double spacing between the status bar and content.

• **Full Localization**: All exercises, topics, and UI text now display in German when German is selected.

• **Better Settings Scrolling**: The settings page now reliably scrolls all the way to the bottom.

**Known Limitations:**

• Voice output requires MindMate Plus.
• Some exercise videos are still in preparation.

---

### Technical Changes

| Component | Change |
|-----------|--------|
| `AppLayout.tsx` | Removed duplicate `paddingTop: env(safe-area-inset-top)` |
| `PageHeader.tsx` | Now sole provider of top safe-area padding; reduced py from 3.5 to 2.5 |
| `ChatModeSelector.tsx` | Added `min-w-0`, `flex-nowrap` for iOS robustness |
| `Chat.tsx` | Removed top safe-area padding from container |
| `useTranslation.ts` | Added `getExerciseDisplay()` and `getTopicDisplay()` helpers |

---

**Build Date:** _______________  
**Version:** _______________
