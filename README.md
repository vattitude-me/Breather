# Stretch Reminder

A mobile app (iOS & Android) to remind you to take breaks during long work sessions — stretch, drink water, walk, or any custom activity.

## Features

- **Customizable Reminders** — Create reminders for stretching, hydration, eye breaks, or any activity
- **Flexible Intervals** — Set reminders from every minute to every few hours with fine-grained control
- **Smart Notifications** — Push notifications with action buttons: Done, Snooze, or Dismiss
- **Snooze Support** — Configurable snooze duration per reminder
- **Clean Interface** — Minimal, focused UI with quick-start presets
- **Settings** — Customize default intervals, snooze durations, and notification preferences

## Tech Stack

- **React Native** with Expo (managed workflow)
- **TypeScript** for type safety
- **expo-notifications** for local push notifications
- **React Navigation** for tab and stack navigation
- **AsyncStorage** for persistence

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure

```
src/
├── context/         # React Context for state management
├── hooks/           # Custom hooks (notifications)
├── navigation/      # Tab and stack navigators
├── screens/         # Home, AddEdit, Settings screens
├── services/        # Storage and notification logic
├── constants.ts     # Colors, presets, config
└── types.ts         # TypeScript interfaces
```

## Notification Actions

Notifications include actionable buttons:
- **Done** — Acknowledge the reminder
- **Snooze** — Delay the reminder by the configured snooze duration
- **Dismiss** — Dismiss without action (reminder continues on schedule)

> Note: Notification action buttons require a development build (`npx expo run:ios` or `npx expo run:android`). Basic notifications work in Expo Go.
