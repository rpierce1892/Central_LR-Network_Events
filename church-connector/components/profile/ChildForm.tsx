'use client'

import { useState } from 'react'
import type { Child } from '@/lib/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { TagInput } from './TagInput'

interface ChildFormProps {
  child: Partial<Child>
  index: number
  onChange: (data: Partial<Child>) => void
  onRemove: () => void
}

export function ChildForm({ child, index, onChange, onRemove }: ChildFormProps) {
  return (
    <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-stone-700">Child {index + 1}</h4>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-stone-400 hover:text-red-500"
        >
          Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          value={child.first_name ?? ''}
          onChange={(e) => onChange({ ...child, first_name: e.target.value })}
          placeholder="First name only"
        />
        <Input
          label="Age"
          type="number"
          min={0}
          max={25}
          value={child.age ?? ''}
          onChange={(e) => onChange({ ...child, age: parseInt(e.target.value) || 0 })}
        />
        <Select
          label="Gender"
          value={child.gender ?? ''}
          onChange={(e) => onChange({ ...child, gender: e.target.value as Child['gender'] })}
          placeholder="Select gender"
          options={[
            { value: 'boy', label: 'Boy' },
            { value: 'girl', label: 'Girl' },
            { value: 'nonbinary', label: 'Non-binary' },
          ]}
        />
        <Input
          label="Grade"
          value={child.grade ?? ''}
          onChange={(e) => onChange({ ...child, grade: e.target.value })}
          placeholder="e.g. 7th grade"
        />
      </div>

      <div className="mt-3">
        <Input
          label="School"
          value={child.school ?? ''}
          onChange={(e) => onChange({ ...child, school: e.target.value })}
          placeholder="School name"
          hint="This helps match families whose kids go to the same school"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <TagInput
          label="Sports"
          value={child.sports ?? []}
          onChange={(sports) => onChange({ ...child, sports })}
          placeholder="Add a sport and press Enter"
        />
        <TagInput
          label="Activities & clubs"
          value={[...(child.activities ?? []), ...(child.clubs ?? [])]}
          onChange={(tags) => onChange({ ...child, activities: tags, clubs: [] })}
          placeholder="Add an activity and press Enter"
        />
      </div>
    </div>
  )
}
