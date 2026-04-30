'use client'

import { createClient } from '@/lib/supabase/client'
import type { Habit, HabitLog } from '@/lib/types'
import Plant from '@/components/Plant'
import Avatar from '@/components/Avatar'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type HabitData = {
  habit: Habit
  log: HabitLog | null
  streak: number
  week: { date: string; completed: boolean }[]
}

type Props = {
  habits: HabitData[]
  today: string
  userId: string
  longestStreak: number
  displayName: string | null
  avatar: string | null
}

export default function Dashboard({ habits, today, userId, longestStreak, displayName, avatar }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const [pending, setPending] = useState<Set<string>>(new Set())
  const [reorderMode, setReorderMode] = useState(false)
  const [reordering, setReordering] = useState(false)

  function setPendingFor(id: string, on: boolean) {
    setPending(prev => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function upsertLog(habit: Habit, value: number) {
    setPendingFor(habit.id, true)
    if (value <= 0) {
      await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('date', today)
    } else {
      await supabase.from('habit_logs').upsert(
        { habit_id: habit.id, user_id: userId, date: today, value },
        { onConflict: 'habit_id,date' },
      )
    }
    startTransition(() => router.refresh())
    setPendingFor(habit.id, false)
  }

  const sorted = reorderMode
    ? [...habits].sort((a, b) => a.habit.sort_order - b.habit.sort_order)
    : [...habits].sort((a, b) => {
        const aDone = (a.log?.value || 0) >= a.habit.target_value
        const bDone = (b.log?.value || 0) >= b.habit.target_value
        if (aDone !== bDone) return aDone ? 1 : -1
        return a.habit.sort_order - b.habit.sort_order
      })

  async function moveHabit(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= sorted.length || reordering) return
    setReordering(true)
    // Build the new desired order locally, then renumber every habit.
    // This is robust whether or not the existing sort_order values are unique.
    const reordered = [...sorted]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    await Promise.all(
      reordered.map((h, i) =>
        supabase.from('habits').update({ sort_order: i }).eq('id', h.habit.id),
      ),
    )
    startTransition(() => router.refresh())
    setReordering(false)
  }

  return (
    <div className="min-h-screen bg-green-50 pb-24">
     <div className="max-w-xl mx-auto">
      <header className="px-5 pt-8 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/profile" aria-label="Profile">
            <Avatar avatar={avatar} size={48} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-green-900 truncate">
              {displayName ? `Hi, ${displayName}` : 'Bloom'}
            </h1>
            <p className="text-sm text-green-700/70">
              {new Date(today + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setReorderMode(v => !v)}
            className={`text-xs rounded-full px-3 py-2 shadow-sm ${
              reorderMode ? 'bg-green-600 text-white' : 'bg-white text-green-800'
            }`}
          >
            {reorderMode ? 'Done' : 'Reorder'}
          </button>
          <Link
            href="/history"
            className="text-xs text-green-800 bg-white rounded-full px-3 py-2 shadow-sm"
          >
            History
          </Link>
        </div>
      </header>

      <div className="flex flex-col items-center pb-2">
        <Plant streak={longestStreak} size={180} />
        <p className="text-sm text-green-800 font-medium -mt-2">
          {longestStreak === 0
            ? 'Plant a seed today 🌱'
            : `${longestStreak}-day streak`}
        </p>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {sorted.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500 mb-4">No habits yet.</p>
            <Link
              href="/habits/new"
              className="inline-block bg-green-600 text-white rounded-full px-5 py-2 text-sm font-semibold"
            >
              Add your first habit
            </Link>
          </div>
        )}

        {sorted.map(({ habit, log, streak, week }, idx) => {
          const value = log?.value || 0
          const done = value >= habit.target_value
          const isPending = pending.has(habit.id)

          function promptValue() {
            const input = window.prompt(
              `${habit.name}\nEnter value${habit.unit ? ` (${habit.unit})` : ''}:`,
              String(value),
            )
            if (input === null) return
            const trimmed = input.trim()
            if (trimmed === '') return upsertLog(habit, 0)
            const n = Number(trimmed)
            if (Number.isNaN(n) || n < 0) return
            upsertLog(habit, n)
          }

          return (
            <div
              key={habit.id}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 transition-opacity ${
                done ? 'opacity-60' : ''
              } ${isPending ? 'opacity-50' : ''}`}
              style={{ borderLeftColor: habit.color }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{habit.emoji}</span>
                <div className="flex-1 min-w-0">
                  {reorderMode ? (
                    <p className="font-semibold text-gray-900 truncate">{habit.name}</p>
                  ) : (
                    <Link
                      href={`/habits/${habit.id}/edit`}
                      className="block font-semibold text-gray-900 truncate"
                    >
                      {habit.name}
                    </Link>
                  )}
                  <p className="text-xs text-gray-500">
                    {streak > 0 && `🔥 ${streak} day${streak === 1 ? '' : 's'} · `}
                    {habit.type === 'boolean'
                      ? done
                        ? 'Done'
                        : 'Tap to complete'
                      : `${value} / ${habit.target_value} ${habit.unit || ''}`}
                  </p>
                </div>

                {reorderMode ? (
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveHabit(idx, -1)}
                      disabled={idx === 0 || reordering}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHabit(idx, 1)}
                      disabled={idx === sorted.length - 1 || reordering}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                ) : habit.type === 'boolean' ? (
                  <button
                    disabled={isPending}
                    onClick={() => upsertLog(habit, done ? 0 : habit.target_value)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${
                      done
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                    }`}
                    aria-label={done ? 'Undo' : 'Complete'}
                  >
                    {done ? '✓' : ''}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      disabled={isPending || value <= 0}
                      onClick={() => upsertLog(habit, Math.max(0, value - 1))}
                      className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 text-lg disabled:opacity-30"
                    >
                      −
                    </button>
                    <button
                      disabled={isPending}
                      onClick={promptValue}
                      className="w-10 text-center font-semibold text-gray-800 underline-offset-2 hover:underline"
                      title="Tap to enter exact value"
                    >
                      {value}
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() => upsertLog(habit, value + 1)}
                      className="w-9 h-9 rounded-full text-white text-lg"
                      style={{ backgroundColor: habit.color }}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-1.5 justify-between">
                {week.map(({ date, completed }) => {
                  const label = new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'narrow',
                  })
                  const isToday = date === today
                  return (
                    <div key={date} className="flex-1 flex flex-col items-center gap-1">
                      <span className={`text-[10px] ${isToday ? 'text-green-700 font-bold' : 'text-gray-400'}`}>
                        {label}
                      </span>
                      <div
                        className={`w-full h-2 rounded-full ${isToday ? 'ring-1 ring-offset-1 ring-green-400' : ''}`}
                        style={{ backgroundColor: completed ? habit.color : '#e5e7eb' }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

     </div>

      <div className="fixed bottom-6 inset-x-0 flex justify-center px-4 pointer-events-none">
        <Link
          href="/habits/new"
          className="pointer-events-auto bg-green-600 text-white rounded-full px-6 py-3 text-sm font-semibold shadow-lg"
        >
          + Add habit
        </Link>
      </div>
    </div>
  )
}
