'use client'

import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/Avatar'
import InstallHint from '@/components/InstallHint'
import type { Habit } from '@/lib/types'
import { isPushSupported, subscribeToPush, unsubscribeFromPush, getCurrentSubscription } from '@/lib/push'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const AVATAR_EMOJIS = ['🌱', '🌸', '🌻', '🌳', '🌲', '🌵', '🍀', '🌷', '🌼', '🌺', '🍃', '🦋', '🐝', '🐞', '🦊', '🐻', '🐰', '🐱', '🐶', '🦁', '🐼', '🐨']

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Athens',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

type Stats = {
  weekCompletions: number
  totalCompletions: number
  bestStreakEver: number
  longestActiveStreak: number
  activeHabits: number
}

type Props = {
  userId: string
  email: string
  displayName: string
  timezone: string
  avatar: string | null
  stats: Stats
  archived: Habit[]
}

export default function ProfileForm({ userId, email, displayName, timezone, avatar, stats, archived }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState(displayName)
  const [tz, setTz] = useState(timezone)
  const [pickedAvatar, setPickedAvatar] = useState(avatar || '🌱')
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')
  const [showInstallHint, setShowInstallHint] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isPushSupported()) return
    getCurrentSubscription().then(sub => setPushEnabled(!!sub))
  }, [])

  async function handleTogglePush() {
    setPushError('')
    setPushBusy(true)
    try {
      if (pushEnabled) {
        await unsubscribeFromPush()
        setPushEnabled(false)
      } else {
        const standalone =
          typeof window !== 'undefined' &&
          (window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
        if (!standalone) {
          setShowInstallHint(true)
          setPushBusy(false)
          return
        }
        await subscribeToPush()
        setPushEnabled(true)
      }
    } catch (e: unknown) {
      setPushError(e instanceof Error ? e.message : 'Could not change subscription')
    }
    setPushBusy(false)
  }

  async function handleRestore(habitId: string) {
    await supabase.from('habits').update({ archived_at: null }).eq('id', habitId)
    router.refresh()
  }

  const detected = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : null
  const tzOptions = Array.from(new Set([detected, tz, ...TIMEZONES].filter(Boolean) as string[]))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    const { error: err } = await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: name.trim() || null, timezone: tz, avatar: pickedAvatar })
    if (err) {
      setError(err.message)
    } else {
      setSaved(true)
    }
    setSaving(false)
    router.refresh()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-green-50 pb-12">
     <div className="max-w-xl mx-auto">
      <header className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-green-800 text-xl">←</button>
        <h1 className="text-xl font-bold text-green-900">Profile</h1>
      </header>

      <form onSubmit={handleSave} className="px-4 space-y-4">
        <div className="flex justify-center pt-2">
          <Avatar avatar={pickedAvatar} size={96} />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Profile picture</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_EMOJIS.map(em => (
              <button
                type="button"
                key={em}
                onClick={() => setPickedAvatar(em)}
                className={`w-11 h-11 rounded-full text-2xl flex items-center justify-center ${
                  pickedAvatar === em ? 'bg-green-100 ring-2 ring-green-500' : 'bg-gray-50'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">Image upload coming soon.</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-3">Stats</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.weekCompletions}</p>
              <p className="text-[11px] text-gray-500">This week</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.totalCompletions}</p>
              <p className="text-[11px] text-gray-500">All time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.bestStreakEver}</p>
              <p className="text-[11px] text-gray-500">Best streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.longestActiveStreak}</p>
              <p className="text-[11px] text-gray-500">Current best</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.activeHabits}</p>
              <p className="text-[11px] text-gray-500">Active habits</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{archived.length}</p>
              <p className="text-[11px] text-gray-500">Archived</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Push notifications</p>
              <p className="text-xs text-gray-500">
                {pushEnabled ? 'On for this device' : 'Off — enable to receive reminders'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleTogglePush}
              disabled={pushBusy}
              className={`text-xs rounded-full px-4 py-2 font-medium ${
                pushEnabled ? 'bg-gray-100 text-gray-700' : 'bg-green-600 text-white'
              } disabled:opacity-50`}
            >
              {pushBusy ? '...' : pushEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          {pushError && <p className="text-red-500 text-xs mt-2">{pushError}</p>}
        </div>

        {archived.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-3">Archived habits</p>
            <div className="space-y-2">
              {archived.map(h => (
                <div key={h.id} className="flex items-center gap-3">
                  <span className="text-xl">{h.emoji}</span>
                  <p className="flex-1 text-sm text-gray-700 truncate">{h.name}</p>
                  <button
                    type="button"
                    onClick={() => handleRestore(h.id)}
                    className="text-xs text-green-700 font-medium"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
          <p className="text-base text-gray-900">{email}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Display name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="w-full text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-500 mb-2">Timezone</label>
          <select
            value={tz}
            onChange={e => setTz(e.target.value)}
            className="w-full text-base text-gray-900 bg-white focus:outline-none"
          >
            {tzOptions.map(z => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          {detected && detected !== tz && (
            <button
              type="button"
              onClick={() => setTz(detected)}
              className="text-xs text-green-700 mt-2"
            >
              Use detected: {detected}
            </button>
          )}
        </div>

        {error && <p className="text-red-500 text-sm px-2">{error}</p>}
        {saved && !error && <p className="text-green-700 text-sm px-2">Saved ✓</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-600 text-white rounded-2xl py-4 font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full bg-white text-red-600 rounded-2xl py-3 text-sm font-medium shadow-sm"
        >
          Sign out
        </button>
      </form>
     </div>
      <InstallHint open={showInstallHint} onClose={() => setShowInstallHint(false)} />
    </div>
  )
}
