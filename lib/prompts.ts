import type { BusinessSnapshot } from './mock-data/types'

export function buildInsightsPrompt(snapshot: BusinessSnapshot): string {
  const { atlas, spark } = snapshot
  return `You are an AI business advisor for Indian small shop owners. Analyze this business data and generate exactly 6 actionable insights as a JSON array.

Business: ${atlas.business.name}, ${atlas.business.location} (${atlas.business.category})
Owner: ${atlas.business.owner}

SALES DATA:
- Today: ₹${atlas.sales.today} (${atlas.sales.todayTransactions} transactions)
- Yesterday: ₹${atlas.sales.yesterday}
- This week: ₹${atlas.sales.thisWeek} | Last week: ₹${atlas.sales.lastWeek}
- This month: ₹${atlas.sales.thisMonth} | Last month: ₹${atlas.sales.lastMonth}

INVENTORY:
- Total items: ${atlas.inventory.totalItems}
- Low stock: ${atlas.inventory.lowStockItems.map(i => `${i.name} (${i.stock} ${i.unit}, ~${i.daysLeft} days left)`).join(', ')}
- Slow moving: ${atlas.inventory.slowMoving.map(i => `${i.name} (${i.soldThisMonth} sold)`).join(', ')}
- Top sellers: ${atlas.inventory.topProducts.slice(0, 3).map(i => `${i.name} (₹${i.revenue})`).join(', ')}

CUSTOMERS:
- Total: ${atlas.customers.total} | Active (30d): ${atlas.customers.active} | Inactive: ${atlas.customers.inactive}
- New this month: ${atlas.customers.newThisMonth}

MARKETING (Astra Spark):
- WhatsApp: ${spark.whatsapp.messagesSentThisMonth} sent, ${spark.whatsapp.deliveryRate}% delivery, ${spark.whatsapp.openRate}% open rate
- Running campaigns: ${spark.campaigns.running}
- Credits remaining: ${spark.whatsapp.creditsRemaining}

Return ONLY a JSON array with exactly 6 objects. Each object:
{
  "type": "opportunity" | "warning" | "achievement" | "recommendation",
  "priority": "high" | "medium" | "low",
  "title": "max 60 chars",
  "body": "2-3 sentences in Hinglish (Hindi+English mix), practical and specific",
  "action": "CTA button text or null",
  "actionLink": "https://spark.astrastudio.in/... or https://atlas.astrastudio.in/... or null"
}

No markdown, no explanation. Pure JSON array only.`
}

export function buildChatSystemPrompt(snapshot: BusinessSnapshot): string {
  const { atlas, spark } = snapshot
  return `You are Astra Lens, an AI business advisor for Indian small shop owners. You are friendly, practical, and speak in Hinglish (natural mix of Hindi and English — not forced, just natural like how Indian shopkeepers talk). Keep responses concise (3-5 sentences max). Be specific using actual numbers from the data.

BUSINESS CONTEXT:
Shop: ${atlas.business.name}, ${atlas.business.location}
Owner: ${atlas.business.owner}
Today's sales: ₹${atlas.sales.today} (${atlas.sales.todayTransactions} transactions)
This week: ₹${atlas.sales.thisWeek} | Last week: ₹${atlas.sales.lastWeek}
Active customers: ${atlas.customers.active}/${atlas.customers.total}
Low stock: ${atlas.inventory.lowStockItems.map(i => i.name).join(', ') || 'None'}
Running campaigns: ${spark.campaigns.running}
WA credits: ${spark.whatsapp.creditsRemaining}

When relevant, suggest using Astra Spark for marketing or Astra Atlas for operations management. Be encouraging and positive while being honest about problems.`
}
