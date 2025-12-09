"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/types"

export function CryptoPaymentsTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [comment, setComment] = useState("")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders")
    if (res.ok) {
      const json = await res.json()
      const all = json.orders || []
      setOrders(all.filter((o: any) => o.payment_method === "crypto"))
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
      <h2 className="text-2xl font-bold mb-6">Crypto Payments</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No crypto payments yet
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
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="font-bold">${order.total_amount}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {order.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateStatus(order.id, "approved")}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs"
                          >
                            Confirm Payment
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
                          Ship/Deliver
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

      <div className="mt-4">
        <p className="text-xs text-muted-foreground mb-1">Add Admin Comment</p>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment for status changes" />
      </div>
    </div>
  )
}
