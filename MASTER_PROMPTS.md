# Astra Lens — Master Prompts by Phase

Each prompt below is self-contained. Copy-paste it to Claude Code at the start of each phase.

---

---

# PHASE 0 — Project Scaffold

```
You are building "Astra Lens" — an AI-powered business intelligence dashboard for Indian small shop owners. It is part of the Astra Studio ecosystem alongside Astra Atlas (billing) and Astra Spark (marketing).

## Task
Scaffold a new Next.js 14 (App Router) project inside the current directory with the following setup. Do NOT use create-next-app interactively — write all config files manually.

## Tech Stack
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- lucide-react
- recharts
- @anthropic-ai/sdk
- clsx + tailwind-merge + class-variance-authority

## Files to Create

### package.json
```json
{
  "name": "astra-lens",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.29",
    "react": "^18",
    "react-dom": "^18",
    "@anthropic-ai/sdk": "^0.32.0",
    "recharts": "^2.12.7",
    "lucide-react": "^0.469.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "class-variance-authority": "^0.7.1",
    "framer-motion": "^11.15.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "eslint": "^8",
    "eslint-config-next": "14.2.29"
  }
}
```

### tailwind.config.ts
Configure with:
- darkMode: 'class'
- Content paths for app/ and components/
- Extend colors:
  - brand: { DEFAULT: '#6366F1', 50: '#EEF2FF', 100: '#E0E7FF', 500: '#6366F1', 600: '#4F46E5', 700: '#4338CA', 900: '#312E81' }
  - surface: { DEFAULT: '#0A0F1E', card: '#0F1629', border: '#1E2A45' }
- Extend backgroundImage with a 'glow-indigo' gradient: radial-gradient at top, rgba(99,102,241,0.15) 0%, transparent 60%
- Extend boxShadow: 'glow': '0 0 40px -10px rgba(99,102,241,0.5)', 'card': '0 4px 24px rgba(0,0,0,0.4)'
- Extend keyframes: fadeIn (opacity 0→1, translateY 10px→0), slideIn (translateX -20px→0, opacity 0→1)
- Extend animation: 'fade-in': 'fadeIn 0.4s ease forwards', 'slide-in': 'slideIn 0.3s ease forwards'

### next.config.js
Standard Next.js config, no special options needed.

### tsconfig.json
Standard Next.js tsconfig with path alias "@/*" → "./*"

### postcss.config.js
Standard with tailwindcss and autoprefixer.

### .env.example
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
NEXT_PUBLIC_APP_NAME=Astra Lens
NEXT_PUBLIC_ATLAS_URL=https://atlas.astrastudio.in
NEXT_PUBLIC_SPARK_URL=https://spark.astrastudio.in
```

### .env.local
Same as above but with ANTHROPIC_API_KEY=sk-ant-... (user will fill this in)

### components.json (shadcn config)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsx": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### app/globals.css
Include Tailwind directives. Add:
- Google Font import: Inter (weights 300,400,500,600,700,800)
- CSS variables for shadcn (dark mode: background=#0A0F1E, card=#0F1629, border=#1E2A45, primary=#6366F1, primary-foreground=white)
- A `.glass` utility class: background rgba(255,255,255,0.03), backdrop-filter blur(12px), border 1px solid rgba(255,255,255,0.06)
- A `.gradient-text` class: background linear-gradient(135deg, #6366F1, #818CF8, #C7D2FE), -webkit-background-clip text, color transparent
- Custom scrollbar styles (thin, indigo thumb, transparent track)

### app/layout.tsx
Root layout with:
- Dark html/body (bg-[#0A0F1E] text-white antialiased)
- Inter font from next/font/google
- Metadata: title "Astra Lens | Astra Studio", description "AI Business Intelligence for Indian Shop Owners"

### lib/utils.ts
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-rose-400'
  return 'text-slate-400'
}

export function getChangePrefix(value: number): string {
  return value > 0 ? '+' : ''
}
```

After creating all files, create these empty placeholder files so Next.js doesn't error:
- app/page.tsx → redirect to /dashboard
- app/(dashboard)/layout.tsx → placeholder
- app/(dashboard)/page.tsx → placeholder with "Dashboard coming soon"

Run npm install after creating package.json.

Output a summary of every file created.
```

---

---

# PHASE 1 — Mock Data Layer

```
You are building Astra Lens — an AI business intelligence dashboard.
Phase 1: Create the complete mock data layer that simulates Astra Atlas + Astra Spark data.

## Context
- No real database. All data comes from static TypeScript objects in lib/mock-data/
- Data should look realistic for "Sharma General Store" — a general goods shop in Kanpur, UP
- Dates should be relative to March 7, 2026 (hackathon day)

## Files to Create

### lib/mock-data/types.ts
Define and export ALL TypeScript interfaces:

```typescript
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
```

### lib/mock-data/atlas.ts
Export a complete `atlasSnapshot: AtlasSnapshot` with:

Business:
- name: "Sharma General Store", owner: "Rajesh Sharma", location: "Kanpur, UP", category: "General Store", phone: "9876543210", gstNumber: "09ABCDE1234F1Z5", memberSince: "2024-06-15"

Sales trend (7 days, realistic INR amounts for a general store):
- Mar 1: ₹9,200 (12 transactions)
- Mar 2: ₹11,400 (18 transactions)
- Mar 3: ₹8,700 (11 transactions) — Sunday, lower
- Mar 4: ₹13,200 (21 transactions)
- Mar 5: ₹10,100 (15 transactions)
- Mar 6: ₹10,500 (16 transactions)
- Mar 7: ₹12,400 (19 transactions) — today

Top Products (5 items, realistic general store goods):
1. Basmati Rice 5kg — stock: 5 bags, daysLeft: 3, sold: 84, revenue: ₹42,000, trend: up
2. Tata Salt 1kg — stock: 32, sold: 210, revenue: ₹21,000, trend: stable
3. Surf Excel 1kg — stock: 28, sold: 60, revenue: ₹18,000, trend: up
4. Fortune Sunflower Oil 1L — stock: 40, sold: 45, revenue: ₹13,500, trend: stable
5. Amul Butter 500g — stock: 15, sold: 38, revenue: ₹9,500, trend: up

Low Stock Items: Basmati Rice (5 bags, 3 days), Tata Salt 1kg (12 packets, 6 days)

Slow Moving: Bournvita 500g (stock 24, sold 3), Nescafe Classic 100g (stock 18, sold 2)

Customers:
- total: 847, active: 312, inactive: 535, newThisMonth: 23
- Top 3 customers with realistic names, spend ₹8k-₹18k
- Recent activity: 4 entries with time strings like "2 hours ago", "4 hours ago", "Yesterday 6 PM", "Yesterday 2 PM"

### lib/mock-data/spark.ts
Export `sparkSnapshot: SparkData` with:
- 8 total campaigns, 2 running
- Campaign list including "Holi Special Offer" (running, sent Mar 5, 480 delivered, 312 opened, 89 clicked)
- WhatsApp: 940 messages sent, 96.2% delivery, 68.4% open rate, 560 credits remaining
- 12 reel scripts generated, 5 scheduled posts

### lib/mock-data/index.ts
Export:
```typescript
import { atlasSnapshot } from './atlas'
import { sparkSnapshot } from './spark'
import type { BusinessSnapshot } from './types'

export function getBusinessSnapshot(): BusinessSnapshot {
  return {
    atlas: atlasSnapshot,
    spark: sparkSnapshot,
    generatedAt: new Date().toISOString(),
  }
}

export { atlasSnapshot, sparkSnapshot }
export type { BusinessSnapshot, AtlasSnapshot, SparkData }
```

Also re-export all types from types.ts.

Output a summary confirming all files are created and types are consistent.
```

---

---

# PHASE 2 — Layout (Sidebar + Topbar)

```
You are building Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 2: Build the application layout — sidebar navigation and topbar.

## Design Philosophy
- Dark, premium feel like Linear or Vercel dashboard
- Background: #0A0F1E (deep navy)
- Cards/sidebar: #0F1629 with subtle border #1E2A45
- Primary accent: Indigo #6366F1
- Glass morphism for sidebar: bg-white/[0.03] backdrop-blur-xl border-r border-white/[0.06]
- Smooth hover transitions on all nav items
- Active item gets indigo left border + indigo text + subtle indigo background

## Files to Create

### app/(dashboard)/layout.tsx
```
'use client'
- Sidebar (fixed left, 240px wide on desktop)
- Main content area (ml-60 on desktop, full width on mobile)
- Mobile: show hamburger menu + bottom nav
- No sidebar on mobile (full screen content)
```

### components/layout/Sidebar.tsx
Design specs:
- Width: 240px fixed
- Background: bg-[#0A0F1E]/90 backdrop-blur-xl border-r border-white/[0.06]
- Full height: h-screen sticky top-0

TOP SECTION (logo area, py-6 px-5):
- Logo: A small "L" glyph in a rounded indigo gradient square (8x8, gradient from #6366F1 to #818CF8) + "Astra Lens" text in white font-semibold text-sm
- Below logo: thin separator

NAVIGATION (flex-1, mt-4, px-3):
Nav items array:
1. Dashboard — icon: LayoutDashboard — href: /dashboard
2. AI Insights — icon: Lightbulb — href: /dashboard/insights
3. Chat Advisor — icon: MessageCircle — href: /dashboard/chat
4. Smart Alerts — icon: Bell — href: /dashboard/alerts — showBadge: true (count: 4)
5. Ecosystem — icon: Network — href: /dashboard/ecosystem

Each nav item:
- Container: flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group cursor-pointer
- Default: text-slate-400 hover:text-white hover:bg-white/[0.05]
- Active: text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 pl-[10px] (adjust padding)
- Icon: size 16px, same color as text
- Badge (for alerts): ml-auto bg-indigo-500/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded-full font-medium

Use Next.js usePathname() to detect active route.

BOTTOM SECTION (border-t border-white/[0.06] p-4 mt-auto):
- Business avatar: 32px circle with gradient bg (indigo→purple), initials "RS" in white text-xs font-bold
- Business name: "Sharma General Store" text-sm text-white font-medium
- Location: "Kanpur, UP" text-xs text-slate-500
- Below: two small link pills: "Atlas ↗" and "Spark ↗" in text-xs text-slate-500 hover:text-indigo-400 transition

### components/layout/Topbar.tsx
Props: { title: string, subtitle?: string, actions?: React.ReactNode }

Design:
- Height: 64px
- Background: bg-[#0A0F1E]/80 backdrop-blur-md border-b border-white/[0.06] sticky top-0 z-10
- Left: page title (text-lg font-semibold text-white) + optional subtitle (text-sm text-slate-400)
- Right: slot for action buttons (passed as children/prop)
- On mobile: hamburger menu icon (Menu from lucide) on the left

### app/(dashboard)/page.tsx
Simple redirect to /dashboard/insights OR placeholder:
```typescript
import { redirect } from 'next/navigation'
export default function Home() { redirect('/dashboard') }
```

### app/(dashboard)/dashboard/page.tsx
Placeholder: return a div with text "Dashboard — Phase 3"

### app/(dashboard)/insights/page.tsx
Placeholder: return a div with text "Insights — Phase 5"

### app/(dashboard)/chat/page.tsx
Placeholder: return a div with text "Chat — Phase 6"

### app/(dashboard)/alerts/page.tsx
Placeholder: return a div with text "Alerts — Phase 4"

### app/(dashboard)/ecosystem/page.tsx
Placeholder: return a div with text "Ecosystem — Phase 7"

### app/page.tsx
```typescript
import { redirect } from 'next/navigation'
export default function Root() { redirect('/dashboard') }
```

## Important Notes
- All components are client components ('use client') where hooks are used
- Use Next.js Link for navigation
- Sidebar must be responsive (hidden on mobile, shown on md+)
- Import cn() from @/lib/utils for className merging
- No hardcoded colors — use Tailwind classes only

Output: confirm all files created, describe the visual result.
```

---

---

# PHASE 3 — Dashboard Page

```
You are building Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 3: Build the main dashboard page with stats, revenue chart, top products, and customer activity.

## Existing Code
- lib/mock-data/index.ts exports getBusinessSnapshot()
- lib/utils.ts has formatCurrency(), formatNumber()
- components/layout/Topbar.tsx exists
- Tailwind dark theme configured with brand.DEFAULT = #6366F1

## Files to Create/Modify

### app/api/summary/route.ts
```typescript
import { NextResponse } from 'next/server'
import { getBusinessSnapshot } from '@/lib/mock-data'

export async function GET() {
  const snapshot = getBusinessSnapshot()
  return NextResponse.json(snapshot)
}
```

### components/dashboard/StatCard.tsx
A premium stat card component.

Props:
```typescript
interface StatCardProps {
  title: string
  value: string
  change: number        // percentage, positive or negative
  changeLabel: string   // e.g. "vs yesterday"
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple'
  delay?: number        // animation delay in ms
}
```

Design:
- Container: relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] hover:shadow-glow cursor-default animate-fade-in
- Background: bg-[#0F1629] border-white/[0.06]
- Top row: icon on left (in a colored rounded-xl p-2.5 bg), title text-xs font-medium text-slate-400 uppercase tracking-wider
- Color map for icon bg:
  - indigo: bg-indigo-500/15 text-indigo-400
  - emerald: bg-emerald-500/15 text-emerald-400
  - amber: bg-amber-500/15 text-amber-400
  - rose: bg-rose-500/15 text-rose-400
  - purple: bg-purple-500/15 text-purple-400
- Value: text-3xl font-bold text-white mt-3 tracking-tight
- Change row (bottom): colored arrow icon + change% text + changeLabel text-xs text-slate-500
- Decorative: absolute bottom-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 (same color as icon)

### components/dashboard/RevenueChart.tsx
A beautiful Recharts area chart.

Props: { data: DailySale[] }

Design:
- Container: bg-[#0F1629] rounded-2xl p-6 border border-white/[0.06]
- Title row: "Revenue Trend" text-sm font-semibold text-white + "Last 7 days" text-xs text-slate-500
- Chart: ResponsiveContainer height=200
  - CartesianGrid: strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"
  - XAxis: tick fill #64748B, tickLine false, axisLine false — format date to "Mon", "Tue" etc.
  - YAxis: hidden (show values on tooltip only)
  - Tooltip: custom styled dark tooltip showing ₹amount and transactions
  - Area: type="monotone" dataKey="amount"
    - stroke="#6366F1" strokeWidth=2
    - fill="url(#revenueGradient)"
    - Define a linearGradient id="revenueGradient": from rgba(99,102,241,0.3) at top to rgba(99,102,241,0.0) at bottom
  - Dot: custom dot with outer ring on last point (today)

Custom Tooltip component: dark background bg-[#1E2A45] border border-white/10 rounded-xl p-3 shadow-xl — shows date, ₹amount in bold, "N transactions" in slate.

### components/dashboard/TopProducts.tsx
Props: { products: Product[] }

Design:
- Container: bg-[#0F1629] rounded-2xl p-6 border border-white/[0.06]
- Title: "Top Products" + "This month" subtitle
- List of 5 products:
  - Each row: product name text-sm text-white font-medium + revenue text-sm text-slate-400 (right aligned)
  - Below: progress bar (full width, h-1.5 rounded-full)
    - Track: bg-white/[0.06]
    - Fill: gradient from indigo-500 to purple-500, width = (revenue/maxRevenue)*100%
  - Small trend badge: up=text-emerald-400 + TrendingUp icon, down=text-rose-400, stable=text-slate-400
  - Rank number: text-xs text-slate-600 font-mono left of product name

### components/dashboard/CustomerActivity.tsx
Props: { activity: CustomerActivity[] }

Design:
- Container: bg-[#0F1629] rounded-2xl p-6 border border-white/[0.06]
- Title: "Recent Activity"
- List items: each has
  - Avatar: 36px circle, gradient bg (unique per customer initial letter), initials text-xs font-bold
  - Name + action: "Priya Verma" text-sm text-white + "Purchase — Rice, Salt" text-xs text-slate-500
  - Right: amount in emerald text-sm font-semibold + time text-xs text-slate-600
  - Divider between items: border-b border-white/[0.04]

### components/dashboard/InsightPreview.tsx
Props: { } — fetches from /api/insights but with a STATIC fallback (2 hardcoded insights for dashboard preview)

Show 2 hardcoded insight cards on the dashboard for speed (no AI call needed here, save Claude calls for /insights page):
1. Warning: "Basmati Rice runs out in 3 days" (high priority)
2. Opportunity: "535 inactive customers — launch re-engagement campaign" (high priority)

With a "View All Insights →" link to /dashboard/insights.

Design for each mini-card:
- bg-[#0F1629] rounded-xl p-4 border
- Warning: border-amber-500/20 bg-amber-500/[0.03] — dot amber-400 — title text-sm font-medium text-white
- Opportunity: border-indigo-500/20 bg-indigo-500/[0.03] — dot indigo-400
- Body text: text-xs text-slate-400 mt-1
- Optional CTA link: text-xs font-medium in matching color, mt-2

### app/(dashboard)/dashboard/page.tsx
Full dashboard page. Make it 'use client', use useState + useEffect to fetch /api/summary.

Layout:
```
<Topbar title="Dashboard" subtitle="Sharma General Store — Kanpur, UP" />

<div className="p-6 space-y-6 max-w-7xl mx-auto">

  {/* Stats Row */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard title="Today's Revenue" value={formatCurrency(sales.today)} change={...} icon={TrendingUp} color="indigo" />
    <StatCard title="Customers" value={formatNumber(customers.total)} ... icon={Users} color="emerald" />
    <StatCard title="Active Campaigns" value={spark.campaigns.running} ... icon={Megaphone} color="purple" />
    <StatCard title="WA Messages" value={formatNumber(spark.whatsapp.messagesSentThisMonth)} ... icon={MessageSquare} color="amber" />
  </div>

  {/* Chart + Insights Row */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div className="lg:col-span-2"><RevenueChart data={sales.trend} /></div>
    <div className="space-y-4"><InsightPreview /></div>
  </div>

  {/* Products + Activity Row */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <TopProducts products={inventory.topProducts} />
    <CustomerActivity activity={customers.recentActivity} />
  </div>

</div>
```

Loading state: show skeleton cards using a SkeletonCard component (pulsing bg-white/[0.05] rounded-2xl).

Calculate change percentages:
- Revenue change: ((today - yesterday) / yesterday) * 100
- Week change: ((thisWeek - lastWeek) / lastWeek) * 100

Animate each section with staggered delay using animation-delay CSS (delay-0, delay-100, delay-200, delay-300 via inline style).

Output: describe every component built and the visual result.
```

---

---

# PHASE 4 — Smart Alerts Page

```
You are building Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 4: Build the Smart Alerts page and API route.

## Context
Alerts are rule-based (no AI call). They are derived from the business snapshot.

## Files to Create

### app/api/alerts/route.ts
Import getBusinessSnapshot(). Apply these rules to generate alerts:

Rules:
1. LOW STOCK (HIGH): any item in inventory.lowStockItems with daysLeft <= 3 → HIGH alert
2. LOW STOCK (MEDIUM): daysLeft 4-7 → MEDIUM alert
3. INACTIVE CUSTOMERS (HIGH): if customers.inactive > 400 → HIGH alert
4. SLOW MOVING (MEDIUM): for each slowMoving product → MEDIUM alert
5. OLD CAMPAIGN (LOW): if last campaign was > 7 days ago → LOW alert
6. SALES DROP (MEDIUM): if today < yesterday by more than 20% → MEDIUM alert
7. LOW WA CREDITS (MEDIUM): if whatsapp.creditsRemaining < 100 → MEDIUM alert

Return:
```typescript
{
  alerts: Alert[],    // sorted: HIGH first, then MEDIUM, then LOW
  counts: { high: number, medium: number, low: number, total: number }
}
```

Alert interface:
```typescript
interface Alert {
  id: string
  level: 'high' | 'medium' | 'low'
  category: 'inventory' | 'customers' | 'sales' | 'campaigns' | 'credits'
  title: string
  description: string
  action?: string
  actionLink?: string
  createdAt: string
}
```

### components/alerts/AlertCard.tsx
Props: { alert: Alert, index: number }

Design:
- animate-fade-in with stagger (style={{ animationDelay: `${index * 80}ms` }})
- Container: rounded-2xl p-5 border transition-all hover:scale-[1.01]
- HIGH: bg-rose-950/30 border-rose-500/20 hover:border-rose-500/40
- MEDIUM: bg-amber-950/30 border-amber-500/20 hover:border-amber-500/40
- LOW: bg-slate-800/40 border-white/[0.06] hover:border-white/10

Top row:
- Level badge: rounded-full px-2.5 py-1 text-xs font-bold uppercase
  - HIGH: bg-rose-500/20 text-rose-400
  - MEDIUM: bg-amber-500/20 text-amber-400
  - LOW: bg-slate-500/20 text-slate-400
- Category icon (right side, 16px):
  - inventory: Package (amber)
  - customers: Users (indigo)
  - sales: TrendingDown (rose)
  - campaigns: Megaphone (purple)
  - credits: CreditCard (slate)
- Timestamp: text-xs text-slate-600 (ml-auto)

Title: text-sm font-semibold text-white mt-2
Description: text-xs text-slate-400 mt-1 leading-relaxed

Action button (if action exists):
- mt-3 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors
- HIGH: bg-rose-500/10 text-rose-400 hover:bg-rose-500/20
- MEDIUM: bg-amber-500/10 text-amber-400 hover:bg-amber-500/20
- LOW: bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20
- ChevronRight icon after text

### app/(dashboard)/alerts/page.tsx
'use client', fetch /api/alerts on load.

Header section:
```
<Topbar title="Smart Alerts" subtitle="Rule-based monitoring from your business data" />
```

Below topbar, inside padded container:

Summary bar: 3 pill badges showing counts
- "2 High" with red dot + count
- "1 Medium" with amber dot + count
- "1 Low" with slate dot + count
- Total count: "4 Active Alerts" text-sm text-slate-400

Filter tabs: All | High | Medium | Low (shadcn Tabs or simple button group)
- Active tab: bg-indigo-500/10 text-indigo-400 border border-indigo-500/20
- Inactive: text-slate-400 hover:text-white

Alerts list: filtered by selected tab, grouped by level with section headers:
```
"HIGH PRIORITY" text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 mt-6
[AlertCard] [AlertCard]
"MEDIUM PRIORITY" ...
[AlertCard]
"LOW PRIORITY" ...
[AlertCard]
```

Empty state (no alerts): centered icon (ShieldCheck in emerald) + "All clear! No active alerts." text + "Your business is running smoothly." subtext

Loading: 4 skeleton cards (pulsing rounded-2xl)

Also update the Sidebar.tsx to dynamically show the alert count badge (fetch /api/alerts on mount, show count).

Output: confirm all files, describe visual result.
```

---

---

# PHASE 5 — AI Insights Page

```
You are building Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 5: Build the AI Insights page — the core feature powered by Claude AI.

## Context
- Anthropic SDK: @anthropic-ai/sdk v0.32.x
- Model: claude-haiku-4-5-20251001
- Insights are generated fresh each time user clicks "Refresh"
- Response must be valid JSON (array of insight objects)
- lib/mock-data/index.ts → getBusinessSnapshot() provides business context

## Files to Create

### lib/anthropic.ts
```typescript
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const AI_MODEL = 'claude-haiku-4-5-20251001'
```

### lib/prompts.ts
```typescript
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
```

### app/api/insights/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { buildInsightsPrompt } from '@/lib/prompts'
import { getBusinessSnapshot } from '@/lib/mock-data'

export async function POST(req: NextRequest) {
  try {
    const snapshot = getBusinessSnapshot()
    const prompt = buildInsightsPrompt(snapshot)

    const message = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }, { timeout: 30000 })

    const text = (message.content[0] as any).text
    // Extract JSON — find array between [ and ]
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')

    const insights = JSON.parse(jsonMatch[0])
    return NextResponse.json({ insights, generatedAt: new Date().toISOString() })
  } catch (err: any) {
    console.error('Insights error:', err)
    return NextResponse.json({ error: 'Failed to generate insights', message: err.message }, { status: 500 })
  }
}
```

### components/insights/InsightCard.tsx
Props:
```typescript
interface InsightCardProps {
  insight: {
    type: 'opportunity' | 'warning' | 'achievement' | 'recommendation'
    priority: 'high' | 'medium' | 'low'
    title: string
    body: string
    action?: string | null
    actionLink?: string | null
  }
  index: number
}
```

Design:
- animate-fade-in with stagger: style={{ animationDelay: `${index * 100}ms`, opacity: 0 }} → animation fills forward
- Container: rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.015] hover:shadow-glow group

Type → visual mapping:
- opportunity: bg-indigo-950/40 border-indigo-500/20 hover:border-indigo-500/40
- warning: bg-amber-950/30 border-amber-500/20 hover:border-amber-500/40
- achievement: bg-emerald-950/30 border-emerald-500/20 hover:border-emerald-500/40
- recommendation: bg-slate-800/40 border-white/[0.06] hover:border-white/10

Top row:
- Left: type badge pill
  - opportunity: bg-indigo-500/15 text-indigo-400 "OPPORTUNITY"
  - warning: bg-amber-500/15 text-amber-400 "WARNING"
  - achievement: bg-emerald-500/15 text-emerald-400 "ACHIEVEMENT"
  - recommendation: bg-slate-500/15 text-slate-400 "RECOMMENDATION"
- Right: priority dot + priority text (text-xs text-slate-500)
  - high: dot bg-rose-400
  - medium: dot bg-amber-400
  - low: dot bg-slate-500

Type icon (below badge, large 20px):
- opportunity: Lightbulb (indigo)
- warning: AlertTriangle (amber)
- achievement: Trophy (emerald)
- recommendation: Sparkles (slate)

Title: text-sm font-semibold text-white mt-2 leading-snug

Body: text-xs text-slate-400 mt-2 leading-relaxed

Action button (if exists):
- mt-4 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 transition-all
- opportunity/recommendation: bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 group-hover:translate-x-0.5
- warning: bg-amber-500/10 text-amber-400 hover:bg-amber-500/20
- achievement: bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20
- ArrowUpRight icon (14px) after text

### components/insights/InsightFeed.tsx
Props: { insights: InsightCard[], loading: boolean, error: string | null }

- Loading: 6 skeleton cards in grid, each pulsing
- Error: centered AlertCircle icon + error message + "Try Again" button
- Loaded: grid grid-cols-1 md:grid-cols-2 gap-4, renders InsightCard for each

### app/(dashboard)/insights/page.tsx
'use client'

State: insights[], loading, error, lastGenerated (timestamp)

On mount: auto-fetch from POST /api/insights

Topbar:
- title="AI Insights"
- actions= Refresh button: "Regenerate" with RefreshCw icon, onClick triggers new fetch
  - Style: bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 rounded-lg px-4 py-2 text-sm font-medium
  - Loading state: RefreshCw spins (animate-spin)

Below topbar, padded container:

Info bar: "Generated by Claude AI · Last updated: {lastGenerated}" in text-xs text-slate-500 + a small indigo AI badge

Filter buttons: All | Opportunity | Warning | Achievement | Recommendation
- Active: bg-indigo-500/10 text-indigo-400 border border-indigo-500/20
- Count badges on each filter

InsightFeed component

Output: confirm all files, describe visual result.
```

---

---

# PHASE 6 — AI Chat Page

```
You are building Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 6: Build the AI Chat (Business Advisor) page with streaming Claude responses.

## Context
- Use @anthropic-ai/sdk v0.32.x
- Streaming: use anthropic.messages.stream() → yields text chunks
- Business context is included in every request via the system prompt
- Conversation history maintained in client state

## Files to Create

### app/api/chat/route.ts
```typescript
import { NextRequest } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { buildChatSystemPrompt } from '@/lib/prompts'
import { getBusinessSnapshot } from '@/lib/mock-data'

export async function POST(req: NextRequest) {
  const { message, history } = await req.json()
  const snapshot = getBusinessSnapshot()
  const systemPrompt = buildChatSystemPrompt(snapshot)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const msgStream = anthropic.messages.stream({
          model: AI_MODEL,
          max_tokens: 512,
          system: systemPrompt,
          messages: [
            ...history,
            { role: 'user', content: message }
          ],
        })

        for await (const chunk of msgStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  })
}
```

### components/chat/ChatMessage.tsx
Props:
```typescript
interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  index: number
}
```

User message:
- Right aligned (justify-end)
- Bubble: bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed
- No avatar

Assistant message:
- Left aligned (justify-start)
- Avatar: 28px circle, indigo gradient bg, small "L" letter text-xs font-bold text-white (Lens logo)
- Bubble: bg-[#1A2235] border border-white/[0.06] text-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] text-sm leading-relaxed
- If isStreaming: show a blinking cursor after content (animate-pulse inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle)

Animate each message: animate-fade-in style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}

### components/chat/ChatInput.tsx
Props: { onSend: (msg: string) => void, disabled: boolean }

Design:
- Container: border-t border-white/[0.06] bg-[#0A0F1E]/80 backdrop-blur-md p-4
- Quick prompts row (above input): 4 chip buttons
  - "Aaj kaisa raha?"
  - "Top products?"
  - "Slow items?"
  - "Next week forecast?"
  - Style: bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-slate-400 hover:text-white rounded-full px-3 py-1.5 transition-all
  - On click: calls onSend with that question

- Input row: flex gap-3
  - Textarea (auto-resize, max 3 lines): bg-[#0F1629] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none resize-none flex-1 transition-colors
  - Placeholder: "Apne business ke baare mein kuch poochho..."
  - Send button: bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl p-3 transition-all
    - Icon: Send (16px, white)
    - Disabled (streaming): Loader2 spin icon instead

- Enter key sends (Shift+Enter = new line)

### components/chat/ChatWindow.tsx
Full chat area component.

State:
- messages: { role: 'user'|'assistant', content: string }[]
- isStreaming: boolean
- currentStreamText: string (builds up during streaming)

Initial message: one assistant message on mount:
"Namaste Rajesh ji! Main Astra Lens hoon, aapka AI business advisor. Aaj main aapki kaise madad kar sakta hoon? Aap apni sales, inventory, customers — kuch bhi pooch sakte ho!"

handleSend(message):
1. Add user message to messages[]
2. Set isStreaming = true, currentStreamText = ''
3. POST /api/chat with message + history (last 10 messages)
4. Read stream: const reader = res.body.getReader() → loop reading chunks → decode + append to currentStreamText → re-render
5. On stream end: add complete assistant message to messages[], clear currentStreamText, isStreaming = false

Scroll behavior: useRef on messages container, scroll to bottom on every new message or stream chunk.

Layout:
- Full height: h-[calc(100vh-64px-1px)] (subtract topbar)
- Messages area: flex-1 overflow-y-auto px-4 py-6 space-y-4 (custom scrollbar)
  - Show messages[] rendered as ChatMessage
  - If isStreaming: show an extra assistant ChatMessage with content=currentStreamText, isStreaming=true
- Input area: flex-none (ChatInput component)

Empty state (only initial greeting shown): subtle background pattern or indigo glow blob.

### app/(dashboard)/chat/page.tsx
'use client'
- Topbar: title="Business Advisor", subtitle="Powered by Claude AI"
- ChatWindow (full remaining height)

Output: confirm all files, describe streaming behavior and visual.
```

---

---

# PHASE 7 — Ecosystem Page

```
You are building Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 7: Build the Ecosystem page — a visual overview of the entire Astra Studio product suite.

## Context
- This is the "wow" page — visual storytelling
- Shows Atlas → Lens → Spark as an interconnected ecosystem
- Uses animated connections between the three products
- Serves as a pitch/demo centerpiece

## Files to Create

### components/ecosystem/ProductCard.tsx
Props:
```typescript
interface ProductCardProps {
  name: string          // "Astra Atlas"
  tagline: string       // "Business Operations"
  color: string         // "blue" | "indigo" | "orange"
  icon: LucideIcon
  features: string[]    // 4 bullet points
  stats: { label: string; value: string }[]  // 2-3 stats
  link: string
  isCenter?: boolean    // true for Lens (larger)
  delay?: number
}
```

Design:
- animate-fade-in with delay
- Container: relative rounded-2xl border p-6 transition-all
- Atlas (blue): border-blue-500/20 bg-blue-950/20 hover:border-blue-500/40
- Lens (indigo, center, isCenter=true): border-indigo-500/30 bg-indigo-950/30 hover:border-indigo-500/50 scale-105 shadow-glow
- Spark (orange): border-orange-500/20 bg-orange-950/20 hover:border-orange-500/40

Top: icon in colored rounded-xl (32px, p-2) + product name text-base font-bold text-white + tagline text-xs colored text

Features list: mt-4 space-y-2
- Each: flex gap-2 text-xs text-slate-400, with small Check icon (colored, 12px)

Stats row: mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2
- Each stat: label text-xs text-slate-500 + value text-sm font-bold text-white

Bottom: "Open {name} ↗" link — colored text-xs font-medium hover:underline

### components/ecosystem/FlowArrow.tsx
A simple animated arrow between cards (CSS or SVG).

- Horizontal arrow: "—→" with a flow animation (shimmer moving left to right)
- Implementation: div with gradient bg (colored → transparent) + animate-pulse or CSS @keyframes flow
- Label: small centered pill above arrow: "reads data" or "triggers actions"

### app/(dashboard)/ecosystem/page.tsx
'use client'

Topbar: title="Astra Studio Ecosystem", subtitle="One platform. Three products. Complete business intelligence."

Page layout (padded container, max-w-6xl):

HERO TEXT (center, mb-12):
- Gradient heading: "The Complete Small Business OS for Bharat"
  - text-3xl font-bold, gradient-text class
- Subtext: text-slate-400 text-sm max-w-xl mx-auto text-center mt-2

ECOSYSTEM VISUAL (3-column grid with arrows between):
```
[Atlas Card] → [Lens Card — highlighted] → [Spark Card]
```
- grid: flex items-center gap-4 (use flex, not grid, so arrows fit naturally)
- Atlas card: flex-1
- Arrow 1: flex-none w-24 (FlowArrow label="Data Flow")
- Lens card: flex-1 (isCenter=true, slightly larger/highlighted)
- Arrow 2: flex-none w-24 (FlowArrow label="Actions")
- Spark card: flex-1

Product data:
Atlas:
- color: blue, icon: Building2
- features: ["Billing & Invoices", "Inventory Management", "Customer Database", "GST Reports"]
- stats: [{ label: "Customers", value: "847" }, { label: "Invoices", value: "2,341" }]
- link: process.env.NEXT_PUBLIC_ATLAS_URL

Lens:
- color: indigo, icon: Brain
- features: ["AI Insights (Claude)", "Smart Alerts", "Business Chat", "Trend Analysis"]
- stats: [{ label: "Insights Today", value: "6" }, { label: "Alerts Active", value: "4" }]
- link: "#" (current app)
- isCenter: true

Spark:
- color: orange, icon: Zap
- features: ["WhatsApp Campaigns", "Social Scheduling", "Reel Scripts (AI)", "Ad Budget Manager"]
- stats: [{ label: "Messages/mo", value: "940" }, { label: "Campaigns", value: "8" }]
- link: process.env.NEXT_PUBLIC_SPARK_URL

STORY SECTION (below visual, mt-12):
3 step cards in a row: "How it works"
1. "Atlas captures data" — every sale, every customer, every product update
2. "Lens analyzes and advises" — AI reads the data, spots patterns, recommends actions
3. "Spark executes marketing" — campaigns launch, messages sent, content created
Each step: numbered pill (1, 2, 3 in gradient circles) + title + description

BOTTOM CTA (centered, mt-12):
- Large text: "Built for 6.3 crore small businesses in Bharat"
- Subtext: text-slate-400 "No consultants. No complexity. Just clarity."
- Two buttons: "Explore Atlas →" (blue outline) + "Explore Spark →" (orange outline)

Use framer-motion for entrance animations:
- Cards: initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.15 }}
- Arrows: initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 0.4 }}

Output: confirm all files, describe the visual storytelling effect.
```

---

---

# PHASE 8 — Polish, Animations & Mobile

```
You are polishing Astra Lens — a dark-themed AI business intelligence dashboard.
Phase 8: Final polish — animations, mobile responsiveness, empty states, loading states, and production readiness.

## Tasks

### 1. Global Animations (app/globals.css additions)
Add:
```css
/* Stagger fade-in for lists */
.stagger-children > * {
  opacity: 0;
  animation: fadeIn 0.4s ease forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 80ms; }
.stagger-children > *:nth-child(3) { animation-delay: 160ms; }
.stagger-children > *:nth-child(4) { animation-delay: 240ms; }
.stagger-children > *:nth-child(5) { animation-delay: 320ms; }
.stagger-children > *:nth-child(6) { animation-delay: 400ms; }

/* Shimmer for skeletons */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.skeleton {
  background: linear-gradient(90deg, #0F1629 25%, #1A2235 50%, #0F1629 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Glow pulse for active elements */
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px -5px rgba(99,102,241,0.3); }
  50% { box-shadow: 0 0 40px -5px rgba(99,102,241,0.6); }
}
.glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
```

### 2. Mobile Sidebar (components/layout/Sidebar.tsx)
Add mobile support:
- On mobile (<768px): sidebar is hidden, replaced by bottom navigation
- Bottom nav: fixed bottom-0, bg-[#0A0F1E]/95 backdrop-blur border-t border-white/[0.06]
- 5 icons evenly spaced, active icon has indigo color + small dot indicator below
- Hamburger icon in topbar on mobile opens a slide-in drawer (use useState for open/close)
- Drawer: full-height overlay from left, same sidebar content, closes on backdrop click

### 3. Loading Skeleton Component (components/shared/Skeleton.tsx)
```typescript
export function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-2xl', className)} />
}

export function SkeletonText({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md h-4', className)} />
}
```
Use these in every page's loading state.

### 4. Error Boundary (components/shared/ErrorBoundary.tsx)
Simple client-side error boundary:
- Shows centered error card: rose border, AlertCircle icon, "Something went wrong" + error message + "Retry" button
- Use React's class-based ErrorBoundary or a try-catch approach in each page

### 5. Toast Notifications (no library — simple custom)
Create components/shared/Toast.tsx:
- Fixed bottom-right position
- Slides in from right (CSS transition)
- Auto-dismisses after 3s
- Types: success (emerald), error (rose), info (indigo)
- Used for: "Insights refreshed!", "Failed to load", etc.

Create a simple useToast hook in lib/hooks/useToast.ts using useState + setTimeout.

### 6. Page Transitions
In app/(dashboard)/layout.tsx, wrap children with:
```typescript
<div key={pathname} className="animate-fade-in">
  {children}
</div>
```
Use usePathname() to trigger re-animation on route change.

### 7. Topbar — Add Date/Time
In components/layout/Topbar.tsx, add a live clock on the right:
- Shows current time, updates every minute
- Text: "Sat, 7 Mar 2026 · 11:42 AM" in text-xs text-slate-500
- Pair with a thin refresh last-updated indicator

### 8. Dashboard — Holi Campaign Banner
Add a contextual seasonal banner on the dashboard (Holi is March 14, 2026 — one week away):

```
+-------------------------------------------------------+
| 🎨  Holi is 7 days away!                              |
| Launch a special offer campaign on Spark to boost    |
| sales. Last year shops saw 40% higher footfall.      |
| [Create Holi Campaign →]                             |
+-------------------------------------------------------+
```

Style: bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-500/20 rounded-2xl p-4
Position: below stats row, above chart row.

### 9. README Updates
Update README.md (already exists at project root) to add:
- Screenshots section (placeholder: "Screenshots coming soon")
- Live demo URL if deployed to Vercel
- Team section

### 10. Final Checks
- Ensure all pages have proper <title> via Next.js metadata or generateMetadata
- Ensure all images/icons have proper alt texts
- Remove all console.log() from production code (or guard with process.env.NODE_ENV !== 'production')
- Verify all API routes have try-catch with proper error responses
- Test that the app builds successfully: `npm run build`

Output: list every change made and confirm `npm run build` passes.
```

---

END OF MASTER PROMPTS
