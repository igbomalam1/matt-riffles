"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Gift, Bitcoin, Check, Copy, ArrowLeft, Download } from "lucide-react"

interface CheckoutItem {
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

type PaymentMethod = "card" | "gift_card" | "crypto"

const giftCardTypes = ["Apple", "Razer", "Google Play", "Steam", "Amazon"]

export default function CheckoutPage() {
  const router = useRouter()
  const [item, setItem] = useState<CheckoutItem | null>(null)
  const [step, setStep] = useState(1)
  const [chatMode, setChatMode] = useState(true)
  const [messages, setMessages] = useState<{ role: "system" | "user" | "assistant"; text: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState("")
  const [btcWallet, setBtcWallet] = useState("")
  const [copied, setCopied] = useState(false)
  const [showCardMessage, setShowCardMessage] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    paymentMethod: "" as PaymentMethod | "",
    // Card payment
    cardNumber: "",
    expiry: "",
    cvv: "",
    // Gift card
    giftCardType: "",
    giftCardImage: null as File | null,
    // Crypto
    cryptoConfirmed: false,
  })

  // Load checkout item from localStorage
  useEffect(() => {
    const storedItem = localStorage.getItem("checkoutItem")
    if (storedItem) {
      setItem(JSON.parse(storedItem))
    }

    // Fetch BTC wallet from admin settings
    const fetchBtcWallet = async () => {
      const supabase = createClient()
      const { data } = await supabase.from("admin_settings").select("value").eq("key", "btc_wallet").single()

      if (data) {
        setBtcWallet(data.value)
      }
    }
    fetchBtcWallet()
    if (chatMode) {
      setMessages([
        {
          role: "assistant",
          text:
            "Thanks for supporting Matt, we really appreciate it! Please follow the prompts to complete your checkout.",
        },
        { role: "assistant", text: "Please enter your name..." },
      ])
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent, nextStep: number) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setStep(nextStep)
    }
  }

  const validateEmail = (v: string) => /.+@.+\..+/.test(v)
  const pushAssistant = (t: string) => setMessages((m) => [...m, { role: "assistant", text: t }])
  const pushUser = (t: string) => setMessages((m) => [...m, { role: "user", text: t }])

  const copyWallet = () => {
    navigator.clipboard.writeText(btcWallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGiftCardUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, giftCardImage: e.target.files[0] })
    }
  }

  useEffect(() => {
    try {
      sessionStorage.setItem("checkoutForm", JSON.stringify({ ...formData, giftCardImage: undefined }))
    } catch {}
  }, [formData])

  const handleSubmit = async () => {
    if (!item || !formData.paymentMethod) return

    // Card payment - show coming soon message
    if (formData.paymentMethod === "card") {
      setShowCardMessage(true)
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const newOrderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`

      let paymentDetails: Record<string, unknown> = {}

      // Handle gift card upload
      if (formData.paymentMethod === "gift_card" && formData.giftCardImage) {
        const fileExt = formData.giftCardImage.name.split(".").pop()
        const fileName = `giftcard-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from("gift-cards")
          .upload(fileName, formData.giftCardImage)

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("gift-cards").getPublicUrl(fileName)

          paymentDetails = {
            giftCardType: formData.giftCardType,
            giftCardImage: publicUrl,
          }
        }
      }

      if (formData.paymentMethod === "crypto") {
        paymentDetails = {
          walletSentTo: btcWallet,
          confirmedByUser: true,
        }
        // Store in localStorage for tracking
        localStorage.setItem(
          `crypto_order_${newOrderNumber}`,
          JSON.stringify({
            confirmed: true,
            timestamp: new Date().toISOString(),
          }),
        )
      }

      // Create order
      const { error } = await supabase.from("orders").insert({
        order_number: newOrderNumber,
        customer_name: formData.name,
        customer_email: formData.email,
        shipping_address: formData.address,
        items: [item],
        total_amount: item.price * item.quantity,
        payment_method: formData.paymentMethod,
        payment_details: paymentDetails,
        status: "pending",
      })

      if (error) throw error

      setOrderNumber(newOrderNumber)
      setShowSuccess(true)
      localStorage.removeItem("checkoutItem")
    } catch (error) {
      console.error("Error creating order:", error)
      alert("There was an error processing your order. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateReceipt = () => {
    if (!item) return

    const receiptContent = `
MATT COMEDY - ORDER RECEIPT
================================
Order Number: ${orderNumber}
Date: ${new Date().toLocaleDateString()}

ITEMS:
${item.name}
Quantity: ${item.quantity}
${item.size ? `Size: ${item.size}` : ""}
${item.format ? `Format: ${item.format}` : ""}
Price: $${item.price} x ${item.quantity}
--------------------------------
TOTAL: $${item.price * item.quantity}

Payment Method: ${formData.paymentMethod?.replace("_", " ").toUpperCase()}

Customer: ${formData.name}
Email: ${formData.email}
Shipping Address: ${formData.address}

================================
Your order will be processed within 
4-7 days depending on location, 
item availability, and team schedule.

Thank you for your purchase!
================================
    `

    const blob = new Blob([receiptContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `receipt-${orderNumber}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-lg mb-4">No items in checkout</p>
        <Link href="/">
          <Button className="bg-gold hover:bg-gold-deep text-black">Return to Shop</Button>
        </Link>
      </div>
    )
  }

  const total = item.price * item.quantity

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="container mx-auto max-w-4xl flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4">Order Summary</h2>
            <div className="border-b pb-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium">{item.name}</span>
                <span>${item.price}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Quantity: {item.quantity}</p>
                {item.size && <p>Size: {item.size}</p>}
                {item.format && <p>Format: {item.format}</p>}
                {item.venue && <p>Venue: {item.venue}</p>}
                {item.showDate && <p>Date: {new Date(item.showDate).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total}</span>
            </div>
          </div>

          {/* Checkout Conversational Form */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-2">Payment Details</h2>
            {chatMode && (
              <div className="space-y-4">
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`${
                        m.role === "assistant"
                          ? "bg-secondary text-sm rounded-2xl px-4 py-3 max-w-[80%]"
                          : "bg-gold/20 text-sm rounded-2xl px-4 py-3 max-w-[80%] ml-auto"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>

                {/* Step 1: Name */}
                {step === 1 && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Button
                      onClick={() => {
                        if (!formData.name.trim()) return pushAssistant("Please enter a valid name.")
                        pushUser(formData.name)
                        setStep(2)
                        pushAssistant("Please enter your email...")
                      }}
                      className="bg-gold text-black"
                    >
                      Send
                    </Button>
                  </div>
                )}

                {/* Step 2: Email */}
                {step === 2 && (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Button
                      onClick={() => {
                        if (!validateEmail(formData.email)) return pushAssistant("Invalid email. Please try again.")
                        pushUser(formData.email)
                        setStep(3)
                        pushAssistant("Please enter your shipping address...")
                      }}
                      className="bg-gold text-black"
                    >
                      Send
                    </Button>
                  </div>
                )}

                {/* Step 3: Address */}
                {step === 3 && (
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Enter your full shipping address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                    <Button
                      onClick={() => {
                        if (!formData.address.trim()) return pushAssistant("Please enter a valid address.")
                        pushUser(formData.address)
                        setStep(4)
                        pushAssistant("Select your payment method: Card, Gift Card, or Cryptocurrency")
                      }}
                      className="bg-gold text-black"
                    >
                      Send
                    </Button>
                  </div>
                )}

                {/* Step 4: Payment Method */}
                {step === 4 && (
                  <div className="grid gap-3">
                    <div className={`border rounded-lg p-4 ${formData.paymentMethod === "card" ? "border-gold" : ""}`}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gold" />
                        <span>Card Payment</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() => {
                            setFormData({ ...formData, paymentMethod: "card" })
                            pushUser("Card Payment")
                            setShowCardMessage(true)
                          }}
                        >
                          Choose
                        </Button>
                      </div>
                    </div>

                    <div className={`border rounded-lg p-4 ${formData.paymentMethod === "gift_card" ? "border-gold" : ""}`}>
                      <div className="flex items-center gap-2">
                        <Gift className="w-5 h-5 text-gold" />
                        <span>Gift Card</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() => {
                            setFormData({ ...formData, paymentMethod: "gift_card" })
                            pushUser("Gift Card")
                            pushAssistant("Please make sure card redeem codes are clear and legible")
                            pushAssistant("Select gift card type and upload a clear photo of the card")
                          }}
                        >
                          Choose
                        </Button>
                      </div>
                      {formData.paymentMethod === "gift_card" && (
                        <div className="mt-3 space-y-3">
                          <Select
                            value={formData.giftCardType}
                            onValueChange={(v) => setFormData({ ...formData, giftCardType: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gift card type" />
                            </SelectTrigger>
                            <SelectContent>
                              {giftCardTypes.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div>
                            <Label htmlFor="giftcard-upload" className="text-sm">
                              Upload Gift Card Photo
                            </Label>
                            <Input id="giftcard-upload" type="file" accept="image/*" onChange={handleGiftCardUpload} />
                          </div>
                          <Button
                            className="bg-gold text-black"
                            onClick={() => {
                              if (!formData.giftCardType || !formData.giftCardImage)
                                return pushAssistant("Select type and upload a clear photo before continuing.")
                              setStep(5)
                              pushAssistant("Confirm and submit your order when ready.")
                            }}
                          >
                            Continue
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className={`border rounded-lg p-4 ${formData.paymentMethod === "crypto" ? "border-gold" : ""}`}>
                      <div className="flex items-center gap-2">
                        <Bitcoin className="w-5 h-5 text-gold" />
                        <span>Cryptocurrency (Bitcoin)</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() => {
                            setFormData({ ...formData, paymentMethod: "crypto" })
                            pushUser("Cryptocurrency")
                            pushAssistant("Send BTC to the wallet shown, then click 'I've Paid'.")
                          }}
                        >
                          Choose
                        </Button>
                      </div>
                      {formData.paymentMethod === "crypto" && (
                        <div className="mt-3 space-y-3">
                          <p className="text-sm">Send payment to our BTC wallet:</p>
                          <div className="flex items-center gap-2 bg-secondary p-3 rounded-lg">
                            <code className="text-xs flex-1 break-all">{btcWallet || "Loading..."}</code>
                            <Button variant="ghost" size="icon" onClick={copyWallet}>
                              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">After sending payment, click "I've Paid".</p>
                          <Button className="bg-urgent text-white" onClick={() => setStep(5)}>
                            I've Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 5: Submit */}
                {step === 5 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        !formData.paymentMethod ||
                        isSubmitting ||
                        (formData.paymentMethod === "gift_card" && (!formData.giftCardType || !formData.giftCardImage))
                      }
                      className="bg-urgent hover:bg-urgent/90 text-white"
                    >
                      Submit Order
                    </Button>
                  </div>
                )}

                {/* Edit previous entries */}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(1, step - 1))}>
                    Go Back
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                    Start Over
                  </Button>
                </div>
              </div>
            )}

            {!chatMode && (
              <>
            {/* Step 1: Name */}
            <div className={`mb-6 ${step >= 1 ? "" : "opacity-50"}`}>
              <Label htmlFor="name" className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold text-black text-sm flex items-center justify-center">
                  1
                </span>
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, 2)}
                disabled={step < 1}
                className="mt-2"
                placeholder="Enter your full name"
              />
              {step === 1 && formData.name && (
                <Button onClick={() => setStep(2)} className="mt-2 bg-gold hover:bg-gold-deep text-black" size="sm">
                  Continue
                </Button>
              )}
            </div>
            
            {/* Step 2: Email */}
            <div className={`mb-6 ${step >= 2 ? "" : "opacity-50"}`}>
              <Label htmlFor="email" className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold text-black text-sm flex items-center justify-center">
                  2
                </span>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, 3)}
                disabled={step < 2}
                className="mt-2"
                placeholder="Enter your email"
              />
              {step === 2 && formData.email && (
                <Button onClick={() => setStep(3)} className="mt-2 bg-gold hover:bg-gold-deep text-black" size="sm">
                  Continue
                </Button>
              )}
            </div>

            {/* Step 3: Address */}
            <div className={`mb-6 ${step >= 3 ? "" : "opacity-50"}`}>
              <Label htmlFor="address" className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gold text-black text-sm flex items-center justify-center">
                  3
                </span>
                Shipping Address
              </Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    setStep(4)
                  }
                }}
                disabled={step < 3}
                className="mt-2"
                placeholder="Enter your full shipping address"
              />
              {step === 3 && formData.address && (
                <Button onClick={() => setStep(4)} className="mt-2 bg-gold hover:bg-gold-deep text-black" size="sm">
                  Continue
                </Button>
              )}
            </div>

            {/* Step 4: Payment Method */}
            <div className={`${step >= 4 ? "" : "opacity-50"}`}>
              <Label className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-gold text-black text-sm flex items-center justify-center">
                  4
                </span>
                Payment Method
              </Label>

              {step >= 4 && (
                <div className="grid gap-4">
                  {/* Card Payment */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.paymentMethod === "card" ? "border-gold bg-gold/5" : "hover:border-gold/50"
                    }`}
                    onClick={() => setFormData({ ...formData, paymentMethod: "card" })}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-gold" />
                      <div>
                        <h3 className="font-semibold">Card Payment</h3>
                        <p className="text-sm text-muted-foreground">Pay with credit or debit card</p>
                      </div>
                    </div>
                    {formData.paymentMethod === "card" && (
                      <div className="mt-4 space-y-3">
                        <Input
                          placeholder="Card Number"
                          value={formData.cardNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cardNumber: e.target.value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="MM/YY"
                            value={formData.expiry}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                expiry: e.target.value,
                              })
                            }
                          />
                          <Input
                            placeholder="CVV"
                            value={formData.cvv}
                            onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Gift Card */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.paymentMethod === "gift_card" ? "border-gold bg-gold/5" : "hover:border-gold/50"
                    }`}
                    onClick={() => setFormData({ ...formData, paymentMethod: "gift_card" })}
                  >
                    <div className="flex items-center gap-3">
                      <Gift className="w-6 h-6 text-gold" />
                      <div>
                        <h3 className="font-semibold">Gift Card</h3>
                        <p className="text-sm text-muted-foreground">Pay with gift cards</p>
                      </div>
                    </div>
                    {formData.paymentMethod === "gift_card" && (
                      <div className="mt-4 space-y-3">
                        <Select
                          value={formData.giftCardType}
                          onValueChange={(v) => setFormData({ ...formData, giftCardType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gift card type" />
                          </SelectTrigger>
                          <SelectContent>
                            {giftCardTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div>
                          <Label htmlFor="giftcard-upload" className="text-sm">
                            Upload Gift Card Photo
                          </Label>
                          <Input
                            id="giftcard-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleGiftCardUpload}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Crypto */}
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      formData.paymentMethod === "crypto" ? "border-gold bg-gold/5" : "hover:border-gold/50"
                    }`}
                    onClick={() => setFormData({ ...formData, paymentMethod: "crypto" })}
                  >
                    <div className="flex items-center gap-3">
                      <Bitcoin className="w-6 h-6 text-gold" />
                      <div>
                        <h3 className="font-semibold">Cryptocurrency</h3>
                        <p className="text-sm text-muted-foreground">Pay with Bitcoin</p>
                      </div>
                    </div>
                    {formData.paymentMethod === "crypto" && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm">Send payment to our BTC wallet:</p>
                        <div className="flex items-center gap-2 bg-secondary p-3 rounded-lg">
                          <code className="text-xs flex-1 break-all">{btcWallet || "Loading..."}</code>
                          <Button variant="ghost" size="icon" onClick={copyWallet}>
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          After sending payment, click &quot;I&apos;ve Paid&quot; below.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      !formData.paymentMethod ||
                      isSubmitting ||
                      (formData.paymentMethod === "gift_card" && (!formData.giftCardType || !formData.giftCardImage))
                    }
                    className="w-full bg-urgent hover:bg-urgent/90 text-white mt-4"
                  >
                    {isSubmitting
                      ? "Processing..."
                      : formData.paymentMethod === "card"
                        ? "Pay Now"
                        : formData.paymentMethod === "gift_card"
                          ? "Redeem & Pay"
                          : formData.paymentMethod === "crypto"
                            ? "I've Paid"
                            : "Complete Order"}
                  </Button>
                </div>
              )}
            </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Card Payment Coming Soon Modal */}
      <Dialog open={showCardMessage} onOpenChange={setShowCardMessage}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Card Payments Coming Soon</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Card payments are coming soon! Please use Crypto or Gift Cards for now.
          </p>
          <Button onClick={() => setShowCardMessage(false)} className="bg-gold hover:bg-gold-deep text-black">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-green-600">Order Placed Successfully!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Order Number</p>
              <p className="font-mono font-bold">{orderNumber}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Order Details</h4>
              <p className="text-sm">{item.name}</p>
              <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
              <p className="text-sm font-bold mt-2">Total: ${total}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your order will be processed within 4-7 days depending on location, item availability, and team schedule.
            </p>
            <div className="flex gap-2">
              <Button onClick={generateReceipt} variant="outline" className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Link href="/" className="flex-1">
                <Button className="w-full bg-gold hover:bg-gold-deep text-black">Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
