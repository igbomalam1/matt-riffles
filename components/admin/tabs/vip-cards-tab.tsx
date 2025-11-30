"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { VIPCard } from "@/lib/types"
import NextImage from "next/image"

const SHOW_COUNTS: Record<string, number> = {
  gold: 12,
  platinum: 24,
  silver: 6,
  bronze: 3,
}

export function VIPCardsTab() {
  const [cards, setCards] = useState<VIPCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [previewCard, setPreviewCard] = useState<VIPCard | null>(null)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
    const res = await fetch("/api/admin/vip-cards")
    if (res.ok) {
      const json = await res.json()
      setCards(json.cards || [])
    }
    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const res = await fetch("/api/admin/vip-cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (res.ok) fetchCards()
  }

  const composePreview = async (card: VIPCard, signature?: string | null) => {
    const canvas = document.createElement("canvas")
    canvas.width = 900
    canvas.height = 540
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const palettes: Record<string, { start: string; end: string; text: string; accent: string }> = {
      gold: { start: "#3b2a07", end: "#b4881c", text: "#e9d9b0", accent: "#c9a25a" },
      platinum: { start: "#2a2a2a", end: "#cfcfcf", text: "#f0f0f0", accent: "#9c9c9c" },
      silver: { start: "#2a2a2a", end: "#c0c0c0", text: "#f6f6f6", accent: "#a8a8a8" },
    }
    const p = palettes[card.card_type] || palettes.gold

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, p.start)
    grad.addColorStop(1, p.end)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Column 1: Photo (left)
    // Column 2: Content (center) - broadened
    // Column 3: VIP Emblem (right)
    const GRID = {
      photo: { x: 50, y: 100, w: 220, h: 280 },
      content: { x: 290, y: 100, w: 340, h: 340 },
      emblem: { x: canvas.width - 90, y: canvas.height - 110, radius: 55 },
    }

    // Watermark anti-counterfeit overlay
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(-Math.PI / 6)
    ctx.globalAlpha = 0.08
    ctx.fillStyle = "#ffffff"
    ctx.textAlign = "center"
    ctx.font = "700 72px Georgia, Times, serif"
    ctx.fillText("MATT RIFFLE FAN", 0, 0)
    ctx.globalAlpha = 1
    ctx.restore()

    // Draw photo in column 1
    if (card.photo_url) {
      const img = document.createElement("img")
      img.crossOrigin = "anonymous"
      img.src = card.photo_url
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
      ctx.save()
      const r = 16
      const { x, y, w, h } = GRID.photo
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.lineTo(x + w - r, y)
      ctx.quadraticCurveTo(x + w, y, x + w, y + r)
      ctx.lineTo(x + w, y + h - r)
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
      ctx.lineTo(x + r, y + h)
      ctx.quadraticCurveTo(x, y + h, x, y + h - r)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, x, y, w, h)
      ctx.restore()
    }

    const fitWrap = (
      text: string,
      startSize: number,
      minSize: number,
      maxWidth: number,
      weight: string,
      maxLines = 2,
    ) => {
      let size = startSize
      let lines: string[] = []
      const build = (s: number) => {
        ctx.font = `${weight} ${s}px Georgia, Times, serif`
        const words = text.split(/\s+/)
        const out: string[] = []
        let line = ""
        for (const w of words) {
          const test = line ? `${line} ${w}` : w
          if (ctx.measureText(test).width > maxWidth) {
            if (line) out.push(line)
            line = w
          } else {
            line = test
          }
        }
        if (line) out.push(line)
        return out
      }
      while (true) {
        lines = build(size)
        const widest = Math.max(...lines.map((l) => ctx.measureText(l).width))
        if ((widest <= maxWidth && lines.length <= maxLines) || size <= minSize) break
        size -= 2
      }
      return { size, lines: lines.slice(0, maxLines), lh: Math.round(size * 1.25) }
    }

    const contentX = GRID.content.x
    const contentW = GRID.content.w
    const contentCX = contentX + contentW / 2
    let y = GRID.content.y + 20

    ctx.textAlign = "center"
    ctx.fillStyle = p.text

    // Name - centered in content column, auto-sized and wrapped
    const nameFit = fitWrap((card.name || "").toUpperCase(), 32, 18, contentW - 20, "600", 2)
    ctx.font = `600 ${nameFit.size}px Georgia, Times, serif`
    for (const ln of nameFit.lines) {
      ctx.fillText(ln, contentCX, y)
      y += nameFit.lh
    }

    y += 12

    // Divider line
    ctx.fillStyle = p.accent
    ctx.fillRect(contentX + 20, y, contentW - 40, 2)
    y += 20

    // Address - centered, auto-sized and wrapped to 2 lines max
    const addressText = (card.address || "").trim().toUpperCase() || card.card_type.toUpperCase()
    const addressFit = fitWrap(addressText, 20, 14, contentW - 20, "500", 2)
    ctx.fillStyle = p.text
    ctx.font = `500 ${addressFit.size}px Georgia, Times, serif`
    for (const ln of addressFit.lines) {
      ctx.fillText(ln, contentCX, y)
      y += addressFit.lh
    }

    y += 12

    // Second divider
    ctx.fillStyle = p.accent
    ctx.fillRect(contentX + 20, y, contentW - 40, 2)
    y += 24

    const showCount = SHOW_COUNTS[card.card_type] || 6
    ctx.fillStyle = p.text
    ctx.font = "600 18px Georgia, Times, serif"
    ctx.fillText(`Card Access: ${showCount} shows`, contentCX, y)
    y += 32

    const drawBarcode = (code: string, bx: number, by: number, bw: number, bh: number) => {
      const chars = code.split("")
      let offset = bx
      for (let i = 0; i < 45; i++) {
        const c = chars[i % chars.length].charCodeAt(0)
        const barW = 2 + (c % 3)
        ctx.fillStyle = i % 2 === 0 ? p.text : p.accent
        ctx.fillRect(offset, by, barW, bh)
        offset += barW + 1
        if (offset >= bx + bw) break
      }
    }
    const barcodeWidth = GRID.content.w - 40
    const barcodeX = GRID.content.x + 20
    const barcodeY = y
    drawBarcode(card.id || "FAN123456", barcodeX, barcodeY, barcodeWidth, 32)
    y += 42
    ctx.fillStyle = p.accent
    ctx.font = "500 12px Georgia, Times, serif"
    ctx.textAlign = "center"
    ctx.fillText(`Verify: riffle.com/verify/${(card.id || "FAN123456").toUpperCase()}`, contentCX, barcodeY + 46)

    const drawStar = (cx: number, cy: number, spikes: number, outerR: number, innerR: number, color: string) => {
      let rot = (Math.PI / 2) * 3
      let sx = cx
      let sy = cy
      ctx.beginPath()
      ctx.moveTo(cx, cy - outerR)
      for (let i = 0; i < spikes; i++) {
        sx = cx + Math.cos(rot) * outerR
        sy = cy + Math.sin(rot) * outerR
        ctx.lineTo(sx, sy)
        rot += Math.PI / spikes
        sx = cx + Math.cos(rot) * innerR
        sy = cy + Math.sin(rot) * innerR
        ctx.lineTo(sx, sy)
        rot += Math.PI / spikes
      }
      ctx.lineTo(cx, cy - outerR)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    }

    const emblemX = GRID.emblem.x
    const emblemY = GRID.emblem.y
    const radius = GRID.emblem.radius

    ctx.save()
    ctx.strokeStyle = p.text
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const angle1 = (Math.PI * 2 * i) / 8
      const angle2 = (Math.PI * 2 * (i + 1)) / 8
      const x1 = emblemX + Math.cos(angle1) * radius
      const y1 = emblemY + Math.sin(angle1) * radius
      const x2 = emblemX + Math.cos(angle2) * radius
      const y2 = emblemY + Math.sin(angle2) * radius
      if (i === 0) ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
    }
    ctx.closePath()
    ctx.stroke()

    // Stars above VIP text
    drawStar(emblemX - 35, emblemY - 25, 5, 8, 4, p.text)
    drawStar(emblemX, emblemY - 25, 5, 8, 4, p.text)
    drawStar(emblemX + 35, emblemY - 25, 5, 8, 4, p.text)

    ctx.fillStyle = p.text
    ctx.font = "700 48px Georgia, Times, serif"
    ctx.textAlign = "center"
    ctx.fillText("FAN", emblemX, emblemY + 25)
    ctx.restore()

    // Signature area left-bottom aligned to emblem level
    ctx.fillStyle = "#ffffff"
    const labelText = "Matt's signature goes here on the physical card to be delivered to you"
    ctx.font = "500 14px Georgia, Times, serif"
    const textWidth = ctx.measureText(labelText).width
    const pad = 24
    const maxW = 360
    const sigW = Math.min(maxW, textWidth + pad)
    const sigH = 34
    const sigX = 50
    const sigY = GRID.emblem.y - sigH / 2
    const rr = 8
    ctx.beginPath()
    ctx.moveTo(sigX + rr, sigY)
    ctx.lineTo(sigX + sigW - rr, sigY)
    ctx.quadraticCurveTo(sigX + sigW, sigY, sigX + sigW, sigY + rr)
    ctx.lineTo(sigX + sigW, sigY + sigH - rr)
    ctx.quadraticCurveTo(sigX + sigW, sigY + sigH, sigX + sigW - rr, sigY + sigH)
    ctx.lineTo(sigX + rr, sigY + sigH)
    ctx.quadraticCurveTo(sigX, sigY + sigH, sigX, sigY + sigH - rr)
    ctx.lineTo(sigX, sigY + rr)
    ctx.quadraticCurveTo(sigX, sigY, sigX + rr, sigY)
    ctx.closePath()
    ctx.fill()

    if (signature) {
      const sigImg = document.createElement("img")
      sigImg.src = signature
      await new Promise((resolve) => {
        sigImg.onload = resolve
        sigImg.onerror = resolve
      })
      const targetH = 24
      const scale = targetH / sigImg.height
      const targetW = sigImg.width * scale
      const sx = sigX + sigW / 2 - targetW / 2
      const sy = sigY + (sigH - targetH) / 2
      ctx.drawImage(sigImg, sx, sy, targetW, targetH)
    } else {
      ctx.fillStyle = "#333333"
      ctx.textAlign = "center"
      ctx.font = "500 14px Georgia, Times, serif"
      ctx.fillText(labelText, sigX + sigW / 2, sigY + 20)
    }

    const url = canvas.toDataURL("image/png")
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

  const openPreview = async (card: VIPCard) => {
    setPreviewCard(card)
    await composePreview(card, signatureUrl)
  }

  useEffect(() => {
    if (previewOpen && previewCard) {
      composePreview(previewCard, signatureUrl)
    }
  }, [signatureUrl])

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={variants[status as keyof typeof variants] || ""}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Fan Card Applications</h2>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Card Type</TableHead>
              <TableHead>Photo</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Date Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No fan card applications yet
                </TableCell>
              </TableRow>
            ) : (
              cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell className="capitalize">{card.card_type}</TableCell>
                  <TableCell>
                    {card.photo_url ? (
                      <button
                        onClick={() => setSelectedImage(card.photo_url)}
                        className="text-gold hover:underline text-sm"
                      >
                        View Photo
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-sm">No photo</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{card.address}</TableCell>
                  <TableCell>{new Date(card.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{getStatusBadge(card.status)}</TableCell>
                  <TableCell>
                    {card.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(card.id, "approved")}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(card.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-2 bg-transparent"
                      onClick={() => openPreview(card)}
                    >
                      Preview Card
                    </Button>
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
            <DialogTitle>User Photo</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-square w-full">
              <NextImage
                src={selectedImage || "/placeholder.svg"}
                alt="User uploaded photo"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>Card Preview</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div>
              <img src={previewUrl || "/placeholder.svg"} alt="Fan Card Preview" className="w-full h-auto rounded" />
              <div className="mt-4 flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    const url = URL.createObjectURL(f)
                    setSignatureUrl(url)
                  }}
                />
                <Button onClick={() => previewCard && composePreview(previewCard, signatureUrl)} variant="outline">
                  Update Preview
                </Button>
              </div>
              <Button
                onClick={() => {
                  if (!previewUrl) return
                  const a = document.createElement("a")
                  a.href = previewUrl
                  a.download = `fan-card-preview.png`
                  a.click()
                }}
                className="mt-4 w-full bg-gold hover:bg-gold-deep text-black"
              >
                Download Preview
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
