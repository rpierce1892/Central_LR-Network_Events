'use client'

import { useState } from 'react'
import type { CriteriaType, StarredCriterion } from '@/lib/types'
import { Button } from '@/components/ui/Button'

const CRITERIA_OPTIONS: { type: CriteriaType; label: string; placeholder: string }[] = [
  { type: 'child_age', label: 'Child age (e.g. 12)', placeholder: 'Enter age' },
  { type: 'child_gender', label: 'Child gender', placeholder: 'boy / girl' },
  { type: 'child_school', label: 'Child school name', placeholder: 'School name' },
  { type: 'parent_age', label: 'Parent age (approx)', placeholder: 'e.g. 42' },
  { type: 'neighborhood', label: 'Neighborhood / area', placeholder: 'e.g. West Little Rock' },
  { type: 'hobby', label: 'Shared hobby', placeholder: 'e.g. golf' },
  { type: 'faith_stage', label: 'Faith stage', placeholder: 'new / growing / established' },
]

interface StarredCriteriaProps {
  value: Omit<StarredCriterion, 'id' | 'guest_profile_id'>[]
  onChange: (criteria: Omit<StarredCriterion, 'id' | 'guest_profile_id'>[]) => void
}

export function StarredCriteria({ value, onChange }: StarredCriteriaProps) {
  const [type, setType] = useState<CriteriaType>('child_age')
  const [val, setVal] = useState('')

  const canAdd = value.length < 3

  function add() {
    if (!val.trim() || !canAdd) return
    const next = [
      ...value,
      { criteria_type: type, criteria_value: val.trim(), priority: (value.length + 1) as 1 | 2 | 3 },
    ]
    onChange(next)
    setVal('')
  }

  function remove(index: number) {
    const next = value
      .filter((_, i) => i !== index)
      .map((c, i) => ({ ...c, priority: (i + 1) as 1 | 2 | 3 }))
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-stone-700 mb-1">
          Priority matching criteria <span className="text-stone-400 font-normal">(up to 3)</span>
        </p>
        <p className="text-xs text-stone-500 mb-3">
          Star the things that matter most to you. These carry extra weight in finding your match.
        </p>
      </div>

      {value.map((c, i) => (
        <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-amber-500 text-base">★</span>
          <span className="text-sm text-stone-700 flex-1">
            <span className="font-medium capitalize">{c.criteria_type.replace('_', ' ')}</span>:{' '}
            {c.criteria_value}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-stone-400 hover:text-red-500 text-xs"
          >
            ✕
          </button>
        </div>
      ))}

      {canAdd && (
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CriteriaType)}
            className="rounded-lg border border-stone-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {CRITERIA_OPTIONS.map((opt) => (
              <option key={opt.type} value={opt.type}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={CRITERIA_OPTIONS.find((o) => o.type === type)?.placeholder}
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          />
          <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!val.trim()}>
            ★ Add
          </Button>
        </div>
      )}

      {!canAdd && (
        <p className="text-xs text-stone-500">You've added 3 priority criteria (maximum).</p>
      )}
    </div>
  )
}
