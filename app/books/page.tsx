import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BooksSection } from "@/components/books-section"

export default function BooksPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <BooksSection />
      <Footer />
    </main>
  )
}
