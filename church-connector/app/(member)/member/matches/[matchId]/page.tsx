export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AcceptDeclineButtons } from './AcceptDeclineButtons'
import { Badge } from '@/components/ui/Badge'

export default async function MatchDetailPage({
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
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) redirect('/member/profile/edit')

  const { data: match } = await supabase
    .from('matches')
    .select(`
      id, status, match_score,
      guest_profile:profiles!matches_guest_profile_id_fkey(
        id, first_name, age_range, marital_status, neighborhood,
        occupation, faith_stage, social_style, about_me, looking_for,
        hobbies, interests, volunteer_activities, sports_leagues
      )
    `)
    .eq('id', matchId)
    .eq('member_profile_id', myProfile.id)
    .single()

  if (!match) redirect('/member/dashboard')

  const guest = match.guest_profile as unknown as {
    id: string
    first_name: string
    age_range: string | null
    marital_status: string | null
    neighborhood: string | null
    occupation: string | null
    faith_stage: string | null
    social_style: string | null
    about_me: string | null
    looking_for: string | null
    hobbies: string[]
    interests: string[]
    volunteer_activities: string[]
    sports_leagues: string[]
  } | null

  if (!guest) redirect('/member/dashboard')

  const { data: guestKids } = await supabase
    .from('children')
    .select('first_name, age, gender, school, grade, sports, activities')
    .eq('profile_id', guest.id)

  const { data: starred } = await supabase
    .from('starred_criteria')
    .select('criteria_type, criteria_value, priority')
    .eq('guest_profile_id', guest.id)
    .order('priority')

  // How many members have already accepted
  const { count: acceptedCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('guest_profile_id', guest.id)
    .eq('status', 'accepted')

  const spotsLeft = 2 - (acceptedCount ?? 0)
  const alreadyFull = spotsLeft <= 0 && match.status === 'pending'

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <a href="/member/dashboard" className="text-stone-400 hover:text-stone-700 text-lg">←</a>
          <h1 className="text-lg font-bold text-stone-900">Guest Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Disclaimer */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl px-4 py-3 text-sm text-indigo-800 italic">
          This is a starting point — real relationships can&apos;t be captured on paper, but we hope this helps you find your people.
        </div>

        {alreadyFull && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800">
            Two members have already connected with this guest. You can still view their profile in case you&apos;d like to make a personal introduction later.
          </div>
        )}

        {/* Priority criteria */}
        {starred && starred.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
            <h3 className="font-semibold text-stone-900 mb-3 text-sm">What matters most to them</h3>
            <div className="flex flex-col gap-2">
              {starred.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-amber-500">★</span>
                  <span className="text-sm text-stone-700 capitalize">
                    {c.criteria_type.replace('_', ' ')}: <strong>{c.criteria_value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-xl font-bold text-stone-900">{guest.first_name}</h2>
            <div className="flex flex-col items-end gap-1">
              {guest.age_range && <Badge>{guest.age_range}</Badge>}
              {guest.neighborhood && <span className="text-xs text-stone-500">{guest.neighborhood}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
            {guest.marital_status && (
              <div><span className="text-stone-400">Status</span><br/><span className="capitalize">{guest.marital_status}</span></div>
            )}
            {guest.occupation && (
              <div><span className="text-stone-400">Work</span><br/>{guest.occupation}</div>
            )}
            {guest.faith_stage && (
              <div><span className="text-stone-400">Faith journey</span><br/><span className="capitalize">{guest.faith_stage}</span></div>
            )}
            {guest.social_style && (
              <div><span className="text-stone-400">Social style</span><br/><span className="capitalize">{guest.social_style}</span></div>
            )}
          </div>

          {guest.about_me && (
            <div className="border-t border-stone-100 pt-3 mt-3">
              <p className="text-xs text-stone-400 mb-1">About them</p>
              <p className="text-sm text-stone-700 leading-relaxed">{guest.about_me}</p>
            </div>
          )}
          {guest.looking_for && (
            <div className="border-t border-stone-100 pt-3 mt-3">
              <p className="text-xs text-stone-400 mb-1">Looking for</p>
              <p className="text-sm text-stone-700 leading-relaxed italic">"{guest.looking_for}"</p>
            </div>
          )}
        </div>

        {/* Kids */}
        {guestKids && guestKids.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
            <h3 className="font-semibold text-stone-900 mb-3 text-sm">Their kids</h3>
            <div className="flex flex-col gap-3">
              {guestKids.map((kid, i) => (
                <div key={i} className="flex flex-col gap-1 text-sm text-stone-700 border-b border-stone-100 last:border-0 pb-2 last:pb-0">
                  <p className="font-medium capitalize">{kid.gender === 'boy' ? '👦' : kid.gender === 'girl' ? '👧' : '🧒'} {kid.first_name}, age {kid.age} · {kid.grade}</p>
                  {kid.school && <p className="text-stone-500 text-xs">{kid.school}</p>}
                  {kid.sports?.length > 0 && <p className="text-xs text-stone-500">Sports: {kid.sports.join(', ')}</p>}
                  {kid.activities?.length > 0 && <p className="text-xs text-stone-500">Activities: {kid.activities.join(', ')}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {[
          { label: 'Hobbies', items: guest.hobbies },
          { label: 'Interests', items: guest.interests },
          { label: 'Volunteers', items: guest.volunteer_activities },
          { label: 'Sports leagues', items: guest.sports_leagues },
        ].some((g) => g.items?.length > 0) && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
            <h3 className="font-semibold text-stone-900 mb-3 text-sm">Interests & activities</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: 'Hobbies', items: guest.hobbies },
                { label: 'Interests', items: guest.interests },
                { label: 'Volunteers', items: guest.volunteer_activities },
                { label: 'Sports leagues', items: guest.sports_leagues },
              ].filter((g) => g.items?.length > 0).map((group) => (
                <div key={group.label}>
                  <p className="text-xs text-stone-400 mb-1">{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span key={item} className="bg-stone-100 text-stone-700 text-xs rounded-full px-2.5 py-1">{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accept / Decline */}
        {match.status === 'pending' && !alreadyFull && (
          <AcceptDeclineButtons matchId={matchId} spotsLeft={spotsLeft} />
        )}

        {match.status === 'accepted' && (
          <a
            href={`/member/chat/${matchId}`}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 text-sm font-medium transition-colors"
          >
            💬 Open chat with {guest.first_name}
          </a>
        )}

        {match.status === 'declined' && (
          <div className="text-center text-sm text-stone-400 py-4">
            You declined this match.
          </div>
        )}
      </main>
    </div>
  )
}
