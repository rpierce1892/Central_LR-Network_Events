'use client'

import { KeyboardEvent, useState } from 'react'

interface TagInputProps {
  label?: string
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  hint?: string
}

export function TagInput({ label, value, onChange, placeholder, hint }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag() {
    const trimmed = input.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-stone-700">{label}</label>}
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-stone-300 px-3 py-2 min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs rounded-full px-2 py-0.5"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
              ✕
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={addTag}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder:text-stone-400"
        />
      </div>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
    </div>
  )
}
