"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Minus, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Product } from "@/lib/types"

const books: Product[] = [
  {
    id: "book-your-mom",
    name: "Your Mom's Gonna Love Me",
    price: 95,
    image: "/products/Your-mom's-gonna-love-me.png",
    category: "book",
    hasFormats: true,
  },
]

const bookDescription: string[] = [
  "Everyone has an opinion about Matt Rife, who at twenty-eight years old is both the hottest and most controversial comedian in America. Now, in his new book, Matt gives his legions of fans and haters plenty to talk about, with hilarious and dangerously revealing stories about his insane rise to stardom—from the trashy backroads of Ohio to the bedrooms of MILFs in LA to sold-out stadiums around the world.",
  "In his very first book, Matt reveals without apology everything that led him to becoming comedy’s biggest lightning rod before he reached thirty, in a story full of bold and hysterical takes on everything from Justin Bieber tramp stamps and rap battles with ex-cons to Matt’s battles with depression and his many brushes with failure before finally hitting it big.",
  "Born in trashy backwoods Ohio, Matt was saved by his foul-mouthed but loving grandpa Steve and a passion for standup. He started hitting comedy clubs before he could even drink, cutting his teeth in front of mostly Black crowds who dared him to succeed. Matt honed a brand of razor-sharp, brutally honest standup that took no prisoners—and took him to the most famous stages of Atlanta and LA before he graduated high school. Along the way, he broke the hearts of MILFs everywhere, finally hit puberty at the ripe age of twenty-two, never met a grudge he wouldn’t keep—and never, ever backed down.",
  "Full of Matt at his most unfiltered best opening up about his life for the very first time, this book will give Matt’s millions of fans everything they want and more—and might even get his insecure enemies to change their minds. Your Mom’s Gonna Love Me is one part memoir, one part comedy special, one part crazy first date. Just you and Matt between the covers. What could be better?",
]

const formats = ["Soft Copy", "Hard Copy"]

export function BooksSection() {
  const [selectedBook, setSelectedBook] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedFormat, setSelectedFormat] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const router = useRouter()

  const handleQuantityChange = (bookId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [bookId]: Math.max(1, (prev[bookId] || 1) + delta),
    }))
  }

  const openBookModal = (book: Product) => {
    setSelectedBook(book)
    setQuantity(quantities[book.id] || 1)
    setSelectedFormat("")
  }

  const handleCheckout = () => {
    if (!selectedBook) return
    if (selectedBook.hasFormats && !selectedFormat) {
      alert("Please select a format")
      return
    }

    const checkoutData = {
      type: "book",
      name: selectedBook.name,
      price: selectedBook.price,
      quantity: quantity,
      format: selectedFormat,
    }
    localStorage.setItem("checkoutItem", JSON.stringify(checkoutData))
    router.push("/checkout")
  }

  return (
    <section id="books" className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Books</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-secondary rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-[3/4]">
                <Image src={book.image || "/placeholder.svg"} alt={book.name} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-2">{book.name}</h3>
                <p className="text-xl font-bold text-foreground mb-4">${book.price}</p>
                <div className="space-y-3 text-sm text-muted-foreground mb-4">
                  {bookDescription.slice(0, 1).map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
                {/* Quantity Controls */}
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(book.id, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium w-8 text-center">{quantities[book.id] || 1}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(book.id, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button onClick={() => openBookModal(book)} className="w-full bg-gold hover:bg-gold-deep text-black">
                  Buy Now
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto mt-10 space-y-4 text-foreground">
          {bookDescription.map((para, idx) => (
            <p key={idx} className="leading-relaxed">
              {para}
            </p>
          ))}
        </div>

        {/* Book Modal */}
        <Dialog open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{selectedBook?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto">
                <Image
                  src={selectedBook?.image || ""}
                  alt={selectedBook?.name || ""}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                {bookDescription.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${selectedBook?.price}</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {selectedBook?.hasFormats && (
                <div>
                  <Label>Format</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span>Total:</span>
                  <span className="font-bold">${(selectedBook?.price || 0) * quantity}</span>
                </div>
                <Button onClick={handleCheckout} className="w-full bg-urgent hover:bg-urgent/90 text-white">
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
