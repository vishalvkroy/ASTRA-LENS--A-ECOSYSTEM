import { NextResponse } from 'next/server'
import { getBusinessSnapshot } from '@/lib/mock-data'

export interface Alert {
  id: string
  level: 'high' | 'medium' | 'low'
  category: 'inventory' | 'customers' | 'sales' | 'campaigns' | 'credits'
  title: string
  description: string
  action?: string
  actionLink?: string
  createdAt: string
}

const ATLAS_URL = process.env.NEXT_PUBLIC_ATLAS_URL || 'https://atlas.astrastudio.in'
const SPARK_URL = process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'

export async function GET() {
  const { atlas, spark } = getBusinessSnapshot()
  const now = new Date().toISOString()
  const alerts: Alert[] = []

  // Rule 1 & 2: Low stock
  for (const item of atlas.inventory.lowStockItems) {
    const daysLeft = item.daysLeft ?? 99
    if (daysLeft <= 3) {
      alerts.push({
        id: `low-stock-high-${item.id}`,
        level: 'high',
        category: 'inventory',
        title: `Low Stock: ${item.name}`,
        description: `Only ${item.stock} ${item.unit} remaining. At current sales rate, stock will run out in approximately ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        action: 'Restock Now',
        actionLink: `${ATLAS_URL}/inventory/${item.id}`,
        createdAt: now,
      })
    } else if (daysLeft <= 7) {
      alerts.push({
        id: `low-stock-med-${item.id}`,
        level: 'medium',
        category: 'inventory',
        title: `Stock Running Low: ${item.name}`,
        description: `${item.stock} ${item.unit} left — approximately ${daysLeft} days of stock remaining. Consider restocking soon.`,
        action: 'View Inventory',
        actionLink: `${ATLAS_URL}/inventory/${item.id}`,
        createdAt: now,
      })
    }
  }

  // Rule 3: Inactive customers
  if (atlas.customers.inactive > 400) {
    alerts.push({
      id: 'inactive-customers',
      level: 'high',
      category: 'customers',
      title: `${atlas.customers.inactive} Customers Inactive (30+ days)`,
      description: `More than ${Math.round((atlas.customers.inactive / atlas.customers.total) * 100)}% of your customer base hasn't purchased in over 30 days. A re-engagement campaign could bring 15–20% back.`,
      action: 'Launch WhatsApp Campaign',
      actionLink: `${SPARK_URL}/whatsapp/campaigns/new`,
      createdAt: now,
    })
  }

  // Rule 4: Slow moving items
  for (const item of atlas.inventory.slowMoving) {
    alerts.push({
      id: `slow-moving-${item.id}`,
      level: 'medium',
      category: 'sales',
      title: `Slow-Moving: ${item.name}`,
      description: `Only ${item.soldThisMonth} units sold this month with ${item.stock} ${item.unit} still in stock. Consider a bundle offer or promotion.`,
      action: 'Create Promotion',
      actionLink: `${SPARK_URL}/reelscript`,
      createdAt: now,
    })
  }

  // Rule 5: Old campaign (last campaign > 7 days ago)
  const lastCampaign = spark.campaigns.list
    .filter((c) => c.sentAt)
    .sort((a, b) => new Date(b.sentAt!).getTime() - new Date(a.sentAt!).getTime())[0]

  if (lastCampaign?.sentAt) {
    const daysSince = Math.floor(
      (Date.now() - new Date(lastCampaign.sentAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSince > 7) {
      alerts.push({
        id: 'old-campaign',
        level: 'low',
        category: 'campaigns',
        title: `Last Campaign: ${daysSince} Days Ago`,
        description: `Your "${lastCampaign.name}" campaign was sent ${daysSince} days ago. Regular messaging keeps customers engaged and drives repeat purchases.`,
        action: 'Plan Next Campaign',
        actionLink: `${SPARK_URL}/whatsapp/campaigns/new`,
        createdAt: now,
      })
    }
  }

  // Rule 6: Sales drop > 20% vs yesterday
  const salesDrop = ((atlas.sales.today - atlas.sales.yesterday) / atlas.sales.yesterday) * 100
  if (salesDrop < -20) {
    alerts.push({
      id: 'sales-drop',
      level: 'medium',
      category: 'sales',
      title: `Sales Down ${Math.abs(salesDrop).toFixed(0)}% vs Yesterday`,
      description: `Today's revenue is significantly lower than yesterday. Review if any top products are out of stock or if footfall has dropped.`,
      action: 'View Sales Report',
      actionLink: `${ATLAS_URL}/reports`,
      createdAt: now,
    })
  }

  // Rule 7: Low WA credits
  if (spark.whatsapp.creditsRemaining < 100) {
    alerts.push({
      id: 'low-wa-credits',
      level: 'medium',
      category: 'credits',
      title: 'Low WhatsApp Credits',
      description: `Only ${spark.whatsapp.creditsRemaining} WhatsApp credits remaining. Top up before your next campaign to avoid delivery failures.`,
      action: 'Top Up Credits',
      actionLink: `${SPARK_URL}/billing`,
      createdAt: now,
    })
  }

  // Sort: high → medium → low
  const order = { high: 0, medium: 1, low: 2 }
  alerts.sort((a, b) => order[a.level] - order[b.level])

  const counts = {
    high: alerts.filter((a) => a.level === 'high').length,
    medium: alerts.filter((a) => a.level === 'medium').length,
    low: alerts.filter((a) => a.level === 'low').length,
    total: alerts.length,
  }

  return NextResponse.json({ alerts, counts })
}
