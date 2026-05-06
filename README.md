# Breather

**A workplace wellness PWA and Chrome extension that keeps you healthy, focused, and productive - with a virtual plant that grows a new leaf every time you complete a break.**

---

## The Problem

Sedentary work kills productivity. People who sit for hours without movement suffer from back pain, eye strain, fatigue, and reduced concentration. Studies show that prolonged sitting increases absenteeism and healthcare costs while reducing cognitive performance.

Most people *know* they should take breaks - they just forget.

## The Solution

Breather is a lightweight Progressive Web App (+ Chrome extension) that delivers timely, non-intrusive nudges to move, stretch, hydrate, and rest your eyes throughout the workday.

It's not another wellness platform that gets ignored. It's a simple tool that does one thing brilliantly: reminds people to take care of themselves - and rewards them with a growing virtual plant.

---

## Key Features

### Break Reminders
- **Personalised reminders** - Stretch, drink water, walk, rest eyes, posture check, deep breath, or create custom activities
- **Smart scheduling** - Only active during configured days and hours (defaults to Mon–Fri, 8am–5pm)
- **Non-disruptive notifications** - Gentle nudges with rotating motivational prompts and one-tap actions
- **Flexible intervals** - 1, 5, 15, 30, 45, 60, 90, or 120 minutes between breaks
- **Countdown timer** - See exactly when your next break is coming, with paused-state awareness

### Plant Gamification
- **Daily leaf growth** - Each completed break grows a new leaf on your plant
- **Realistic pot images** - Photorealistic collectible pots (terracotta, rattan, copper, galvanized, stone, marble, matte black)
- **Progressive unlocks** - Pots unlock over days to months of consistent use (15, 50, 120, 250, 500, 1000 breaks)
- **Watering animation** - Watering can overlay plays on the home screen when a break timer completes
- **Daily decay** - Miss a day and your plant loses progress, encouraging consistency
- **Daily colour rotation** - Your plant changes colour palette each day
- **Leaf wiggle** - Subtle idle animation makes the plant feel alive
- **End-of-day leaf drop** - Leaves fall with autumn colour transition at day reset
- **Motivational messages** - Random encouragement every time you complete a break

### Progress Tracking
- **Daily, weekly, and monthly views** - See your break history over time
- **Pots collection drawer** - Browse unlocked and upcoming pots, equip your favourite
- **Wellness tips** - Rotating evidence-based health tips throughout the day

### Multi-Platform
- **PWA** - Installable on desktop (Windows, macOS, Linux) and mobile (iOS, Android)
- **Chrome Extension** - Quick access from the browser toolbar with popup showing plant status, countdown, and water button
- **Offline-first** - Works without internet; no server dependency
- **Private** - All data stays on-device; no accounts, no tracking, no data collection

---

## How It Works

1. **Choose an activity** - Pick from presets (Stretch, Drink Water, Walk, Eye Break, Posture Check, Deep Breath) or create your own
2. **Set the interval** - Choose how often you want to be reminded
3. **Configure your schedule** - Select active days and working hours
4. **Get reminded** - Receive a notification when it's time for a break
5. **Grow your plant** - Complete the break timer and watch a new leaf sprout on your plant

No onboarding flow, no account creation, no subscription.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite |
| Service Worker | Workbox (injectManifest) - offline support + background notifications |
| Hosting | Vercel |
| Extension | Chrome MV3 (alarms, storage, notifications) |
| Architecture | npm workspaces monorepo |

### Monorepo Structure

```
packages/
├── shared/        # Types, constants, plant logic, storage utilities
├── pwa/           # Progressive Web App (main product)
└── chrome-ext/    # Chrome Extension (MV3)
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

## Notification Reliability

Breather uses a multi-layered approach to ensure notifications fire reliably:

- **Drift-correcting setTimeout chains** - Wall-clock aligned, self-rescheduling timers
- **Service worker scheduling** - Independent timer loop in the SW with 30s max check interval
- **Visibility/focus resync** - Re-checks all timers when the app returns to foreground
- **Stable tag deduplication** - Prevents duplicate notifications from parallel timer paths
- **Chrome extension alarms API** - Reliable `chrome.alarms` for the extension (not affected by browser throttling)

---

## License

Internal use. Contact the development team for licensing enquiries.
