import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { VIPCardsSection } from "@/components/vip-cards-section"
import { ShowsSection } from "@/components/shows-section"
import { Footer } from "@/components/footer"
import { ChatWidget } from "@/components/chat-widget"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <VIPCardsSection />
      <ShowsSection />
      <Footer />
      <ChatWidget />
    </main>
  )
}
