"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { PresaleRequest } from "@/lib/types"

export function PresaleRequestsTab() {
  const [requests, setRequests] = useState<PresaleRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const res = await fetch("/api/admin/presale-requests")
    if (res.ok) {
      const json = await res.json()
      setRequests(json.requests || [])
    }
    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: "fulfilled" | "rejected") => {
    const res = await fetch("/api/admin/presale-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) fetchRequests()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      fulfilled: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return <Badge className={variants[status] || ""}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Presale Code Requests</h2>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Codes Needed</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No presale requests yet
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.codes_needed}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.address}</TableCell>
                  <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(request.id, "fulfilled")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Fulfill
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(request.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
