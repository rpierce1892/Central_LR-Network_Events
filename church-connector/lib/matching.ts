import { Profile, Child, StarredCriterion } from './types'

interface ScoredMember {
  profile: Profile
  score: number
  matchReasons: string[]
}

const SCORES = {
  starred: 30,
  childAgeWithin2: 20,
  childSameGender: 15,
  childSameSchool: 25,
  parentAgeWithin5: 15,
  parentAgeWithin10: 8,
  sharedHobby: 5,
  sameNeighborhood: 10,
  sameFaithStage: 8,
}

const MAX_HOBBY_SCORE = 20

function ageWithinYears(a: number, b: number, years: number): boolean {
  return Math.abs(a - b) <= years
}

function childrenOverlap(
  guestKids: Child[],
  memberKids: Child[]
): { ageMatch: boolean; genderMatch: boolean; schoolMatch: boolean } {
  let ageMatch = false
  let genderMatch = false
  let schoolMatch = false

  for (const gKid of guestKids) {
    for (const mKid of memberKids) {
      if (ageWithinYears(gKid.age, mKid.age, 2)) {
        ageMatch = true
        if (gKid.gender === mKid.gender) genderMatch = true
        if (
          gKid.school &&
          mKid.school &&
          gKid.school.toLowerCase().trim() === mKid.school.toLowerCase().trim()
        ) {
          schoolMatch = true
        }
      }
    }
  }

  return { ageMatch, genderMatch, schoolMatch }
}

function matchesStarredCriterion(
  criterion: StarredCriterion,
  member: Profile,
  memberKids: Child[]
): boolean {
  const val = criterion.criteria_value.toLowerCase()

  switch (criterion.criteria_type) {
    case 'child_age': {
      const targetAge = parseInt(val)
      return memberKids.some((k) => ageWithinYears(k.age, targetAge, 2))
    }
    case 'child_gender':
      return memberKids.some((k) => k.gender === val)
    case 'child_school':
      return memberKids.some((k) => k.school.toLowerCase().trim() === val)
    case 'parent_age': {
      const targetAge = parseInt(val)
      return member.age ? ageWithinYears(member.age, targetAge, 5) : false
    }
    case 'hobby':
      return member.hobbies.map((h) => h.toLowerCase()).includes(val)
    case 'neighborhood':
      return member.neighborhood?.toLowerCase().includes(val) ?? false
    case 'faith_stage':
      return member.faith_stage === val
    case 'marital_status':
      return member.marital_status === val
    default:
      return false
  }
}

export function scoreMembers(
  guest: Profile,
  guestKids: Child[],
  starredCriteria: StarredCriterion[],
  members: { profile: Profile; kids: Child[] }[]
): ScoredMember[] {
  return members
    .map(({ profile: member, kids: memberKids }) => {
      let score = 0
      const matchReasons: string[] = []

      // Starred criteria (highest weight)
      for (const criterion of starredCriteria) {
        if (matchesStarredCriterion(criterion, member, memberKids)) {
          score += SCORES.starred
          matchReasons.push(`Priority match: ${criterion.criteria_type}`)
        }
      }

      // Children overlap
      if (guestKids.length > 0 && memberKids.length > 0) {
        const { ageMatch, genderMatch, schoolMatch } = childrenOverlap(guestKids, memberKids)
        if (ageMatch) {
          score += SCORES.childAgeWithin2
          matchReasons.push('Kids close in age')
        }
        if (genderMatch) {
          score += SCORES.childSameGender
          matchReasons.push('Kids same gender')
        }
        if (schoolMatch) {
          score += SCORES.childSameSchool
          matchReasons.push('Kids go to same school')
        }
      }

      // Parent age
      if (guest.age && member.age) {
        if (ageWithinYears(guest.age, member.age, 5)) {
          score += SCORES.parentAgeWithin5
          matchReasons.push('Similar ages')
        } else if (ageWithinYears(guest.age, member.age, 10)) {
          score += SCORES.parentAgeWithin10
          matchReasons.push('Relatively close in age')
        }
      }

      // Shared hobbies (capped)
      const guestHobbies = guest.hobbies.map((h) => h.toLowerCase())
      const memberHobbies = member.hobbies.map((h) => h.toLowerCase())
      const sharedHobbies = guestHobbies.filter((h) => memberHobbies.includes(h))
      const hobbyScore = Math.min(sharedHobbies.length * SCORES.sharedHobby, MAX_HOBBY_SCORE)
      if (hobbyScore > 0) {
        score += hobbyScore
        matchReasons.push(`Shared interests: ${sharedHobbies.slice(0, 2).join(', ')}`)
      }

      // Neighborhood
      if (
        guest.neighborhood &&
        member.neighborhood &&
        guest.neighborhood.toLowerCase() === member.neighborhood.toLowerCase()
      ) {
        score += SCORES.sameNeighborhood
        matchReasons.push('Same neighborhood')
      }

      // Faith stage
      if (guest.faith_stage && member.faith_stage && guest.faith_stage === member.faith_stage) {
        score += SCORES.sameFaithStage
        matchReasons.push('Similar faith journey')
      }

      return { profile: member, score, matchReasons }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
}

export function getTop5(scored: ScoredMember[]): ScoredMember[] {
  return scored.slice(0, 5)
}
