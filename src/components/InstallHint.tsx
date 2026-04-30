'use client'

import { useState } from 'react'

const DISMISS_KEY = 'bloom_install_hint_dismissed'

type Props = { open: boolean; onClose: () => void }

function detectPlatform() {
  if (typeof window === 'undefined') return { isIOS: false, isStandalone: true }
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window)
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return { isIOS, isStandalone }
}

export default function InstallHint({ open, onClose }: Props) {
  // Lazy-init from window once on mount; SSR returns isStandalone=true so the modal stays hidden during hydration.
  const [{ isIOS, isStandalone }] = useState(detectPlatform)

  function handleDismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {}
    onClose()
  }

  if (!open || isStandalone) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <span className="text-4xl">📲</span>
          <h2 className="text-lg font-bold text-green-900 mt-2">Install Bloom</h2>
          <p className="text-sm text-gray-600 mt-2">
            Reminders only work after Bloom is installed to your home screen.
          </p>
        </div>

        {isIOS ? (
          <ol className="text-sm text-gray-700 mt-4 space-y-2 list-decimal list-inside">
            <li>
              Open Bloom in <strong>Safari</strong> (not in-app browsers).
            </li>
            <li>
              Tap the <strong>Share</strong> icon{' '}
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs">⬆︎</span>{' '}
              at the bottom.
            </li>
            <li>
              Choose <strong>Add to Home Screen</strong>.
            </li>
            <li>Tap the Bloom icon from your home screen to open it.</li>
          </ol>
        ) : (
          <ol className="text-sm text-gray-700 mt-4 space-y-2 list-decimal list-inside">
            <li>Open the browser menu (⋮ in Chrome).</li>
            <li>
              Choose <strong>Install app</strong> or <strong>Add to home screen</strong>.
            </li>
            <li>Open Bloom from your home screen.</li>
          </ol>
        )}

        <button
          onClick={handleDismiss}
          className="w-full mt-5 bg-green-600 text-white rounded-xl py-3 text-sm font-semibold"
        >
          Got it
        </button>
      </div>
    </div>
  )
}

export function shouldShowInstallHint(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(DISMISS_KEY) === '1') return false
  } catch {}
  const { isStandalone } = detectPlatform()
  return !isStandalone
}
