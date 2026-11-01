> Archived original prototype. Active 1.7.4 sources and current security/data behavior are documented in the repository root. The historical description below applies only to this prototype.

# 🚀 Procats - Premium Local Task Manager & Focus App

Procats is a privacy-first, fully local desktop productivity suite designed to keep you deeply focused. Built with Electron.js, it offers a seamless, distraction-free environment that runs entirely on your machine without requiring cloud accounts, subscriptions, or internet access.

## ✨ Why Procats?
Your data belongs to you. Procats stores all your tasks, notes, and focus heatmaps entirely in your local system. No tracking, no syncing to external servers—just pure, uninterrupted productivity.

---

## 📥 Installation (1-Click Setup)

You don't need any coding knowledge to use Procats. 

1. Go to the **[Releases](../../releases)** page on the right side of this repository.
2. Download the latest `procats-Setup-1.0.0.exe` file.
3. Double-click the downloaded file. 
4. The setup will install automatically in seconds and launch the main dashboard directly. You are ready to go!

---

## 🛠️ Features Overview

Procats is not just a to-do list; it is a comprehensive life and study manager.

*   **📊 30-Day Focus Heatmap:** Visually track your daily consistency. Tasks completed automatically light up your heatmap. (You can also *exempt* specific tasks from the heatmap if they shouldn't count towards your daily score).
*   **🔗 Block Lesson Chaining:** Link related tasks together visually. Perfect for Pomodoro sessions or study blocks.
*   **⭐ Task Efficiency Rating:** Rate your completed tasks out of 10 to track the quality of your focus, not just the quantity.
*   **⏱️ Built-in Timers:** A sleek stopwatch and customizable countdown timers (with screen shake and notifications when time is up).
*   **📝 Obsidian-Style Free Plan:** A nested folder-and-page structure for your long-form notes and thoughts.
*   **📌 Quick Post-it Notes:** Colorful, draggable notes for sudden ideas.
*   **📚 Life Archive:** Keep a beautiful record of the books you've read, movies you've watched, and games you've played, complete with a 10-star rating system.
*   **🗄️ Local Data Vault:** Export all your data as a single `.json` file for backup, and import it anytime.
*   **🌍 Multi-Language & Themes:** Available in English, German, and Turkish. Switch instantly between Classic Dark, Light, OLED, Hacker, and Crimson themes.

---

## 📖 Quick Start Guide (How to Use)

1. **Navigation:** Use the floating left sidebar to switch between Home, Free Plan, Tasks, Timers, Post-its, Bookmarks, Archive, and the Data Vault.
2. **Creating Tasks:** Go to the Tasks (Checkmark) tab. First, click **+ New Day** (or right-click to create Folders). Then, select the day and click **+ New Task** on the top right.
3. **Task Options:** Click the **3-dot menu (⋮)** on any task card to:
   * Link it to the next task (Block Lesson).
   * Exempt it from the Heatmap.
   * Edit or Delete it.
4. **Drag & Drop:** You can drag and drop task cards to reorder them, or drag days into folders in the left panel.
5. **Settings:** Click the gear icon at the bottom left to change the app language and visual theme instantly.

---

## 💻 For Developers

If you want to view or modify the source code:
1. Clone this repository.
2. Open the terminal in the folder and run `npm install` to get the dependencies.
3. Run `npm start` to launch the app in development mode.
4. Run `npm run build` to package your own `.exe` file.
