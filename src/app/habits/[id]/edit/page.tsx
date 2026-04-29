import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import HabitForm from '@/components/HabitForm'
import type { Habit } from '@/lib/types'

export default async function EditHabitPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', id)
    .single<Habit>()

  if (!habit) notFound()

  return <HabitForm habit={habit} userId={user.id} />
}
