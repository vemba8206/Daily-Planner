# Planora Daily Planner

A modern local-first daily planner built with React, Vite, Tailwind CSS, GSAP, canvas motion, and PWA support. Planora includes task scheduling, drag-and-drop ordering, task milestone timelines, light/dark modes, filtering, offline caching, desktop installation, and instant persistence.

## Features

- Create, edit, delete, reorder, complete, and track progress for tasks.
- Store title, description, date, total planned duration, work windows, priority, status, and progress.
- Track every work window with its scheduled duration, actual minutes worked, completion checkbox, and individual progress bar.
- Automatically calculate weighted task progress from actual time worked across all windows, and grow the task's total time when its windows exceed the current total.
- Set a custom planner-day boundary per date, including late-night endings such as 3:00 AM.
- Close a planner day manually with `Day completed`; unfinished tasks move to incomplete tracking with their progress percentage.
- Dashboard scheduler for the next 10 days of dated task targets, plus productivity, incomplete tasks, streaks, and today's total planned time.
- Task-specific timeline milestones directly inside the dashboard.
- Selected-day time totals, task search, filters, compact sidebar, and small theme toggle.
- Violet, fuchsia, imperial-red, and dark-grey UI refresh with GSAP reveal animations and a canvas aura background.
- Incomplete tracking for tasks that pass their planner-day end without being completed, or unfinished tasks from a day you manually close.
- Installable Progressive Web App with `manifest.json`, app icons, standalone mode, and offline app-shell caching.
- Automatic LocalStorage saving, previous-state backup, and delete undo.

## Project Structure

```text
daily-planner/
  index.html
  package.json
  vercel.json
  public/
    apple-touch-icon.png
    favicon.svg
    icons/
      icon-192.png
      icon-512.png
      maskable-icon-512.png
  vite.config.js
  src/
    App.jsx
    index.css
    main.jsx
    components/
      AnimatedAura.jsx
      EmptyState.jsx
      Header.jsx
      DailyTimePanel.jsx
      IncompleteTracker.jsx
      ProgressRing.jsx
      Sidebar.jsx
      StatCard.jsx
      TaskCard.jsx
      TaskModal.jsx
      Toast.jsx
      WeeklyScheduler.jsx
    hooks/
      usePlannerSettings.js
      useTaskMilestones.js
      useTasks.js
      useTheme.js
    utils/
      date.js
      tasks.js
    views/
      Dashboard.jsx
```

## Install and Run

Install Node.js 20.19 or newer, then run:

```bash
cd daily-planner
npm install
npm run dev
```

Open the local address printed by Vite, normally `http://localhost:5173`.

## Deploy to Vercel

Vercel settings for this app are already configured in `vercel.json`:

- Framework preset: `Vite`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

The `vercel.json` file also includes the SPA rewrite needed for React routes and PWA-friendly headers for `sw.js` and `manifest.json`.

### Push to GitHub

Create a new GitHub repository, then run these commands from this folder:

```bash
git init
git add .
git commit -m "Deploy Planora daily planner"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` with your real GitHub account and repository name.

### Import into Vercel

1. Go to `https://vercel.com`.
2. Sign in with GitHub.
3. Click `Add New` then `Project`.
4. Select the GitHub repository for this planner.
5. Choose the `Vite` framework preset.
6. Confirm these settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Install command: `npm install`
7. Click `Deploy`.

After deployment, Vercel gives you a permanent HTTPS URL. Use that URL normally; you do not need `npm run dev` or `npm run preview` after the app is deployed.

### Redeploy Later

After making future changes:

```bash
git add .
git commit -m "Update planner"
git push
```

Vercel automatically detects the push and deploys a new version.

### Bookmark and Install

To bookmark the deployed app, open the Vercel HTTPS URL in Chrome and press `Ctrl+D`.

To install it as a desktop app in Chrome:

1. Open the deployed HTTPS URL.
2. Wait for the app to load once.
3. Click the install icon in the address bar, or open Chrome's three-dot menu.
4. Choose `Cast, save, and share` then `Install Planora`.
5. Confirm the install.

After it is installed, Planora opens in standalone desktop-app mode. Your task data still saves in each browser's LocalStorage, so data is local to that browser/profile/device.

## Production PWA Build

```bash
npm run build
```

The optimized production PWA is generated in `dist/`. The build includes the app files, `manifest.json`, generated service worker files, and installable icons.

## Run the Production Version

After `npm run build`, serve the `dist` folder with any static web server. The easiest beginner-friendly option in this project is:

```bash
npm run preview
```

Open the printed local URL, normally `http://localhost:4173`.

You do not need `npm run dev` for production. Chrome requires a real web address such as `localhost` or HTTPS for service workers and app installation, so opening `dist/index.html` directly from the file system is not enough for the install button.

## Install in Chrome as a Desktop App

1. Run `npm run build`.
2. Run `npm run preview`.
3. Open the preview URL in Chrome.
4. Click the install icon in the address bar, or open Chrome's three-dot menu and choose `Cast, save, and share` then `Install Planora`.
5. Confirm the install.

After installation, Planora opens like a desktop app in standalone mode. Visit the production version once while online so the service worker can cache the app shell; after that, the interface can reopen offline and your tasks still come from LocalStorage.

## PWA Setup

PWA support is configured in `vite.config.js` with `vite-plugin-pwa`. The plugin generates `dist/manifest.json` during `npm run build`, registers a service worker automatically, and precaches the built HTML, CSS, JavaScript, JSON, SVG, and PNG assets where possible.

## LocalStorage

Tasks are restored from `planora.tasks.v1` when the app starts. Task timeline milestones are stored separately in `planora.taskMilestones.v1`. Every create, edit, deletion, completion, reorder, duration update, work-window update, milestone update, or progress adjustment immediately triggers a new save. Before writing the new task list, the last valid version is copied to `planora.tasks.backup.v1`, so corrupted or invalid primary data can fall back to a valid snapshot. Theme choice, per-day planner end times, and completed planner days are saved separately.

If June 5 is configured to end at `03:00`, the June 5 planner day runs from June 5 at 3:00 AM until June 6 at 3:00 AM. That means June 5 from midnight through 3:00 AM still belongs to June 4, while June 6 from midnight through 3:00 AM belongs to June 5. Pressing `Day completed` closes the active planner day early, moves unfinished work into incomplete tracking, and hides that date's tasks from the dashboard while keeping future-dated tasks visible.

Each task work window stores its own completion state and actual minutes worked. Its progress is actual minutes divided by the window duration. Overall task progress is weighted by time, so working 90 minutes in a two-hour window contributes 90 minutes toward the task total. These values auto-save with the task in LocalStorage.
