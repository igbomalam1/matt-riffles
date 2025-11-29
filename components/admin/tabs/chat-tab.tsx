"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Send } from "lucide-react"

interface ChatSession {
  session_id: string
  sender_name: string
  sender_email: string
  message_count: number
  last_message: string
  last_message_date: string
}

interface ChatMessage {
  id: string
  message: string
  is_admin: boolean
  created_at: string
}

export function ChatTab() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [subscribedSessionId, setSubscribedSessionId] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel("admin_sessions")
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          fetchSessions()
        },
      )
      .subscribe()
    return () => {
      try {
        supabase.removeChannel(ch)
      } catch {}
    }
  }, [])

  const fetchSessions = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: false })

    if (data) {
      // Group messages by session
      const sessionMap = new Map<string, ChatSession>()

      data.forEach((msg) => {
        if (!sessionMap.has(msg.session_id)) {
          sessionMap.set(msg.session_id, {
            session_id: msg.session_id,
            sender_name: msg.sender_name,
            sender_email: msg.sender_email,
            message_count: 1,
            last_message: msg.message,
            last_message_date: msg.created_at,
          })
        } else {
          const session = sessionMap.get(msg.session_id)!
          session.message_count++
        }
      })

      setSessions(Array.from(sessionMap.values()))
    }
    setIsLoading(false)
  }

  const openChat = async (session: ChatSession) => {
    setSelectedSession(session)

    const supabase = createClient()
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", session.session_id)
      .order("created_at", { ascending: true })

    if (data) {
      setMessages(data)
    }

    setSubscribedSessionId(session.session_id)
  }

  const sendReply = async () => {
    if (!newMessage.trim() || !selectedSession) return

    setIsSending(true)
    const supabase = createClient()

    const { error } = await supabase.from("chat_messages").insert({
      session_id: selectedSession.session_id,
      sender_name: "Admin",
      sender_email: "admin@matt.com",
      message: newMessage,
      is_admin: true,
    })

    if (!error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          message: newMessage,
          is_admin: true,
          created_at: new Date().toISOString(),
        },
      ])
      setNewMessage("")

      const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || ""
      if (key) {
        try {
          await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_key: key,
              subject: `Reply from Matt's Team`,
              from_name: "Matt's Team",
              email: selectedSession.sender_email,
              message: newMessage,
            }),
          })
        } catch {}
      }
    }
    setIsSending(false)
  }

  useEffect(() => {
    const supabase = createClient()
    if (!subscribedSessionId) return
    const ch = supabase
      .channel(`admin_chat_${subscribedSessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${subscribedSessionId}` },
        (payload: any) => {
          const msg = payload.new
          setMessages((prev) => [
            ...prev,
            { id: msg.id, message: msg.message, is_admin: msg.is_admin, created_at: msg.created_at },
          ])
        },
      )
      .subscribe()
    return () => {
      try {
        supabase.removeChannel(ch)
      } catch {}
    }
  }, [subscribedSessionId])

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Chat Messages</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Last Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No chat messages yet
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell className="font-medium">{session.sender_name}</TableCell>
                  <TableCell>{session.sender_email}</TableCell>
                  <TableCell>{session.message_count}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{session.last_message}</TableCell>
                  <TableCell>{new Date(session.last_message_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => openChat(session)}
                      className="bg-gold hover:bg-gold-deep text-black"
                    >
                      View Chat
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Chat Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-lg h-[600px] flex flex-col bg-white">
          <DialogHeader>
            <DialogTitle>Chat with {selectedSession?.sender_name}</DialogTitle>
            <p className="text-sm text-muted-foreground">{selectedSession?.sender_email}</p>
          </DialogHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-secondary rounded-lg">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    msg.is_admin ? "bg-gold text-black" : "bg-white text-foreground"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs opacity-70 mt-1">{new Date(msg.created_at).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Input */}
          <div className="flex gap-2 pt-4 border-t">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a reply..."
              onKeyDown={(e) => e.key === "Enter" && sendReply()}
            />
            <Button
              onClick={sendReply}
              disabled={isSending || !newMessage.trim()}
              className="bg-gold hover:bg-gold-deep text-black"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
