import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()
  const endpoint = body?.endpoint as string | undefined
  const p256dh = body?.keys?.p256dh as string | undefined
  const auth_key = body?.keys?.auth as string | undefined

  if (!endpoint || !p256dh || !auth_key) {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh, auth_key },
    { onConflict: 'endpoint' },
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
