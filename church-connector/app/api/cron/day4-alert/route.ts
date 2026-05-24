import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendLeaderAlertEmail } from '@/lib/email'
import { subDays } from 'date-fns'

// Called daily. Alerts small group leaders for guests with 0 acceptances after 4 days.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()
  const fourDaysAgo = subDays(new Date(), 4).toISOString()
  const fiveDaysAgo = subDays(new Date(), 5).toISOString()

  // Find guest profiles submitted ~4 days ago with 0 accepted matches
  const { data: guestProfiles } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('role', 'guest')
    .gte('created_at', fiveDaysAgo)
    .lte('created_at', fourDaysAgo)

  let alerted = 0

  for (const guest of guestProfiles ?? []) {
    const { count: acceptedCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('guest_profile_id', guest.id)
      .eq('status', 'accepted')

    if ((acceptedCount ?? 0) > 0) continue

    // Alert all active small group leaders
    const { data: leaders } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('role', 'leader')
      .eq('is_active', true)

    for (const leader of leaders ?? []) {
      const { data: leaderUser } = await supabase.auth.admin.getUserById(leader.user_id)
      if (leaderUser?.user?.email) {
        await sendLeaderAlertEmail(leaderUser.user.email, guest.first_name, guest.id).catch(() => {})
        alerted++
      }
    }
  }

  return NextResponse.json({ alerted })
}
