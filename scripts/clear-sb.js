const { createClient } = require("@supabase/supabase-js")

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.argv[2]
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[3]

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
    console.error("Usage: node scripts/clear-sb.js <SUPABASE_URL> <SERVICE_ROLE_KEY>")
    process.exit(1)
  }
  const supabase = createClient(url, serviceRoleKey)
  const results = []
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).delete().not("id", "is", null)
      if (error) results.push({ table, status: "error", error: error.message || "unknown" })
      else results.push({ table, status: "cleared" })
    } catch (e) {
      results.push({ table, status: "error", error: e instanceof Error ? e.message : String(e) })
    }
  }
  console.log(JSON.stringify({ url, results }, null, 2))
}

main()
