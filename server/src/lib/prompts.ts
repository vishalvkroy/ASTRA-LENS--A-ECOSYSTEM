import type { BusinessSnapshot } from '../types'

function sanitizeForPrompt(value: unknown, maxLength = 120): string {
  if (typeof value !== 'string') return String(value ?? '').substring(0, maxLength)
  return value
    .replace(/[`\[\]{}<>]/g, ' ')   // remove prompt-injection-prone chars
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLength)
}

function getUpcomingFestivalNote(daysAhead = 21): string {
  const festivals = [
    { name: 'Holi',          month: 2,  day: 14 },  // approximate
    { name: 'Ram Navami',    month: 3,  day: 6  },
    { name: 'Eid ul-Fitr',   month: 3,  day: 10 },  // approximate (lunar)
    { name: 'Akshaya Tritiya', month: 4, day: 30 },
    { name: 'Diwali',        month: 9,  day: 20 },  // approximate
    { name: 'Navratri',      month: 9,  day: 22 },
    { name: 'Dussehra',      month: 9,  day: 2  },
    { name: 'Christmas',     month: 11, day: 25 },
    { name: 'New Year',      month: 11, day: 31 },
    { name: 'Pongal/Makar',  month: 0,  day: 14 },
    { name: 'Republic Day',  month: 0,  day: 26 },
  ]
  const now = new Date()
  const year = now.getFullYear()
  for (const f of festivals) {
    const fDate = new Date(year, f.month, f.day)
    const diff = Math.ceil((fDate.getTime() - now.getTime()) / 86400000)
    if (diff >= 0 && diff <= daysAhead) {
      return `${f.name} is in ${diff} days — a great time for promotions.`
    }
  }
  return ''
}

export function buildInsightsPrompt(snapshot: BusinessSnapshot): string {
  const { atlas, spark } = snapshot
  const festivalNote = getUpcomingFestivalNote()
  return `You are an AI business advisor for Indian small shop owners. Analyze this business data and generate exactly 6 actionable insights as a JSON array.

BUSINESS: ${sanitizeForPrompt(atlas.business.name)}, ${sanitizeForPrompt(atlas.business.location)} (${sanitizeForPrompt(atlas.business.category)})
OWNER: ${sanitizeForPrompt(atlas.business.owner)}

SALES DATA:
- Today: ₹${atlas.sales.today} (${atlas.sales.todayTransactions} transactions)
- Yesterday: ₹${atlas.sales.yesterday}
- This week: ₹${atlas.sales.thisWeek} | Last week: ₹${atlas.sales.lastWeek}
- This month: ₹${atlas.sales.thisMonth} | Last month: ₹${atlas.sales.lastMonth}
- Weekly change: ${(((atlas.sales.thisWeek - atlas.sales.lastWeek) / atlas.sales.lastWeek) * 100).toFixed(1)}%

INVENTORY:
- Total items: ${atlas.inventory.totalItems}
- Low stock (urgent): ${atlas.inventory.lowStockItems.map(i => `${sanitizeForPrompt(i.name)} (${i.stock} ${sanitizeForPrompt(i.unit)}, ~${i.daysLeft ?? '?'} days left)`).join(', ') || 'None'}
- Slow moving: ${atlas.inventory.slowMoving.map(i => `${sanitizeForPrompt(i.name)} (only ${i.soldThisMonth} sold this month)`).join(', ') || 'None'}
- Top sellers: ${atlas.inventory.topProducts.slice(0, 3).map(i => `${sanitizeForPrompt(i.name)} ₹${i.revenue.toLocaleString('en-IN')}`).join(', ')}

CUSTOMERS:
- Total: ${atlas.customers.total}
- Active (last 30 days): ${atlas.customers.active}
- Inactive (30+ days): ${atlas.customers.inactive}
- New this month: ${atlas.customers.newThisMonth}

MARKETING (via Astra Spark):
- WhatsApp messages sent this month: ${spark.whatsapp.messagesSentThisMonth}
- Delivery rate: ${spark.whatsapp.deliveryRate}%
- Open rate: ${spark.whatsapp.openRate}%
- Active campaigns: ${spark.campaigns.running}
- WA credits remaining: ${spark.whatsapp.creditsRemaining}

CONTEXT: Current date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.${festivalNote ? ` UPCOMING: ${festivalNote}` : ''}

Generate exactly 6 insight objects. Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

Each object must follow this exact schema:
{
  "type": "opportunity" | "warning" | "achievement" | "recommendation",
  "priority": "high" | "medium" | "low",
  "title": "max 60 characters",
  "body": "2-3 sentences in natural Hinglish (mix of Hindi and English, how Indian shopkeepers actually talk). Be specific — use actual numbers from the data.",
  "action": "CTA button text (short) or null",
  "actionLink": "https://spark.astrastudio.in/... OR https://atlas.astrastudio.in/... OR null"
}

Mix the types: include at least 1 warning, 1 opportunity, 1 achievement. Prioritize by real business impact.`
}

export function buildChatSystemPrompt(snapshot: BusinessSnapshot): string {
  const { atlas, spark } = snapshot
  const weekChange = (((atlas.sales.thisWeek - atlas.sales.lastWeek) / atlas.sales.lastWeek) * 100).toFixed(1)

  return `You are Astra Lens, an AI business advisor for Indian small shop owners. You are helpful, friendly, and practical. You speak in natural Hinglish — a casual mix of Hindi and English, the way Indian shopkeepers and businesspeople actually talk to each other. Not forced — just natural. Keep responses short: 3-5 sentences max. Always be specific and use actual numbers from the business data below.

SHOP CONTEXT:
- Name: ${sanitizeForPrompt(atlas.business.name)}
- Owner: ${sanitizeForPrompt(atlas.business.owner)}
- Location: ${sanitizeForPrompt(atlas.business.location)}
- Type: ${sanitizeForPrompt(atlas.business.category)}

TODAY'S PERFORMANCE:
- Sales today: ₹${atlas.sales.today.toLocaleString('en-IN')} (${atlas.sales.todayTransactions} transactions)
- vs yesterday: ₹${atlas.sales.yesterday.toLocaleString('en-IN')} (${todayVsYesterday(atlas.sales.today, atlas.sales.yesterday)})
- This week: ₹${atlas.sales.thisWeek.toLocaleString('en-IN')} (${weekChange}% vs last week)

INVENTORY ALERTS:
- Low stock: ${atlas.inventory.lowStockItems.map(i => `${sanitizeForPrompt(i.name)} (~${i.daysLeft} days left)`).join(', ') || 'None'}
- Slow moving: ${atlas.inventory.slowMoving.map(i => sanitizeForPrompt(i.name)).join(', ') || 'None'}
- Top seller: ${sanitizeForPrompt(atlas.inventory.topProducts[0]?.name || 'N/A')} (₹${atlas.inventory.topProducts[0]?.revenue?.toLocaleString('en-IN') || '0'} this month)

CUSTOMERS:
- Active: ${atlas.customers.active} | Inactive 30+ days: ${atlas.customers.inactive}
- New this month: ${atlas.customers.newThisMonth}

SPARK (Marketing):
- Running campaigns: ${spark.campaigns.running}
- WA messages this month: ${spark.whatsapp.messagesSentThisMonth}
- WA credits remaining: ${spark.whatsapp.creditsRemaining}

When relevant, suggest using Astra Spark for marketing (campaigns, WhatsApp, reels) or Astra Atlas for operations (inventory, billing). Be encouraging. If there's a real problem, be honest but constructive.`
}

function todayVsYesterday(today: number, yesterday: number): string {
  if (yesterday === 0) return 'N/A'
  const change = ((today - yesterday) / yesterday * 100).toFixed(1)
  return `${Number(change) >= 0 ? '+' : ''}${change}%`
}
