# Breakly

**A workplace wellness app that keeps your team healthy, focused, and productive.**

---

## The Problem

Sedentary work kills productivity. Employees who sit for hours without movement suffer from back pain, eye strain, fatigue, and reduced concentration. Studies show that prolonged sitting increases absenteeism and healthcare costs while reducing cognitive performance.

Most people *know* they should take breaks — they just forget.

## The Solution

Breakly is a lightweight mobile app (Android & iOS) that delivers timely, non-intrusive nudges to move, stretch, hydrate, and rest their eyes throughout the workday.

It's not another wellness platform that employees ignore. It's a simple tool that does one thing brilliantly: reminds people to take care of themselves.

---

## Key Benefits

### For Employers

- **Reduced absenteeism** — Regular movement breaks reduce musculoskeletal complaints, the #1 cause of workplace sick leave
- **Higher productivity** — Short breaks restore focus and prevent the afternoon slump
- **Low cost, high impact** — No hardware, no training, no ongoing admin; employees self-manage
- **Duty of care** — Demonstrates investment in employee wellbeing (relevant for ESG and HR reporting)

### For Employees

- **Personalised reminders** — Stretch, drink water, walk, rest eyes, or create custom activities
- **Respects work hours** — Only active during configured days and times (defaults to Mon-Fri, 8am-5pm)
- **Non-disruptive** — Gentle push notifications with one-tap actions: Done, Snooze, or Dismiss
- **Quick setup** — Pre-built presets get users started in under 30 seconds
- **Private** — All data stays on-device; no accounts, no tracking, no data collection

---

## How It Works

1. **Choose an activity** — Pick from presets (Stretch, Drink Water, Walk, Eye Break) or create your own
2. **Set the interval** — Every 15, 30, 45, 60, 90, or 120 minutes
3. **Configure your schedule** — Select active days and working hours
4. **Get reminded** — Receive a notification, tap Done when complete, or Snooze if you're in the middle of something

That's it. No onboarding flow, no account creation, no subscription.

---

## Features at a Glance

| Feature | Detail |
|---------|--------|
| Custom reminders | Any activity, any interval, any icon |
| Smart scheduling | Active only during selected days and hours |
| Snooze | Configurable 5-30 minute snooze per reminder |
| Quick-start presets | One tap to create common wellness reminders |
| Notification actions | Done / Snooze / Dismiss directly from the notification |
| Cross-platform | Android and iOS from a single codebase |
| Offline-first | Works without internet; no server dependency |
| Privacy-first | Zero data leaves the device |

---

## Deployment Options

| Option | Best For |
|--------|----------|
| **Public app stores** | Broad distribution, consumer-facing |
| **Enterprise MDM** | Managed rollout via Intune, Jamf, etc. |
| **Direct APK / TestFlight** | Pilot programs, small teams |

---

## Technical Overview

Built with modern, well-supported technologies:

- **React Native + Expo** — Cross-platform (iOS & Android) from one codebase
- **TypeScript** — Type-safe, maintainable code
- **Local notifications** — No server required; works offline
- **On-device storage** — No backend, no database, no cloud dependency
- **EAS Build** — Automated CI/CD for app store and enterprise distribution

---

## Getting Started (Development)

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Build Android APK
eas build --platform android --profile preview

# Build iOS
eas build --platform ios --profile preview
```

---

## Roadmap

- Team leaderboards and streaks (opt-in)
- Integration with Microsoft Teams / Slack status
- Weekly wellness summary reports
- Custom corporate branding
- Admin dashboard for enterprise deployments

---

## License

Internal use. Contact the development team for licensing enquiries.
