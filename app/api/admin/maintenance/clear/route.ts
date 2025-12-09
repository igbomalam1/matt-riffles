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
  return data?.user || null
}

export async function POST() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const tables = [
    "order_audit_logs",
    "vip_cards",
    "orders",
    "shows",
    "presale_requests",
    "city_requests",
    "chat_messages",
    "admin_settings",
    "newsletter_subscribers",
  ]

  const results: Array<{ table: string; status: string; error?: string }> = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().not("id", "is", null)
      if (error) {
        results.push({ table, status: "error", error: error.message || "unknown" })
      } else {
        results.push({ table, status: "cleared" })
      }
    } catch (e: any) {
      results.push({ table, status: "error", error: e?.message || String(e) })
    }
  }

  return NextResponse.json({ ok: true, results })
}

