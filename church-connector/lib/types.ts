export type UserRole = 'guest' | 'member' | 'leader' | 'admin'

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'partnered'

export type FaithStage = 'new' | 'growing' | 'established'

export type SocialStyle = 'introvert' | 'ambivert' | 'extrovert'

export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type NotificationType =
  | 'new_match'
  | 'match_reminder'
  | 'leader_alert'
  | 'member_accepted'
  | 'guest_connected'
  | 'preservice_alert'
  | 'chat_message'

export type CriteriaType =
  | 'child_age'
  | 'child_gender'
  | 'child_school'
  | 'parent_age'
  | 'hobby'
  | 'neighborhood'
  | 'faith_stage'
  | 'marital_status'

export type DayOfWeek = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface Child {
  id: string
  profile_id: string
  first_name: string
  age: number
  gender: 'boy' | 'girl' | 'nonbinary'
  school: string
  grade: string
  activities: string[]
  sports: string[]
  clubs: string[]
  personality_notes: string
}

export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  photo_url: string | null
  age: number | null
  age_range: string | null
  marital_status: MaritalStatus | null
  spouse_first_name: string | null
  spouse_age: number | null
  spouse_occupation: string | null
  about_me: string | null
  occupation: string | null
  employer_type: string | null
  how_long_in_area: string | null
  neighborhood: string | null
  home_zip: string | null
  faith_stage: FaithStage | null
  how_long_attending_church: string | null
  social_style: SocialStyle | null
  looking_for: string | null
  hobbies: string[]
  interests: string[]
  volunteer_activities: string[]
  sports_leagues: string[]
  favorite_local_spots: string[]
  is_active: boolean
  completion_pct: number
  created_at: string
  updated_at: string
  children?: Child[]
}

export interface StarredCriterion {
  id: string
  guest_profile_id: string
  criteria_type: CriteriaType
  criteria_value: string
  priority: 1 | 2 | 3
}

export interface Match {
  id: string
  guest_profile_id: string
  member_profile_id: string
  status: MatchStatus
  match_score: number
  notified_at: string | null
  responded_at: string | null
  created_at: string
  guest_profile?: Profile
  member_profile?: Profile
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}

export interface ChurchConfig {
  id: string
  church_name: string
  primary_service_day: DayOfWeek
  midweek_day: DayOfWeek | null
  service_time: string
  timezone: string
}
