import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type HabitRow = {
  id: string
  user_id: string
  name: string
  emoji: string
  reminder_time: string | null
  interval_start_time: string | null
  interval_end_time: string | null
  interval_hours: number | null
}

type SubRow = {
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
}

type ProfileRow = {
  id: string
  timezone: string | null
}

function localHm(tz: string, when: Date): { hour: number; minute: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const parts = fmt.formatToParts(when)
  const hour = Number(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = Number(parts.find(p => p.type === 'minute')?.value || '0')
  return { hour: hour === 24 ? 0 : hour, minute }
}

function parseHm(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number)
  return { hour: h || 0, minute: m || 0 }
}

function toMinutes(h: number, m: number): number {
  return h * 60 + m
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization') || ''
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:hello@example.com'
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: 'missing_vapid' }, { status: 500 })
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'missing_supabase_service' }, { status: 500 })
  }
  const supabase = createClient(url, serviceKey)

  const now = new Date()
  const windowMinutes = 15

  const { data: habits } = await supabase
    .from('habits')
    .select('id, user_id, name, emoji, reminder_time, interval_start_time, interval_end_time, interval_hours')
    .is('archived_at', null)
    .or('reminder_time.not.is.null,interval_hours.not.is.null')
    .returns<HabitRow[]>()

  if (!habits || habits.length === 0) return NextResponse.json({ sent: 0 })

  const userIds = Array.from(new Set(habits.map(h => h.user_id)))

  const [{ data: profiles }, { data: subs }] = await Promise.all([
    supabase.from('profiles').select('id, timezone').in('id', userIds).returns<ProfileRow[]>(),
    supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth_key')
      .in('user_id', userIds)
      .returns<SubRow[]>(),
  ])

  const tzByUser = new Map<string, string>()
  for (const p of profiles || []) tzByUser.set(p.id, p.timezone || 'UTC')

  const subsByUser = new Map<string, SubRow[]>()
  for (const s of subs || []) {
    const list = subsByUser.get(s.user_id) || []
    list.push(s)
    subsByUser.set(s.user_id, list)
  }

  const due: { habit: HabitRow; reason: 'daily' | 'interval' }[] = []
  for (const h of habits) {
    const tz = tzByUser.get(h.user_id) || 'UTC'
    const { hour, minute } = localHm(tz, now)
    const localMin = toMinutes(hour, minute)

    if (h.reminder_time) {
      const r = parseHm(h.reminder_time)
      const rMin = toMinutes(r.hour, r.minute)
      if (Math.abs(localMin - rMin) <= windowMinutes) {
        due.push({ habit: h, reason: 'daily' })
        continue
      }
    }

    if (h.interval_hours && h.interval_start_time && h.interval_end_time) {
      const start = parseHm(h.interval_start_time)
      const end = parseHm(h.interval_end_time)
      const startMin = toMinutes(start.hour, start.minute)
      const endMin = toMinutes(end.hour, end.minute)
      if (localMin >= startMin && localMin <= endMin) {
        const offset = localMin - startMin
        const intervalMin = h.interval_hours * 60
        const remainder = offset % intervalMin
        if (remainder <= windowMinutes || intervalMin - remainder <= windowMinutes) {
          due.push({ habit: h, reason: 'interval' })
        }
      }
    }
  }

  let sent = 0
  const removeEndpoints: string[] = []

  for (const { habit, reason } of due) {
    const userSubs = subsByUser.get(habit.user_id) || []
    const payload = JSON.stringify({
      title: `${habit.emoji} ${habit.name}`,
      body: reason === 'interval' ? "Time to check in" : "Don't forget today",
      tag: `habit-${habit.id}`,
      url: '/',
    })
    for (const s of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
          payload,
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) removeEndpoints.push(s.endpoint)
      }
    }
  }

  if (removeEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('endpoint', removeEndpoints)
  }

  return NextResponse.json({ sent, due: due.length })
}
