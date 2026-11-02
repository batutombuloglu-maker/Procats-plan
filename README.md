# Procats

Personal study planning for Android, Wear OS, Windows and the web. Developed by **Batu**. Current source: **1.7.7**.

## Features

- Daily tasks, a calendar, completion history, ratings and a 30-day activity heatmap.
- Focus timers with classic, exam-clock and OLED displays, plus a persistent stopwatch.
- Quick notes, free-form plans, resources, reorderable checklists and practice-exam tracking.
- Account-scoped local journals, Firestore synchronization, encrypted backups and an offline recovery tool.
- Android home widgets and a Wear OS companion.

## 1.7.7

The home 3D scene, home post-it and Knowledge Treasury interface have been removed. The original home layout remains. The stopwatch now matches the real clock's system typeface, with fixed numeric fields to prevent lateral movement. The task view has a theme-aware scrollbar and extra space plus a soft edge below its fixed week strip.

Existing home-note text appears in Quick Notes. Legacy knowledge records remain in their existing storage/sync/backup format for data recovery; they have no active navigation or study interface. Removing these interfaces does not erase account data. A retired pinned destination is filtered while other tabs retain their order.

## Build

Use Node.js 22+. In `Procats/`, run `npm ci`, `npm test`, `npm run build`, then `npm run preview`. A clean public checkout uses example Firebase settings and supports local guest use. For a real backend, create `public/firebase-config.js` from the example and set `.firebaserc` and `publisher.json`. Deploy authenticated Firestore rules.

Android requires JDK 21 and Android SDK 36. Build the web client, run `npx cap sync android`, then use the Gradle wrapper. The personal application ID is `com.procats.study.personal`; phone code **32**, watch code **33**. Keep the original signing certificate for in-place updates. Signing credentials are intentionally excluded.

For Windows, install dependencies in `Windows/`, copy the completed web build to a fresh `Windows/www/` directory, then run `npm test` and `npm run dist`. The x64 installer and portable EXE are not publisher-signed.

## Data and verification

The public repository contains no personal records, account backups, real Firebase configuration, signing keys or credentials. Source code does not replace an encrypted personal-data backup. The retained legacy data layer is deliberate recovery compatibility, not a hidden user interface.

227 application checks cover active behavior and retained data compatibility. New coverage checks stable stopwatch fields and safe retired-tab normalization. Release evidence includes local guest UI tests; physical phone/watch behavior and indefinite retention are not guaranteed. No new dependencies were added. No live Firebase deployment or Play Store upload is part of this release.

`Procats/` contains the web/Android/Wear project; `Windows/` contains the isolated Electron shell. `legacy/` preserves an older prototype. Release and security notes are in `Procats/docs/`.
