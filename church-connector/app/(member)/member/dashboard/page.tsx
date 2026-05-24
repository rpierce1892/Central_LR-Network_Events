export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { CompletionMeter } from '@/components/profile/CompletionMeter'

export default async function MemberDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, photo_url, is_active, completion_pct, role')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/member/profile/edit')

  if (profile.role === 'leader') redirect('/leader/dashboard')
  if (profile.role === 'admin') redirect('/admin/dashboard')

  const { data: pendingMatches } = await supabase
    .from('matches')
    .select('id, match_score, created_at')
    .eq('member_profile_id', profile.id)
    .eq('status', 'pending')

  const { data: acceptedMatches } = await supabase
    .from('matches')
    .select(`
      id,
      guest_profile:profiles!matches_guest_profile_id_fkey(first_name)
    `)
    .eq('member_profile_id', profile.id)
    .eq('status', 'accepted')

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Church Connect</h1>
            <p className="text-xs text-stone-500">Welcome back, {profile.first_name}</p>
          </div>
          <Link href="/member/profile/edit" className="text-sm text-indigo-600 hover:underline">
            My profile
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Profile completeness */}
        {profile.completion_pct < 80 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <CompletionMeter pct={profile.completion_pct} />
            <p className="text-xs text-amber-700 mt-2">
              Complete your profile to start appearing in guest matches.{' '}
              <Link href="/member/profile/edit" className="underline font-medium">Finish now →</Link>
            </p>
          </div>
        )}

        {/* Participation toggle banner */}
        {!profile.is_active && (
          <div className="bg-stone-100 border border-stone-300 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-stone-700">You&apos;re currently paused</p>
              <p className="text-xs text-stone-500">You won&apos;t receive new match notifications while paused.</p>
            </div>
            <Link
              href="/member/profile/edit#active"
              className="text-xs text-indigo-600 font-medium hover:underline"
            >
              Resume
            </Link>
          </div>
        )}

        {/* Pending matches */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900">New match requests</h2>
            {pendingMatches && pendingMatches.length > 0 && (
              <Badge variant="warning">{pendingMatches.length} pending</Badge>
            )}
          </div>

          {pendingMatches && pendingMatches.length > 0 ? (
            <div className="flex flex-col gap-3">
              {pendingMatches.map((m) => (
                <Link
                  key={m.id}
                  href={`/member/matches/${m.id}`}
                  className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 hover:border-indigo-300 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">Someone visited our church</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Their profile is waiting for you to review
                    </p>
                  </div>
                  <span className="text-indigo-500 text-lg">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-sm text-stone-400">
              No new match requests right now. Check back later!
            </div>
          )}
        </section>

        {/* Active connections */}
        {acceptedMatches && acceptedMatches.length > 0 && (
          <section>
            <h2 className="font-semibold text-stone-900 mb-3">Active connections</h2>
            <div className="flex flex-col gap-3">
              {acceptedMatches.map((m) => {
                const guest = m.guest_profile as unknown as { first_name: string } | null
                return (
                  <Link
                    key={m.id}
                    href={`/member/chat/${m.id}`}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 hover:border-indigo-300 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">
                        {guest?.first_name ?? 'Guest'}
                      </p>
                      <p className="text-xs text-stone-500">Tap to open chat</p>
                    </div>
                    <span className="text-xl">💬</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
