"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageCircle, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Message {
  id: string
  text: string
  isAdmin: boolean
  timestamp: Date
}

interface UserInfo {
  name: string
  email: string
  sessionId: string
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [showRegistration, setShowRegistration] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [threads, setThreads] = useState<{
    sessionId: string
    name: string
    email: string
    lastAt: number
    lastPreview: string
    unread: number
    messagesCount: number
  }[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showThreads, setShowThreads] = useState(false)

  const [registrationForm, setRegistrationForm] = useState({
    name: "",
    email: "",
  })

  // Check for existing session
  useEffect(() => {
    const storedUser = localStorage.getItem("chatUserInfo")
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser))
    }

    const storedThreads = localStorage.getItem("chatThreads")
    if (storedThreads) {
      const t = JSON.parse(storedThreads)
      setThreads(Array.isArray(t) ? t : [])
    }
    const storedActive = localStorage.getItem("chatActiveSessionId")
    if (storedActive) {
      setActiveSessionId(storedActive)
      const ms = localStorage.getItem(`chatMessages_${storedActive}`)
      if (ms) setMessages(JSON.parse(ms))
      const draft = localStorage.getItem(`chatDraft_${storedActive}`)
      if (draft) setNewMessage(draft)
    }

    const storedOpen = localStorage.getItem("chatIsOpen")
    if (storedOpen === "true") {
      setIsOpen(true)
    }
    const autoFlag = localStorage.getItem("chatHasShownAutoOpen")
    if (!autoFlag) {
      setIsOpen(true)
      localStorage.setItem("chatHasShownAutoOpen", "true")
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Poll for new messages
  useEffect(() => {
    if (!userInfo || !activeSessionId) return

    const fetchMessages = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", activeSessionId)
        .order("created_at", { ascending: true })

      if (data) {
        const formattedMessages = data.map((msg) => ({
          id: msg.id,
          text: msg.message,
          isAdmin: msg.is_admin,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(formattedMessages)
        localStorage.setItem(`chatMessages_${activeSessionId}`, JSON.stringify(formattedMessages))
        const preview = formattedMessages.length ? formattedMessages[formattedMessages.length - 1].text : ""
        const lastAt = formattedMessages.length ? formattedMessages[formattedMessages.length - 1].timestamp.getTime() : Date.now()
        setThreads((prev) => {
          const idx = prev.findIndex((t) => t.sessionId === activeSessionId)
          const next = [...prev]
          if (idx >= 0) {
            next[idx] = {
              ...next[idx],
              lastAt,
              lastPreview: preview,
              messagesCount: formattedMessages.length,
              unread: isOpen ? 0 : next[idx].unread,
            }
          }
          localStorage.setItem("chatThreads", JSON.stringify(next))
          return next
        })
      }
    }

    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [userInfo, activeSessionId, isOpen])

  const handleOpenChat = () => {
    setIsOpen(true)
    if (!userInfo) {
      setShowRegistration(true)
    }
    if (threads.length > 0) {
      setShowThreads(false)
    }
  }

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault()
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newUserInfo: UserInfo = {
      name: registrationForm.name,
      email: registrationForm.email,
      sessionId,
    }
    setUserInfo(newUserInfo)
    localStorage.setItem("chatUserInfo", JSON.stringify(newUserInfo))
    setShowRegistration(false)
    setRegistrationForm({ name: "", email: "" })
    setActiveSessionId(sessionId)
    localStorage.setItem("chatActiveSessionId", sessionId)
    setThreads((prev) => {
      const next = [
        ...prev,
        { sessionId, name: newUserInfo.name, email: newUserInfo.email, lastAt: Date.now(), lastPreview: "", unread: 0, messagesCount: 0 },
      ]
      localStorage.setItem("chatThreads", JSON.stringify(next))
      return next
    })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !userInfo || !activeSessionId) return

    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase.from("chat_messages").insert({
      session_id: activeSessionId,
      sender_name: userInfo.name,
      sender_email: userInfo.email,
      message: newMessage,
      is_admin: false,
    })

    if (!error) {
      const newMsg: Message = {
        id: Date.now().toString(),
        text: newMessage,
        isAdmin: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, newMsg])
      const nextMsgs = [...messages, newMsg]
      localStorage.setItem(`chatMessages_${activeSessionId}`, JSON.stringify(nextMsgs))
      setThreads((prev) => {
        const idx = prev.findIndex((t) => t.sessionId === activeSessionId)
        const next = [...prev]
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            lastAt: Date.now(),
            lastPreview: newMessage,
            messagesCount: (next[idx].messagesCount || 0) + 1,
            unread: 0,
          }
        }
        localStorage.setItem("chatThreads", JSON.stringify(next))
        return next
      })

      const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY || ""
      if (key) {
        try {
          await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_key: key,
              subject: `New chat message from ${userInfo.name}`,
              from_name: userInfo.name,
              email: userInfo.email,
              message: newMessage,
            }),
          })
        } catch {}
      }
    }

    setNewMessage("")
    setIsLoading(false)
  }

  useEffect(() => {
    localStorage.setItem("chatIsOpen", isOpen ? "true" : "false")
  }, [isOpen])

  useEffect(() => {
    if (activeSessionId) localStorage.setItem(`chatDraft_${activeSessionId}`, newMessage)
  }, [newMessage, activeSessionId])

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread || 0), 0)
  const switchThread = (sid: string) => {
    setActiveSessionId(sid)
    localStorage.setItem("chatActiveSessionId", sid)
    const ms = localStorage.getItem(`chatMessages_${sid}`)
    setMessages(ms ? JSON.parse(ms) : [])
    setShowThreads(false)
    setThreads((prev) => {
      const idx = prev.findIndex((t) => t.sessionId === sid)
      const next = [...prev]
      if (idx >= 0) next[idx] = { ...next[idx], unread: 0 }
      localStorage.setItem("chatThreads", JSON.stringify(next))
      return next
    })
  }
  const startNewChat = () => {
    if (!userInfo) {
      setShowRegistration(true)
      return
    }
    const sid = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`
    setActiveSessionId(sid)
    localStorage.setItem("chatActiveSessionId", sid)
    setMessages([])
    setThreads((prev) => {
      const next = [
        { sessionId: sid, name: userInfo.name, email: userInfo.email, lastAt: Date.now(), lastPreview: "", unread: 0, messagesCount: 0 },
        ...prev,
      ]
      localStorage.setItem("chatThreads", JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    const supabase = createClient()
    const channels: unknown[] = []
    if (activeSessionId) {
      const ch = supabase
        .channel(`chat_${activeSessionId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${activeSessionId}` },
          (payload: any) => {
            const msg = payload.new
            const m = { id: msg.id, text: msg.message, isAdmin: msg.is_admin, timestamp: new Date(msg.created_at) }
            setMessages((prev) => {
              const next = [...prev, m]
              localStorage.setItem(`chatMessages_${activeSessionId}`, JSON.stringify(next))
              return next
            })
          },
        )
        .subscribe()
      channels.push(ch)
    }
    threads.forEach((t) => {
      if (!activeSessionId || t.sessionId !== activeSessionId) {
        const ch = supabase
          .channel(`thread_${t.sessionId}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${t.sessionId}` },
            (payload: any) => {
              const msg = payload.new
              const preview = msg.message
              const ts = new Date(msg.created_at).getTime()
              setThreads((prev) => {
                const idx = prev.findIndex((x) => x.sessionId === t.sessionId)
                const next = [...prev]
                if (idx >= 0) {
                  const inc = isOpen && activeSessionId === t.sessionId ? 0 : 1
                  next[idx] = {
                    ...next[idx],
                    lastPreview: preview,
                    lastAt: ts,
                    unread: (next[idx].unread || 0) + inc,
                    messagesCount: (next[idx].messagesCount || 0) + 1,
                  }
                }
                localStorage.setItem('chatThreads', JSON.stringify(next))
                return next
              })
            },
          )
          .subscribe()
        channels.push(ch)
      }
    })

    return () => {
      channels.forEach((ch: any) => {
        try {
          supabase.removeChannel(ch)
        } catch {}
      })
    }
  }, [activeSessionId, threads, isOpen])

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={handleOpenChat}
        aria-label="Open chat"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="fixed bottom-4 right-4 left-auto sm:bottom-6 sm:right-6 z-[9999] pointer-events-auto bg-black text-white border border-gold/70 hover:border-gold-deep rounded-full h-12 w-auto px-4 sm:h-14 sm:px-5 inline-flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gold-deep outline-none"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="text-sm font-semibold">Chat</span>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-urgent text-white text-[10px] leading-none px-1.5 py-[2px] rounded-full">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Chat Widget */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col p-0 bg-white">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <span>Chat with Matt&apos;s Team</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowThreads((s) => !s)}>
                  {showThreads ? "Close" : "Recent"}
                </Button>
                <Button variant="outline" size="sm" onClick={startNewChat}>
                  New Chat
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {userInfo && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-b">
              Tracking ID: {userInfo.name} · {userInfo.email}. Keep this safe to continue your chat.
            </div>
          )}

          {showRegistration ? (
            <div className="p-4 flex-1 flex items-center">
              <form onSubmit={handleRegistration} className="w-full space-y-4">
                <div>
                  <Label htmlFor="chat-name">Name</Label>
                  <Input
                    id="chat-name"
                    value={registrationForm.name}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        name: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="chat-email">Email</Label>
                  <Input
                    id="chat-email"
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) =>
                      setRegistrationForm({
                        ...registrationForm,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-gold hover:bg-gold-deep text-black">
                  Start Chat
                </Button>
              </form>
            </div>
          ) : (
            <>
              {showThreads && (
                <div className="p-3 border-b max-h-40 overflow-y-auto space-y-2">
                  {threads.length === 0 && <p className="text-sm text-muted-foreground">No previous chats</p>}
                  {threads.map((t) => (
                    <button
                      key={t.sessionId}
                      onClick={() => switchThread(t.sessionId)}
                      className={`w-full text-left px-3 py-2 rounded ${
                        t.sessionId === activeSessionId ? "bg-secondary" : "hover:bg-secondary"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{t.lastPreview || "(no messages)"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(t.lastAt).toLocaleDateString()}</span>
                      </div>
                      {t.unread > 0 && <span className="text-xs text-urgent">{t.unread} unread</span>}
                    </button>
                  ))}
                </div>
              )}
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm">Send a message to start the conversation</p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isAdmin ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-lg ${
                        msg.isAdmin ? "bg-gray-100 text-foreground" : "bg-gold text-black"
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-70 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gold hover:bg-gold-deep text-black"
                  disabled={isLoading || !newMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
