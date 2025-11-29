import { NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, address, waybill_address, card_type, photo_url } = body || {}

    if (!name || !address || !card_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: "Supabase configuration is missing" }, { status: 500 })
    }

    const supabase = createSupabaseClient(url, serviceRoleKey)

    const { data, error } = await supabase
      .from("vip_cards")
      .insert({
        name,
        address,
        waybill_address,
        card_type,
        photo_url: photo_url ?? null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    return NextResponse.json({ id: data.id }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 })
  }
}