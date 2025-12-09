"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"

type OrderItem = {
  type: string
  name: string
  price: number
  quantity: number
  size?: string
  format?: string
  cardId?: string
  showId?: string
  showDate?: string
  venue?: string
}

type OrderStatus = "pending" | "approved" | "rejected" | "shipped" | "completed"

type StatusEvent = { status: OrderStatus; timestamp: string; comment?: string | null; actor?: string | null }

type OrderResponse = {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  shipping_address: string
  items: OrderItem[]
  total_amount: number
  payment_method: string
  payment_details: Record<string, unknown> | null
  status: OrderStatus
  created_at: string
  updated_at?: string | null
  status_history?: StatusEvent[] | null
  admin_comments?: string | null
}

function TrackOrderContent() {
  const params = useSearchParams()
  const initialOrder = params.get("order") || ""
  const [orderId, setOrderId] = useState(initialOrder)
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [open, setOpen] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  const statusColor = (s: OrderStatus) =>
    s === "approved" || s === "completed" ? "text-green-600" : s === "rejected" ? "text-red-600" : "text-yellow-600"

  const fetchOrder = async (orderNumber: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/track?order_number=${encodeURIComponent(orderNumber)}`)
      if (!res.ok) throw new Error("Not found")
      const json = await res.json()
      setOrder(json.order || null)
      setOpen(true)
    } catch {
      setOrder(null)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialOrder) fetchOrder(initialOrder)
  }, [initialOrder])

  useEffect(() => {
    if (!order?.order_number) return
    const channel = supabase
      .channel(`order_${order.order_number}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `order_number=eq.${order.order_number}` }, (payload) => {
        const updated = payload.new as any
        setOrder((prev) => (prev ? { ...prev, status: updated.status, updated_at: updated.updated_at, status_history: updated.status_history || prev.status_history } : prev))
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [order?.order_number, supabase])

  return (
      <main className="min-h-screen bg-secondary">
        <div className="container mx-auto max-w-xl px-4 py-16">
          <h1 className="text-2xl font-bold mb-4">Track Your Order</h1>
          <p className="text-sm text-muted-foreground mb-6">Enter your order ID to check the latest status.</p>
          <div className="flex gap-2">
            <Input placeholder="Enter Order/Tracking ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <Button onClick={() => fetchOrder(orderId)} disabled={!orderId.trim() || loading} className="shrink-0">
              {loading ? "Checking..." : "Check Status"}
            </Button>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Order Status</DialogTitle>
            </DialogHeader>
            {!order ? (
              <div className="p-4">
                <p className="text-sm text-red-600">Order not found. Please confirm your ID and try again.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Order ID</p>
                    <p className="font-mono text-sm">{order.order_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Purchase Date</p>
                    <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Status</p>
                    <p className={`text-sm font-semibold ${statusColor(order.status)}`}>{order.status.toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last Update</p>
                    <p className="text-sm">{order.updated_at ? new Date(order.updated_at).toLocaleString() : "—"}</p>
                  </div>
                </div>

                {order.status === "rejected" && (
                  <div className="rounded border border-red-200 bg-red-50 p-3">
                    <p className="text-sm text-red-700">Transaction failed. Please replace your order.</p>
                    {order.admin_comments && (
                      <p className="text-xs text-red-600 mt-1">{order.admin_comments}</p>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Items</p>
                  <div className="rounded border">
                    <ul className="divide-y">
                      {order.items.map((it, idx) => (
                        <li key={idx} className="p-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{it.name}</span>
                            <span>${it.price} × {it.quantity}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {it.size && <span>Size: {it.size} · </span>}
                            {it.format && <span>Format: {it.format} · </span>}
                            {it.venue && <span>Venue: {it.venue} · </span>}
                            {it.showDate && <span>Date: {new Date(it.showDate).toLocaleDateString()}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {order.status_history && order.status_history.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Status History</p>
                    <div className="rounded border p-3 space-y-2">
                      {order.status_history.map((ev, i) => (
                        <div key={i} className="text-sm">
                          <span className={`font-semibold ${statusColor(ev.status)}`}>{ev.status.toUpperCase()}</span>
                          <span className="ml-2 text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</span>
                          {ev.comment && <span className="ml-2">— {ev.comment}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.admin_comments && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Admin Comments</p>
                    <div className="rounded border p-3 text-sm">{order.admin_comments}</div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-secondary"><div className="container mx-auto max-w-xl px-4 py-16">Loading...</div></main>}>
      <TrackOrderContent />
    </Suspense>
  )
}
