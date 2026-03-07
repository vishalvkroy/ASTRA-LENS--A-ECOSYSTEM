# Astra Lens — Architecture

---

## System Overview

Astra Lens is a standalone Next.js 14 application (App Router) with no separate backend server. All API logic lives in Next.js API routes. Data is sourced from mock seed files simulating Atlas + Spark databases.

```
Browser
  |
  v
Next.js 14 (App Router)
  |-- /app/(dashboard)/page.tsx          → Dashboard
  |-- /app/(dashboard)/insights/page.tsx → AI Insight Cards
  |-- /app/(dashboard)/chat/page.tsx     → AI Business Advisor
  |-- /app/(dashboard)/alerts/page.tsx   → Smart Alerts
  |-- /app/(dashboard)/ecosystem/page.tsx → Atlas+Lens+Spark Visual
  |
  |-- /app/api/insights/route.ts         → POST: Generate AI insights
  |-- /app/api/chat/route.ts             → POST: AI advisor chat
  |-- /app/api/summary/route.ts          → GET: Business summary
  |-- /app/api/alerts/route.ts           → GET: Smart alerts
  |
  v
lib/
  |-- mock-data/atlas.ts    → Simulated Atlas data (sales, inventory, customers)
  |-- mock-data/spark.ts    → Simulated Spark data (campaigns, message stats)
  |-- anthropic.ts          → Claude API client
  |-- prompts.ts            → All AI prompt templates
```

---

## Folder Structure

```
apps/lens/
├── app/
│   ├── layout.tsx                    # Root layout (font, sidebar)
│   ├── page.tsx                      # Redirect to dashboard
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Sidebar + topbar layout
│   │   ├── page.tsx                  # Main dashboard
│   │   ├── insights/
│   │   │   └── page.tsx              # AI insight cards page
│   │   ├── chat/
│   │   │   └── page.tsx              # AI advisor chat
│   │   ├── alerts/
│   │   │   └── page.tsx              # Smart alerts
│   │   └── ecosystem/
│   │       └── page.tsx              # Ecosystem visual
│   └── api/
│       ├── insights/
│       │   └── route.ts              # POST /api/insights
│       ├── chat/
│       │   └── route.ts              # POST /api/chat
│       ├── summary/
│       │   └── route.ts              # GET /api/summary
│       └── alerts/
│           └── route.ts              # GET /api/alerts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # Left navigation
│   │   └── Topbar.tsx                # Top bar with business name
│   ├── dashboard/
│   │   ├── StatCard.tsx              # Metric card (sales, customers etc.)
│   │   ├── RevenueChart.tsx          # Line chart (7-day revenue)
│   │   ├── TopProducts.tsx           # Top 5 products list
│   │   └── CustomerActivity.tsx      # Recent customer activity
│   ├── insights/
│   │   ├── InsightCard.tsx           # Single AI recommendation card
│   │   └── InsightFeed.tsx           # List of insight cards
│   ├── chat/
│   │   ├── ChatInput.tsx             # Message input
│   │   ├── ChatMessage.tsx           # Single message bubble
│   │   └── ChatWindow.tsx            # Full chat UI
│   ├── alerts/
│   │   └── AlertCard.tsx             # Single alert card
│   └── ecosystem/
│       └── EcosystemMap.tsx          # Atlas → Lens → Spark visual
├── lib/
│   ├── mock-data/
│   │   ├── atlas.ts                  # Mock Atlas data
│   │   ├── spark.ts                  # Mock Spark data
│   │   └── index.ts                  # Combined business snapshot
│   ├── anthropic.ts                  # Anthropic client singleton
│   ├── prompts.ts                    # AI prompt templates
│   └── utils.ts                      # formatCurrency, formatDate etc.
├── .env.local                        # ANTHROPIC_API_KEY
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── components.json                   # shadcn config
└── package.json
```

---

## Data Flow

### Dashboard Load
```
page.tsx
  → GET /api/summary
    → lib/mock-data/index.ts (returns business snapshot)
  → renders StatCards, RevenueChart, TopProducts
```

### AI Insights Generation
```
InsightFeed.tsx
  → POST /api/insights { businessSnapshot }
    → lib/anthropic.ts (Claude API call)
    → lib/prompts.ts (INSIGHTS_PROMPT)
    → returns: InsightCard[]
```

### AI Chat
```
ChatWindow.tsx (user sends message)
  → POST /api/chat { message, conversationHistory, businessSnapshot }
    → lib/anthropic.ts (Claude API call with context)
    → lib/prompts.ts (CHAT_SYSTEM_PROMPT)
    → streams response back
```

### Smart Alerts
```
alerts/page.tsx
  → GET /api/alerts
    → lib/mock-data/index.ts
    → rule-based checks (low stock, churn risk, sales drop)
    → returns: Alert[]
```

---

## Mock Data Schema

### Atlas Mock Data (lib/mock-data/atlas.ts)
```typescript
interface AtlasSnapshot {
  business: {
    name: string         // "Sharma General Store"
    owner: string        // "Rajesh Sharma"
    location: string     // "Kanpur, UP"
    category: string     // "General Store"
  }
  sales: {
    today: number        // 12400 (INR)
    yesterday: number
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
    trend: DailySale[]   // Last 7 days
  }
  inventory: {
    totalItems: number
    lowStockItems: LowStockItem[]
    topProducts: Product[]
    slowMoving: Product[]
  }
  customers: {
    total: number
    active: number        // Bought in last 30 days
    inactive: number      // Not bought in 30+ days
    newThisMonth: number
    topCustomers: Customer[]
    recentActivity: CustomerActivity[]
  }
}
```

### Spark Mock Data (lib/mock-data/spark.ts)
```typescript
interface SparkSnapshot {
  campaigns: {
    total: number
    running: number
    lastCampaign: {
      name: string
      sentAt: string
      delivered: number
      opened: number
      clicked: number
    }
  }
  whatsapp: {
    messagesSentThisMonth: number
    deliveryRate: number
    openRate: number
  }
  topPerformingContent: string[]
}
```

---

## AI Prompt Architecture

### INSIGHTS_PROMPT
Sends the full business snapshot to Claude and asks for 4-6 structured insight cards in JSON format.

Each card has:
- `type`: "opportunity" | "warning" | "recommendation" | "achievement"
- `title`: Short headline
- `body`: Plain-language explanation (Hindi/English mixed ok)
- `action`: Optional CTA ("Launch campaign on Spark", "Restock now")
- `actionLink`: Optional deep link to Spark or Atlas
- `priority`: "high" | "medium" | "low"

### CHAT_SYSTEM_PROMPT
Sets Claude's persona as a friendly Indian business advisor. Includes full business snapshot as context. Responds in Hinglish (Hindi + English mix) or pure English based on user's input language.

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_NAME=Astra Lens
NEXT_PUBLIC_ATLAS_URL=https://atlas.astrastudio.in
NEXT_PUBLIC_SPARK_URL=https://spark.astrastudio.in
```

---

## Key Design Decisions

1. **No separate backend** — Next.js API routes keep the stack simple for hackathon
2. **Mock data only** — No DB setup needed; seed data is realistic enough for demo
3. **Streaming AI chat** — Uses Vercel AI SDK `streamText` for real-time chat feel
4. **Claude Haiku** — Fast and cheap for hackathon; easy to swap to Sonnet/Opus
5. **shadcn/ui** — Pre-built accessible components, zero design time wasted
6. **Indigo brand color** — Distinct from Atlas (blue) and Spark (orange); feels "intelligent"
