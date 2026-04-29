function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) return null
  return await reg.pushManager.getSubscription()
}

export async function subscribeToPush(): Promise<PushSubscription> {
  if (!isPushSupported()) throw new Error('Push not supported on this browser')
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidKey) throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY')

  const reg =
    (await navigator.serviceWorker.getRegistration()) ||
    (await navigator.serviceWorker.register('/sw.js'))
  await navigator.serviceWorker.ready

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Notification permission denied')

  const existing = await reg.pushManager.getSubscription()
  if (existing) return existing

  const keyArr = urlBase64ToUint8Array(vapidKey)
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyArr.buffer.slice(
      keyArr.byteOffset,
      keyArr.byteOffset + keyArr.byteLength,
    ) as ArrayBuffer,
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(sub.toJSON()),
  })
  return sub
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getCurrentSubscription()
  if (!sub) return
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  })
  await sub.unsubscribe()
}
