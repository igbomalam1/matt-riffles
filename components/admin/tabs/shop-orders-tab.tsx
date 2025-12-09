"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/types"

export function ShopOrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [comment, setComment] = useState("")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders")
    if (res.ok) {
      const json = await res.json()
      const data = json.orders || []
      const shopOrders = data.filter((order: any) =>
        order.items?.some((item: { type: string }) => item.type === "merchandise" || item.type === "book"),
      )
      setOrders(shopOrders)
    }
    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: "approved" | "rejected" | "shipped" | "completed") => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, comment: comment?.trim() || null }),
    })
    if (res.ok) fetchOrders()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      shipped: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    }
    return <Badge className={variants[status] || ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Shop Orders</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No shop orders yet
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                  <TableCell>
                    <div className="text-sm">{order.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{order.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    {order.items.map((item, i) => (
                      <div key={i} className="text-sm">
                        {item.name} x{item.quantity}
                        {item.size && ` (${item.size})`}
                        {item.format && ` - ${item.format}`}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="font-bold">${order.total_amount}</TableCell>
                  <TableCell className="capitalize">{order.payment_method.replace("_", " ")}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          setSelectedOrder(order)
                          setComment("")
                          setOpen(true)
                        }}
                      >
                        View
                      </Button>
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(order.id, "approved")}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateStatus(order.id, "rejected")}
                            className="text-xs"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {order.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, "shipped")}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          Ship
                        </Button>
                      )}
                      {order.status === "shipped" && (
                        <Button size="sm" onClick={() => updateStatus(order.id, "completed")} className="text-xs">
                          Complete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{selectedOrder.customer_email}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Items</p>
                <div className="rounded border">
                  <ul className="divide-y">
                    {selectedOrder.items.map((it, idx) => (
                      <li key={idx} className="p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">{it.name}</span>
                          <span>${it.price} × {it.quantity}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {it.size && <span>Size: {it.size} · </span>}
                          {it.format && <span>Format: {it.format}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Add Admin Comment</p>
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment for status changes" />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "approved")} className="bg-green-600 hover:bg-green-700 text-white text-xs">Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(selectedOrder.id, "rejected")} className="text-xs">Reject</Button>
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "shipped")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">Ship</Button>
                  <Button size="sm" onClick={() => updateStatus(selectedOrder.id, "completed")} className="text-xs">Complete</Button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Status History</p>
                <div className="rounded border p-3 space-y-2">
                  {(selectedOrder as any).status_history?.length ? (
                    (selectedOrder as any).status_history.map((ev: any, i: number) => (
                      <div key={i} className="text-sm">
                        <span className="font-semibold">{String(ev.status).toUpperCase()}</span>
                        <span className="ml-2 text-muted-foreground">{new Date(ev.timestamp).toLocaleString()}</span>
                        {ev.comment && <span className="ml-2">— {ev.comment}</span>}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No history available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
