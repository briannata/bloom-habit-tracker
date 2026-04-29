'use client'

import { createClient } from '@/lib/supabase/client'
import type { Habit, HabitType } from '@/lib/types'
import InstallHint, { shouldShowInstallHint } from './InstallHint'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const EMOJIS = ['⭐', '💧', '🏃', '📚', '🧘', '💤', '🥗', '🚶', '💪', '🧠', '🌱', '☀️', '🍎', '✍️', '🎯', '🎵', '🛏️', '🚭']
const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#ef4444', '#14b8a6', '#6366f1']

type Props = { habit?: Habit; userId: string }

export default function HabitForm({ habit, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!habit

  const [name, setName] = useState(habit?.name || '')
  const [emoji, setEmoji] = useState(habit?.emoji || '⭐')
  const [color, setColor] = useState(habit?.color || COLORS[0])
  const [type, setType] = useState<HabitType>(habit?.type || 'boolean')
  const [target, setTarget] = useState(String(habit?.target_value ?? 1))
  const [unit, setUnit] = useState(habit?.unit || '')
  const [reminderTime, setReminderTime] = useState(habit?.reminder_time?.slice(0, 5) || '')
  const [intervalEnabled, setIntervalEnabled] = useState(!!habit?.interval_hours)
  const [intervalStart, setIntervalStart] = useState(habit?.interval_start_time?.slice(0, 5) || '09:00')
  const [intervalEnd, setIntervalEnd] = useState(habit?.interval_end_time?.slice(0, 5) || '21:00')
  const [intervalHours, setIntervalHours] = useState(String(habit?.interval_hours ?? 2))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showInstallHint, setShowInstallHint] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload: Record<string, unknown> = {
      user_id: userId,
      name: name.trim(),
      emoji,
      color,
      type,
      target_value: Number(target) || 1,
      unit: type === 'boolean' ? null : unit.trim() || null,
      reminder_time: reminderTime || null,
    }
    if (intervalEnabled) {
      payload.interval_start_time = intervalStart
      payload.interval_end_time = intervalEnd
      payload.interval_hours = Number(intervalHours) || 2
    } else if (isEdit) {
      payload.interval_start_time = null
      payload.interval_end_time = null
      payload.interval_hours = null
    }
    const { error: err } = isEdit
      ? await supabase.from('habits').update(payload).eq('id', habit!.id)
      : await supabase.from('habits').insert(payload)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    if ((reminderTime || intervalEnabled) && shouldShowInstallHint()) {
      setShowInstallHint(true)
      setSaving(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  function finishAfterHint() {
    setShowInstallHint(false)
    router.push('/')
    router.refresh()
  }

  async function handleArchive() {
    if (!habit) return
    if (!confirm(`Archive "${habit.name}"? It'll be hidden but history is kept.`)) return
    setSaving(true)
    await supabase.from('habits').update({ archived_at: new Date().toISOString() }).eq('id', habit.id)
    router.push('/')
    router.refresh()
  }

  async function handleDelete() {
    if (!habit) return
    if (!confirm(`Permanently delete "${habit.name}" and ALL its history? This cannot be undone.`)) return
    setSaving(true)
    await supabase.from('habits').delete().eq('id', habit.id)
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-green-50 pb-12">
     <div className="max-w-xl mx-auto">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-green-800 text-xl">←</button>
        <h1 className="text-xl font-bold text-green-900">
          {isEdit ? 'Edit habit' : 'New habit'}
        </h1>
      </header>

      <form onSubmit={handleSave} className="px-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Drink water"
            className="w-full text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Icon</label>
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(em => (
              <button
                type="button"
                key={em}
                onClick={() => setEmoji(em)}
                className={`w-11 h-11 rounded-full text-2xl flex items-center justify-center ${
                  emoji === em ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-50'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
          <div className="flex gap-3">
            {COLORS.map(c => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Type</label>
          <div className="grid grid-cols-3 gap-2">
            {(['boolean', 'numeric', 'duration'] as HabitType[]).map(t => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`py-2 rounded-xl text-sm font-medium capitalize ${
                  type === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {t === 'boolean' ? 'Yes/No' : t}
              </button>
            ))}
          </div>
        </div>

        {type !== 'boolean' && (
          <div className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-2">Target</label>
              <input
                type="number"
                min="1"
                value={target}
                onChange={e => setTarget(e.target.value)}
                className="w-full text-lg text-gray-900 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-2">Unit</label>
              <input
                value={unit}
                onChange={e => setUnit(e.target.value)}
                placeholder={type === 'duration' ? 'minutes' : 'glasses'}
                className="w-full text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">
            Daily reminder (optional)
          </label>
          <input
            type="time"
            value={reminderTime}
            onChange={e => setReminderTime(e.target.value)}
            className="text-lg text-gray-900 focus:outline-none"
          />
          {reminderTime && (
            <button
              type="button"
              onClick={() => setReminderTime('')}
              className="text-xs text-gray-500 ml-3"
            >
              Clear
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">Interval reminders</p>
              <p className="text-xs text-gray-500">Repeat every few hours within a window</p>
            </div>
            <input
              type="checkbox"
              checked={intervalEnabled}
              onChange={e => setIntervalEnabled(e.target.checked)}
              className="w-5 h-5 accent-green-600"
            />
          </label>

          {intervalEnabled && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">From</label>
                <input
                  type="time"
                  value={intervalStart}
                  onChange={e => setIntervalStart(e.target.value)}
                  className="w-full text-sm text-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">To</label>
                <input
                  type="time"
                  value={intervalEnd}
                  onChange={e => setIntervalEnd(e.target.value)}
                  className="w-full text-sm text-gray-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-500 mb-1">Every (hrs)</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={intervalHours}
                  onChange={e => setIntervalHours(e.target.value)}
                  className="w-full text-sm text-gray-900 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm px-2">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 text-white rounded-2xl py-4 font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create habit'}
        </button>

        {isEdit && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="w-full bg-white text-gray-700 rounded-2xl py-3 text-sm font-medium shadow-sm"
            >
              Archive habit
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="w-full text-red-600 rounded-2xl py-2 text-xs font-medium"
            >
              Delete permanently (loses history)
            </button>
          </div>
        )}
      </form>
     </div>
      <InstallHint open={showInstallHint} onClose={finishAfterHint} />
    </div>
  )
}
