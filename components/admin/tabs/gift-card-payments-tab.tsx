"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/types"
import Image from "next/image"

export function GiftCardPaymentsTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    const res = await fetch("/api/admin/orders")
    if (res.ok) {
      const json = await res.json()
      const all = json.orders || []
      setOrders(all.filter((o: any) => o.payment_method === "gift_card"))
    }
    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: "approved" | "rejected" | "shipped") => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
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
      <h2 className="text-2xl font-bold mb-6">Gift Card Payments</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Gift Card Type</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No gift card payments yet
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                  <TableCell>
                    {order.items.map((item, i) => (
                      <div key={i} className="text-sm">
                        {item.name} x{item.quantity}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    {String((order.payment_details as Record<string, unknown>)?.giftCardType ?? "N/A")}
                  </TableCell>
                  <TableCell>
                    {(order.payment_details as Record<string, unknown>)?.giftCardImage ? (
                      <button
                        onClick={() =>
                          setSelectedImage((order.payment_details as Record<string, unknown>)?.giftCardImage as string)
                        }
                        className="text-gold hover:underline text-sm"
                      >
                        View Image
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No image</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.status === "pending" && (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, "approved")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {order.status === "approved" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(order.id, "shipped")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Mark as Shipped
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Gift Card Image</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-video w-full">
              <Image
                src={selectedImage || "/placeholder.svg"}
                alt="Gift card"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
