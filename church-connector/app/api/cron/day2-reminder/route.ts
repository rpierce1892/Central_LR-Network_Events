import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendMatchReminderEmail } from '@/lib/email'
import { subDays } from 'date-fns'

// Called daily by Vercel cron. Sends reminders to members who haven't responded after 2 days.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const twoDaysAgo = subDays(new Date(), 2).toISOString()
  const threeDaysAgo = subDays(new Date(), 3).toISOString()

  // Matches notified ~2 days ago that are still pending
  const { data: pendingMatches } = await supabase
    .from('matches')
    .select(`
      id,
      member_profile_id,
      guest_profile:profiles!matches_guest_profile_id_fkey(first_name),
      member_profile:profiles!matches_member_profile_id_fkey(user_id)
    `)
    .eq('status', 'pending')
    .gte('notified_at', threeDaysAgo)
    .lte('notified_at', twoDaysAgo)

  let sent = 0
  for (const match of pendingMatches ?? []) {
    const memberProfile = match.member_profile as unknown as { user_id: string } | null
    const guestProfile = match.guest_profile as unknown as { first_name: string } | null
    if (!memberProfile || !guestProfile) continue

    const { data: memberUser } = await supabase.auth.admin.getUserById(memberProfile.user_id)
    if (memberUser?.user?.email) {
      await sendMatchReminderEmail(memberUser.user.email, guestProfile.first_name).catch(() => {})
      sent++
    }
  }

  return NextResponse.json({ sent })
}
