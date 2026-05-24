'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message } from '@/lib/types'
import { Button } from '@/components/ui/Button'

const CONVERSATION_STARTERS = [
  "Hi! I heard you visited our church recently — I think our families might have a lot in common. Would love to connect!",
  "Hey! I saw your profile and noticed our kids are around the same age. We'd love to meet your family!",
  "Hi there! Looking forward to meeting you at church. Where do you usually sit? We can try to find each other.",
  "Welcome to our church family! Are you planning to be there this Sunday? We'd love to introduce ourselves.",
]

interface ChatWindowProps {
  matchId: string
  currentUserId: string
  guestFirstName: string
  memberFirstName: string
  initialMessages: Message[]
}

export function ChatWindow({
  matchId,
  currentUserId,
  guestFirstName,
  memberFirstName,
  initialMessages,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showStarters, setShowStarters] = useState(initialMessages.length === 0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(content: string) {
    if (!content.trim() || sending) return
    setSending(true)
    setShowStarters(false)

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: currentUserId,
      content: content.trim(),
    })

    if (!error) setInput('')
    setSending(false)
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-stone-400 py-8">
            No messages yet. Say hello! 👋
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  isMe
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-white border border-stone-200 text-stone-800 rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-stone-400'}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Conversation starters */}
      {showStarters && (
        <div className="px-4 py-2 border-t border-stone-100">
          <p className="text-xs text-stone-400 mb-2">Suggested openers:</p>
          <div className="flex flex-col gap-1.5">
            {CONVERSATION_STARTERS.map((starter, i) => (
              <button
                key={i}
                onClick={() => send(starter)}
                className="text-left text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-stone-200 bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-stone-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button
          onClick={() => send(input)}
          disabled={!input.trim() || sending}
          size="sm"
          className="rounded-full px-4"
        >
          Send
        </Button>
      </div>
    </div>
  )
}
