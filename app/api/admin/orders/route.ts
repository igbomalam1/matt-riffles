import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

async function requireUser(request: Request) {
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

export async function GET(request: Request) {
  const user = await requireUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ orders: data || [] })
}

export async function PATCH(request: Request) {
  const user = await requireUser(request)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await request.json()
  const { id, status, comment } = payload || {}
  if (!id || !status) return NextResponse.json({ error: "Missing id or status" }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const now = new Date().toISOString()

  // Update order status and append to status_history if column exists
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: now })
    .eq("id", id)
  if (error) return NextResponse.json({ error }, { status: 400 })

  // Best-effort: fetch current history and append
  try {
    const { data } = await supabase.from("orders").select("status_history").eq("id", id).single()
    const hist = Array.isArray(data?.status_history) ? data?.status_history : []
    const updatedHist = [...hist, { status, timestamp: now, comment: comment ?? null, actor: user.email || user.id }]
    await supabase.from("orders").update({ status_history: updatedHist }).eq("id", id)
  } catch {}

  // Best-effort: update admin_comments if provided (column may or may not exist)
  try {
    if (comment && String(comment).trim().length > 0) {
      await supabase.from("orders").update({ admin_comments: comment }).eq("id", id)
    }
  } catch {}

  // Best-effort: insert audit log (if table exists)
  try {
    await supabase.from("order_audit_logs").insert({
      order_id: id,
      actor_id: user.id,
      actor_email: user.email,
      action: `status:${status}`,
      comment: comment ?? null,
      created_at: now,
    })
  } catch {}

  return NextResponse.json({ ok: true })
}
