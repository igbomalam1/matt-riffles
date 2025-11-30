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
  const { data, error } = await supabase.from("shows").select("*").order("date", { ascending: true })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ shows: data || [] })
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await request.json()
  const { date, city, venue, ticket_status } = payload || {}
  if (!date || !city || !venue || !ticket_status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const { error } = await supabase.from("shows").insert({ date, city, venue, ticket_status })
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const payload = await request.json()
  const { id, date, city, venue, ticket_status } = payload || {}
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const { error } = await supabase
    .from("shows")
    .update({ date, city, venue, ticket_status })
    .eq("id", id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 })

  const supabase = createSupabaseClient(url, serviceRoleKey)
  const { error } = await supabase.from("shows").delete().eq("id", id)
  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
