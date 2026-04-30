<div align="center">

# 🌱 Bloom

**A mobile-first habit tracker PWA with a plant that grows alongside your streak.**

[Live demo](https://bloom-habit-tracker-fc3n.vercel.app/) · [@briannata](https://github.com/briannata)

[![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=fff)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=fff)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?logo=vercel)](https://vercel.com/)

</div>

---

## Highlights

- **Full-stack PWA** — installable on iOS & Android, works offline-ready, complete auth flow
- **Web Push notifications** — daily + interval reminders, timezone-aware, delivered through a service worker, scheduled via GitHub Actions cron
- **Postgres with Row-Level Security** — every query scoped to the signed-in user; no API surface exposes other users' data
- **OAuth + email auth** via Supabase, including a custom `/auth/callback` that handles cookie-based session exchange
- **Custom growing-plant SVG** with 5 streak stages, **GitHub-style year heatmap**, and a tap-to-edit calendar grid
- **Mobile-first responsive UI** that adapts cleanly from phone to desktop without a separate codebase

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth) · Web Push API · Service Worker · Vercel · GitHub Actions

## Engineering decisions worth a look

- [`src/proxy.ts`](src/proxy.ts) — auth-gate edge logic on every request (Next 16 replacement for middleware)
- [`src/app/api/push/notify/route.ts`](src/app/api/push/notify/route.ts) — cron-protected endpoint that computes each user's local time, matches habits within a 15-minute window, and dispatches pushes
- [`src/app/auth/callback/route.ts`](src/app/auth/callback/route.ts) — OAuth code exchange that attaches session cookies directly to the redirect response (avoids a known Supabase SSR pitfall)
- [`src/components/Plant.tsx`](src/components/Plant.tsx) — hand-rolled SVG that morphs between stages based on the longest active streak

## Features at a glance

📅 Daily dashboard with one-tap logging, +/− steppers, tap-to-edit values, completed-sink-to-bottom, 7-day strip per habit
📊 Calendar month view + year heatmap, per-habit current/best/total stats, backfill any past day
⏰ Daily reminders + hourly-interval reminders within a time window
👤 Profile with avatar picker, timezone auto-detect, push notification toggle
🗂️ Reorderable, archivable habits (soft delete preserves history)
🔐 Google OAuth + email/password with email confirmation
📱 PWA installable on iOS/Android, in-app "Add to Home Screen" prompt for iOS push support

---

<div align="center">
Built with 💚
</div>
