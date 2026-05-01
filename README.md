# Breather

**A workplace wellness PWA that keeps you healthy, focused, and productive.**

---

## The Problem

Sedentary work kills productivity. People who sit for hours without movement suffer from back pain, eye strain, fatigue, and reduced concentration. Studies show that prolonged sitting increases absenteeism and healthcare costs while reducing cognitive performance.

Most people *know* they should take breaks - they just forget.

## The Solution

Breather is a lightweight Progressive Web App that delivers timely, non-intrusive nudges to move, stretch, hydrate, and rest your eyes throughout the workday.

It's not another wellness platform that gets ignored. It's a simple tool that does one thing brilliantly: reminds people to take care of themselves.

---

## Key Features

- **Personalised reminders** - Stretch, drink water, walk, rest eyes, or create custom activities
- **Smart scheduling** - Only active during configured days and times (defaults to Mon-Fri, 8am-5pm)
- **Non-disruptive** - Gentle notifications with one-tap actions: Done, Snooze, or Dismiss
- **Quick setup** - Pre-built presets get you started in under 30 seconds
- **Private** - All data stays on-device; no accounts, no tracking, no data collection
- **Installable** - Works as a PWA on desktop and mobile
- **Offline-first** - Works without internet; no server dependency

---

## How It Works

1. **Choose an activity** - Pick from presets (Stretch, Drink Water, Walk, Eye Break) or create your own
2. **Set the interval** - Every 15, 30, 45, 60, 90, or 120 minutes
3. **Configure your schedule** - Select active days and working hours
4. **Get reminded** - Receive a notification, tap Done when complete, or Snooze if busy

No onboarding flow, no account creation, no subscription.

---

## Tech Stack

- **React 18 + TypeScript** - Type-safe, component-based UI
- **Vite** - Fast build tooling
- **Workbox (injectManifest)** - Custom service worker for offline support and background notifications
- **Vercel** - Hosting and deployment
- **PWA** - Installable on desktop and mobile

---

## Getting Started

```bash
npm install
npm run dev
```

---

## License

Internal use. Contact the development team for licensing enquiries.
