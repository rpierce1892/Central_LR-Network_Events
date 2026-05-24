'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface AcceptDeclineButtonsProps {
  matchId: string
  spotsLeft: number
}

export function AcceptDeclineButtons({ matchId, spotsLeft }: AcceptDeclineButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function respond(action: 'accept' | 'decline') {
    setLoading(action)
    setError(null)

    const res = await fetch(`/api/matches/${matchId}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(null)
      return
    }

    if (action === 'accept') {
      router.push(`/member/chat/${matchId}`)
    } else {
      router.push('/member/dashboard')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {spotsLeft === 1 && (
        <p className="text-xs text-stone-500 text-center">
          One other member has already connected with this guest. There&apos;s one spot remaining.
        </p>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button
        onClick={() => respond('accept')}
        disabled={loading !== null}
        className="w-full"
        size="lg"
      >
        {loading === 'accept' ? 'Accepting…' : '✓ Connect with this guest'}
      </Button>
      <Button
        onClick={() => respond('decline')}
        disabled={loading !== null}
        variant="outline"
        className="w-full"
      >
        {loading === 'decline' ? 'Declining…' : 'Not a fit right now'}
      </Button>
      <p className="text-xs text-stone-400 text-center">
        Declining is completely fine — we&apos;ll continue looking for the right connection.
      </p>
    </div>
  )
}
