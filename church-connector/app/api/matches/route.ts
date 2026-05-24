import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { scoreMembers, getTop5 } from '@/lib/matching'
import { sendNewMatchEmail } from '@/lib/email'
import type { Profile, Child, StarredCriterion } from '@/lib/types'

export async function POST(request: NextRequest) {
  const { guestProfileId } = await request.json()

  if (!guestProfileId) {
    return NextResponse.json({ error: 'guestProfileId required' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Load guest profile
  const { data: guestProfile, error: guestError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', guestProfileId)
    .single()

  if (guestError || !guestProfile) {
    return NextResponse.json({ error: 'Guest profile not found' }, { status: 404 })
  }

  const { data: guestKids } = await supabase
    .from('children')
    .select('*')
    .eq('profile_id', guestProfileId)

  const { data: starredCriteria } = await supabase
    .from('starred_criteria')
    .select('*')
    .eq('guest_profile_id', guestProfileId)

  // Load all active members with completion >= 80
  const { data: memberProfiles } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['member', 'leader'])
    .eq('is_active', true)
    .gte('completion_pct', 80)

  if (!memberProfiles || memberProfiles.length === 0) {
    return NextResponse.json({ matched: 0 })
  }

  // Load all member children in one query
  const memberIds = memberProfiles.map((p: Profile) => p.id)
  const { data: allMemberKids } = await supabase
    .from('children')
    .select('*')
    .in('profile_id', memberIds)

  const kidsByProfile: Record<string, Child[]> = {}
  for (const kid of allMemberKids ?? []) {
    if (!kidsByProfile[kid.profile_id]) kidsByProfile[kid.profile_id] = []
    kidsByProfile[kid.profile_id].push(kid)
  }

  const scored = scoreMembers(
    guestProfile as Profile,
    (guestKids as Child[]) ?? [],
    (starredCriteria as StarredCriterion[]) ?? [],
    memberProfiles.map((p: Profile) => ({ profile: p, kids: kidsByProfile[p.id] ?? [] }))
  )

  const top5 = getTop5(scored)

  // Create match records and notify
  let notified = 0
  for (const { profile: member, score } of top5) {
    const { error: matchError } = await supabase.from('matches').insert({
      guest_profile_id: guestProfileId,
      member_profile_id: member.id,
      status: 'pending',
      match_score: score,
      notified_at: new Date().toISOString(),
    })

    if (!matchError) {
      // Get member's auth email
      const { data: memberUser } = await supabase.auth.admin.getUserById(member.user_id)
      if (memberUser?.user?.email) {
        await sendNewMatchEmail(memberUser.user.email, guestProfile.first_name).catch(() => {})
      }
      notified++
    }
  }

  return NextResponse.json({ matched: notified })
}
