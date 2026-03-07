export interface Business {
  name: string
  owner: string
  location: string
  category: string
  phone: string
  gstNumber: string
  memberSince: string
}

export interface DailySale {
  date: string
  amount: number
  transactions: number
}

export interface SalesData {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  todayTransactions: number
  trend: DailySale[]
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  soldThisMonth: number
  revenue: number
  daysLeft?: number
  trend: 'up' | 'down' | 'stable'
}

export interface Customer {
  id: string
  name: string
  phone: string
  totalSpent: number
  visits: number
  lastVisit: string
  tags: string[]
}

export interface CustomerActivity {
  customerId: string
  name: string
  action: 'Purchase' | 'Return' | 'New'
  amount: number
  items: string[]
  time: string
}

export interface InventoryData {
  totalItems: number
  totalValue: number
  lowStockItems: Product[]
  topProducts: Product[]
  slowMoving: Product[]
}

export interface CustomersData {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  topCustomers: Customer[]
  recentActivity: CustomerActivity[]
}

export interface CampaignData {
  id: string
  name: string
  status: 'running' | 'completed' | 'draft'
  type: 'whatsapp' | 'social' | 'reel'
  sentAt?: string
  delivered?: number
  opened?: number
  clicked?: number
  audience: number
}

export interface SparkData {
  campaigns: {
    total: number
    running: number
    list: CampaignData[]
  }
  whatsapp: {
    messagesSentThisMonth: number
    deliveryRate: number
    openRate: number
    creditsRemaining: number
  }
  reelScripts: number
  scheduledPosts: number
}

export interface AtlasSnapshot {
  business: Business
  sales: SalesData
  inventory: InventoryData
  customers: CustomersData
}

export interface BusinessSnapshot {
  atlas: AtlasSnapshot
  spark: SparkData
  generatedAt: string
}
