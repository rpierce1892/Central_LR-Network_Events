export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'

export default async function MemberChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) redirect('/member/profile/edit')

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status,
      guest_profile:profiles!matches_guest_profile_id_fkey(first_name)
    `)
    .eq('id', matchId)
    .eq('member_profile_id', myProfile.id)
    .eq('status', 'accepted')
    .single()

  if (!match) redirect('/member/dashboard')

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at')

  const guest = match.guest_profile as unknown as { first_name: string } | null

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3">
        <a href="/member/dashboard" className="text-stone-400 hover:text-stone-700 text-lg">←</a>
        <div>
          <h1 className="text-base font-bold text-stone-900">{guest?.first_name ?? 'Guest'}</h1>
          <p className="text-xs text-stone-500">Church guest</p>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
        <ChatWindow
          matchId={matchId}
          currentUserId={user.id}
          guestFirstName={guest?.first_name ?? 'Guest'}
          memberFirstName={myProfile.first_name}
          initialMessages={messages ?? []}
        />
      </div>
    </div>
  )
}
