import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const perPage = Number(process.env.PER_PAGE || 200)

function genPassword() {
  return crypto.randomBytes(18).toString("base64url")
}

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

  const results = []
  for (const u of admins) {
    const password = genPassword()
    const { error } = await supabase.auth.admin.updateUserById(u.id, { password })
    if (error) {
      results.push({ id: u.id, email: u.email, error: error.message || "update failed" })
    } else {
      results.push({ id: u.id, email: u.email, password })
    }
  }

  console.log(JSON.stringify(results, null, 2))
}

main()
