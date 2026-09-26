# Breather

**Breathe and grow. A calm little breathing app with a sprout that grows one leaf every time you stop to breathe.**

---

## The idea

Most wellness apps ask too much. Breather asks for one thing: a few slow breaths a day.

Each finished session grows a new leaf on your sprout. Twelve leaves and it blooms. There are no streak penalties, no collections to manage and no settings to wrestle with.

---

## What's in the app

- **Guided breathing** - 1, 3 or 5 minute sessions with a breathing halo, phase countdown, optional soft chime and haptic cues. Three patterns: Calm (4·4·6), Box (4·4·4·4) and Even (5·5).
- **A sprout that grows** - One leaf per completed session, a flower at full bloom. Close a session early and it simply doesn't count.
- **Gentle daily reminder** - One nudge a day (morning, midday or evening), skipped if you've already breathed.
- **Progress** - This week at a glance, day streak, total calm time and recent sessions.
- **Chrome extension** - A minimal popup showing your sprout with a one-tap "Begin breathing", plus the daily reminder when the app isn't open.
- **Private and offline** - Everything is stored on your device. No accounts.

Existing users keep their leaves: older Breather data is migrated automatically on first launch.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite |
| Service Worker | Workbox (injectManifest) - offline support + daily reminder |
| Hosting | Vercel |
| Extension | Chrome MV3 (alarms, storage, notifications) |
| Architecture | npm workspaces monorepo |

### Monorepo Structure

```
packages/
├── shared/        # Garden model, breathing patterns, reminder and streak logic
├── pwa/           # Progressive Web App (main product)
└── chrome-ext/    # Chrome Extension (MV3) - popup + daily reminder
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run the PWA locally
npm run dev

# Build everything (shared + PWA)
npm run build

# Build the Chrome extension
npm run build:ext

# Dev mode for Chrome extension
npm run dev:ext
```

### Loading the Chrome Extension locally

1. Run `npm run build:ext`
2. Open `chrome://extensions` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select `packages/chrome-ext/dist/`

---

## Daily reminder

- The PWA schedules the reminder both in the page and in the service worker, using the same notification tag so only one appears.
- The extension uses a single `chrome.alarms` alarm and stays quiet while the PWA is open.
- Every path skips the reminder if you've already breathed that day.

---

## License

Internal use. Contact the development team for licensing enquiries.
