"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface VIPCardData {
  type: "gold" | "platinum" | "silver"
  name: string
  price: number
  access: string
}

const vipCards: VIPCardData[] = [
  { type: "silver", name: "Silver VIP", price: 475, access: "3 Shows" },
  { type: "gold", name: "Gold VIP", price: 1200, access: "12 Shows" },
  { type: "platinum", name: "Platinum VIP", price: 850, access: "8 Shows" },
]

export function VIPCardsSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<VIPCardData | null>(null)
  const [showCardView, setShowCardView] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [generatedCardId, setGeneratedCardId] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    waybillAddress: "",
    photo: null as File | null,
  })

  const handleCardSelect = (value: string) => {
    const card = vipCards.find((c) => c.type === value)
    setSelectedCard(card || null)
  }

  const handleGetCard = () => {
    if (selectedCard) {
      setShowCardView(true)
      setIsModalOpen(false)
      // Open in new tab simulation - we'll show in modal instead
      window.open(`/vip-card/${selectedCard.type}`, "_blank")
    }
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
    if (!selectedCard) return

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      let photoUrl = null

      // Upload photo if provided
      if (formData.photo) {
        const fileExt = formData.photo.name.split(".").pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("user-photos")
          .upload(fileName, formData.photo)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("user-photos").getPublicUrl(fileName)

        photoUrl = publicUrl
      }

      // Insert VIP card application
      const { data, error } = await supabase
        .from("vip_cards")
        .insert({
          name: formData.name,
          address: formData.address,
          waybill_address: formData.waybillAddress,
          card_type: selectedCard.type,
          photo_url: photoUrl,
          status: "pending",
        })
        .select()
        .single()

      if (error) throw error

      setGeneratedCardId(data.id)
      setShowSuccess(true)
      setIsFlipped(false)
      setFormData({ name: "", address: "", waybillAddress: "", photo: null })
    } catch (error) {
      console.error("Error submitting VIP card:", error)
      alert("There was an error submitting your application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckout = () => {
    if (selectedCard && generatedCardId) {
      const checkoutData = {
        type: "vip_card",
        name: `${selectedCard.name} Card`,
        price: selectedCard.price,
        quantity: 1,
        cardId: generatedCardId,
      }
      localStorage.setItem("checkoutItem", JSON.stringify(checkoutData))
      router.push("/checkout")
    }
  }

  return (
    <section className="py-16 px-4 bg-secondary">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">VIP Access Cards</h2>

        {/* Cards Display */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 mb-12">
          {/* Desktop: Overlapping layout */}
          <div className="hidden md:flex items-end justify-center">
            {/* Silver - Left */}
            <div className="relative z-10 transform -mr-8">
              <VIPCardDisplay card={vipCards[0]} size="small" />
            </div>
            {/* Gold - Center (elevated) */}
            <div className="relative z-20 transform -translate-y-4">
              <VIPCardDisplay card={vipCards[1]} size="large" featured />
            </div>
            {/* Platinum - Right */}
            <div className="relative z-10 transform -ml-8">
              <VIPCardDisplay card={vipCards[2]} size="small" />
            </div>
          </div>

          {/* Mobile: Stacked layout */}
          <div className="flex md:hidden flex-col gap-4">
            <VIPCardDisplay card={vipCards[1]} size="large" featured />
            <VIPCardDisplay card={vipCards[2]} size="medium" />
            <VIPCardDisplay card={vipCards[0]} size="medium" />
          </div>
        </div>

        {/* Get Your Ticket Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-gold hover:bg-gold-deep text-black font-bold px-8 py-6 text-lg transition-transform hover:scale-105"
          >
            Get Your Ticket
          </Button>
        </div>

        {/* Selection Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Select Your VIP Card</DialogTitle>
              <DialogDescription>Choose your VIP membership tier for exclusive access to shows.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Select onValueChange={handleCardSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a card type" />
                </SelectTrigger>
                <SelectContent>
                  {vipCards.map((card) => (
                    <SelectItem key={card.type} value={card.type}>
                      {card.name} - ${card.price} ({card.access})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCard && (
                <Button onClick={handleGetCard} className="w-full bg-gold hover:bg-gold-deep text-black font-semibold">
                  Get {selectedCard.name}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Card View Modal */}
        <Dialog open={showCardView} onOpenChange={setShowCardView}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>{selectedCard?.name} Card</DialogTitle>
            </DialogHeader>
            <div className="card-flip h-[400px]">
              <div className={`card-flip-inner ${isFlipped ? "flipped" : ""}`}>
                {/* Front of card */}
                <div className="card-flip-front">
                  <div
                    className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer"
                    onClick={handleFlip}
                  >
                    <Image
                      src={`/images/vip-${selectedCard?.type}.jpg`}
                      alt={`${selectedCard?.name} VIP Card`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span className="text-white text-xl font-semibold">Tap to Enter Info</span>
                    </div>
                  </div>
                </div>

                {/* Back of card - Form */}
                <div className="card-flip-back">
                  <form
                    onSubmit={handleSubmit}
                    className="p-4 bg-white rounded-xl border space-y-4 h-full overflow-y-auto"
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
                    <div className="text-xs text-muted-foreground">
                      Matt&apos;s Signature will be added upon approval
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gold hover:bg-gold-deep text-black"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Generating..." : "Generate Card"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-green-600">Card Generated Successfully!</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground">
                This digital card is valid immediately. Your physical card with Matt&apos;s authentic signature will be
                mailed to you upon payment completion. Please proceed to checkout to finalize your order.
              </p>
              <Button onClick={handleCheckout} className="w-full bg-urgent hover:bg-urgent/90 text-white font-semibold">
                Checkout
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

function VIPCardDisplay({
  card,
  size,
  featured,
}: {
  card: VIPCardData
  size: "small" | "medium" | "large"
  featured?: boolean
}) {
  const sizeClasses = {
    small: "w-48 h-32",
    medium: "w-64 h-40",
    large: "w-72 h-44",
  }

  const bgColors = {
    gold: "bg-gradient-to-br from-gold to-gold-deep",
    platinum: "bg-gradient-to-br from-gray-300 to-gray-400",
    silver: "bg-gradient-to-br from-gray-200 to-gray-300",
  }

  return (
    <div
      className={`${sizeClasses[size]} ${bgColors[card.type]} rounded-xl p-4 flex flex-col justify-between shadow-lg ${featured ? "ring-2 ring-gold" : ""}`}
    >
      <div>
        <h3 className="font-bold text-black text-lg">{card.name}</h3>
        <p className="text-sm text-black/70">{card.access}</p>
      </div>
      <div className="text-right">
        <span className="text-2xl font-bold text-black">${card.price}</span>
      </div>
    </div>
  )
}
