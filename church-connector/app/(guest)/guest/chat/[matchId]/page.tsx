export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'
import Image from 'next/image'

export default async function GuestChatPage({
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

  if (!myProfile) redirect('/guest/profile/new')

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status,
      member_profile:profiles!matches_member_profile_id_fkey(
        first_name, photo_url, neighborhood, occupation
      )
    `)
    .eq('id', matchId)
    .eq('guest_profile_id', myProfile.id)
    .eq('status', 'accepted')
    .single()

  if (!match) redirect('/guest/pending')

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('match_id', matchId)
    .order('created_at')

  const member = match.member_profile as unknown as {
    first_name: string
    photo_url: string | null
    neighborhood: string | null
    occupation: string | null
  } | null

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3">
        <a href="/guest/pending" className="text-stone-400 hover:text-stone-700 text-lg">←</a>
        {member?.photo_url ? (
          <Image
            src={member.photo_url}
            alt={member.first_name}
            width={36}
            height={36}
            className="rounded-full object-cover w-9 h-9"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm">👤</div>
        )}
        <div>
          <h1 className="text-base font-bold text-stone-900">{member?.first_name ?? 'Member'}</h1>
          {member?.neighborhood && (
            <p className="text-xs text-stone-500">{member.neighborhood}</p>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 73px)' }}>
        <ChatWindow
          matchId={matchId}
          currentUserId={user.id}
          guestFirstName={myProfile.first_name}
          memberFirstName={member?.first_name ?? 'Member'}
          initialMessages={messages ?? []}
        />
      </div>
    </div>
  )
}
