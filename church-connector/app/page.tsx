export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  switch (profile.role) {
    case 'admin':
      redirect('/admin/dashboard')
    case 'leader':
      redirect('/leader/dashboard')
    case 'member':
      redirect('/member/dashboard')
    default:
      redirect('/guest/pending')
  }
}
