# iOS QA Checklist

Use this checklist before every TestFlight build to catch layout and UX issues early.

---

## 1. Viewport & Safe-Area Testing

### Devices to Test
- [ ] iPhone 12/13/14 (390×844)
- [ ] iPhone 14 Pro Max (430×932)
- [ ] iPad (if applicable)

### Safe-Area Checks
- [ ] Header sits directly below status bar (no extra gap)
- [ ] Bottom nav floats above home indicator
- [ ] No content hidden behind status bar
- [ ] No content hidden behind home indicator

### Layout Strategy Verification
- [ ] **ONLY PageHeader** applies `paddingTop: env(safe-area-inset-top)`
- [ ] AppLayout does NOT apply top safe-area
- [ ] Chat.tsx does NOT apply top safe-area
- [ ] Run `window.__debugLayout()` in console to verify

---

## 2. Chat Screen Specifics

### Header
- [ ] Logo + "MindMate" visible
- [ ] Voice icon and Safety icon have ≥8px spacing
- [ ] All icons have ≥44px tap targets
- [ ] Header doesn't shift on keyboard open

### ChatModeSelector
- [ ] All 4 tabs visible without clipping (Talk, Clarify, Calm, Patterns)
- [ ] German labels (Freireden, Klären, Beruhigen, Muster) fit without truncation
- [ ] Horizontal scroll works smoothly if needed
- [ ] Edge fades appear on scroll
- [ ] No wrapping even with large accessibility text

### Messages
- [ ] Messages scroll smoothly
- [ ] Typing indicator animates
- [ ] Quick replies are tappable
- [ ] Keyboard doesn't push content unexpectedly

---

## 3. Settings Screen

### Scroll Behavior
- [ ] Can scroll to bottom of page
- [ ] All sections are reachable
- [ ] Last item ("Konto löschen") is fully visible
- [ ] No nested scroll blockers

### Bottom Padding
- [ ] Content ends cleanly above bottom nav
- [ ] Minimum pb-24 or pb-32 applied
- [ ] No gray box artifacts at bottom

---

## 4. Other Tabs (Journal, Topics, Mood, Toolbox)

- [ ] Headers align consistently with Chat
- [ ] Content scrolls properly
- [ ] No double safe-area gaps
- [ ] Bottom nav visible and tappable

---

## 5. Localization (German Mode)

- [ ] Switch language to German in Settings
- [ ] All tab labels in German
- [ ] All headers in German
- [ ] Exercise titles in German
- [ ] Topic titles and steps in German
- [ ] No English fallbacks visible
- [ ] "Warum hilft das?" modal in German

---

## 6. Dark Mode

- [ ] Toggle dark mode in Settings
- [ ] All screens readable
- [ ] No white-on-white or black-on-black text
- [ ] Borders and shadows visible
- [ ] Status bar adapts correctly

---

## 7. PWA / WKWebView

- [ ] App installs to home screen
- [ ] App launches in standalone mode (no browser chrome)
- [ ] Safe areas respected in standalone mode
- [ ] Splash screen appears
- [ ] App icon correct

---

## 8. Performance

- [ ] Initial load < 3 seconds
- [ ] No layout shifts after load
- [ ] Scrolling is 60fps smooth
- [ ] No jank on tab switches
- [ ] Voice avatar animates smoothly

---

## 9. Debug Commands

Run in Safari Web Inspector or Chrome DevTools:

```javascript
// Full layout debug
window.__debugLayout()

// Check safe-area values
getComputedStyle(document.documentElement).getPropertyValue('--sat')
```

---

## 10. Final Sign-Off

| Area | Status | Notes |
|------|--------|-------|
| Safe-area top | ✅ / ❌ | |
| Safe-area bottom | ✅ / ❌ | |
| Chat header | ✅ / ❌ | |
| Mode selector | ✅ / ❌ | |
| Settings scroll | ✅ / ❌ | |
| German localization | ✅ / ❌ | |
| Dark mode | ✅ / ❌ | |

**Tested by:** _______________  
**Date:** _______________  
**Build:** _______________
