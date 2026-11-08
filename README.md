# Procats

**A study workspace for turning plans into daily progress.**

![Version 2.1.1](https://img.shields.io/badge/version-2.1.1-1884f7)
![Platforms](https://img.shields.io/badge/platforms-Web%20%7C%20Android%20%7C%20Windows-394556)
![Interface languages](https://img.shields.io/badge/interface%20languages-20-4a8b6f)

Procats brings a weekly task planner, focus timers, practice exam tracking, checklists, notes, study links, and a Knowledge Collection together. It can run locally in guest mode or sync across devices with a verified Firebase account.

**Plan the week.** Add tasks and study resources. **Work in focus.** Start the timer and mark tasks as you go. **Review progress.** Check your activity and exam results.

## What you can do

| Plan your week | Focus on the next task | Keep your work |
| --- | --- | --- |
| Organize daily tasks, free-form plans, and reorderable checklists. | Use classic, exam-clock, and OLED timers, a stopwatch, and a 30-day activity heatmap. | Sync with an account, export encrypted backups, and recover data offline. |
| Compare practice-exam results and keep resources and quick notes nearby. | See today's tasks from Android home widgets or the Wear OS companion. | Organize study cards in collections and reveal each answer when you review. |

## Knowledge Collection

Create custom collections alongside Words, Concepts, and General Knowledge. A card can belong to multiple collections and appears once in All cards. The card menu opens its editor or delete confirmation.

In 2.1.1, right-click a custom collection tab or open its three-dot menu to rename or delete it. Renaming keeps its cards assigned. Deleting a collection keeps its cards in their other collections and moves cards with no other memberships to General Knowledge. Built-in collections serve as fixed categories. Card labels use more visible colored dots to distinguish collections.

Choose a collection or search for cards, then select **Review** to see the prompts and reveal the answers. Use **Data Vault → Add data** to preview and import a supported JSON data pack. The [Turkish example pack](docs/examples/knowledge-collection-tr.json) contains ten sample cards and one custom collection.

Collections sync through the existing account workspace. Guest collections are stored on the current device. Encrypted backups include collection records and preserve older archive data.

## Languages

The workspace supports English, Turkish, German, Spanish, French, Italian, Arabic, Azerbaijani, Kazakh, Kyrgyz, Uzbek, Turkmen, Swedish, Danish, Norwegian Bokmål, Finnish, Icelandic, Simplified Chinese, Japanese, and Korean. English covers untranslated text. Arabic uses a right-to-left layout.

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

See the [2.1.1 release notes](Procats/docs/2.1.1-RELEASE.md) for Android and Windows build details. This public source uses example Firebase settings. Store personal records and release signing keys separately.
