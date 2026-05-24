import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPreServiceAlertEmail } from '@/lib/email'
import { getNextServiceDate } from '@/lib/utils'
import { isToday, addDays } from 'date-fns'
import type { DayOfWeek } from '@/lib/types'

// Called daily. On the day before a service, alerts accepted members to look for their guest.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  const { data: config } = await supabase
    .from('church_config')
    .select('primary_service_day, midweek_day')
    .single()

  if (!config) return NextResponse.json({ sent: 0 })

  const today = new Date()
  const tomorrow = addDays(today, 1)

  // Is tomorrow a service day?
  const serviceDays: DayOfWeek[] = [config.primary_service_day as DayOfWeek]
  if (config.midweek_day) serviceDays.push(config.midweek_day as DayOfWeek)

  const tomorrowIsServiceDay = serviceDays.some((day) => {
    const next = getNextServiceDate(today, day)
    return isToday(addDays(next, -1)) // i.e., next service is tomorrow
  })

  if (!tomorrowIsServiceDay) {
    return NextResponse.json({ sent: 0, reason: 'Not a pre-service day' })
  }

  // Find all active accepted matches
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      id,
      member_profile:profiles!matches_member_profile_id_fkey(user_id),
      guest_profile:profiles!matches_guest_profile_id_fkey(first_name)
    `)
    .eq('status', 'accepted')

  let sent = 0
  for (const match of matches ?? []) {
    const member = match.member_profile as unknown as { user_id: string } | null
    const guest = match.guest_profile as unknown as { first_name: string } | null
    if (!member || !guest) continue

    const { data: memberUser } = await supabase.auth.admin.getUserById(member.user_id)
    if (memberUser?.user?.email) {
      await sendPreServiceAlertEmail(
        memberUser.user.email,
        guest.first_name,
        'tomorrow'
      ).catch(() => {})
      sent++
    }
  }

  return NextResponse.json({ sent })
}
