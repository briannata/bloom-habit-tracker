import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { todayInTz, addDays, calcStreak } from '@/lib/date'
import type { Habit, HabitLog, Profile } from '@/lib/types'
import Dashboard from './Dashboard'

export default async function HomePage() {
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
  const since = addDays(today, -60)

  const { data: habits } = await supabase
    .from('habits')
    .select('*')
    .is('archived_at', null)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .returns<Habit[]>()

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('*')
    .gte('date', since)
    .lte('date', today)
    .returns<HabitLog[]>()

  const habitList = habits || []
  const logList = logs || []

  const todayMap = new Map<string, HabitLog>()
  const completedByHabit = new Map<string, Set<string>>()
  for (const h of habitList) completedByHabit.set(h.id, new Set())

  for (const log of logList) {
    if (log.date === today) todayMap.set(log.habit_id, log)
    const habit = habitList.find(h => h.id === log.habit_id)
    if (habit && log.value >= habit.target_value) {
      completedByHabit.get(habit.id)?.add(log.date)
    }
  }

  const habitData = habitList.map(habit => {
    const log = todayMap.get(habit.id) || null
    const completed = completedByHabit.get(habit.id) || new Set()
    const streak = calcStreak(completed, today)
    const week: { date: string; completed: boolean }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = addDays(today, -i)
      week.push({ date: d, completed: completed.has(d) })
    }
    return { habit, log, streak, week }
  })

  const longestStreak = habitData.reduce((m, h) => Math.max(m, h.streak), 0)

  return (
    <Dashboard
      habits={habitData}
      today={today}
      userId={user.id}
      longestStreak={longestStreak}
      displayName={profile?.display_name || null}
      avatar={profile?.avatar || null}
    />
  )
}
