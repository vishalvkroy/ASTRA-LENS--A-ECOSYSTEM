import type { BusinessSnapshot, Alert } from '../types'
import { AggregatorService } from './aggregator.service'

export class AlertService {

  static async getAlerts(): Promise<{
    alerts: Alert[]
    counts: { high: number; medium: number; low: number; total: number }
  }> {
    const snapshot = await AggregatorService.getSnapshot()
    const alerts: Alert[] = []

    // RULE 1: Low stock — critical (daysLeft <= 3) or warning (daysLeft <= 7)
    for (const item of snapshot.atlas.inventory.lowStockItems) {
      const days = item.daysLeft ?? 999
      if (days <= 3) {
        alerts.push({
          id: `low-stock-critical-${item.id}`,
          level: 'high',
          category: 'inventory',
          title: `Low Stock: ${item.name}`,
          description: `Only ${item.stock} ${item.unit} remaining. At current sales rate, stock runs out in approximately ${days} day${days === 1 ? '' : 's'}.`,
          action: 'Restock in Atlas',
          actionLink: null,
          createdAt: new Date().toISOString(),
        })
      } else if (days <= 7) {
        alerts.push({
          id: `low-stock-warning-${item.id}`,
          level: 'medium',
          category: 'inventory',
          title: `Stock Running Low: ${item.name}`,
          description: `${item.stock} ${item.unit} remaining — approximately ${days} days left. Consider restocking soon.`,
          action: 'View in Atlas',
          actionLink: null,
          createdAt: new Date().toISOString(),
        })
      }
    }

    // RULE 2: Inactive customers
    const { inactive, total } = snapshot.atlas.customers
    if (inactive > 400) {
      alerts.push({
        id: 'inactive-customers-high',
        level: 'high',
        category: 'customers',
        title: `${inactive.toLocaleString('en-IN')} Customers Inactive (30+ days)`,
        description: `${Math.round((inactive / total) * 100)}% of your customer base hasn't purchased in over 30 days. A re-engagement WhatsApp campaign could bring back 15-20% of them.`,
        action: 'Launch WhatsApp Campaign',
        actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
        createdAt: new Date().toISOString(),
      })
    } else if (inactive > 200) {
      alerts.push({
        id: 'inactive-customers-medium',
        level: 'medium',
        category: 'customers',
        title: `${inactive} Customers Need Re-engagement`,
        description: `${inactive} customers haven't purchased in 30+ days. Consider a targeted campaign.`,
        action: 'Create Campaign',
        actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
        createdAt: new Date().toISOString(),
      })
    }

    // RULE 3: Sales drop today vs yesterday > 20%
    const { today, yesterday } = snapshot.atlas.sales
    if (yesterday > 0) {
      const dropPercent = ((yesterday - today) / yesterday) * 100
      if (dropPercent > 20) {
        alerts.push({
          id: 'sales-drop',
          level: 'medium',
          category: 'sales',
          title: `Sales Down ${Math.round(dropPercent)}% vs Yesterday`,
          description: `Today's revenue is ₹${today.toLocaleString('en-IN')} vs yesterday's ₹${yesterday.toLocaleString('en-IN')}. Check if any products are out of stock or if there's a local event affecting footfall.`,
          action: 'View Dashboard',
          actionLink: '/dashboard',
          createdAt: new Date().toISOString(),
        })
      }
    }

    // RULE 4: Slow-moving stock
    for (const item of snapshot.atlas.inventory.slowMoving) {
      alerts.push({
        id: `slow-moving-${item.id}`,
        level: 'medium',
        category: 'inventory',
        title: `Slow-Moving Stock: ${item.name}`,
        description: `Only ${item.soldThisMonth} units sold this month despite ${item.stock} in stock. Consider a bundle offer or WhatsApp promotion to clear inventory.`,
        action: 'Create Promotion on Spark',
        actionLink: 'https://spark.astrastudio.in/reelscript',
        createdAt: new Date().toISOString(),
      })
    }

    // RULE 5: No recent campaign (last campaign > 7 days ago)
    const lastCampaign = snapshot.spark.campaigns.list.find(
      c => c.status === 'completed' && c.sentAt
    )
    if (lastCampaign?.sentAt) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastCampaign.sentAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSince > 7) {
        alerts.push({
          id: 'no-recent-campaign',
          level: 'low',
          category: 'campaigns',
          title: `Last Campaign Was ${daysSince} Days Ago`,
          description: `Regular customer communication improves retention. Your last campaign was "${lastCampaign.name}". Time to engage your customers again.`,
          action: 'Plan Next Campaign',
          actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
          createdAt: new Date().toISOString(),
        })
      }
    }

    // RULE 6: Low WA credits (< 100)
    const { creditsRemaining } = snapshot.spark.whatsapp
    if (creditsRemaining > 0 && creditsRemaining < 100) {
      alerts.push({
        id: 'low-wa-credits',
        level: 'medium',
        category: 'credits',
        title: `Only ${creditsRemaining} WhatsApp Credits Remaining`,
        description: `You're running low on WhatsApp message credits. Buy a bundle on Spark to keep your campaigns running.`,
        action: 'Buy Credits on Spark',
        actionLink: 'https://spark.astrastudio.in/whatsapp/bundles',
        createdAt: new Date().toISOString(),
      })
    }

    // Sort: high first, then medium, then low
    const priority = { high: 0, medium: 1, low: 2 }
    alerts.sort((a, b) => priority[a.level] - priority[b.level])

    const counts = {
      high: alerts.filter(a => a.level === 'high').length,
      medium: alerts.filter(a => a.level === 'medium').length,
      low: alerts.filter(a => a.level === 'low').length,
      total: alerts.length,
    }

    return { alerts, counts }
  }
}
