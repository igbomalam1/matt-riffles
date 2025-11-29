import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const email = process.env.ADMIN_EMAIL || process.argv[2]
const password = process.env.ADMIN_PASSWORD || process.argv[3]

async function main() {
  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase URL or service role key")
    process.exit(1)
  }
  if (!email || !password) {
    console.error("Usage: node scripts/create-admin.mjs <email> <password>")
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "admin" },
  })

  if (error) {
    console.error(error.message || "Failed to create admin")
    process.exit(1)
  }

  console.log(`Admin created: ${data.user?.id}`)
}

main()