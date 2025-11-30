"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, Gift, Bitcoin, Calendar, Ticket, ShoppingBag, Settings, MessageCircle, LogOut, Menu } from "lucide-react"
import { VIPCardsTab } from "./tabs/vip-cards-tab"
import { GiftCardPaymentsTab } from "./tabs/gift-card-payments-tab"
import { CryptoPaymentsTab } from "./tabs/crypto-payments-tab"
import { ShowBookingsTab } from "./tabs/show-bookings-tab"
import { PresaleRequestsTab } from "./tabs/presale-requests-tab"
import { ShopOrdersTab } from "./tabs/shop-orders-tab"
import { SettingsTab } from "./tabs/settings-tab"
import { ChatTab } from "./tabs/chat-tab"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

type TabType = "vip_cards" | "gift_cards" | "crypto" | "shows" | "presale" | "orders" | "chat" | "settings"

const tabs = [
  { id: "vip_cards" as const, label: "Fan Card Applications", icon: CreditCard },
  { id: "gift_cards" as const, label: "Gift Card Payments", icon: Gift },
  { id: "crypto" as const, label: "Crypto Payments", icon: Bitcoin },
  { id: "shows" as const, label: "Show Bookings", icon: Calendar },
  { id: "presale" as const, label: "Presale Code Requests", icon: Ticket },
  { id: "orders" as const, label: "Shop Orders", icon: ShoppingBag },
  { id: "chat" as const, label: "Chat Messages", icon: MessageCircle },
  { id: "settings" as const, label: "Settings", icon: Settings },
]

export function AdminDashboard({ initialTab }: { initialTab?: TabType }) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab ?? "vip_cards")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const renderTab = () => {
    switch (activeTab) {
      case "vip_cards":
        return <VIPCardsTab />
      case "gift_cards":
        return <GiftCardPaymentsTab />
      case "crypto":
        return <CryptoPaymentsTab />
      case "shows":
        return <ShowBookingsTab />
      case "presale":
        return <PresaleRequestsTab />
      case "orders":
        return <ShopOrdersTab />
      case "chat":
        return <ChatTab />
      case "settings":
        return <SettingsTab />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="md:hidden bg-white border-b flex items-center justify-between p-4">
        <h1 className="font-bold text-xl">Admin Panel</h1>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-white">
            <div className="flex flex-col gap-2 mt-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id ? "bg-gold/10 text-gold-deep" : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
              <div className="mt-4 border-t pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        <aside
          className={`hidden md:flex ${isSidebarOpen ? "w-64" : "w-16"} bg-white border-r transition-all duration-300 flex-col`}
        >
        <div className="p-4 border-b">
          <h1 className={`font-bold text-xl ${isSidebarOpen ? "" : "hidden"}`}>Admin Panel</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={isSidebarOpen ? "hidden" : ""}
          >
            =
          </Button>
        </div>

        <nav className="flex-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                activeTab === tab.id ? "bg-gold/10 text-gold-deep" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {isSidebarOpen && <span className="text-sm">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">{renderTab()}</div>
        </main>
      </div>
    </div>
  )
}
