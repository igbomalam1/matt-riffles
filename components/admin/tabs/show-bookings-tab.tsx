"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/types"

export function ShowBookingsTab() {
  const [bookings, setBookings] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    const res = await fetch("/api/admin/orders")
    if (res.ok) {
      const json = await res.json()
      const data = json.orders || []
      const ticketOrders = data.filter((order: any) => order.items?.some((item: { type: string }) => item.type === "ticket"))
      setBookings(ticketOrders)
    }
    setIsLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      completed: "bg-gray-100 text-gray-800",
    }
    return <Badge className={variants[status] || ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Show Bookings</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Show Details</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Date Booked</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No show bookings yet
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-mono text-sm">{booking.order_number}</TableCell>
                  <TableCell>
                    <div className="text-sm">{booking.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{booking.customer_email}</div>
                  </TableCell>
                  <TableCell>
                    {booking.items.map((item, i) => (
                      <div key={i} className="text-sm">
                        {item.name}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell className="capitalize">{booking.payment_method.replace("_", " ")}</TableCell>
                  <TableCell>{new Date(booking.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
