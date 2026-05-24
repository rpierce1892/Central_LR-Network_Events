export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { AssignMemberForm } from './AssignMemberForm'

export default async function LeaderGuestDetailPage({
  params,
}: {
  params: Promise<{ guestId: string }>
}) {
  const { guestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!myProfile || !['leader', 'admin'].includes(myProfile.role)) {
    redirect('/member/dashboard')
  }

  const { data: guest } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', guestId)
    .eq('role', 'guest')
    .single()

  if (!guest) redirect('/leader/dashboard')

  const { data: guestKids } = await supabase
    .from('children')
    .select('*')
    .eq('profile_id', guestId)

  const { data: starred } = await supabase
    .from('starred_criteria')
    .select('*')
    .eq('guest_profile_id', guestId)

  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id, status, match_score, responded_at, notified_at,
      member_profile:profiles!matches_member_profile_id_fkey(
        id, first_name, neighborhood, occupation
      )
    `)
    .eq('guest_profile_id', guestId)
    .order('match_score', { ascending: false })

  // Active members for manual assignment
  const { data: activeMembers } = await supabase
    .from('profiles')
    .select('id, first_name, neighborhood')
    .in('role', ['member', 'leader'])
    .eq('is_active', true)
    .gte('completion_pct', 80)

  const acceptedCount = matches?.filter((m) => m.status === 'accepted').length ?? 0

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/leader/dashboard" className="text-stone-400 hover:text-stone-700 text-lg">←</Link>
          <div>
            <h1 className="text-lg font-bold text-stone-900">{guest.first_name}</h1>
            <p className="text-xs text-stone-500">Guest profile · Leader view</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {guest.age && <div><span className="text-stone-400">Age</span><br/>{guest.age}</div>}
            {guest.neighborhood && <div><span className="text-stone-400">Area</span><br/>{guest.neighborhood}</div>}
            {guest.occupation && <div><span className="text-stone-400">Work</span><br/>{guest.occupation}</div>}
            {guest.marital_status && <div><span className="text-stone-400">Status</span><br/><span className="capitalize">{guest.marital_status}</span></div>}
          </div>
          {guest.looking_for && (
            <div className="mt-3 border-t border-stone-100 pt-3">
              <p className="text-xs text-stone-400">Looking for</p>
              <p className="text-sm text-stone-700 italic">"{guest.looking_for}"</p>
            </div>
          )}
        </div>

        {/* Starred criteria */}
        {starred && starred.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-stone-900 mb-2">Priority criteria</h3>
            {starred.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <span className="text-amber-500">★</span>
                <span className="capitalize">{c.criteria_type.replace('_', ' ')}: <strong>{c.criteria_value}</strong></span>
              </div>
            ))}
          </div>
        )}

        {/* Kids */}
        {guestKids && guestKids.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-stone-900 mb-2">Kids</h3>
            {guestKids.map((kid, i) => (
              <div key={i} className="text-sm text-stone-700 py-1">
                {kid.first_name}, {kid.gender}, age {kid.age} · {kid.grade} · {kid.school}
              </div>
            ))}
          </div>
        )}

        {/* Matches */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-stone-900">Match status</h3>
            <Badge variant={acceptedCount > 0 ? 'success' : 'warning'}>
              {acceptedCount} / 2 connected
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {matches?.map((match) => {
              const member = match.member_profile as unknown as { id: string; first_name: string; neighborhood: string | null; occupation: string | null } | null
              return (
                <div key={match.id} className="flex items-center justify-between text-sm py-1.5 border-b border-stone-100 last:border-0">
                  <span className="text-stone-700">{member?.first_name ?? '—'}</span>
                  <Badge
                    variant={
                      match.status === 'accepted' ? 'success' :
                      match.status === 'declined' ? 'danger' :
                      match.status === 'expired' ? 'default' : 'warning'
                    }
                  >
                    {match.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>

        {/* Manual assignment */}
        {acceptedCount < 2 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-stone-900 mb-3">Manually assign a member</h3>
            <AssignMemberForm
              guestId={guestId}
              guestFirstName={guest.first_name}
              members={activeMembers ?? []}
              existingMemberIds={matches?.map((m) => (m.member_profile as unknown as { id: string } | null)?.id).filter(Boolean) as string[] ?? []}
            />
          </div>
        )}

        {/* Convert to member */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">Convert to member</p>
            <p className="text-xs text-stone-500">When {guest.first_name} is ready to join as a full member</p>
          </div>
          <Link
            href={`/leader/guests/${guestId}/convert`}
            className="text-sm text-indigo-600 hover:underline font-medium"
          >
            Convert →
          </Link>
        </div>
      </main>
    </div>
  )
}
