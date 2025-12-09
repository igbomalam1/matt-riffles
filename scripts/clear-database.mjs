import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

let url = process.env.NEXT_PUBLIC_SUPABASE_URL
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceRoleKey) {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local")
    const content = fs.readFileSync(envPath, "utf8")
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^([^=]+)=(.*)$/)
      if (!m) continue
      const key = m[1].trim()
      const val = m[2].trim()
      if (key === "NEXT_PUBLIC_SUPABASE_URL") url = val
      if (key === "SUPABASE_SERVICE_ROLE_KEY") serviceRoleKey = val
    }
  } catch {}
}

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

async function main() {
  if (!url || !serviceRoleKey) {
    console.error("Missing Supabase URL or service role key")
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey)
  const results = []

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().not("id", "is", null)
      if (error) {
        results.push({ table, status: "error", error: error.message || "unknown" })
      } else {
        results.push({ table, status: "cleared" })
      }
    } catch (e) {
      results.push({ table, status: "error", error: e instanceof Error ? e.message : String(e) })
    }
  }

  console.log(JSON.stringify({ url, results }, null, 2))
}

main()
