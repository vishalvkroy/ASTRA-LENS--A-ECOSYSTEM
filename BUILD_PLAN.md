# Astra Lens — 24-Hour Build Plan

Hackathon Start: 11:00 AM, March 7, 2026
Submission Window: 5:00 AM – 8:00 AM, March 8, 2026
Target Submission: 6:00 AM (gives 1hr buffer)

Total Build Time: ~19 hours

---

## Phase 0 — Setup (11:00 AM – 12:00 PM) [1 hour]

- [ ] Create GitHub repo: `astra-studio` (monorepo)
- [ ] Init Next.js 14 app in `apps/lens/`
- [ ] Install dependencies (shadcn, tailwind, lucide, recharts, anthropic, ai)
- [ ] Configure tailwind with indigo brand color
- [ ] Init shadcn/ui (add Card, Button, Badge, Tabs, ScrollArea, Skeleton)
- [ ] Set up folder structure per ARCHITECTURE.md
- [ ] Add `.env.local` with ANTHROPIC_API_KEY
- [ ] Push initial commit: "feat: init astra lens"

---

## Phase 1 — Mock Data Layer (12:00 PM – 1:00 PM) [1 hour]

- [ ] Create `lib/mock-data/atlas.ts` — full AtlasSnapshot object
- [ ] Create `lib/mock-data/spark.ts` — SparkSnapshot object
- [ ] Create `lib/mock-data/index.ts` — combines both into BusinessSnapshot
- [ ] Create `lib/utils.ts` — formatCurrency (INR), formatDate, formatNumber
- [ ] Test: import and console.log the snapshot
- [ ] Push commit: "feat: add mock data layer (atlas + spark)"

---

## Phase 2 — Layout (1:00 PM – 2:30 PM) [1.5 hours]

- [ ] Create root `app/layout.tsx` (Inter font, globals.css)
- [ ] Create `components/layout/Sidebar.tsx` (nav links, active state, bottom business info)
- [ ] Create `components/layout/Topbar.tsx`
- [ ] Create `app/(dashboard)/layout.tsx` (sidebar + main area)
- [ ] Add basic page stubs for all 5 routes (dashboard, insights, chat, alerts, ecosystem)
- [ ] Verify navigation works, active link highlights
- [ ] Push commit: "feat: layout — sidebar + topbar + route stubs"

[LUNCH BREAK: 1:30 PM – 2:30 PM per schedule]

---

## Phase 3 — Dashboard Page (2:30 PM – 4:30 PM) [2 hours]

- [ ] Create `app/api/summary/route.ts` → GET → returns mock snapshot
- [ ] Create `components/dashboard/StatCard.tsx`
- [ ] Create `components/dashboard/RevenueChart.tsx` (Recharts LineChart, 7-day)
- [ ] Create `components/dashboard/TopProducts.tsx` (list with progress bars)
- [ ] Create `components/dashboard/CustomerActivity.tsx` (recent activity list)
- [ ] Wire `app/(dashboard)/page.tsx` to fetch /api/summary
- [ ] Add loading skeletons
- [ ] Push commit: "feat: dashboard page — stats, chart, top products"

---

## Phase 4 — Smart Alerts (4:30 PM – 5:30 PM) [1 hour]

- [ ] Create `app/api/alerts/route.ts` → GET → rule-based alerts from snapshot
- [ ] Create `components/alerts/AlertCard.tsx`
- [ ] Wire `app/(dashboard)/alerts/page.tsx`
- [ ] Add alert count badge on Sidebar nav item
- [ ] Push commit: "feat: smart alerts page"

---

## Phase 5 — AI Insights (5:30 PM – 7:30 PM) [2 hours]

- [ ] Create `lib/anthropic.ts` — Anthropic client
- [ ] Create `lib/prompts.ts` — buildInsightsPrompt + CHAT_SYSTEM_PROMPT
- [ ] Create `app/api/insights/route.ts` → POST → Claude call → returns insight cards
- [ ] Create `components/insights/InsightCard.tsx`
- [ ] Create `components/insights/InsightFeed.tsx`
- [ ] Wire `app/(dashboard)/insights/page.tsx` (fetch on load + Refresh button)
- [ ] Add 3 insight cards on Dashboard page (preview)
- [ ] Handle loading state (skeleton) and error state
- [ ] Push commit: "feat: ai insights — claude-powered recommendation cards"

[DINNER: 8:00 PM – 9:00 PM]

---

## Phase 6 — AI Chat (9:00 PM – 11:00 PM) [2 hours]

- [ ] Create `app/api/chat/route.ts` → POST → streaming Claude response
- [ ] Create `components/chat/ChatMessage.tsx`
- [ ] Create `components/chat/ChatInput.tsx`
- [ ] Create `components/chat/ChatWindow.tsx` (scroll, history, quick prompts)
- [ ] Wire `app/(dashboard)/chat/page.tsx`
- [ ] Add 4 quick prompt chips: "Best products?", "Slow items?", "This week vs last?", "Who are my top customers?"
- [ ] Push commit: "feat: ai chat — business advisor with streaming responses"

[FUN ACTIVITIES: 11:00 PM – 12:00 AM — Take a break!]

---

## Phase 7 — Ecosystem Page (12:00 AM – 1:00 AM) [1 hour]

- [ ] Create `components/ecosystem/EcosystemMap.tsx` (Atlas → Lens → Spark visual)
- [ ] Wire `app/(dashboard)/ecosystem/page.tsx`
- [ ] Add stats from each product below the visual
- [ ] Add "Open Atlas" + "Open Spark" links
- [ ] Push commit: "feat: ecosystem page — astra studio visual overview"

---

## Phase 8 — Polish + Demo Data (1:00 AM – 3:00 AM) [2 hours]

- [ ] Add page transitions / fade-in animations
- [ ] Add empty states for all pages
- [ ] Improve mobile responsiveness
- [ ] Add Holi-themed insight (timely — Holi is March 14, 2026)
- [ ] Make sure all CTAs link to real Spark/Atlas URLs (or demo URLs)
- [ ] Add loading states everywhere
- [ ] Add error boundaries
- [ ] Test full demo flow end-to-end
- [ ] Push commit: "polish: animations, empty states, mobile, demo-ready"

---

## Phase 9 — README + Submission Prep (3:00 AM – 5:00 AM) [2 hours]

- [ ] Update README.md with screenshots (or add placeholder image links)
- [ ] Write clear project description for Devfolio submission
- [ ] Add demo video link (record Loom/screen recording)
- [ ] Create monorepo README referencing Atlas + Spark as sister products
- [ ] Final commit: "docs: submission-ready readme + ecosystem overview"
- [ ] Push all commits to GitHub

---

## Submission Window (5:00 AM – 6:00 AM)

- [ ] Submit GitHub link via Google Form
- [ ] Ensure repo is PUBLIC
- [ ] Devfolio submission accepted

---

## Mentor Round Prep (1:00 AM+ — mental notes)

7 minutes pitch outline:
1. (0:30) Problem — "Small shop owners have no business advisor"
2. (1:00) Ecosystem — "We built Atlas (billing), Spark (marketing), and now Lens (intelligence)"
3. (2:00) LIVE DEMO — Dashboard → Insights (Claude generating) → Chat (ask a question)
4. (1:00) Alerts — show stock warning + customer churn alert
5. (0:30) Ecosystem page — visual of all 3 products
6. (0:30) Tech stack — Next.js + Claude AI + shadcn
7. (1:30) Q&A

---

## Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "@anthropic-ai/sdk": "^0.32.x",
    "ai": "^3.x",
    "recharts": "^2.x",
    "lucide-react": "latest",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "class-variance-authority": "latest"
  },
  "devDependencies": {
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "autoprefixer": "latest",
    "postcss": "latest",
    "@types/node": "20.x",
    "@types/react": "18.x"
  }
}
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Claude API slow | Pre-generate insights on page load, cache in state |
| Streaming chat broken | Fall back to non-streaming POST/response |
| Recharts not rendering | Replace with simple CSS bar chart if needed |
| Too much to build | Cut Ecosystem page — it is nice-to-have |
| Demo laptop issues | Deploy to Vercel before 3 AM as backup |

---

## Vercel Deployment (Optional but recommended)

```bash
cd apps/lens
npx vercel --prod
# Add ANTHROPIC_API_KEY in Vercel dashboard
```

Deploy URL: `https://astra-lens.vercel.app`
