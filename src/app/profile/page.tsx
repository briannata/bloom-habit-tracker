import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Habit, HabitLog, Profile } from '@/lib/types'
import { todayInTz, addDays, calcStreak } from '@/lib/date'
import ProfileForm from './ProfileForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  const tz = profile?.timezone || 'UTC'
  const today = todayInTz(tz)
  const weekStart = addDays(today, -6)

  const [{ data: habits }, { data: archived }, { data: weekLogs }, { data: allLogs }] = await Promise.all([
    supabase.from('habits').select('*').is('archived_at', null).returns<Habit[]>(),
    supabase
      .from('habits')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .returns<Habit[]>(),
    supabase
      .from('habit_logs')
      .select('*')
      .gte('date', weekStart)
      .lte('date', today)
      .returns<HabitLog[]>(),
    supabase.from('habit_logs').select('habit_id, date, value').returns<HabitLog[]>(),
  ])

  const habitList = habits || []
  const habitById = new Map(habitList.map(h => [h.id, h]))

  let weekCompletions = 0
  for (const log of weekLogs || []) {
    const h = habitById.get(log.habit_id)
    if (h && log.value >= h.target_value) weekCompletions++
  }

  let totalCompletions = 0
  const completedByHabit = new Map<string, Set<string>>()
  for (const h of habitList) completedByHabit.set(h.id, new Set())
  for (const log of allLogs || []) {
    const h = habitById.get(log.habit_id)
    if (h && log.value >= h.target_value) {
      totalCompletions++
      completedByHabit.get(h.id)?.add(log.date)
    }
  }

  let bestStreakEver = 0
  for (const h of habitList) {
    const dates = Array.from(completedByHabit.get(h.id) || []).sort()
    if (dates.length === 0) continue
    let run = 1
    let best = 1
    for (let i = 1; i < dates.length; i++) {
      if (addDays(dates[i - 1], 1) === dates[i]) {
        run++
        if (run > best) best = run
      } else {
        run = 1
      }
    }
    if (best > bestStreakEver) bestStreakEver = best
  }

  const longestActiveStreak = habitList.reduce(
    (m, h) => Math.max(m, calcStreak(completedByHabit.get(h.id) || new Set(), today)),
    0,
  )

  return (
    <ProfileForm
      userId={user.id}
      email={user.email || ''}
      displayName={profile?.display_name || ''}
      timezone={profile?.timezone || 'UTC'}
      avatar={profile?.avatar || null}
      stats={{
        weekCompletions,
        totalCompletions,
        bestStreakEver,
        longestActiveStreak,
        activeHabits: habitList.length,
      }}
      archived={archived || []}
    />
  )
}
