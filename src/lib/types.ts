export type HabitType = 'boolean' | 'numeric' | 'duration'

export type Habit = {
  id: string
  user_id: string
  name: string
  emoji: string
  color: string
  type: HabitType
  target_value: number
  unit: string | null
  sort_order: number
  reminder_time: string | null
  interval_start_time: string | null
  interval_end_time: string | null
  interval_hours: number | null
  archived_at: string | null
  created_at: string
}

export type HabitLog = {
  id: string
  habit_id: string
  user_id: string
  date: string
  value: number
  logged_at: string
}

export type Profile = {
  id: string
  display_name: string | null
  timezone: string
  avatar: string | null
  created_at: string
}
