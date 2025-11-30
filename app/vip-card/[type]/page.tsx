"use client"

import type React from "react"

import { use, useState } from "react"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const cardData = {
  gold: { name: "Gold Fan", price: 1200, access: "12 Shows" },
  platinum: { name: "Platinum Fan", price: 850, access: "8 Shows" },
  silver: { name: "Silver Fan", price: 475, access: "3 Shows" },
}

export default function VIPCardPage({
  params,
}: {
  params: Promise<{ type: string }>
}) {
  const { type } = use(params)
  const card = cardData[type as keyof typeof cardData]
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generatedCardId, setGeneratedCardId] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    waybillAddress: "",
    photo: null as File | null,
  })

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Invalid card type</p>
      </div>
    )
  }

  const handleFlip = () => {
    setIsFlipped(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, photo: e.target.files[0] })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const supabase = createClient()

    try {
      let photoUrl = null

      if (formData.photo) {
        const fileExt = formData.photo.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from("user-photos").upload(fileName, formData.photo)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("user-photos").getPublicUrl(fileName)

        photoUrl = publicUrl
      }

      const res = await fetch("/api/vip-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          waybill_address: formData.waybillAddress,
          card_type: type,
          photo_url: photoUrl,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(typeof err.error === "string" ? err.error : "Failed to submit fan card")
      }

      const { id } = await res.json()
      setGeneratedCardId(id)
      setLastPhotoUrl(photoUrl)
      setShowSuccess(true)
    } catch (error) {
      console.error("Error submitting fan card:", error)
      alert("There was an error submitting your application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckout = () => {
    if (generatedCardId) {
      const checkoutData = {
        type: "vip_card",
        name: `${card.name} Card`,
        price: card.price,
        quantity: 1,
        cardId: generatedCardId,
      }
      localStorage.setItem("checkoutItem", JSON.stringify(checkoutData))
      router.push("/checkout")
    }
  }

  const generatePreview = async () => {
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
    const p = palettes[type] || palettes.gold

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0, p.start)
    grad.addColorStop(1, p.end)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

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

    const photoX = 70
    const photoY = 120
    const photoW = 240
    const photoH = 240
    if (lastPhotoUrl) {
      const img = document.createElement("img")
      img.crossOrigin = "anonymous"
      img.src = lastPhotoUrl
      await new Promise((resolve) => {
        img.onload = resolve
        img.onerror = resolve
      })
      ctx.save()
      const r = 20
      ctx.beginPath()
      ctx.moveTo(photoX + r, photoY)
      ctx.lineTo(photoX + photoW - r, photoY)
      ctx.quadraticCurveTo(photoX + photoW, photoY, photoX + photoW, photoY + r)
      ctx.lineTo(photoX + photoW, photoY + photoH - r)
      ctx.quadraticCurveTo(photoX + photoW, photoY + photoH, photoX + photoW - r, photoY + photoH)
      ctx.lineTo(photoX + r, photoY + photoH)
      ctx.quadraticCurveTo(photoX, photoY + photoH, photoX, photoY + photoH - r)
      ctx.lineTo(photoX, photoY + r)
      ctx.quadraticCurveTo(photoX, photoY, photoX + r, photoY)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(img, photoX, photoY, photoW, photoH)
      ctx.restore()
    }

    ctx.fillStyle = p.text
    ctx.textAlign = "left"
    ctx.font = "600 56px Georgia, Times, serif"
    const nameText = (formData.name || "").toUpperCase()
    ctx.fillText(nameText, 350, 180)
    ctx.fillStyle = p.accent
    ctx.fillRect(350, 195, 320, 3)
    ctx.fillStyle = p.text
    ctx.font = "600 32px Georgia, Times, serif"
    const region = (formData.address || "").split(/\n|,/)[0].trim().toUpperCase()
    ctx.fillText(region || card.name.toUpperCase(), 350, 235)
    ctx.fillStyle = p.accent
    ctx.fillRect(350, 250, 320, 3)
    const accessMatch = (card.access || "").match(/\d+/)
    const accessCount = accessMatch ? accessMatch[0] : ""
    ctx.fillStyle = p.text
    ctx.font = "500 30px Georgia, Times, serif"
    ctx.fillText(`Card Access: ${accessCount} shows`, 350, 290)

    const drawStar = (cx: number, cy: number, spikes: number, outerR: number, innerR: number, color: string) => {
      let rot = Math.PI / 2 * 3
      let x = cx
      let y = cy
      ctx.beginPath()
      ctx.moveTo(cx, cy - outerR)
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerR
        y = cy + Math.sin(rot) * outerR
        ctx.lineTo(x, y)
        rot += Math.PI / spikes
        x = cx + Math.cos(rot) * innerR
        y = cy + Math.sin(rot) * innerR
        ctx.lineTo(x, y)
        rot += Math.PI / spikes
      }
      ctx.lineTo(cx, cy - outerR)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    }

    const emblemX = canvas.width - 90
    const emblemY = canvas.height - 110
    const radius = 55
    ctx.save()
    ctx.strokeStyle = p.text
    ctx.lineWidth = 4
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
    drawStar(emblemX - 40, emblemY - 30, 5, 10, 5, p.text)
    drawStar(emblemX, emblemY - 30, 5, 10, 5, p.text)
    drawStar(emblemX + 40, emblemY - 30, 5, 10, 5, p.text)
    ctx.fillStyle = p.text
    ctx.font = "700 56px Georgia, Times, serif"
    ctx.textAlign = "center"
    ctx.fillText("FAN", emblemX, emblemY + 30)
    ctx.restore()

    const drawBarcode = (code: string, x: number, y: number, w: number, h: number) => {
      const chars = code.split("")
      let offset = x
      for (let i = 0; i < 120; i++) {
        const c = chars[i % chars.length].charCodeAt(0)
        const barW = 1 + (c % 4)
        ctx.fillStyle = i % 2 === 0 ? p.text : p.accent
        ctx.fillRect(offset, y, barW, h)
        offset += barW + 1
        if (offset >= x + w) break
      }
    }
    const code = `${nameText}|${region}` || "FAN"
    const contentX = 330
    const contentW = 360
    const barcodeW = contentW - 40
    const barcodeH = 42
    const barcodeX = contentX + 20
    const barcodeY = 330
    drawBarcode(code, barcodeX, barcodeY, barcodeW, barcodeH)

    ctx.fillStyle = "#ffffff"
    const labelText = "Matt's signature goes here on the physical card to be delivered to you"
    ctx.font = "500 14px Georgia, Times, serif"
    const textWidth = ctx.measureText(labelText).width
    const padding = 24
    const maxSigW = 380
    const sigW = Math.min(maxSigW, textWidth + padding)
    const sigH = 34
    const sigX = 50
    const sigY = emblemY - sigH / 2
    const r = 8
    ctx.beginPath()
    ctx.moveTo(sigX + r, sigY)
    ctx.lineTo(sigX + sigW - r, sigY)
    ctx.quadraticCurveTo(sigX + sigW, sigY, sigX + sigW, sigY + r)
    ctx.lineTo(sigX + sigW, sigY + sigH - r)
    ctx.quadraticCurveTo(sigX + sigW, sigY + sigH, sigX + sigW - r, sigY + sigH)
    ctx.lineTo(sigX + r, sigY + sigH)
    ctx.quadraticCurveTo(sigX, sigY + sigH, sigX, sigY + sigH - r)
    ctx.lineTo(sigX, sigY + r)
    ctx.quadraticCurveTo(sigX, sigY, sigX + r, sigY)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = "#333333"
    ctx.textAlign = "center"
    ctx.font = "500 14px Georgia, Times, serif"
    ctx.fillText(labelText, sigX + sigW / 2, sigY + sigH / 2 + 5)

    const url = canvas.toDataURL("image/png")
    setPreviewUrl(url)
    setPreviewOpen(true)
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">{card.name} Card</h1>
        <p className="text-center text-muted-foreground mb-8">
          ${card.price} | {card.access}
        </p>

        <div className="card-flip h-[450px]">
          <div className={`card-flip-inner ${isFlipped ? "flipped" : ""}`}>
            {/* Front */}
            <div className="card-flip-front">
              <div
                className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer shadow-xl"
                onClick={handleFlip}
              >
                <NextImage src={`/images/vip-${type}.jpg`} alt={`${card.name} Fan Card`} fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <span className="text-white text-xl font-semibold">Tap to Enter Info</span>
                </div>
              </div>
            </div>

            {/* Back */}
            <div className="card-flip-back">
              <form
                onSubmit={handleSubmit}
                className="p-6 bg-white rounded-xl border shadow-xl space-y-4 h-full overflow-y-auto"
              >
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="photo">Upload Picture</Label>
                  <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} />
                </div>
                <div>
                  <Label htmlFor="waybill">Waybill Address</Label>
                  <Input
                    id="waybill"
                    value={formData.waybillAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waybillAddress: e.target.value,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">Matt&apos;s Signature will be added upon approval</p>
                <Button type="submit" className="w-full bg-gold hover:bg-gold-deep text-black" disabled={isSubmitting}>
                  {isSubmitting ? "Generating..." : "Generate Card"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-green-600">Card Generated Successfully!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                You can download and print your card but it&apos;s invalid without Matt&apos;s signature, which will come with
                the physical card that will be delivered to you. Please proceed to checkout to finalize your order.
              </p>
              <Button onClick={handleCheckout} className="w-full bg-urgent hover:bg-urgent/90 text-white font-semibold">
                Checkout
              </Button>
              <Button onClick={generatePreview} variant="outline" className="w-full">
                Preview & Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Card Preview</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <div className="w-full">
                <img src={previewUrl} alt="Fan Card Preview" className="w-full h-auto rounded" />
                <Button
                  onClick={() => {
                    if (!previewUrl) return
                    const a = document.createElement("a")
                    a.href = previewUrl
                    a.download = `${card.name.toLowerCase().replace(/\s+/g, "-")}-preview.png`
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
    </div>
  )
}
