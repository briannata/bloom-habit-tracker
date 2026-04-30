<div align="center">

# 🌱 Bloom

### Grow your habits, one day at a time

A mobile-first habit tracker PWA with a plant that grows alongside your streak.

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=fff)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)](https://vercel.com/)

</div>

---

## ✨ What it does

Track daily habits on your phone like a native app. Tap once to mark a habit done, watch your streak grow, and let the plant on the dashboard bloom as you stay consistent.

```
🪴  → 🌱  → 🌿  → 🌸  → 🌳
 0      1-3     4-7    week+   month+
```

---

## 🌟 Features

### 📅 Daily dashboard
- **Three habit types** — yes/no, numeric (e.g. 8 glasses of water), or duration (e.g. 30 minutes)
- **One-tap logging** for boolean habits, **+/− steppers** with **tap-to-edit** exact values for numeric/duration
- **7-day strip** under each habit so you see the whole week at a glance
- **Completed habits sink to the bottom** automatically
- **Growing plant SVG** on the dashboard, evolves with your longest active streak (5 stages)
- **Custom emoji + accent color** per habit

### 📊 History
- **Calendar month view** — color intensity scales with completion ratio, tap any day to log/edit
- **Year heatmap** — full calendar year, GitHub-style scrollable strip on mobile, fills full width on desktop
- **Per-habit stats** — current streak, best-ever streak, total completions
- Backfill past days to keep your streak honest

### ⏰ Smart reminders
- **Daily reminder** — pick a time of day per habit
- **Interval reminders** — "every 2 hours between 9am and 9pm" for water, posture, steps
- **Web Push notifications** delivered via service worker
- **Timezone-aware** — reminders fire at your local time
- **PWA install hint** auto-shown when you set a reminder

### 👤 Profile
- **Avatar picker** (22 plant + animal emojis, image upload-ready)
- **Display name** + **timezone** with auto-detect
- **One-tap notification toggle** with permission flow

### 🗂️ Habit management
- **Drag-free reorder** with up/down arrows
- **Soft archive** — hide a habit but keep its history forever
- **Permanent delete** as a separate, scarier button

### 🔐 Auth
- **Email + password** signup with email confirmation
- **Google OAuth** sign-in
- **Row-level security** in Postgres — every query is scoped to the signed-in user

### 📱 PWA
- **Installable** on iOS & Android home screen
- **Standalone display mode** with splash + theme colors
- **Service worker** registered for push delivery
- **iOS-aware install prompt** with step-by-step instructions

### 🎨 Polish
- **Mobile-first design** — single-column phone layout, responsive grid on tablet/desktop
- **Tasteful constraints** — content centered with max width on every page except the wide year heatmap
- **Tactile, app-like interactions** — rounded cards, accent borders, no chrome

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Database + Auth | [Supabase](https://supabase.com/) (Postgres + RLS) |
| Push delivery | [`web-push`](https://github.com/web-push-libs/web-push) + service worker |
| Cron | [GitHub Actions](https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule) (free, every 15 min) |
| Hosting | [Vercel](https://vercel.com/) |

---

## 🗄️ Database schema

```
habits           one row per habit          (RLS: auth.uid() = user_id)
habit_logs       one row per habit per day  (RLS: auth.uid() = user_id)
profiles         one row per user           (RLS: auth.uid() = id)
push_subscriptions  one row per device      (RLS: auth.uid() = user_id)
```

`habits.archived_at` — soft delete. `habits.reminder_time` + `habits.interval_*` — reminder configuration. `habits.sort_order` — user-controlled ordering.

---

## 🚀 Getting started

### Prerequisites
- Node.js 20+
- A free Supabase project
- A Vercel account (for deploy)

### Local setup

```bash
git clone https://github.com/briannata/bloom-habit-tracker.git
cd bloom-habit-tracker
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-publishable-key>

# Optional — only needed for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<from `npx web-push generate-vapid-keys`>
VAPID_PRIVATE_KEY=<same command>
VAPID_SUBJECT=mailto:you@example.com
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>
CRON_SECRET=<any random 32-char string>
```

Run the SQL migrations in the Supabase SQL editor (see `migrations/` notes in commit history) then:

```bash
npm run dev
```

Open http://localhost:3000.

### Deploy to Vercel

1. Push to GitHub.
2. Import the repo at https://vercel.com/new.
3. Paste the same env vars from `.env.local` into Vercel's Environment Variables.
4. Update Supabase **Auth → URL Configuration**: set Site URL to your Vercel domain and add `https://*.vercel.app/**` to the redirect allowlist.
5. (For notifications) add `NOTIFY_URL` and `CRON_SECRET` to GitHub repo secrets so the Actions cron can call your API every 15 min.

---

## 📂 Project structure

```
src/
  app/
    page.tsx                   Daily dashboard
    Dashboard.tsx
    history/                   Calendar grid + year heatmap
    profile/                   Settings + notifications toggle
    habits/
      new/                     Add habit
      [id]/edit/               Edit / archive / delete
    auth/callback/             OAuth callback
    api/push/
      subscribe/                POST: save push subscription
      unsubscribe/              POST: remove subscription
      notify/                   POST (cron-protected): send due reminders
    login/  signup/
  components/
    Plant.tsx                  Growing plant SVG (5 stages)
    Avatar.tsx                 Emoji or image avatar
    HabitForm.tsx              Add + edit form (shared)
    InstallHint.tsx            iOS Add-to-Home-Screen modal
    ServiceWorkerRegister.tsx
  lib/
    supabase/                  Server + browser clients
    types.ts                   Habit, HabitLog, Profile types
    date.ts                    Timezone-aware date + streak helpers
    push.ts                    Subscription helper
  proxy.ts                     Auth gate (Next 16 successor to middleware)
public/
  sw.js                        Push event handler
  icon.svg                     PWA icon (480x480 maskable)
  manifest.webmanifest
.github/workflows/
  notify.yml                   Cron → POST /api/push/notify every 15 min
```

---

## 🔔 How notifications work

```
User toggles "Enable notifications" on /profile
   ↓
Browser asks for permission
   ↓
Service worker subscribes via Web Push API
   ↓
Subscription saved to Supabase (push_subscriptions table)

   ─── meanwhile, every 15 minutes ───

GitHub Actions cron → POST /api/push/notify (with CRON_SECRET)
   ↓
For each habit with reminder_time or interval config:
   compute user's local time, check 15-min match window
   ↓
For each due habit, send a push to all that user's subscriptions
   ↓
Service worker receives push → shows OS notification
```

iOS only delivers push to PWAs **installed to home screen** — the in-app `InstallHint` walks users through this when they set a reminder.

---

## 🌱 Why "Bloom"?

Habits are like plants — small, daily, easy to forget, but transformative over months. The dashboard reflects your longest active streak with a plant that grows from bare soil to a full bloom. Miss a day, and you start the next streak again. The plant is patient.

---

<div align="center">

Built with 💚 by [@briannata](https://github.com/briannata)

</div>
