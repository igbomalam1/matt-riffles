import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ShopSection } from "@/components/shop-section"

export default function ShopPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <ShopSection />
      <Footer />
    </main>
  )
}
