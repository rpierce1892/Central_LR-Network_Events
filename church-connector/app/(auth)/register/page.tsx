'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError || !data.user) {
      setError(authError?.message ?? 'Registration failed. Please try again.')
      setLoading(false)
      return
    }

    const role = token ? 'guest' : 'member'
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: data.user.id,
      first_name: firstName,
      role,
      invite_token: token,
    })

    if (profileError) {
      setError('Account created but profile setup failed. Please contact the church office.')
      setLoading(false)
      return
    }

    router.push(token ? '/guest/profile/new' : '/member/profile/edit')
    router.refresh()
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-stone-900">
          {token ? 'Welcome to our church!' : 'Create your account'}
        </h1>
        <p className="text-stone-500 mt-1 text-sm">
          {token
            ? "Let's set up your connection profile so we can introduce you to some great families."
            : 'Join our member community and help welcome new guests.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          autoComplete="given-name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters"
          required
        />
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="text-center text-sm text-stone-500 mt-4">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div className="h-64 animate-pulse bg-stone-100 rounded-2xl" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
