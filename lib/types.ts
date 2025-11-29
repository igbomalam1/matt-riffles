export interface VIPCard {
  id: string
  name: string
  address: string
  waybill_address: string | null
  card_type: "gold" | "platinum" | "silver"
  photo_url: string | null
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  shipping_address: string
  items: OrderItem[]
  total_amount: number
  payment_method: "card" | "gift_card" | "crypto"
  payment_details: Record<string, unknown> | null
  status: "pending" | "approved" | "rejected" | "shipped" | "completed"
  created_at: string
  updated_at: string
}

export interface OrderItem {
  type: "vip_card" | "merchandise" | "book" | "ticket"
  name: string
  quantity: number
  price: number
  size?: string
  format?: string
}

export interface Show {
  id: string
  date: string
  city: string
  venue: string
  ticket_status: "available" | "low_tickets" | "sold_out"
  ticket_url: string | null
  created_at: string
}

export interface PresaleRequest {
  id: string
  name: string
  email: string
  address: string
  codes_needed: number
  status: "pending" | "fulfilled" | "rejected"
  created_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_name: string
  sender_email: string
  message: string
  is_admin: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  price: number
  image: string
  category: "merchandise" | "book"
  hasSizes?: boolean
  hasFormats?: boolean
  compareAtPrice?: number
  soldOut?: boolean
  colors?: string[]
}

export interface CartItem extends Product {
  quantity: number
  size?: string
  format?: string
}
