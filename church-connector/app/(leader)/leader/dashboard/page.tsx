export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'

export default async function LeaderDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, first_name, role')
    .eq('user_id', user.id)
    .single()

  if (!myProfile || !['leader', 'admin'].includes(myProfile.role)) {
    redirect('/member/dashboard')
  }

  // All guest profiles with their match status summary
  const { data: guests } = await supabase
    .from('profiles')
    .select('id, first_name, created_at')
    .eq('role', 'guest')
    .order('created_at', { ascending: false })
    .limit(50)

  // Get match summaries for all guests
  const { data: matchSummaries } = await supabase
    .from('matches')
    .select('guest_profile_id, status')
    .in('guest_profile_id', (guests ?? []).map((g) => g.id))

  const statusByGuest: Record<string, { pending: number; accepted: number }> = {}
  for (const m of matchSummaries ?? []) {
    if (!statusByGuest[m.guest_profile_id]) {
      statusByGuest[m.guest_profile_id] = { pending: 0, accepted: 0 }
    }
    if (m.status === 'pending') statusByGuest[m.guest_profile_id].pending++
    if (m.status === 'accepted') statusByGuest[m.guest_profile_id].accepted++
  }

  const needsAttention = (guests ?? []).filter((g) => {
    const s = statusByGuest[g.id]
    return !s || s.accepted === 0
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Leader Dashboard</h1>
            <p className="text-xs text-stone-500">Welcome, {myProfile.first_name}</p>
          </div>
          <Link href="/leader/guests/new-invite" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors">
            + Invite guest
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Needs attention */}
        {needsAttention.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-stone-900">Needs attention</h2>
              <Badge variant="danger">{needsAttention.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {needsAttention.map((guest) => (
                <Link
                  key={guest.id}
                  href={`/leader/guests/${guest.id}`}
                  className="bg-white rounded-2xl border border-red-200 shadow-sm p-4 hover:border-red-400 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{guest.first_name}</p>
                    <p className="text-xs text-stone-500">
                      Submitted {new Date(guest.created_at).toLocaleDateString()} · No connections yet
                    </p>
                  </div>
                  <Badge variant="danger">Action needed</Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All guests */}
        <section>
          <h2 className="font-semibold text-stone-900 mb-3">All guests</h2>
          {guests && guests.length > 0 ? (
            <div className="flex flex-col gap-2">
              {guests.map((guest) => {
                const s = statusByGuest[guest.id]
                return (
                  <Link
                    key={guest.id}
                    href={`/leader/guests/${guest.id}`}
                    className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 hover:border-indigo-300 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-stone-900">{guest.first_name}</p>
                      <p className="text-xs text-stone-500">
                        {new Date(guest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {s?.accepted ? (
                        <Badge variant="success">{s.accepted} connected</Badge>
                      ) : s?.pending ? (
                        <Badge variant="warning">{s.pending} pending</Badge>
                      ) : (
                        <Badge variant="danger">No matches</Badge>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-sm text-stone-400">
              No guests yet. Invite someone using the button above.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
