'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TagInput } from '@/components/profile/TagInput'
import { ChildForm } from '@/components/profile/ChildForm'
import { PhotoUpload } from '@/components/profile/PhotoUpload'
import { CompletionMeter } from '@/components/profile/CompletionMeter'
import { calculateCompletionPct } from '@/lib/utils'
import type { Child } from '@/lib/types'

export default function MemberProfileEditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [userId, setUserId] = useState('')
  const [profileId, setProfileId] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [age, setAge] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [spouseFirstName, setSpouseFirstName] = useState('')
  const [spouseAge, setSpouseAge] = useState('')
  const [spouseOccupation, setSpouseOccupation] = useState('')
  const [occupation, setOccupation] = useState('')
  const [employerType, setEmployerType] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [howLongInArea, setHowLongInArea] = useState('')
  const [faithStage, setFaithStage] = useState('')
  const [howLongAttending, setHowLongAttending] = useState('')
  const [socialStyle, setSocialStyle] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [lookingFor, setLookingFor] = useState('')
  const [hobbies, setHobbies] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [volunteerActivities, setVolunteerActivities] = useState<string[]>([])
  const [sportsLeagues, setSportsLeagues] = useState<string[]>([])
  const [favoriteSpots, setFavoriteSpots] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [children, setChildren] = useState<Partial<Child>[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setProfileId(profile.id)
        setPhotoUrl(profile.photo_url)
        setFirstName(profile.first_name ?? '')
        setLastName(profile.last_name ?? '')
        setAge(profile.age?.toString() ?? '')
        setMaritalStatus(profile.marital_status ?? '')
        setSpouseFirstName(profile.spouse_first_name ?? '')
        setSpouseAge(profile.spouse_age?.toString() ?? '')
        setSpouseOccupation(profile.spouse_occupation ?? '')
        setOccupation(profile.occupation ?? '')
        setEmployerType(profile.employer_type ?? '')
        setNeighborhood(profile.neighborhood ?? '')
        setHowLongInArea(profile.how_long_in_area ?? '')
        setFaithStage(profile.faith_stage ?? '')
        setHowLongAttending(profile.how_long_attending ?? '')
        setSocialStyle(profile.social_style ?? '')
        setAboutMe(profile.about_me ?? '')
        setLookingFor(profile.looking_for ?? '')
        setHobbies(profile.hobbies ?? [])
        setInterests(profile.interests ?? [])
        setVolunteerActivities(profile.volunteer_activities ?? [])
        setSportsLeagues(profile.sports_leagues ?? [])
        setFavoriteSpots(profile.favorite_local_spots ?? [])
        setIsActive(profile.is_active)

        const { data: kids } = await supabase.from('children').select('*').eq('profile_id', profile.id)
        setChildren(kids ?? [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  function addChild() {
    setChildren([...children, { age: 0, gender: 'boy', school: '', grade: '', activities: [], sports: [], clubs: [] }])
  }

  const completionData = {
    first_name: firstName, last_name: lastName, photo_url: photoUrl,
    age: age || null, marital_status: maritalStatus || null, occupation: occupation || null,
    neighborhood: neighborhood || null, looking_for: lookingFor || null,
    faith_stage: faithStage || null, social_style: socialStyle || null,
    hobbies, interests,
  }
  const completionPct = calculateCompletionPct(completionData, children.length > 0)

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        photo_url: photoUrl,
        age: age ? parseInt(age) : null,
        marital_status: maritalStatus || null,
        spouse_first_name: spouseFirstName || null,
        spouse_age: spouseAge ? parseInt(spouseAge) : null,
        spouse_occupation: spouseOccupation || null,
        occupation: occupation || null,
        employer_type: employerType || null,
        neighborhood: neighborhood || null,
        how_long_in_area: howLongInArea || null,
        faith_stage: faithStage || null,
        how_long_attending: howLongAttending || null,
        social_style: socialStyle || null,
        about_me: aboutMe || null,
        looking_for: lookingFor || null,
        hobbies,
        interests,
        volunteer_activities: volunteerActivities,
        sports_leagues: sportsLeagues,
        favorite_local_spots: favoriteSpots,
        is_active: isActive,
        completion_pct: completionPct,
      })
      .eq('user_id', userId)

    if (profileError) {
      setError('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    // Sync children: delete all and reinsert
    if (profileId) {
      await supabase.from('children').delete().eq('profile_id', profileId)
      const validKids = children.filter((c) => c.first_name && c.age)
      if (validKids.length > 0) {
        await supabase.from('children').insert(validKids.map((c) => ({ ...c, profile_id: profileId })))
      }
    }

    setSuccess(true)
    setSaving(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-stone-400">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-stone-900">My Profile</h1>
            <p className="text-xs text-stone-500">Keep this up to date for better matches</p>
          </div>
          <a href="/member/dashboard" className="text-sm text-stone-400 hover:text-stone-700">← Back</a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
        <CompletionMeter pct={completionPct} />

        {/* Photo */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col items-center">
          <PhotoUpload currentUrl={photoUrl} onUpload={setPhotoUrl} userId={userId} />
        </div>

        {/* Participation */}
        <div id="active" className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-stone-900">Participate in guest matching</p>
            <p className="text-xs text-stone-500">Turn off to pause without deleting your profile</p>
          </div>
          <button
            onClick={() => setIsActive(!isActive)}
            className={`w-11 h-6 rounded-full transition-colors relative ${isActive ? 'bg-indigo-600' : 'bg-stone-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-stone-900 text-sm">About you</h2>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
            <Select
              label="Marital status"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              placeholder="Select…"
              options={[
                { value: 'single', label: 'Single' },
                { value: 'married', label: 'Married' },
                { value: 'divorced', label: 'Divorced' },
                { value: 'widowed', label: 'Widowed' },
                { value: 'partnered', label: 'Partnered' },
              ]}
            />
          </div>
          {(maritalStatus === 'married' || maritalStatus === 'partnered') && (
            <div className="grid grid-cols-3 gap-3">
              <Input label="Spouse first name" value={spouseFirstName} onChange={(e) => setSpouseFirstName(e.target.value)} />
              <Input label="Spouse age" type="number" value={spouseAge} onChange={(e) => setSpouseAge(e.target.value)} />
              <Input label="Spouse occupation" value={spouseOccupation} onChange={(e) => setSpouseOccupation(e.target.value)} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. teacher, nurse" />
            <Input label="Industry / field" value={employerType} onChange={(e) => setEmployerType(e.target.value)} placeholder="e.g. healthcare, education" />
          </div>
          <Input label="Neighborhood or area" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. West Little Rock" />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="How long in the area?"
              value={howLongInArea}
              onChange={(e) => setHowLongInArea(e.target.value)}
              placeholder="Select…"
              options={[
                { value: 'less than 1 year', label: 'Less than a year' },
                { value: '1-3 years', label: '1–3 years' },
                { value: '3-5 years', label: '3–5 years' },
                { value: '5-10 years', label: '5–10 years' },
                { value: '10+ years', label: '10+ years' },
                { value: 'born and raised', label: 'Born and raised' },
              ]}
            />
            <Select
              label="Faith stage"
              value={faithStage}
              onChange={(e) => setFaithStage(e.target.value)}
              placeholder="Select…"
              options={[
                { value: 'new', label: 'Just getting started' },
                { value: 'growing', label: 'Actively growing' },
                { value: 'established', label: 'Long-time walker' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="How long attending?"
              value={howLongAttending}
              onChange={(e) => setHowLongAttending(e.target.value)}
              placeholder="Select…"
              options={[
                { value: 'less than 6 months', label: 'Less than 6 months' },
                { value: '6-12 months', label: '6–12 months' },
                { value: '1-3 years', label: '1–3 years' },
                { value: '3-5 years', label: '3–5 years' },
                { value: '5+ years', label: '5+ years' },
              ]}
            />
            <Select
              label="Social style"
              value={socialStyle}
              onChange={(e) => setSocialStyle(e.target.value)}
              placeholder="Select…"
              options={[
                { value: 'introvert', label: 'Introvert' },
                { value: 'ambivert', label: 'Ambivert' },
                { value: 'extrovert', label: 'Extrovert' },
              ]}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">A little about you</label>
            <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={3}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tell guests a bit about yourself and your family…" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-stone-700">What are you looking for?</label>
            <textarea value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} rows={2}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Families to do life with, parents to share the school run…" />
          </div>
        </div>

        {/* Interests */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-stone-900 text-sm">Interests & activities</h2>
          <TagInput label="Hobbies (at least 3)" value={hobbies} onChange={setHobbies} placeholder="e.g. golf, hiking — press Enter after each" hint="Press Enter or comma to add each one" />
          <TagInput label="Interests" value={interests} onChange={setInterests} placeholder="e.g. travel, photography" />
          <TagInput label="Volunteer activities" value={volunteerActivities} onChange={setVolunteerActivities} placeholder="e.g. food bank, youth coach" />
          <TagInput label="Sports leagues or teams" value={sportsLeagues} onChange={setSportsLeagues} placeholder="e.g. rec soccer, golf league" />
          <TagInput label="Favorite local spots" value={favoriteSpots} onChange={setFavoriteSpots} placeholder="e.g. Pinnacle Mountain, Loch Lomond" />
        </div>

        {/* Kids */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-stone-900 text-sm">Your kids</h2>
          {children.map((child, i) => (
            <ChildForm
              key={i}
              child={child}
              index={i}
              onChange={(data) => {
                const next = [...children]; next[i] = data; setChildren(next)
              }}
              onRemove={() => setChildren(children.filter((_, idx) => idx !== i))}
            />
          ))}
          <Button type="button" variant="outline" onClick={addChild}>+ Add a child</Button>
        </div>

        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">Profile saved!</div>}

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </main>
    </div>
  )
}
