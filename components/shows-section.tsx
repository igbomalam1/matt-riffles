"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"

interface Show {
  id: string
  date: string
  city: string
  venue: string
  ticket_status: "available" | "low_tickets" | "sold_out"
}

// Sample shows data - replaced with provided tour dates; Supabase data overrides if present
const sampleShows: Show[] = [
  { id: "2025-11-28-1", date: "2025-11-28", city: "Hershey, Pennsylvania", venue: "Giant Center", ticket_status: "sold_out" },
  { id: "2025-11-29-1", date: "2025-11-29", city: "Philadelphia, Pennsylvania", venue: "Xfinity Mobile Arena", ticket_status: "sold_out" },
  { id: "2025-12-14-1", date: "2025-12-14", city: "City Not Listed", venue: "Kia Center", ticket_status: "sold_out" },
  { id: "2025-12-29-1", date: "2025-12-29", city: "Montreal, Canada", venue: "Centre Bell", ticket_status: "low_tickets" },
  { id: "2025-12-30-1", date: "2025-12-30", city: "Hamilton, Canada", venue: "TD Coliseum", ticket_status: "low_tickets" },
  { id: "2025-12-31-1", date: "2025-12-31", city: "Boston, Massachusetts", venue: "TD Garden", ticket_status: "low_tickets" },

  { id: "2026-01-16-1", date: "2026-01-16", city: "Christchurch, New Zealand", venue: "Wolfbrook Arena", ticket_status: "low_tickets" },
  { id: "2026-01-17-1", date: "2026-01-17", city: "Auckland, New Zealand", venue: "Spark Arena", ticket_status: "low_tickets" },
  { id: "2026-01-19-1", date: "2026-01-19", city: "Brisbane, Australia", venue: "Brisbane Entertainment Centre", ticket_status: "low_tickets" },
  { id: "2026-01-20-1", date: "2026-01-20", city: "Brisbane, Australia", venue: "Brisbane Entertainment Centre", ticket_status: "sold_out" },
  { id: "2026-01-22-1", date: "2026-01-22", city: "Adelaide, Australia", venue: "Adelaide Entertainment Centre", ticket_status: "low_tickets" },
  { id: "2026-01-23-1", date: "2026-01-23", city: "Melbourne, Australia", venue: "Palais Theatre", ticket_status: "sold_out" },
  { id: "2026-01-23-2", date: "2026-01-23", city: "Melbourne, Australia", venue: "Palais Theatre", ticket_status: "low_tickets" },
  { id: "2026-01-24-1", date: "2026-01-24", city: "Melbourne, Australia", venue: "Palais Theatre", ticket_status: "sold_out" },
  { id: "2026-01-24-2", date: "2026-01-24", city: "Melbourne, Australia", venue: "Palais Theatre", ticket_status: "low_tickets" },
  { id: "2026-01-30-1", date: "2026-01-30", city: "Sydney, Australia", venue: "ICC Sydney Theatre", ticket_status: "sold_out" },
  { id: "2026-01-31-1", date: "2026-01-31", city: "Sydney, Australia", venue: "ICC Sydney Theatre", ticket_status: "sold_out" },
  { id: "2026-02-01-1", date: "2026-02-01", city: "Sydney, Australia", venue: "Sydney Opera House", ticket_status: "sold_out" },
  { id: "2026-02-03-1", date: "2026-02-03", city: "Perth, Australia", venue: "Perth HPC", ticket_status: "sold_out" },
  { id: "2026-02-04-1", date: "2026-02-04", city: "Perth, Australia", venue: "Perth HPC", ticket_status: "low_tickets" },
  { id: "2026-02-05-1", date: "2026-02-05", city: "Perth, Australia", venue: "Perth HPC", ticket_status: "low_tickets" },
  { id: "2026-02-07-1", date: "2026-02-07", city: "Singapore", venue: "Singapore Indoor Stadium", ticket_status: "available" },
  { id: "2026-02-28-1", date: "2026-02-28", city: "Newark, New Jersey", venue: "Prudential Center", ticket_status: "available" },
  { id: "2026-03-01-1", date: "2026-03-01", city: "Washington, District of Columbia", venue: "Capital One Arena", ticket_status: "available" },
  { id: "2026-03-12-1", date: "2026-03-12", city: "Jacksonville, Florida", venue: "VyStar Veterans Memorial Arena", ticket_status: "available" },
  { id: "2026-03-13-1", date: "2026-03-13", city: "Tampa, Florida", venue: "Benchmark International Arena", ticket_status: "available" },
  { id: "2026-03-14-1", date: "2026-03-14", city: "Savannah, Georgia", venue: "Enmarket Arena", ticket_status: "available" },
  { id: "2026-03-15-1", date: "2026-03-15", city: "Raleigh, North Carolina", venue: "Lenovo Center", ticket_status: "available" },
  { id: "2026-03-28-1", date: "2026-03-28", city: "Louisville, Kentucky", venue: "KFC Yum! Center", ticket_status: "available" },
  { id: "2026-03-29-1", date: "2026-03-29", city: "Cincinnati, Ohio", venue: "Heritage Bank Center", ticket_status: "available" },
  { id: "2026-04-13-1", date: "2026-04-13", city: "Amsterdam, Netherlands", venue: "Ziggo Dome", ticket_status: "low_tickets" },
  { id: "2026-04-17-1", date: "2026-04-17", city: "Zurich, Switzerland", venue: "Hallenstadion", ticket_status: "available" },
  { id: "2026-04-18-1", date: "2026-04-18", city: "Oslo, Norway", venue: "Unity Arena", ticket_status: "low_tickets" },
  { id: "2026-04-20-1", date: "2026-04-20", city: "Stockholm, Sweden", venue: "Avicii Arena", ticket_status: "available" },
  { id: "2026-04-22-1", date: "2026-04-22", city: "Dublin, Ireland", venue: "3Arena", ticket_status: "available" },
  { id: "2026-04-23-1", date: "2026-04-23", city: "London, United Kingdom", venue: "The O2", ticket_status: "low_tickets" },
  { id: "2026-04-24-1", date: "2026-04-24", city: "Manchester, United Kingdom", venue: "AO Arena", ticket_status: "low_tickets" },
  { id: "2026-04-25-1", date: "2026-04-25", city: "Glasgow, United Kingdom", venue: "OVO Hydro", ticket_status: "low_tickets" },
  { id: "2026-04-27-1", date: "2026-04-27", city: "Rome, Italy", venue: "Sala Santa Cecilia: Auditorium Parco della Musica", ticket_status: "low_tickets" },
  { id: "2026-04-27-2", date: "2026-04-27", city: "Rome, Italy", venue: "Sala Santa Cecilia: Auditorium Parco della Musica", ticket_status: "available" },
  { id: "2026-06-26-1", date: "2026-06-26", city: "Hollywood, Florida", venue: "Hard Rock Live", ticket_status: "low_tickets" },
  { id: "2026-06-27-1", date: "2026-06-27", city: "Hollywood, Florida", venue: "Hard Rock Live", ticket_status: "available" },
  { id: "2026-06-28-1", date: "2026-06-28", city: "Charlotte, North Carolina", venue: "Spectrum Center", ticket_status: "available" },
  { id: "2026-07-11-1", date: "2026-07-11", city: "Los Angeles, California", venue: "The Greek Theatre", ticket_status: "low_tickets" },
  { id: "2026-07-12-1", date: "2026-07-12", city: "Los Angeles, California", venue: "The Greek Theatre", ticket_status: "available" },
  { id: "2026-07-18-1", date: "2026-07-18", city: "Edmonton, Canada", venue: "Kinsmen Park", ticket_status: "available" },
  { id: "2026-07-19-1", date: "2026-07-19", city: "Winnipeg, Canada", venue: "Assiniboine Park", ticket_status: "available" },
  { id: "2026-07-24-1", date: "2026-07-24", city: "Atlantic City, New Jersey", venue: "Ocean Casino Resort", ticket_status: "low_tickets" },
  { id: "2026-07-24-2", date: "2026-07-24", city: "Atlantic City, New Jersey", venue: "Ocean Casino Resort", ticket_status: "available" },
  { id: "2026-08-06-1", date: "2026-08-06", city: "Halifax, Canada", venue: "Garrison Grounds", ticket_status: "available" },
  { id: "2026-08-07-1", date: "2026-08-07", city: "Halifax, Canada", venue: "Garrison Grounds", ticket_status: "low_tickets" },
  { id: "2026-08-08-1", date: "2026-08-08", city: "Bangor, Maine", venue: "Maine Savings Amphitheater", ticket_status: "available" },
  { id: "2026-08-22-1", date: "2026-08-22", city: "Anchorage, Alaska", venue: "Alaska Airlines Center", ticket_status: "low_tickets" },
  { id: "2026-08-23-1", date: "2026-08-23", city: "Fairbanks, Alaska", venue: "Carlson Center", ticket_status: "available" },
  { id: "2026-08-27-1", date: "2026-08-27", city: "Bend, Oregon", venue: "Hayden Homes Amphitheater", ticket_status: "available" },
  { id: "2026-08-28-1", date: "2026-08-28", city: "Calgary, Canada", venue: "Prince's Island Park", ticket_status: "available" },
  { id: "2026-08-29-1", date: "2026-08-29", city: "Spokane, Washington", venue: "ONE Spokane Stadium", ticket_status: "available" },
  { id: "2026-08-30-1", date: "2026-08-30", city: "Vancouver, Canada", venue: "Stanley Park", ticket_status: "available" },
  { id: "2026-09-04-1", date: "2026-09-04", city: "Uncasville, Connecticut", venue: "Mohegan Sun Arena", ticket_status: "available" },
  { id: "2026-09-05-1", date: "2026-09-05", city: "Uncasville, Connecticut", venue: "Mohegan Sun Arena", ticket_status: "available" },
  { id: "2026-09-25-1", date: "2026-09-25", city: "Durant, Oklahoma", venue: "Choctaw Casino & Resort", ticket_status: "low_tickets" },
  { id: "2026-09-26-1", date: "2026-09-26", city: "Durant, Oklahoma", venue: "Choctaw Casino & Resort", ticket_status: "available" },
  { id: "2026-09-27-1", date: "2026-09-27", city: "Rogers, Arkansas", venue: "Walmart AMP", ticket_status: "low_tickets" },
  { id: "2026-10-09-1", date: "2026-10-09", city: "Nampa, Idaho", venue: "Ford Idaho Center", ticket_status: "available" },
  { id: "2026-10-10-1", date: "2026-10-10", city: "Portland, Oregon", venue: "Moda Center", ticket_status: "available" },
  { id: "2026-10-11-1", date: "2026-10-11", city: "Sacramento, California", venue: "Golden 1 Center", ticket_status: "available" },
  { id: "2026-10-18-1", date: "2026-10-18", city: "Morrison, Colorado", venue: "Red Rocks Amphitheatre", ticket_status: "available" },
  { id: "2026-10-24-1", date: "2026-10-24", city: "Nashville, Tennessee", venue: "Bridgestone Arena", ticket_status: "available" },
  { id: "2026-10-25-1", date: "2026-10-25", city: "Chicago, Illinois", venue: "United Center", ticket_status: "available" },
  { id: "2026-11-07-1", date: "2026-11-07", city: "Milwaukee, Wisconsin", venue: "Fiserv Forum", ticket_status: "available" },
  { id: "2026-11-08-1", date: "2026-11-08", city: "Indianapolis, Indiana", venue: "Gainbridge Fieldhouse", ticket_status: "available" },
  { id: "2026-11-20-1", date: "2026-11-20", city: "Elmont, New York", venue: "UBS Arena", ticket_status: "available" },
  { id: "2026-11-21-1", date: "2026-11-21", city: "Buffalo, New York", venue: "KeyBank Center", ticket_status: "available" },
  { id: "2026-11-22-1", date: "2026-11-22", city: "Toronto, Canada", venue: "Scotiabank Arena", ticket_status: "available" },
  { id: "2026-12-12-1", date: "2026-12-12", city: "Fort Worth, Texas", venue: "Dickies Arena", ticket_status: "available" },
  { id: "2026-12-13-1", date: "2026-12-13", city: "Wichita, Kansas", venue: "INTRUST Bank Arena", ticket_status: "available" },
  { id: "2026-12-26-1", date: "2026-12-26", city: "Phoenix, Arizona", venue: "Mortgage Matchup Center", ticket_status: "available" },
  { id: "2026-12-29-1", date: "2026-12-29", city: "Oklahoma City, Oklahoma", venue: "Paycom Center", ticket_status: "available" },
]

export function ShowsSection() {
  const [shows, setShows] = useState<Show[]>(sampleShows)
  const [presaleModalOpen, setPresaleModalOpen] = useState(false)
  const [cityModalOpen, setCityModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()

  const [presaleForm, setPresaleForm] = useState({
    codesNeeded: 1,
    name: "",
    email: "",
    address: "",
  })

  const [cityForm, setCityForm] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
  })

  // Fetch shows from Supabase
  useEffect(() => {
    const fetchShows = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("shows").select("*").order("date", { ascending: true })

      if (!error && data && data.length > 0) {
        setShows(data)
      }
    }
    fetchShows()
  }, [])

  // Calculate show status based on date
  const getShowStatus = (show: Show): "available" | "low_tickets" | "sold_out" => {
    const showDate = new Date(show.date)
    const today = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const daysUntilShow = Math.ceil((showDate.getTime() - today.getTime()) / msPerDay)

    if (daysUntilShow <= 3) return "sold_out"
    if (daysUntilShow <= 30) return "low_tickets"
    return "available"
  }

  const handlePresaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.from("presale_requests").insert({
      name: presaleForm.name,
      email: presaleForm.email,
      address: presaleForm.address,
      codes_needed: presaleForm.codesNeeded,
    })

    setIsSubmitting(false)

    if (error) {
      alert("Error submitting request. Please try again.")
    } else {
      setSuccessMessage("Presale code request submitted successfully!")
      setPresaleModalOpen(false)
      setPresaleForm({ codesNeeded: 1, name: "", email: "", address: "" })
    }
  }

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.from("city_requests").insert({
      name: cityForm.name,
      email: cityForm.email,
      address: cityForm.address,
      requested_city: cityForm.city,
    })

    setIsSubmitting(false)

    if (error) {
      alert("Error submitting request. Please try again.")
    } else {
      setSuccessMessage("City request submitted successfully!")
      setCityModalOpen(false)
      setCityForm({ name: "", email: "", address: "", city: "" })
    }
  }

  const handleBuyTicket = (show: Show) => {
    const checkoutData = {
      type: "ticket",
      name: `Show Ticket - ${show.city}`,
      price: 150,
      quantity: 1,
      showId: show.id,
      showDate: show.date,
      venue: show.venue,
    }
    localStorage.setItem("checkoutItem", JSON.stringify(checkoutData))
    router.push("/checkout")
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <section id="shows" className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-6 text-foreground">Upcoming Shows</h2>

        {/* Alert Banner */}
        <div className="flex items-center justify-center gap-2 bg-gold/10 border border-gold rounded-lg p-4 mb-8">
          <Zap className="w-5 h-5 text-gold" />
          <p className="text-sm font-medium text-foreground">
            Buy upcoming tickets early! We accept Gift Cards (Buy at <a href="https://www.bestbuy.com/site/electronics/gift-cards/cat09000.c?id=cat09000" target="_blank" rel="noopener noreferrer" className="underline font-bold text-[#D4AF37]">BestBuy.com</a> for instant delivery).
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
            <button onClick={() => setSuccessMessage("")} className="float-right font-bold">
              &times;
            </button>
          </div>
        )}

        {/* Special Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Presale Codes */}
          <div className="border rounded-lg p-6 bg-secondary">
            <h3 className="text-lg font-bold mb-2">Get Presale Codes</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Get early access to ticket purchases before they go public.
            </p>
            <Button onClick={() => setPresaleModalOpen(true)} className="bg-gold hover:bg-gold-deep text-black">
              RSVP
            </Button>
          </div>

          {/* City Request */}
          <div className="border rounded-lg p-6 bg-secondary">
            <h3 className="text-lg font-bold mb-2">Don&apos;t See Your City?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Request a show in your city and we&apos;ll try to make it happen.
            </p>
            <Button onClick={() => setCityModalOpen(true)} className="bg-gold hover:bg-gold-deep text-black">
              RSVP
            </Button>
          </div>
        </div>

        {/* Shows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => {
            const status = getShowStatus(show)
            const isPast = new Date(show.date) < new Date()

            return (
              <div key={show.id} className="border rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{formatDate(show.date)}</p>
                    <h3 className="text-xl font-bold text-foreground">{show.city}</h3>
                    <p className="text-sm text-muted-foreground">{show.venue}</p>
                  </div>
                  <StatusBadge status={status} isPast={isPast} />
                </div>
                <Button
                  onClick={() => handleBuyTicket(show)}
                  disabled={status === "sold_out" || isPast}
                  className={`w-full ${status === "sold_out" || isPast
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-urgent hover:bg-urgent/90 text-white"
                    }`}
                >
                  {isPast ? "Past Show" : status === "sold_out" ? "Sold Out" : "Buy Tickets"}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Presale Modal */}
        <Dialog open={presaleModalOpen} onOpenChange={setPresaleModalOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Request Presale Codes</DialogTitle>
              <DialogDescription>Fill out the form below to reserve your presale codes.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePresaleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="codes">Amount of Codes Needed</Label>
                <Input
                  id="codes"
                  type="number"
                  min="1"
                  max="10"
                  value={presaleForm.codesNeeded}
                  onChange={(e) =>
                    setPresaleForm({
                      ...presaleForm,
                      codesNeeded: Number.parseInt(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="presale-name">Name</Label>
                <Input
                  id="presale-name"
                  value={presaleForm.name}
                  onChange={(e) => setPresaleForm({ ...presaleForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="presale-email">Email</Label>
                <Input
                  id="presale-email"
                  type="email"
                  value={presaleForm.email}
                  onChange={(e) => setPresaleForm({ ...presaleForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="presale-address">Address</Label>
                <Textarea
                  id="presale-address"
                  value={presaleForm.address}
                  onChange={(e) => setPresaleForm({ ...presaleForm, address: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gold hover:bg-gold-deep text-black" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Reserve Codes"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* City Request Modal */}
        <Dialog open={cityModalOpen} onOpenChange={setCityModalOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Request a Show in Your City</DialogTitle>
              <DialogDescription>Tell us where you&apos;d like to see Matt perform.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCitySubmit} className="space-y-4">
              <div>
                <Label htmlFor="city-request">Requested City</Label>
                <Input
                  id="city-request"
                  value={cityForm.city}
                  onChange={(e) => setCityForm({ ...cityForm, city: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city-name">Name</Label>
                <Input
                  id="city-name"
                  value={cityForm.name}
                  onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city-email">Email</Label>
                <Input
                  id="city-email"
                  type="email"
                  value={cityForm.email}
                  onChange={(e) => setCityForm({ ...cityForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city-address">Address</Label>
                <Textarea
                  id="city-address"
                  value={cityForm.address}
                  onChange={(e) => setCityForm({ ...cityForm, address: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gold hover:bg-gold-deep text-black" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}

function StatusBadge({
  status,
  isPast,
}: {
  status: "available" | "low_tickets" | "sold_out"
  isPast: boolean
}) {
  if (isPast) {
    return (
      <Badge variant="secondary" className="bg-gray-200 text-gray-600">
        Sold Out
      </Badge>
    )
  }

  const variants = {
    available: "bg-green-100 text-green-700",
    low_tickets: "bg-gold/20 text-gold-deep",
    sold_out: "bg-urgent/10 text-urgent",
  }

  const labels = {
    available: "Available",
    low_tickets: "Low Tickets",
    sold_out: "Sold Out",
  }

  return <Badge className={variants[status]}>{labels[status]}</Badge>
}
