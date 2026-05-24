import { type ClassValue, clsx } from 'clsx'
import { addDays, nextDay, isBefore, format } from 'date-fns'
import type { DayOfWeek } from './types'

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ')
}

const DAY_MAP: Record<DayOfWeek, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

/** Returns the next occurrence of a given service day after fromDate */
export function getNextServiceDate(fromDate: Date, serviceDay: DayOfWeek): Date {
  const targetDay = DAY_MAP[serviceDay]
  const from = new Date(fromDate)
  from.setHours(0, 0, 0, 0)
  return nextDay(from, targetDay)
}

/** Returns the date one day before the next service */
export function getPreServiceAlertDate(submittedAt: Date, serviceDay: DayOfWeek): Date {
  const nextService = getNextServiceDate(submittedAt, serviceDay)
  return addDays(nextService, -1)
}

export function formatServiceDay(serviceDay: DayOfWeek): string {
  return `this ${serviceDay}`
}

export function calculateCompletionPct(profile: Record<string, unknown>, hasChildren: boolean): number {
  const requiredFields = [
    'first_name',
    'last_name',
    'photo_url',
    'age',
    'marital_status',
    'occupation',
    'neighborhood',
    'looking_for',
    'faith_stage',
    'social_style',
  ]

  const arrayFields = ['hobbies', 'interests']

  let filled = 0
  const total = requiredFields.length + arrayFields.length + (hasChildren ? 1 : 0)

  for (const field of requiredFields) {
    if (profile[field]) filled++
  }

  for (const field of arrayFields) {
    const arr = profile[field] as string[] | undefined
    if (arr && arr.length >= 2) filled++
  }

  if (hasChildren) filled++ // at least one child added

  return Math.round((filled / total) * 100)
}

export function ageRangeLabel(age: number): string {
  if (age < 30) return 'late 20s'
  if (age < 35) return 'early 30s'
  if (age < 40) return 'late 30s'
  if (age < 45) return 'early 40s'
  if (age < 50) return 'late 40s'
  if (age < 55) return 'early 50s'
  return '50s+'
}
