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

const shopProducts: Product[] = [
  { id: "stay-golden-tee", name: "Stay Golden Tour Black T-Shirt", price: 36, compareAtPrice: 45, image: "/products/Stay-Golden-Tour-Black-T-Shirt.png", category: "merchandise", hasSizes: true },
  { id: "stay-golden-hoodie", name: "Stay Golden Tour Black Hoodie", price: 64, compareAtPrice: 80, image: "/products/Stay-Golden-Tour-Black-Hoodie.png", category: "merchandise", hasSizes: true },
  { id: "rife-gym-tee", name: "Rife's Gym Faded Black T-Shirt", price: 36, compareAtPrice: 45, image: "/products/RifeGym-Faded-Black-T-Shirt.png", category: "merchandise", hasSizes: true },
  { id: "rife-diner-tee", name: "Rife's Diner White T-Shirt", price: 36, compareAtPrice: 45, image: "/products/Rife's-Diner-White-T-Shirt.png", category: "merchandise", hasSizes: true },
  { id: "hot-girls-tee", name: "Hot Girls Black T-Shirt", price: 36, compareAtPrice: 45, image: "/products/Hot-Girls-Black-T-Shirt.png", category: "merchandise", hasSizes: true },
  { id: "hot-girls-cropped", name: "Hot Girls Cropped Pink Jersey", price: 48, compareAtPrice: 60, image: "/products/Hot-Girls-Cropped-Pink-Jersey.png", category: "merchandise", hasSizes: true, soldOut: true },
  { id: "rife-applique-hat", name: "Rife Applique Black Hat", price: 32, compareAtPrice: 40, image: "/products/Rife-Applique-Black-Hat.png", category: "merchandise" },
  { id: "matt-rife-pillow", name: "Matt Rife Pillow", price: 36, compareAtPrice: 45, image: "/products/MattRifePillow.png", category: "merchandise" },
  { id: "matt-rife-keychain", name: "Matt Rife Keychain", price: 12, compareAtPrice: 15, image: "/products/Matt-Rife-Keychain.png", category: "merchandise" },
  { id: "rife-alert-wristband", name: "Rife Alert Wristband", price: 12, compareAtPrice: 15, image: "/products/Rife-Alert-Wristband.png", category: "merchandise" },
  { id: "stay-golden-poster", name: "Stay Golden Tour Poster", price: 24, compareAtPrice: 30, image: "/products/Stay-Golden-Tour-Poster.png", category: "merchandise" },
  { id: "cookies-milf-sweater", name: "Cookies & Milf Sweater", price: 28, compareAtPrice: 35, image: "/products/Cookies&Milf-Sweater.png", category: "merchandise", hasSizes: true },
  { id: "laughter-hoodie", name: "Matt Rife Laughter Hoodie", price: 28, compareAtPrice: 35, image: "/products/Matt-Rife-Laughter-Hoodie.png", category: "merchandise", hasSizes: true, soldOut: true },
  { id: "red-flag-bikini", name: "Women's Red Flag Bikini", price: 9.6, compareAtPrice: 12, image: "/products/Women'sRedFlagBikini.png", category: "merchandise", hasSizes: true },
  { id: "boat-tote", name: "Boat Tote", price: 16, compareAtPrice: 20, image: "/products/Boat-Tote.png", category: "merchandise" },
  { id: "teddy-blue", name: "Teddy Bear - Blue Shirt", price: 12, compareAtPrice: 15, image: "/products/Teddy-Bear-BlueShirt.png", category: "merchandise" },
  { id: "teddy", name: "Teddy Bear", price: 12, compareAtPrice: 15, image: "/products/TeddyBear.png", category: "merchandise" },
  { id: "rife4life", name: "Rife4Life Necklace", price: 8, compareAtPrice: 10, image: "/products/Rife4LifeNecklace.png", category: "merchandise" },
  { id: "flag-beanie", name: "Flag Beanie", price: 12, compareAtPrice: 15, image: "/products/FlagBeanie.png", category: "merchandise" },
  { id: "sheet-cleats-socks", name: "Sheet Cleats Bunny Socks", price: 12, compareAtPrice: 15, image: "/products/Sheet-Cleats-Bunny-Socks.png", category: "merchandise" },
]

const sizes = ["S", "M", "L", "XL", "XXL"]

export function ShopSection() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const router = useRouter()

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }))
  }

  const openProductModal = (product: Product) => {
    setSelectedProduct(product)
    setQuantity(quantities[product.id] || 1)
    setSelectedSize("")
  }

  const handleCheckout = () => {
    if (!selectedProduct) return
    if (selectedProduct.hasSizes && !selectedSize) {
      alert("Please select a size")
      return
    }

    const checkoutData = {
      type: "merchandise",
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: quantity,
      size: selectedSize,
    }
    localStorage.setItem("checkoutItem", JSON.stringify(checkoutData))
    router.push("/checkout")
  }

  return (
    <section id="shop" className="py-16 px-4 bg-secondary">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Shop</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shopProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-square">
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xl font-bold text-foreground">${product.price}</p>
                  {product.compareAtPrice && (
                    <span className="text-sm line-through text-muted-foreground">${product.compareAtPrice}</span>
                  )}
                  {product.compareAtPrice && (
                    <span className="text-xs bg-gold/20 text-gold-deep px-2 py-0.5 rounded">Save 20%</span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-4 mb-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, -1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium w-8 text-center">{quantities[product.id] || 1}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(product.id, 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={() => openProductModal(product)}
                  disabled={product.soldOut}
                  className={`w-full ${product.soldOut ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-gold hover:bg-gold-deep text-black"}`}
                >
                  {product.soldOut ? "Sold Out" : "Buy Now"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Product Modal */}
        <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{selectedProduct?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative aspect-square w-full max-w-[200px] mx-auto">
                <Image
                  src={selectedProduct?.image || ""}
                  alt={selectedProduct?.name || ""}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">${selectedProduct?.price}</span>
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

              {selectedProduct?.hasSizes && (
                <div>
                  <Label>Size</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedProduct?.colors && selectedProduct.colors.length > 0 && (
                <div>
                  <Label>Color</Label>
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedProduct.colors.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between mb-4">
                  <span>Total:</span>
                  <span className="font-bold">${(selectedProduct?.price || 0) * quantity}</span>
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
