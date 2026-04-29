'use client'

import type { Habit, HabitLog } from '@/lib/types'
import { addDays, calcStreak } from '@/lib/date'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'

type HabitData = { habit: Habit; logs: Record<string, HabitLog> }

type Props = { habits: HabitData[]; today: string; userId: string }

type View = 'month' | 'year'

function buildYearDates(today: string): string[] {
  const year = today.slice(0, 4)
  const start = `${year}-01-01`
  const end = `${year}-12-31`
  const result: string[] = []
  let cur = start
  while (cur <= end) {
    result.push(cur)
    cur = addDays(cur, 1)
  }
  return result
}

function buildMonthDates(today: string): string[] {
  const [y, m] = today.split('-').map(Number)
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const result: string[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  return result
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0')
  return `${hex}${a}`
}

function intensity(value: number, target: number): number {
  if (target <= 0) return value > 0 ? 1 : 0
  return Math.min(1, value / target)
}

function cellFill(habit: Habit, value: number): string {
  const ratio = intensity(value, habit.target_value)
  if (ratio === 0) return '#e5e7eb'
  return hexWithAlpha(habit.color, 0.25 + ratio * 0.75)
}

function MonthGrid({
  habit,
  logs,
  dates,
  today,
  onLog,
}: {
  habit: Habit
  logs: Record<string, HabitLog>
  dates: string[]
  today: string
  onLog: (habit: Habit, date: string, value: number) => void
}) {
  const startWeekday = new Date(dates[0] + 'T00:00:00').getDay()
  const totalCells = startWeekday + dates.length
  const numWeeks = Math.ceil(totalCells / 7)
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  const cells: (string | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (const d of dates) cells.push(d)
  while (cells.length < numWeeks * 7) cells.push(null)

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {labels.map((l, i) => (
          <div key={i} className="text-[10px] text-gray-400 text-center">
            {l}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />
          const value = logs[d]?.value || 0
          const day = Number(d.slice(8, 10))
          const isFuture = d > today
          const isToday = d === today
          return (
            <button
              type="button"
              key={i}
              disabled={isFuture}
              onClick={() => {
                if (habit.type === 'boolean') {
                  onLog(habit, d, value >= habit.target_value ? 0 : habit.target_value)
                } else {
                  const input = window.prompt(
                    `${habit.name} — ${d}\nEnter value${habit.unit ? ` (${habit.unit})` : ''}:`,
                    String(value),
                  )
                  if (input === null) return
                  const trimmed = input.trim()
                  if (trimmed === '') return onLog(habit, d, 0)
                  const n = Number(trimmed)
                  if (Number.isNaN(n) || n < 0) return
                  onLog(habit, d, n)
                }
              }}
              title={`${d} — ${value}${habit.unit ? ` ${habit.unit}` : ''} / ${habit.target_value}`}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] text-gray-700 transition ${
                isFuture ? 'opacity-30 cursor-default' : 'hover:ring-2 hover:ring-green-400'
              } ${isToday ? 'ring-2 ring-green-500' : ''}`}
              style={{ backgroundColor: cellFill(habit, value) }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function YearGrid({ habit, logs, dates }: { habit: Habit; logs: Record<string, HabitLog>; dates: string[] }) {
  const cellSize = 10
  const gap = 2
  const rows = 7
  const startWeekday = new Date(dates[0] + 'T00:00:00').getDay()
  const totalCols = Math.ceil((dates.length + startWeekday) / rows)
  const width = totalCols * (cellSize + gap)
  const height = rows * (cellSize + gap)

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full h-auto"
        style={{ minWidth: width }}
      >
        {dates.map((d, i) => {
          const idx = i + startWeekday
          const col = Math.floor(idx / rows)
          const row = idx % rows
          const value = logs[d]?.value || 0
          return (
            <rect
              key={i}
              x={col * (cellSize + gap)}
              y={row * (cellSize + gap)}
              width={cellSize}
              height={cellSize}
              rx={2}
              fill={cellFill(habit, value)}
            >
              <title>
                {d} — {value}
                {habit.unit ? ` ${habit.unit}` : ''} / {habit.target_value}
              </title>
            </rect>
          )
        })}
      </svg>
    </div>
  )
}

export default function History({ habits, today, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()
  const [view, setView] = useState<View>('month')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function handleLog(habit: Habit, date: string, value: number) {
    if (value <= 0) {
      await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('date', date)
    } else {
      await supabase.from('habit_logs').upsert(
        { habit_id: habit.id, user_id: userId, date, value },
        { onConflict: 'habit_id,date' },
      )
    }
    startTransition(() => router.refresh())
  }

  const dates = useMemo(
    () => (view === 'month' ? buildMonthDates(today) : buildYearDates(today)),
    [today, view],
  )

  const monthLabel = useMemo(
    () =>
      new Date(today + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [today],
  )

  return (
    <div className="min-h-screen bg-green-50 pb-12">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <Link href="/" className="text-green-800 text-xl">←</Link>
        <h1 className="text-xl font-bold text-green-900">History</h1>
      </header>

      <div className="px-4 mb-4 max-w-2xl flex items-center justify-between gap-3">
        <div className="bg-white rounded-full p-1 inline-flex shadow-sm">
          {(['month', 'year'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${
                view === v ? 'bg-green-600 text-white' : 'text-gray-600'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        {view === 'month' && (
          <span className="text-sm font-medium text-green-900">{monthLabel}</span>
        )}
      </div>

      <div
        className={
          view === 'month'
            ? 'px-4 grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'px-4 space-y-3'
        }
      >
        {habits.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <p className="text-gray-500">No habits to show.</p>
          </div>
        )}

        {habits.map(({ habit, logs }) => {
          const completedDates = new Set<string>()
          let totalCompletions = 0
          let bestStreak = 0
          let currentRunningStreak = 0

          const allDates = Object.keys(logs).sort()
          for (const d of allDates) {
            if ((logs[d]?.value || 0) >= habit.target_value) {
              completedDates.add(d)
              totalCompletions++
            }
          }

          const earliestDate = allDates[0] || today
          let cursor = earliestDate
          while (cursor <= today) {
            if (completedDates.has(cursor)) {
              currentRunningStreak++
              if (currentRunningStreak > bestStreak) bestStreak = currentRunningStreak
            } else {
              currentRunningStreak = 0
            }
            cursor = addDays(cursor, 1)
          }

          const streak = calcStreak(completedDates, today)
          const isExpanded = expanded === habit.id

          return (
            <div
              key={habit.id}
              className="bg-white rounded-2xl p-4 shadow-sm border-l-4"
              style={{ borderLeftColor: habit.color }}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : habit.id)}
                className="w-full flex items-center gap-3 text-left"
              >
                <span className="text-2xl">{habit.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{habit.name}</p>
                  <p className="text-xs text-gray-500">
                    {streak > 0 ? `🔥 ${streak} day streak` : 'No active streak'}
                  </p>
                </div>
                <span className="text-gray-400 text-sm">{isExpanded ? '▾' : '▸'}</span>
              </button>

              <div className="mt-3">
                {view === 'month' ? (
                  <MonthGrid habit={habit} logs={logs} dates={dates} today={today} onLog={handleLog} />
                ) : (
                  <YearGrid habit={habit} logs={logs} dates={dates} />
                )}
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Current</p>
                    <p className="text-lg font-bold text-gray-900">{streak}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Best</p>
                    <p className="text-lg font-bold text-gray-900">{bestStreak}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-lg font-bold text-gray-900">{totalCompletions}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
