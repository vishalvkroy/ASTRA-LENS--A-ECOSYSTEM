# Astra Lens — Tech Stack & Architecture Reference

---

## Frontend

| What | Technology | Version | Why |
|------|-----------|---------|-----|
| Framework | Next.js | 14.2.29 | App Router, API routes, SSR |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.4.x | Utility-first, fast UI |
| Components | shadcn/ui | latest | Pre-built accessible components |
| Icons | lucide-react | 0.469.x | Clean icon set |
| Charts | Recharts | 2.12.x | Revenue trend charts |
| Animations | Framer Motion | 11.x | Page transitions, card animations |
| Font | Inter (Google Fonts) | - | Clean, professional |

---

## AI / Backend

| What | Technology | Version | Why |
|------|-----------|---------|-----|
| AI Model | Claude Haiku | claude-haiku-4-5-20251001 | Fast, cheap, smart |
| AI SDK | @anthropic-ai/sdk | 0.32.x | Official Anthropic SDK |
| API Layer | Next.js API Routes | - | No separate backend needed |
| Data | Mock JSON (TypeScript) | - | No DB needed for hackathon demo |

---

## Utilities

| What | Technology |
|------|-----------|
| Class merging | clsx + tailwind-merge |
| Variant styles | class-variance-authority |
| Currency format | Intl.NumberFormat (en-IN, INR) |

---

## Hosting / Deployment

| What | Platform |
|------|---------|
| Frontend + API | Vercel (bom1 — Mumbai region) |
| Environment vars | Vercel dashboard |

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_NAME=Astra Lens
NEXT_PUBLIC_ATLAS_URL=https://atlas.astrastudio.in
NEXT_PUBLIC_SPARK_URL=https://spark.astrastudio.in
```

---

## Architecture — How It Works

```
Browser
   │
   ▼
Next.js 14 (App Router)
   │
   ├── /app/(dashboard)/          ← All UI pages
   │     ├── page.tsx             → Dashboard
   │     ├── insights/page.tsx    → AI Insight Cards
   │     ├── chat/page.tsx        → AI Chat Advisor
   │     ├── alerts/page.tsx      → Smart Alerts
   │     └── ecosystem/page.tsx   → Atlas+Lens+Spark Visual
   │
   ├── /app/api/                  ← Backend (API Routes)
   │     ├── summary/route.ts     → GET  — business snapshot
   │     ├── insights/route.ts    → POST — Claude AI insights
   │     ├── chat/route.ts        → POST — Claude AI chat (streaming)
   │     └── alerts/route.ts      → GET  — rule-based alerts
   │
   └── /lib/
         ├── mock-data/           ← Simulated Atlas + Spark data
         ├── anthropic.ts         ← Claude client
         ├── prompts.ts           ← AI prompt templates
         └── utils.ts             ← formatCurrency, formatDate etc.
```

---

## API Routes — Quick Reference

| Method | Route | What it does |
|--------|-------|-------------|
| GET | /api/summary | Returns full business snapshot (sales, inventory, customers, campaigns) |
| POST | /api/insights | Sends snapshot to Claude → returns 6 AI insight cards as JSON |
| POST | /api/chat | Sends message + history to Claude → streams response back |
| GET | /api/alerts | Runs rule-based checks on snapshot → returns prioritized alerts |

---

## AI — How Claude Is Used

### 1. Insights Generation
- **Input:** Full business snapshot (sales, inventory, customers, Spark data)
- **Prompt:** Asks Claude to return exactly 6 insight cards as a JSON array
- **Output:** Array of `{ type, priority, title, body, action, actionLink }`
- **Model:** claude-haiku-4-5-20251001
- **Max tokens:** 2048

### 2. Business Chat (Streaming)
- **Input:** User message + conversation history (last 10 messages) + system prompt
- **System prompt:** Includes full business snapshot as context
- **Output:** Streamed text response in Hinglish
- **Model:** claude-haiku-4-5-20251001
- **Max tokens:** 512

---

## Data Flow

```
Atlas Mock Data  ──┐
                   ├──► Business Snapshot ──► Claude AI ──► Insights / Chat
Spark Mock Data  ──┘         │
                             │
                             └──► Rule Engine ──► Smart Alerts
```

---

## Pages — What Each Does

| Page | Route | Data Source |
|------|-------|------------|
| Dashboard | /dashboard | /api/summary (mock data) |
| AI Insights | /dashboard/insights | /api/insights (Claude AI) |
| Chat Advisor | /dashboard/chat | /api/chat (Claude AI, streaming) |
| Smart Alerts | /dashboard/alerts | /api/alerts (rule-based) |
| Ecosystem | /dashboard/ecosystem | Static + mock stats |

---

## Design System

| Property | Value |
|----------|-------|
| Primary color | Indigo `#6366F1` |
| Background | Deep navy `#0A0F1E` |
| Card background | `#0F1629` |
| Border | `#1E2A45` |
| Warning | Amber `#F59E0B` |
| Success | Emerald `#10B981` |
| Danger | Rose `#F43F5E` |
| Font | Inter |
| Style | Dark theme, glassmorphism cards |

---

## Package.json (Full Dependencies)

```json
{
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
    "postcss": "^8"
  }
}
```

---

## Ecosystem — How Atlas + Spark Connect

```
ASTRA ATLAS                ASTRA LENS               ASTRA SPARK
(Billing & Inventory)  →   (Intelligence)       →   (Marketing)

- Sales data               - Reads Atlas data        - WhatsApp Campaigns
- Customer records         - Reads Spark stats        - Social Media Posts
- Inventory levels         - Claude AI analyzes       - Reel Scripts
- GST reports              - Gives insights           - Ad Budget Manager
                           - Smart alerts
                           - Chat advisor
                           - Links back to Spark
```

**In production:** Lens calls Atlas REST API + Spark PostgreSQL (read-only) to get live data instead of mock data. Schema is already designed to match.
