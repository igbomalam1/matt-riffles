import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const perPage = Number(process.env.PER_PAGE || 200)

async function main() {
  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase URL or service role key")
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey)
  let page = 1
  const admins = []

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error(error.message || "Failed to list users")
      process.exit(1)
    }
    const batch = (data?.users || []).filter((u) => (u.user_metadata?.role || "") === "admin")
    admins.push(...batch)
    if (!data || !data.users || data.users.length < perPage) break
    page += 1
  }

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(admins.map((u) => ({ id: u.id, email: u.email, created_at: u.created_at, aud: u.aud })), null, 2))
  } else {
    if (admins.length === 0) {
      console.log("No admins found")
      return
    }
    for (const u of admins) {
      console.log(`${u.id}\t${u.email}\t${u.created_at}`)
    }
  }
}

main()
