import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get("order_number")
  if (!orderNumber) return NextResponse.json({ error: "Missing order_number" }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const { data, error } = await supabase.from("orders").select("*").eq("order_number", orderNumber).single()
  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ order: data })
}

