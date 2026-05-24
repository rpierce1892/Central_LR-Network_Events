'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TagInput } from '@/components/profile/TagInput'
import { ChildForm } from '@/components/profile/ChildForm'
import { PhotoUpload } from '@/components/profile/PhotoUpload'
import { StarredCriteria } from '@/components/profile/StarredCriteria'
import type { Child, StarredCriterion } from '@/lib/types'

const STEPS = ['About you', 'Your family', 'Interests', 'What matters most', 'Review']

export default function GuestProfilePage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Profile fields
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [age, setAge] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('')
  const [spouseFirstName, setSpouseFirstName] = useState('')
  const [spouseAge, setSpouseAge] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [howLongInArea, setHowLongInArea] = useState('')
  const [occupation, setOccupation] = useState('')
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
  const [children, setChildren] = useState<Partial<Child>[]>([])
  const [starredCriteria, setStarredCriteria] = useState<
    Omit<StarredCriterion, 'id' | 'guest_profile_id'>[]
  >([])

  // Load user id once
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  function addChild() {
    setChildren([...children, { age: 0, gender: 'boy', school: '', grade: '', activities: [], sports: [], clubs: [] }])
  }

  async function handleSubmit() {
    if (!userId) return
    if (!photoUrl) {
      setError('Please add a photo so people can recognize you.')
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()

    // Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        photo_url: photoUrl,
        age: age ? parseInt(age) : null,
        marital_status: maritalStatus || null,
        spouse_first_name: spouseFirstName || null,
        spouse_age: spouseAge ? parseInt(spouseAge) : null,
        neighborhood: neighborhood || null,
        how_long_in_area: howLongInArea || null,
        occupation: occupation || null,
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
      })
      .eq('user_id', userId)
      .select('id')
      .single()

    if (profileError || !profile) {
      setError('Failed to save profile. Please try again.')
      setSaving(false)
      return
    }

    // Insert children
    if (children.length > 0) {
      const validKids = children.filter((c) => c.first_name && c.age)
      if (validKids.length > 0) {
        await supabase.from('children').insert(
          validKids.map((c) => ({ ...c, profile_id: profile.id }))
        )
      }
    }

    // Insert starred criteria
    if (starredCriteria.length > 0) {
      await supabase.from('starred_criteria').insert(
        starredCriteria.map((c) => ({ ...c, guest_profile_id: profile.id }))
      )
    }

    // Trigger matching
    await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestProfileId: profile.id }),
    })

    router.push('/guest/pending')
  }

  const steps = [
    // Step 0: About you
    <div key="about" className="flex flex-col gap-4">
      {userId && (
        <PhotoUpload currentUrl={photoUrl} onUpload={setPhotoUrl} userId={userId} />
      )}
      <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
      <Input label="Your age" type="number" min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} />
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
      {(maritalStatus === 'married' || maritalStatus === 'partnered') && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Spouse first name" value={spouseFirstName} onChange={(e) => setSpouseFirstName(e.target.value)} />
          <Input label="Spouse age" type="number" value={spouseAge} onChange={(e) => setSpouseAge(e.target.value)} />
        </div>
      )}
      <Input label="Neighborhood or area of town" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="e.g. West Little Rock, Chenal" />
      <Select
        label="How long have you lived in the area?"
        value={howLongInArea}
        onChange={(e) => setHowLongInArea(e.target.value)}
        placeholder="Select…"
        options={[
          { value: 'less than 1 year', label: 'Less than a year' },
          { value: '1-3 years', label: '1–3 years' },
          { value: '3-5 years', label: '3–5 years' },
          { value: '5-10 years', label: '5–10 years' },
          { value: '10+ years', label: '10+ years' },
          { value: 'born and raised', label: 'Born and raised here' },
        ]}
      />
      <Input label="Occupation or field of work" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. teacher, contractor, nurse" />
      <Select
        label="Where are you in your faith journey?"
        value={faithStage}
        onChange={(e) => setFaithStage(e.target.value)}
        placeholder="Select…"
        options={[
          { value: 'new', label: "I'm just getting started" },
          { value: 'growing', label: "I'm actively growing" },
          { value: 'established', label: "I've been walking this road for a while" },
        ]}
      />
      <Select
        label="How long have you been attending?"
        value={howLongAttending}
        onChange={(e) => setHowLongAttending(e.target.value)}
        placeholder="Select…"
        options={[
          { value: 'first visit', label: 'This was my first visit' },
          { value: '2-4 visits', label: "I've been a few times" },
          { value: 'a few months', label: 'A few months' },
          { value: 'less than a year', label: 'Less than a year' },
        ]}
      />
    </div>,

    // Step 1: Family
    <div key="family" className="flex flex-col gap-4">
      <p className="text-sm text-stone-500">
        Tell us about your kids. This helps us match you with families in a similar stage of life.
      </p>
      {children.map((child, i) => (
        <ChildForm
          key={i}
          child={child}
          index={i}
          onChange={(data) => {
            const next = [...children]
            next[i] = data
            setChildren(next)
          }}
          onRemove={() => setChildren(children.filter((_, idx) => idx !== i))}
        />
      ))}
      <Button type="button" variant="outline" onClick={addChild}>
        + Add a child
      </Button>
      {children.length === 0 && (
        <p className="text-xs text-stone-400 text-center">
          No kids at home? That&apos;s fine — we can match you with others in a similar season.
        </p>
      )}
    </div>,

    // Step 2: Interests
    <div key="interests" className="flex flex-col gap-4">
      <p className="text-sm text-stone-500">
        The more you share, the better your match will be. Add as many as you like.
      </p>
      <TagInput label="Hobbies" value={hobbies} onChange={setHobbies} placeholder="e.g. golf, hiking, cooking — press Enter after each" hint="Press Enter or comma to add each one" />
      <TagInput label="Interests & passions" value={interests} onChange={setInterests} placeholder="e.g. travel, photography, music" />
      <TagInput label="Volunteer activities" value={volunteerActivities} onChange={setVolunteerActivities} placeholder="e.g. food bank, youth sports coach" />
      <TagInput label="Sports leagues or recreational teams" value={sportsLeagues} onChange={setSportsLeagues} placeholder="e.g. rec soccer, golf league" />
      <TagInput label="Favorite local spots" value={favoriteSpots} onChange={setFavoriteSpots} placeholder="e.g. Pinnacle Mountain, Loch Lomond" />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">A little about you</label>
        <textarea
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          rows={3}
          placeholder="Anything else you'd like to share about yourself or your family…"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-stone-700">What are you looking for?</label>
        <textarea
          value={lookingFor}
          onChange={(e) => setLookingFor(e.target.value)}
          rows={2}
          placeholder="e.g. Families to hang out with on weekends, parents to swap school pickups with…"
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>,

    // Step 3: Starred criteria
    <div key="starred" className="flex flex-col gap-4">
      <StarredCriteria value={starredCriteria} onChange={setStarredCriteria} />
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        <strong>Remember:</strong> This is a starting point — real relationships can&apos;t be captured on paper, but we hope this helps you find your people.
      </div>
    </div>,

    // Step 4: Review
    <div key="review" className="flex flex-col gap-4">
      <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3 text-sm text-indigo-800">
        <p className="font-semibold mb-1">You&apos;re all set!</p>
        <p>Once you submit, we&apos;ll quietly connect you with some families from our church who have a lot in common with yours. You&apos;ll hear from someone by mid-week — there&apos;s no need to check back.</p>
      </div>
      {!photoUrl && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Please go back and add a photo — it helps people recognize you at church.
        </div>
      )}
      {starredCriteria.length === 0 && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          You haven&apos;t starred any priority criteria. That&apos;s okay — we&apos;ll still find great matches based on your whole profile.
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>,
  ]

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <header className="bg-white border-b border-stone-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-bold text-stone-900">Church Connect</h1>
          <p className="text-xs text-stone-500">Your connection profile</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-stone-200 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1 mb-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-indigo-500' : 'bg-stone-200'}`}
              />
            ))}
          </div>
          <p className="text-xs text-stone-500">
            Step {step + 1} of {STEPS.length}: <span className="font-medium text-stone-700">{STEPS[step]}</span>
          </p>
        </div>
      </div>

      <main className="flex-1 px-4 py-6">
        <div className="max-w-lg mx-auto">
          {steps[step]}
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200 px-4 py-4 sticky bottom-0">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !firstName}
            >
              Continue
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={saving || !photoUrl}
            >
              {saving ? 'Submitting…' : 'Submit my profile'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
