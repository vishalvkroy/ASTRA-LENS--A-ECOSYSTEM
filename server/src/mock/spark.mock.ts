import type { SparkData } from '../types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export function getSparkMock(): SparkData {
  return {
    campaigns: {
      total: 8,
      running: 2,
      list: [
        {
          id: 'camp-001',
          name: 'Holi Special Offers',
          status: 'running',
          type: 'whatsapp',
          audience: 312,
          delivered: 298,
          opened: 201,
          clicked: 87,
        },
        {
          id: 'camp-002',
          name: 'Weekend Sale Blast',
          status: 'running',
          type: 'whatsapp',
          audience: 200,
          delivered: 189,
          opened: 134,
          clicked: 52,
        },
        {
          id: 'camp-003',
          name: 'Republic Day Sale',
          status: 'completed',
          type: 'whatsapp',
          sentAt: daysAgo(14),
          audience: 450,
          delivered: 438,
          opened: 312,
          clicked: 145,
        },
        {
          id: 'camp-004',
          name: 'New Year Greetings',
          status: 'completed',
          type: 'social',
          sentAt: daysAgo(60),
          audience: 500,
          delivered: 490,
          opened: 380,
          clicked: 220,
        },
        {
          id: 'camp-005',
          name: 'Winter Warm-Up Deals',
          status: 'completed',
          type: 'whatsapp',
          sentAt: daysAgo(30),
          audience: 380,
          delivered: 365,
          opened: 240,
          clicked: 98,
        },
        {
          id: 'camp-006',
          name: 'Diwali Grand Sale',
          status: 'completed',
          type: 'whatsapp',
          sentAt: daysAgo(120),
          audience: 620,
          delivered: 605,
          opened: 450,
          clicked: 280,
        },
        {
          id: 'camp-007',
          name: 'Summer Reels',
          status: 'completed',
          type: 'reel',
          sentAt: daysAgo(90),
          audience: 1000,
          delivered: 1000,
          opened: 680,
          clicked: 320,
        },
        {
          id: 'camp-008',
          name: 'Monsoon Fresh Arrivals',
          status: 'draft',
          type: 'whatsapp',
          audience: 400,
        },
      ],
    },
    whatsapp: {
      messagesSentThisMonth: 940,
      deliveryRate: 96.2,
      openRate: 68.4,
      creditsRemaining: 560,
    },
    reelScripts: 5,
    scheduledPosts: 3,
  }
}
