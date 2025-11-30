import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

async function requireUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
  const { data } = await supabase.auth.getUser()
  if (!data?.user) return null
  return data.user
}

export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const { data, error } = await supabase.from("admin_settings").select("*")
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ settings: data || [] })
}

export async function PATCH(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await request.json()
  const { btc_wallet, signature_url } = payload || {}
  if (
    (btc_wallet === undefined || btc_wallet === null || btc_wallet === "") &&
    (signature_url === undefined || signature_url === null || signature_url === "")
  ) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)

  const updates: Array<{ key: string; value: string; updated_at: string }> = []
  const now = new Date().toISOString()
  if (btc_wallet !== undefined && btc_wallet !== null && btc_wallet !== "")
    updates.push({ key: "btc_wallet", value: String(btc_wallet), updated_at: now })
  if (signature_url !== undefined && signature_url !== null && signature_url !== "")
    updates.push({ key: "signature_url", value: String(signature_url), updated_at: now })

  const { error } = await supabase.from("admin_settings").upsert(updates, { onConflict: "key" })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
