"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import type { Show } from "@/lib/types"
import { Plus, Pencil, Trash2 } from "lucide-react"

export function SettingsTab() {
  const [btcWallet, setBtcWallet] = useState("")
  const [signatureUrl, setSignatureUrl] = useState("")
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [shows, setShows] = useState<Show[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [editingShow, setEditingShow] = useState<Show | null>(null)

  const [showForm, setShowForm] = useState({
    date: "",
    city: "",
    venue: "",
    ticket_status: "available" as "available" | "low_tickets" | "sold_out",
  })

  useEffect(() => {
    fetchSettings()
    fetchShows()
  }, [])

  const fetchSettings = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("admin_settings").select("*")

    if (data) {
      const walletSetting = data.find((s) => s.key === "btc_wallet")
      const signatureSetting = data.find((s) => s.key === "signature_url")

      if (walletSetting) setBtcWallet(walletSetting.value)
      if (signatureSetting) setSignatureUrl(signatureSetting.value)
    }
    setIsLoading(false)
  }

  const fetchShows = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("shows").select("*").order("date", { ascending: true })

    if (data) {
      setShows(data)
    }
  }

  const saveWallet = async () => {
    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("admin_settings")
      .upsert({ key: "btc_wallet", value: btcWallet, updated_at: new Date().toISOString() })

    if (!error) {
      alert("BTC wallet address saved!")
    }
    setIsSaving(false)
  }

  const handleSignatureUpload = async () => {
    if (!signatureFile) return

    setIsSaving(true)
    const supabase = createClient()

    const fileName = `signature-${Date.now()}.png`
    const { error: uploadError } = await supabase.storage.from("product-images").upload(fileName, signatureFile)

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName)

      await supabase
        .from("admin_settings")
        .upsert({ key: "signature_url", value: publicUrl, updated_at: new Date().toISOString() })

      setSignatureUrl(publicUrl)
      setSignatureFile(null)
      alert("Signature uploaded!")
    }
    setIsSaving(false)
  }

  const saveShow = async () => {
    const supabase = createClient()

    if (editingShow) {
      const { error } = await supabase
        .from("shows")
        .update({
          date: showForm.date,
          city: showForm.city,
          venue: showForm.venue,
          ticket_status: showForm.ticket_status,
        })
        .eq("id", editingShow.id)

      if (!error) {
        fetchShows()
        setShowDialog(false)
        resetShowForm()
      }
    } else {
      const { error } = await supabase.from("shows").insert({
        date: showForm.date,
        city: showForm.city,
        venue: showForm.venue,
        ticket_status: showForm.ticket_status,
      })

      if (!error) {
        fetchShows()
        setShowDialog(false)
        resetShowForm()
      }
    }
  }

  const deleteShow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this show?")) return

    const supabase = createClient()
    const { error } = await supabase.from("shows").delete().eq("id", id)

    if (!error) {
      fetchShows()
    }
  }

  const resetShowForm = () => {
    setShowForm({
      date: "",
      city: "",
      venue: "",
      ticket_status: "available",
    })
    setEditingShow(null)
  }

  const openEditDialog = (show: Show) => {
    setEditingShow(show)
    setShowForm({
      date: show.date,
      city: show.city,
      venue: show.venue,
      ticket_status: show.ticket_status,
    })
    setShowDialog(true)
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* BTC Wallet */}
      <Card>
        <CardHeader>
          <CardTitle>BTC Wallet Address</CardTitle>
          <CardDescription>This wallet address will be shown to customers for crypto payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={btcWallet}
              onChange={(e) => setBtcWallet(e.target.value)}
              placeholder="Enter BTC wallet address"
              className="flex-1"
            />
            <Button onClick={saveWallet} disabled={isSaving} className="bg-gold hover:bg-gold-deep text-black">
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Signature Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Matt&apos;s Signature</CardTitle>
          <CardDescription>Upload Matt&apos;s signature for VIP cards.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signatureUrl && (
              <div className="p-4 bg-secondary rounded-lg">
                <img
                  src={signatureUrl || "/placeholder.svg"}
                  alt="Current signature"
                  className="max-h-20 object-contain"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                className="flex-1"
              />
              <Button
                onClick={handleSignatureUpload}
                disabled={!signatureFile || isSaving}
                className="bg-gold hover:bg-gold-deep text-black"
              >
                {isSaving ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Show Management</CardTitle>
            <CardDescription>Add, edit, or delete shows.</CardDescription>
          </div>
          <Dialog
            open={showDialog}
            onOpenChange={(open) => {
              setShowDialog(open)
              if (!open) resetShowForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-gold hover:bg-gold-deep text-black">
                <Plus className="w-4 h-4 mr-2" />
                Add Show
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>{editingShow ? "Edit Show" : "Add New Show"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={showForm.date}
                    onChange={(e) => setShowForm({ ...showForm, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={showForm.city}
                    onChange={(e) => setShowForm({ ...showForm, city: e.target.value })}
                    placeholder="e.g., New York"
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={showForm.venue}
                    onChange={(e) => setShowForm({ ...showForm, venue: e.target.value })}
                    placeholder="e.g., Madison Square Garden"
                  />
                </div>
                <div>
                  <Label>Ticket Status</Label>
                  <select
                    value={showForm.ticket_status}
                    onChange={(e) =>
                      setShowForm({
                        ...showForm,
                        ticket_status: e.target.value as typeof showForm.ticket_status,
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="available">Available</option>
                    <option value="low_tickets">Low Tickets</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <Button onClick={saveShow} className="w-full bg-gold hover:bg-gold-deep text-black">
                  {editingShow ? "Update Show" : "Add Show"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No shows added yet
                  </TableCell>
                </TableRow>
              ) : (
                shows.map((show) => (
                  <TableRow key={show.id}>
                    <TableCell>{new Date(show.date).toLocaleDateString()}</TableCell>
                    <TableCell>{show.city}</TableCell>
                    <TableCell>{show.venue}</TableCell>
                    <TableCell className="capitalize">{show.ticket_status.replace("_", " ")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(show)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteShow(show.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
