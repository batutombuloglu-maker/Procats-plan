# Procats

**A study workspace for turning plans into daily progress.**

![Version 2.0.0](https://img.shields.io/badge/version-2.0.0-1884f7)
![Platforms](https://img.shields.io/badge/platforms-Web%20%7C%20Android%20%7C%20Windows-394556)
![Interface languages](https://img.shields.io/badge/interface%20languages-20-4a8b6f)

Procats brings a weekly task planner, focus timers, practice exam tracking, checklists, notes, and study links together. It can run locally in guest mode or sync across devices with a verified Firebase account.

**Plan the week.** Add tasks and study resources. **Work in focus.** Start the timer and mark tasks as you go. **Review progress.** Check your activity and exam results.

## What you can do

| Plan your week | Focus on the next task | Keep your work |
| --- | --- | --- |
| Organize daily tasks, free-form plans, and reorderable checklists. | Use classic, exam-clock, and OLED timers, a stopwatch, and a 30-day activity heatmap. | Sync with an account, export encrypted backups, and recover data offline. |
| Compare practice-exam results and keep resources and quick notes nearby. | See today's tasks from Android home widgets or the Wear OS companion. | Try the workspace in guest mode before creating an account. |

## What's new in 2.0.0

- The first-run screen presents sign-in, account creation, guest mode, and language selection.
- The workspace offers 20 languages. The new packs cover onboarding, navigation, and common actions, with English fallback for remaining text. Arabic uses a right-to-left layout.
- The home workspace uses the familiar clock, stopwatch, and heatmap. The former 3D progress and Knowledge Treasury features are retired.
- Older encrypted backups remain readable. Legacy archive records can still be handled during backup recovery and account deletion.

Available languages include English, Turkish, German, Spanish, French, Italian, Arabic, Azerbaijani, Kazakh, Kyrgyz, Uzbek, Turkmen, Swedish, Danish, Norwegian Bokmål, Finnish, Icelandic, Simplified Chinese, Japanese, and Korean.

## Run it locally

```sh
cd Procats
npm ci
npm test
npm run build
npm run preview
```

Use Node.js 22 or newer. Select **Try without an account** to explore the local workspace. To enable account features for your own deployment, supply your Firebase client configuration and deploy the included Firestore rules.

| Project | Contents |
| --- | --- |
| [Procats](Procats/) | Web client, Android app, and Wear OS companion |
| [Windows](Windows/) | Electron desktop shell and Windows packaging |
| [Data and security](docs/DATA-SECURITY.md) | Account boundaries, backup format, and recovery |

See the [2.0.0 release notes](Procats/docs/2.0.0-RELEASE.md) for Android and Windows build details. This public source uses example Firebase settings and contains no personal records or release signing keys.
