<div align="center">

# 🌱 Bloom

### Grow your habits, one day at a time

A mobile-first habit tracker with a plant that grows alongside your streak.

[**Live demo**](https://bloom-habit-tracker-fc3n.vercel.app/) · [@briannata](https://github.com/briannata)

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=fff)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000?logo=vercel)](https://vercel.com/)

</div>

---

## ✨ What it does

Track daily habits like a native app — installable on your phone, with smart reminders and a growing plant that reflects your progress.

```
🪴  →  🌱  →  🌿  →  🌸  →  🌳
 0      1-3    4-7    week+   month+
```

The longer your streak, the more your plant blooms.

---

## 🌟 Features

**Daily dashboard**
Three habit types — boolean, numeric, and duration — each with its own input UI. Logged habits auto-sort to the bottom; a 7-day strip on every card surfaces the past week without leaving the screen. The growing-plant SVG on the header reflects your longest active streak across all habits.

**Calendar history**
Tap-to-log calendar month with intensity scaled to completion ratio, plus a full-year GitHub-style heatmap. Per-habit current streak, best-ever streak, and total completions on tap. Backfill any past day to keep streaks honest.

**Smart reminders**
Daily reminder times *and* hourly-interval reminders within a window (e.g. "every 2 hours between 9am and 9pm"). Delivered as Web Push notifications through a service worker; the dispatcher computes each user's local time in their saved timezone before firing.

**Auth & access control**
Email/password and Google OAuth via Supabase. Every table uses Postgres Row-Level Security — every query is server-enforced to be scoped to the signed-in user.

**PWA**
Installable on iOS and Android with a maskable icon, splash screen, and theme color. Standalone display mode unlocks Web Push on iOS 16.4+. The app shows context-aware "Add to Home Screen" instructions when reminders are first set.

**Habit management**
Custom emoji + accent color per habit. Reorder with up/down controls (renumbers `sort_order` in a single batched write). Soft archive preserves history; permanent delete is a separate, opt-in action.

---

## 🛠️ Built with

| Layer | |
|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **Database & Auth** | Supabase (Postgres with RLS) |
| **Notifications** | Web Push API + service worker |
| **Scheduling** | GitHub Actions cron |
| **Hosting** | Vercel |

---

## 🌱 Why "Bloom"?

Habits are like plants — small, daily, easy to forget, but transformative over months. The dashboard reflects your longest active streak with a plant that grows from bare soil to a full bloom. Miss a day and the next streak starts again. The plant is patient.

---

<div align="center">
Built with 💚
</div>
