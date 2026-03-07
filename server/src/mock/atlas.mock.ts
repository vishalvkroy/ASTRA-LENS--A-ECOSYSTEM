import type { AtlasSnapshot, DailySale } from '../types'

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export function getAtlasMock(): AtlasSnapshot {
  const trend: DailySale[] = [
    { date: daysAgo(6), amount: 9200, transactions: 12 },
    { date: daysAgo(5), amount: 11400, transactions: 18 },
    { date: daysAgo(4), amount: 8700, transactions: 11 },
    { date: daysAgo(3), amount: 13200, transactions: 21 },
    { date: daysAgo(2), amount: 10100, transactions: 15 },
    { date: daysAgo(1), amount: 10500, transactions: 16 },
    { date: daysAgo(0), amount: 12400, transactions: 19 },
  ]

  const today = trend[6].amount
  const yesterday = trend[5].amount
  const thisWeek = trend.slice(0, 7).reduce((s, d) => s + d.amount, 0)
  const lastWeek = 68400
  const thisMonth = 285600
  const lastMonth = 261800

  return {
    business: {
      name: 'Sharma General Store',
      owner: 'Rajesh Sharma',
      location: 'Kanpur, UP',
      category: 'General Store',
      phone: '9876543210',
      gstNumber: '09ABCDE1234F1Z5',
    },
    sales: {
      today,
      yesterday,
      thisWeek,
      lastWeek,
      thisMonth,
      lastMonth,
      todayTransactions: trend[6].transactions,
      trend,
    },
    inventory: {
      totalItems: 347,
      totalValue: 485000,
      lowStockItems: [
        {
          id: 'prod-001',
          name: 'Basmati Rice (5kg)',
          category: 'Grains',
          price: 320,
          stock: 8,
          unit: 'bags',
          soldThisMonth: 42,
          revenue: 13440,
          daysLeft: 6,
          trend: 'up',
        },
        {
          id: 'prod-002',
          name: 'Toor Dal (1kg)',
          category: 'Pulses',
          price: 145,
          stock: 12,
          unit: 'packets',
          soldThisMonth: 38,
          revenue: 5510,
          daysLeft: 9,
          trend: 'stable',
        },
        {
          id: 'prod-003',
          name: 'Mustard Oil (1L)',
          category: 'Oils',
          price: 185,
          stock: 5,
          unit: 'bottles',
          soldThisMonth: 29,
          revenue: 5365,
          daysLeft: 5,
          trend: 'up',
        },
      ],
      topProducts: [
        {
          id: 'prod-004',
          name: 'Amul Butter (500g)',
          category: 'Dairy',
          price: 275,
          stock: 48,
          unit: 'packs',
          soldThisMonth: 89,
          revenue: 24475,
          trend: 'up',
        },
        {
          id: 'prod-001',
          name: 'Basmati Rice (5kg)',
          category: 'Grains',
          price: 320,
          stock: 8,
          unit: 'bags',
          soldThisMonth: 42,
          revenue: 13440,
          daysLeft: 6,
          trend: 'up',
        },
        {
          id: 'prod-005',
          name: 'Maggi Noodles (12pk)',
          category: 'Packaged Food',
          price: 145,
          stock: 92,
          unit: 'packs',
          soldThisMonth: 67,
          revenue: 9715,
          trend: 'stable',
        },
        {
          id: 'prod-006',
          name: 'Parle-G Biscuits (1kg)',
          category: 'Snacks',
          price: 85,
          stock: 136,
          unit: 'packs',
          soldThisMonth: 112,
          revenue: 9520,
          trend: 'up',
        },
        {
          id: 'prod-007',
          name: 'Surf Excel (1kg)',
          category: 'Detergents',
          price: 195,
          stock: 54,
          unit: 'boxes',
          soldThisMonth: 43,
          revenue: 8385,
          trend: 'stable',
        },
      ],
      slowMoving: [
        {
          id: 'prod-008',
          name: 'Glucon-D (500g)',
          category: 'Health',
          price: 210,
          stock: 24,
          unit: 'tins',
          soldThisMonth: 3,
          revenue: 630,
          trend: 'down',
        },
        {
          id: 'prod-009',
          name: 'Hajmola Candy (200pc)',
          category: 'Digestives',
          price: 75,
          stock: 31,
          unit: 'jars',
          soldThisMonth: 4,
          revenue: 300,
          trend: 'down',
        },
      ],
    },
    customers: {
      total: 847,
      active: 312,
      inactive: 535,
      newThisMonth: 23,
      topCustomers: [
        {
          id: 'cust-001',
          name: 'Priya Verma',
          phone: '9811234567',
          totalSpent: 28450,
          visits: 34,
          lastVisit: daysAgo(2),
          tags: ['loyal', 'bulk-buyer'],
        },
        {
          id: 'cust-002',
          name: 'Amit Singh',
          phone: '9922345678',
          totalSpent: 19800,
          visits: 28,
          lastVisit: daysAgo(1),
          tags: ['regular'],
        },
        {
          id: 'cust-003',
          name: 'Sunita Gupta',
          phone: '9733456789',
          totalSpent: 15600,
          visits: 22,
          lastVisit: daysAgo(4),
          tags: ['regular', 'credit'],
        },
      ],
      recentActivity: [
        {
          customerId: 'cust-001',
          name: 'Priya Verma',
          action: 'Purchase',
          amount: 1240,
          items: ['Basmati Rice', 'Amul Butter', 'Toor Dal'],
          time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          customerId: 'cust-010',
          name: 'Rahul Mishra',
          action: 'New',
          amount: 560,
          items: ['Maggi Noodles', 'Parle-G'],
          time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
        {
          customerId: 'cust-002',
          name: 'Amit Singh',
          action: 'Purchase',
          amount: 890,
          items: ['Surf Excel', 'Mustard Oil'],
          time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        },
        {
          customerId: 'cust-003',
          name: 'Sunita Gupta',
          action: 'Return',
          amount: -145,
          items: ['Toor Dal'],
          time: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  }
}
