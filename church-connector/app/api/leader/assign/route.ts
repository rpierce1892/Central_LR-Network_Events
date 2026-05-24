import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNewMatchEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const serviceSupabase = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!myProfile || !['leader', 'admin'].includes(myProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { guestProfileId, memberProfileId } = await request.json()

  // Check 2-member cap
  const { count } = await serviceSupabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('guest_profile_id', guestProfileId)
    .eq('status', 'accepted')

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: 'Guest already has 2 connected members.' }, { status: 409 })
  }

  // Create match directly as accepted
  const { error: matchError } = await serviceSupabase
    .from('matches')
    .insert({
      guest_profile_id: guestProfileId,
      member_profile_id: memberProfileId,
      status: 'accepted',
      match_score: 0,
      notified_at: new Date().toISOString(),
      responded_at: new Date().toISOString(),
    })

  if (matchError) {
    if (matchError.code === '23505') {
      return NextResponse.json({ error: 'This member is already matched with this guest.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create match.' }, { status: 500 })
  }

  // Notify the member
  const { data: memberProfile } = await serviceSupabase
    .from('profiles')
    .select('user_id, first_name')
    .eq('id', memberProfileId)
    .single()

  const { data: guestProfile } = await serviceSupabase
    .from('profiles')
    .select('first_name')
    .eq('id', guestProfileId)
    .single()

  if (memberProfile && guestProfile) {
    const { data: memberUser } = await serviceSupabase.auth.admin.getUserById(memberProfile.user_id)
    if (memberUser?.user?.email) {
      await sendNewMatchEmail(memberUser.user.email, guestProfile.first_name).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
