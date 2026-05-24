import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendMemberAcceptedEmail, sendGuestConnectedEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const { action } = await request.json()

  if (!['accept', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('id, first_name, photo_url')
    .eq('user_id', user.id)
    .single()

  if (!myProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  // Verify this member owns this match
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, guest_profile_id')
    .eq('id', matchId)
    .eq('member_profile_id', myProfile.id)
    .eq('status', 'pending')
    .single()

  if (!match) return NextResponse.json({ error: 'Match not found or already responded' }, { status: 404 })

  // If accepting, check the 2-member cap
  if (action === 'accept') {
    const { count } = await serviceSupabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('guest_profile_id', match.guest_profile_id)
      .eq('status', 'accepted')

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: 'This guest has already been connected with 2 members.' },
        { status: 409 }
      )
    }
  }

  // Update match status
  await serviceSupabase
    .from('matches')
    .update({ status: action === 'accept' ? 'accepted' : 'declined', responded_at: new Date().toISOString() })
    .eq('id', matchId)

  if (action === 'accept') {
    // Get guest's auth email
    const { data: guestProfile } = await serviceSupabase
      .from('profiles')
      .select('user_id, first_name')
      .eq('id', match.guest_profile_id)
      .single()

    if (guestProfile) {
      const { data: guestUser } = await serviceSupabase.auth.admin.getUserById(guestProfile.user_id)
      if (guestUser?.user?.email) {
        await sendMemberAcceptedEmail(
          guestUser.user.email,
          myProfile.first_name,
          myProfile.photo_url,
          matchId
        ).catch(() => {})

        // Check if this is the 2nd acceptance — if so, notify remaining pending members
        const { count: nowAccepted } = await serviceSupabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('guest_profile_id', match.guest_profile_id)
          .eq('status', 'accepted')

        if ((nowAccepted ?? 0) >= 2) {
          // Notify remaining pending members that spots are filled
          const { data: pendingMatches } = await serviceSupabase
            .from('matches')
            .select('member_profile_id')
            .eq('guest_profile_id', match.guest_profile_id)
            .eq('status', 'pending')

          for (const pm of pendingMatches ?? []) {
            const { data: pmProfile } = await serviceSupabase
              .from('profiles')
              .select('user_id')
              .eq('id', pm.member_profile_id)
              .single()

            if (pmProfile) {
              const { data: pmUser } = await serviceSupabase.auth.admin.getUserById(pmProfile.user_id)
              if (pmUser?.user?.email) {
                // Mark as expired so it doesn't keep showing
                await serviceSupabase
                  .from('matches')
                  .update({ status: 'expired' })
                  .eq('guest_profile_id', match.guest_profile_id)
                  .eq('member_profile_id', pm.member_profile_id)
                  .eq('status', 'pending')
              }
            }
          }
        }

        // Get church name for email
        const { data: config } = await serviceSupabase
          .from('church_config')
          .select('church_name')
          .single()

        await sendGuestConnectedEmail(
          guestUser.user.email,
          config?.church_name ?? 'our church'
        ).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true })
}
