export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'

export default async function GuestPendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, photo_url')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/guest/profile/new')

  // Load accepted matches with member info
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id,
      status,
      member_profile:profiles!matches_member_profile_id_fkey(
        first_name, photo_url, neighborhood, occupation, looking_for
      )
    `)
    .eq('guest_profile_id', profile.id)
    .eq('status', 'accepted')

  const hasConnections = matches && matches.length > 0

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-stone-900">Church Connect</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4 text-3xl">
            🤝
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">
            {hasConnections ? "You've been connected!" : "We're finding your people"}
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed">
            {hasConnections
              ? 'A member of our church is excited to meet your family. Use the chat to coordinate finding each other at church!'
              : "We've quietly shared your profile with a few families from our church who have a lot in common with yours. You'll hear from someone by mid-week — no need to check back."}
          </p>
        </div>

        {hasConnections && (
          <div className="flex flex-col gap-4">
            {matches.map((match) => {
              const member = match.member_profile as unknown as {
                first_name: string
                photo_url: string | null
                neighborhood: string | null
                occupation: string | null
                looking_for: string | null
              } | null
              if (!member) return null

              return (
                <div key={match.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {member.photo_url ? (
                      <Image
                        src={member.photo_url}
                        alt={member.first_name}
                        width={56}
                        height={56}
                        className="rounded-full object-cover w-14 h-14"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
                        👤
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-stone-900">{member.first_name}</p>
                      {member.neighborhood && (
                        <p className="text-xs text-stone-500">{member.neighborhood}</p>
                      )}
                    </div>
                    <Badge variant="success" className="ml-auto">Connected</Badge>
                  </div>

                  {member.looking_for && (
                    <p className="text-sm text-stone-600 italic mb-3">"{member.looking_for}"</p>
                  )}

                  <Link
                    href={`/guest/chat/${match.id}`}
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                  >
                    💬 Open chat
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {!hasConnections && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <p className="text-stone-600 text-sm">
              Your profile has been shared. Check back in a day or two — there&apos;s no pressure, just people who want to connect.
            </p>
            <p className="text-xs text-stone-400 mt-4 italic">
              This is a starting point — real relationships can&apos;t be captured on paper, but we hope this helps you find your people.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
