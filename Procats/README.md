# Procats

Personal study planning and knowledge management for Android, Wear OS, Windows and the web. Developed by **Batu**. Current source: **1.7.6**.

## Features

- Daily tasks, calendars, focus timers, quick notes, resources and practice-exam tracking.
- A compact Knowledge Treasury with categories, multiple subjects, full-archive search, and paged cards.
- Scheduled review at 1, 3, 7, then every 30 days. Hard/forgotten answers return tomorrow. Random discovery has an independent shuffle bag and does not change review dates.
- A theme-aware geography atlas: 197 country shapes filled with flags, capital markers, continent/detail views, Turkish and English capital names, source-dated population and area. Geometry is bundled and loaded by continent, with no external map/API service.
- A safe map refresh importer: existing identity, review history and relationships survive; user-edited matching content is protected. Ordinary JSON imports remain additive.
- A persistent home post-it using the existing account-synced note collection. Hiding it never deletes its content.
- Selectable heatmap or lightweight WebGL 3D progress steps, both derived from the existing task ledger. The scene is event-driven, with a static fallback and reduced-motion support.
- Full-screen exam clock with an explicit exit button. Presentation changes do not stop the countdown.
- An expanded thought collection with a rolling 15-day cooldown tracked on the device.
- Account-scoped local journals, Firestore synchronization, encrypted backups and an offline recovery tool.

## Project layout

`Procats/` contains the web/Android/Wear project; `Windows/` is the isolated Electron shell. `legacy/` preserves an older prototype. Active release notes and verification details are in `Procats/docs/`. The public repository contains no personal records, account backups, real Firebase client configuration, signing keys or authentication credentials. Source code is not a backup of personal application data.

## Build the web client

Use Node.js 22 or newer. From `Procats/`, run `npm ci`, `npm test`, `npm run build`, then `npm run preview`. The public checkout builds with example Firebase settings and supports local guest use. To connect your own backend, copy `public/firebase-config.example.js` to `public/firebase-config.js`, enter your project settings, and update `.firebaserc` and `publisher.json`. Configure authenticated Firestore rules before deploying.

For Android use JDK 21, Android SDK 36, and the Gradle wrapper in `Procats/android/`. Build the web client, run `npx cap sync android`, then build the desired variant. Personal APKs use `com.procats.study.personal`; phone version code **28**, watch code **29**. Both must share your original signing certificate. Private signing material is deliberately omitted. A new certificate cannot update an existing installation in place.

For Windows, install dependencies in `Windows/`, copy the completed `Procats/www/` directory to `Windows/www/`, and run `npm test` and `npm run dist`. The release task produces installer and portable x64 EXEs. They are not publisher-signed.

## Verification and limits

The release passed 238 Node application checks, 42 Android unit/Robolectric tests, 7 Windows security checks, and 96 Firestore emulator checks. The actual 197-card refresh preserved a separate card and all review/link fields, and was idempotent. Desktop/mobile layout and file-import flows were checked with fictional guest data. Physical phone/watch pairing and long-term device power management were not tested.

No new dependencies were added. Production web dependencies have zero known audit findings in the release check; moderate development/build-tool advisories remain. See the included test report for scope and limitations. No live deployment or Play Store upload was performed for this task.

## Attribution

Atlas sources and data licensing are documented in [geography/SOURCES.md](public/geography/SOURCES.md). Natural Earth geometry is public domain; the derived country metadata collection is offered under ODbL 1.0. Population values display their reference year and source. Philosophical additions clearly distinguish original Procats reflections from short adapted passages of Epictetus and Marcus Aurelius. Geography assets and preset metadata are public educational content, not private user records.
