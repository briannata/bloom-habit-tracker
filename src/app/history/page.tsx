import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { todayInTz, addDays } from '@/lib/date'
import type { Habit, HabitLog, Profile } from '@/lib/types'
import History from './History'

export default async function HistoryPage() {
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
  const yearStart = `${today.slice(0, 4)}-01-01`
  const sixtyBack = addDays(today, -60)
  const since = yearStart < sixtyBack ? yearStart : sixtyBack

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

  const logsByHabit = new Map<string, Map<string, HabitLog>>()
  for (const h of habits || []) logsByHabit.set(h.id, new Map())
  for (const log of logs || []) {
    logsByHabit.get(log.habit_id)?.set(log.date, log)
  }

  const habitData = (habits || []).map(habit => ({
    habit,
    logs: Object.fromEntries(logsByHabit.get(habit.id) || new Map()),
  }))

  return <History habits={habitData} today={today} userId={user.id} />
}
