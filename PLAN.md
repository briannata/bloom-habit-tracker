# HabitTracker — Project Plan

## Overview
A mobile-first web app (PWA) for daily habit tracking with a visual history grid. Accessible on iPhone via browser/home screen, built on Next.js.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js (React) | Familiar to user, full-stack, PWA-ready |
| Backend | Next.js API routes | Co-located with frontend |
| Database + Auth | Supabase | Postgres + auth + real-time, generous free tier |
| Deployment | Vercel | Native Next.js support, cron jobs available |
| Styling | Tailwind CSS | Mobile-first utility classes |

---

## Authentication

- **Providers**: Email/password, phone number, Google, Apple Sign-In
- **Library**: Supabase Auth
- **PWA Note**: Prompt users to "Add to Home Screen" on first login to enable push notifications (required on iOS 16.4+)

---

## Pages

1. **Daily Dashboard** (`/`) — main habit list for today
2. **History** (`/history`) — GitHub-style grid overview
3. **Profile** (`/profile`) — settings, timezone, notification prefs
4. **Add/Edit Habit** (`/habits/new`, `/habits/[id]/edit`)

---

## Habit Types

| Type | Completion Logic | Input UI |
|---|---|---|
| Boolean | Tap to toggle | Tap card → logged; undo button visible |
| Numeric | Actual ≥ target value | +/- quick increment + direct number input |
| Duration | Actual ≥ target duration | +/- quick increment + direct number input |

- **Custom units**: user-defined per habit (glasses, oz, km, miles, pages, chapters, minutes, etc.)
- **Reset**: automatic at midnight in user's timezone

---

## Habit Configuration (per habit)

- Name
- Emoji icon (emoji picker)
- Accent color (color picker)
- Type (boolean / numeric / duration)
- Target value + unit (for numeric/duration)
- Daily reminder time (single time for v1)
- Order (drag-to-reorder)

---

## Daily Dashboard

- Habits sorted by user-defined order
- Completed habits auto-sink to bottom of list
- Each habit card shows:
  - Emoji + name + accent color
  - Current streak
  - Completion status / progress
  - +/- buttons (numeric/duration) or tap-to-toggle (boolean)
  - Undo button after logging
- Backfill: users can log past days from the history page

---

## History Page

- Month/year toggle at top
- One row per habit, scrollable vertically
- Each row:
  - Emoji + habit name (left) + current streak (right)
  - Full-width grid below (GitHub-style squares)
- Grid intensity:
  - **Boolean**: full accent color or empty
  - **Numeric/Duration**: shade intensity = % of goal achieved (0%, 25%, 50%, 75%, 100%)
- Default: month view on mobile, year view on larger screens

---

## Streak Logic

- **Increments**: each consecutive day with full completion
- **Breaks**: immediately on any missed day (no grace period)
- **Backfill**: users can log past days, which recalculates streaks retroactively

---

## Profile Page

- Display name, avatar
- Timezone selector (for midnight reset + reminders)
- Notification preferences (per-habit reminder time)
- Connected accounts (Google, Apple)
- Account deletion

---

## Push Notifications (v1)

- One daily reminder per habit (user picks time in profile)
- Delivered via Web Push API
- Vercel Cron Job checks every hour, sends due reminders
- Requires PWA install on iPhone

### v2 (Future)
- Interval reminders (e.g., every 2 hours between 9am–9pm) — great for water, posture, steps
- Streak at-risk warning ("You haven't logged yet today!")

---

## Future Features (Parking Lot)

- Habit categories / tags
- Streak freeze tokens
- Social / sharing grid snapshots
- Widgets (iOS 16 home screen widgets via PWA limitations — likely need native app)
- Interval/recurring reminders (v2 push)

---

## Data Model (Supabase / Postgres)

```sql
users          — managed by Supabase Auth
habits         — id, user_id, name, emoji, color, type, target_value, unit, order, reminder_time, created_at
habit_logs     — id, habit_id, user_id, date, value, logged_at
```

- `habit_logs.date` stores the local date (in user timezone) for the log
- `habit_logs.value` is 1 for boolean, actual number for numeric/duration
- Streak computed from consecutive dates with `value >= target`
