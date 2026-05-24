'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface AssignMemberFormProps {
  guestId: string
  guestFirstName: string
  members: { id: string; first_name: string; neighborhood: string | null }[]
  existingMemberIds: string[]
}

export function AssignMemberForm({ guestId, guestFirstName, members, existingMemberIds }: AssignMemberFormProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const available = members.filter((m) => !existingMemberIds.includes(m.id))

  async function assign() {
    if (!selectedId) return
    setSaving(true)
    setError(null)

    const res = await fetch('/api/leader/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestProfileId: guestId, memberProfileId: selectedId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Assignment failed.')
      setSaving(false)
      return
    }

    router.refresh()
    setSelectedId('')
    setSaving(false)
  }

  if (available.length === 0) {
    return <p className="text-sm text-stone-400">No additional active members available for assignment.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <option value="">Select a member…</option>
        {available.map((m) => (
          <option key={m.id} value={m.id}>
            {m.first_name}{m.neighborhood ? ` · ${m.neighborhood}` : ''}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button onClick={assign} disabled={!selectedId || saving} size="sm" variant="outline">
        {saving ? 'Assigning…' : `Assign to ${guestFirstName}`}
      </Button>
    </div>
  )
}
