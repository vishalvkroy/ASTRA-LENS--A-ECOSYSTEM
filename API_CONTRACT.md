# Astra Lens — API Contract

All routes are Next.js API routes under `/app/api/`.
Base URL: `http://localhost:3000/api`

---

## GET /api/summary

Returns the full business snapshot (Atlas + Spark mock data combined).

**Response**
```json
{
  "business": {
    "name": "Sharma General Store",
    "owner": "Rajesh Sharma",
    "location": "Kanpur, UP",
    "category": "General Store"
  },
  "sales": {
    "today": 12400,
    "yesterday": 10500,
    "thisWeek": 67200,
    "lastWeek": 58900,
    "thisMonth": 245000,
    "lastMonth": 218000,
    "trend": [
      { "date": "2026-03-01", "amount": 9200 },
      { "date": "2026-03-02", "amount": 11400 },
      { "date": "2026-03-03", "amount": 8700 },
      { "date": "2026-03-04", "amount": 13200 },
      { "date": "2026-03-05", "amount": 10100 },
      { "date": "2026-03-06", "amount": 10500 },
      { "date": "2026-03-07", "amount": 12400 }
    ]
  },
  "inventory": {
    "totalItems": 142,
    "lowStockItems": [
      { "id": "1", "name": "Basmati Rice 5kg", "stock": 5, "unit": "bags", "daysLeft": 3 },
      { "id": "2", "name": "Tata Salt 1kg", "stock": 12, "unit": "packets", "daysLeft": 6 }
    ],
    "topProducts": [
      { "id": "1", "name": "Basmati Rice 5kg", "soldThisMonth": 84, "revenue": 42000 },
      { "id": "2", "name": "Tata Salt 1kg", "soldThisMonth": 210, "revenue": 21000 },
      { "id": "3", "name": "Surf Excel 1kg", "soldThisMonth": 60, "revenue": 18000 },
      { "id": "4", "name": "Fortune Oil 1L", "soldThisMonth": 45, "revenue": 13500 },
      { "id": "5", "name": "Amul Butter 500g", "soldThisMonth": 38, "revenue": 9500 }
    ],
    "slowMoving": [
      { "id": "6", "name": "Bournvita 500g", "soldThisMonth": 3, "stock": 24 },
      { "id": "7", "name": "Nescafe Classic 100g", "soldThisMonth": 2, "stock": 18 }
    ]
  },
  "customers": {
    "total": 847,
    "active": 312,
    "inactive": 535,
    "newThisMonth": 23,
    "topCustomers": [
      { "id": "1", "name": "Priya Verma", "totalSpent": 18400, "lastVisit": "2026-03-07" },
      { "id": "2", "name": "Amit Singh", "totalSpent": 14200, "lastVisit": "2026-03-06" },
      { "id": "3", "name": "Sunita Devi", "totalSpent": 12800, "lastVisit": "2026-03-05" }
    ],
    "recentActivity": [
      { "customerId": "1", "name": "Priya Verma", "action": "Purchase", "amount": 1240, "time": "2 hours ago" },
      { "customerId": "4", "name": "Rakesh Kumar", "action": "Purchase", "amount": 580, "time": "4 hours ago" },
      { "customerId": "2", "name": "Amit Singh", "action": "Purchase", "amount": 2100, "time": "Yesterday" }
    ]
  },
  "spark": {
    "campaigns": {
      "total": 8,
      "running": 2,
      "lastCampaign": {
        "name": "Holi Special Offer",
        "sentAt": "2026-03-05",
        "delivered": 480,
        "opened": 312,
        "clicked": 89
      }
    },
    "whatsapp": {
      "messagesSentThisMonth": 940,
      "deliveryRate": 96.2,
      "openRate": 68.4
    }
  }
}
```

---

## POST /api/insights

Generates AI-powered insight cards using Claude based on business snapshot.

**Request**
```json
{
  "businessSnapshot": { ... }   // Same shape as /api/summary response
}
```

**Response**
```json
{
  "insights": [
    {
      "id": "ins_001",
      "type": "warning",
      "priority": "high",
      "title": "Basmati Rice stock running low",
      "body": "Aapke paas sirf 5 bags bache hain. Current sales rate pe 3 din mein khatam ho jayega. Friday se pehle restock kar lijiye.",
      "action": "Restock Now",
      "actionLink": "https://atlas.astrastudio.in/inventory",
      "generatedAt": "2026-03-07T11:30:00Z"
    },
    {
      "id": "ins_002",
      "type": "opportunity",
      "priority": "high",
      "title": "40 customers haven't visited in 30+ days",
      "body": "535 inactive customers hain. Unhe ek WhatsApp message bhejne se 15-20% wapas aa sakte hain. Holi offer perfect timing hai.",
      "action": "Launch Campaign on Spark",
      "actionLink": "https://spark.astrastudio.in/whatsapp/campaigns/new",
      "generatedAt": "2026-03-07T11:30:00Z"
    },
    {
      "id": "ins_003",
      "type": "achievement",
      "priority": "low",
      "title": "Revenue up 14% this week",
      "body": "Is hafte ₹67,200 ki bikri hui — pichle hafte se ₹8,300 zyada. Basmati Rice aur Tata Salt ne sabse bada contribution diya.",
      "action": null,
      "actionLink": null,
      "generatedAt": "2026-03-07T11:30:00Z"
    },
    {
      "id": "ins_004",
      "type": "recommendation",
      "priority": "medium",
      "title": "Bournvita and Nescafe are slow-moving",
      "body": "Ye items kaafi time se shelf pe pad rahe hain. Bundle offer try karein — jaise 'Rice ke saath Nescafe free'. Spark pe ek reel bana sakte ho is ke liye.",
      "action": "Create Reel on Spark",
      "actionLink": "https://spark.astrastudio.in/reelscript",
      "generatedAt": "2026-03-07T11:30:00Z"
    }
  ]
}
```

**Error Response**
```json
{
  "error": "Failed to generate insights",
  "message": "ANTHROPIC_API_KEY not configured"
}
```
Status: `500`

---

## POST /api/chat

AI business advisor chat. Supports conversation history.

**Request**
```json
{
  "message": "How did I do this week?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Namaste Rajesh! Kya poochna chahte ho?" }
  ],
  "businessSnapshot": { ... }
}
```

**Response** (streaming)
```
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked

Is hafte aapne ₹67,200 ki bikri ki, jo pichle hafte se 14% zyada hai...
```

**Non-streaming fallback response**
```json
{
  "message": "Is hafte aapne ₹67,200 ki bikri ki, jo pichle hafte se 14% zyada hai. Top sellers rahe Basmati Rice (₹4,200) aur Tata Salt (₹2,100). Aur kuch jaanna hai?",
  "role": "assistant"
}
```

---

## GET /api/alerts

Returns rule-based smart alerts derived from mock data (no AI call needed).

**Response**
```json
{
  "alerts": [
    {
      "id": "alert_001",
      "level": "high",
      "category": "inventory",
      "title": "Low Stock: Basmati Rice 5kg",
      "description": "Only 5 bags remaining. At current sales rate, stock will run out in approximately 3 days.",
      "action": "Restock Now",
      "actionLink": "https://atlas.astrastudio.in/inventory/1",
      "createdAt": "2026-03-07T10:00:00Z"
    },
    {
      "id": "alert_002",
      "level": "high",
      "category": "customers",
      "title": "535 Customers Inactive (30+ days)",
      "description": "More than 63% of your customer base hasn't purchased in over 30 days. Consider a re-engagement campaign.",
      "action": "Launch WhatsApp Campaign",
      "actionLink": "https://spark.astrastudio.in/whatsapp/campaigns/new",
      "createdAt": "2026-03-07T10:00:00Z"
    },
    {
      "id": "alert_003",
      "level": "medium",
      "category": "sales",
      "title": "Slow-Moving Inventory: 2 Items",
      "description": "Bournvita and Nescafe have sold fewer than 5 units this month despite healthy stock levels.",
      "action": "Create Promotion",
      "actionLink": "https://spark.astrastudio.in/reelscript",
      "createdAt": "2026-03-07T10:00:00Z"
    },
    {
      "id": "alert_004",
      "level": "low",
      "category": "campaigns",
      "title": "Last Campaign: 7 Days Ago",
      "description": "Your Holi Special campaign was 7 days ago. Regular messaging keeps customers engaged.",
      "action": "Plan Next Campaign",
      "actionLink": "https://spark.astrastudio.in/whatsapp/campaigns/new",
      "createdAt": "2026-03-07T10:00:00Z"
    }
  ],
  "counts": {
    "high": 2,
    "medium": 1,
    "low": 1,
    "total": 4
  }
}
```

---

## Error Format (All Routes)

```json
{
  "error": "Error type",
  "message": "Human-readable description"
}
```

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing fields) |
| 500 | Server error (AI call failed, etc.) |

---

## Claude AI Configuration

```typescript
// lib/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const AI_MODEL = "claude-haiku-4-5-20251001";
export const MAX_TOKENS = 1024;
```

### Insights Prompt Template
```typescript
// lib/prompts.ts
export const buildInsightsPrompt = (snapshot: BusinessSnapshot): string => `
You are an AI business advisor for Indian small shop owners.
Analyze this business data and generate 4-6 actionable insight cards in JSON format.

Business Data:
${JSON.stringify(snapshot, null, 2)}

Return a JSON array of insight objects. Each object must have:
- type: "opportunity" | "warning" | "achievement" | "recommendation"
- priority: "high" | "medium" | "low"
- title: short headline (max 60 chars)
- body: explanation in Hinglish (Hindi + English mix), 2-3 sentences max
- action: CTA button text or null
- actionLink: URL to Atlas or Spark or null

Only return valid JSON. No markdown, no explanation.
`;
```

### Chat System Prompt
```typescript
export const CHAT_SYSTEM_PROMPT = (snapshot: BusinessSnapshot): string => `
You are Astra Lens, an AI business advisor for Indian small shop owners.
You are friendly, practical, and speak in Hinglish (mix of Hindi and English).
Keep responses short and actionable (3-5 sentences max).

Current business context:
- Shop: ${snapshot.business.name}, ${snapshot.business.location}
- Owner: ${snapshot.business.owner}
- Today's sales: ₹${snapshot.sales.today.toLocaleString('en-IN')}
- Active customers: ${snapshot.customers.active} out of ${snapshot.customers.total}
- Low stock items: ${snapshot.inventory.lowStockItems.map(i => i.name).join(', ')}
- Running Spark campaigns: ${snapshot.spark.campaigns.running}

Answer the owner's questions using this context.
When relevant, suggest using Astra Spark for marketing or Astra Atlas for operations.
`;
```
