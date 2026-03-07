# Astra Lens — Hackathon Pitch Guide

---

## One-Liner
"Astra Lens is an AI business advisor that tells Indian shop owners what to do next — in plain Hindi and English."

---

## Problem Statement
India has 6.3 crore small businesses. The vast majority are run by one person who:
- Has no business analyst or consultant
- Cannot read complex dashboards or reports
- Makes decisions on gut feeling — restocking too late, missing customer trends
- Spends money on marketing without knowing what works

**A business consultant costs ₹5,000–₹10,000 per month. Most small shops can't afford that.**

---

## Solution
Astra Lens is the intelligence layer of the Astra Studio ecosystem.

It connects to:
- **Astra Atlas** — billing, inventory, customer data
- **Astra Spark** — WhatsApp campaigns, social media, reel scripts

And gives the shop owner:
- Plain-language AI insights ("Your rice is running out in 3 days")
- Smart alerts (low stock, inactive customers, sales drops)
- An AI chat advisor they can ask anything ("How did I do this week?")
- Actionable recommendations that link directly to Atlas/Spark

---

## The Astra Studio Ecosystem

```
Astra Atlas          Astra Lens           Astra Spark
(Operations)    →    (Intelligence)   →   (Marketing)

Billing              AI Insights          WhatsApp Campaigns
Inventory            Smart Alerts         Social Media Posts
Customers            Chat Advisor         Reel Scripts
GST Reports          Predictions          Ad Campaigns
```

**This is a complete small business operating system for Bharat.**

---

## Demo Script (7 minutes)

### 1. Open Dashboard (30 sec)
"Yeh Rajesh Sharma ka dukaan hai, Kanpur mein. Aaj unki ₹12,400 ki bikri hui — 18% zyada pichle hafte se."

Point to: Stat cards, revenue chart, top products list.

### 2. Open AI Insights (90 sec)
Click Refresh. Watch Claude generate insights in real-time.

"Dekho — AI ne khud detect kiya ki Basmati Rice 3 din mein khatam ho jayega. Aur yahan — 535 customers 30 din se nahi aaye. Ek button click karke Spark pe campaign launch ho sakta hai."

Point to: Warning card (rice), Opportunity card (inactive customers), Achievement card (revenue up).

### 3. AI Chat (90 sec)
Type: "Is hafte kaisa raha?"

Watch streaming response. Then type: "Konsa product zyada order karna chahiye Holi se pehle?"

"Yeh unka personal business advisor hai — 24/7, Hindi mein, mobile pe."

### 4. Smart Alerts (45 sec)
"Yahan sab alerts ek jagah. High priority — stock aur customers. Medium — slow-moving items. Sab ke saath directly Atlas ya Spark ka link."

### 5. Ecosystem Page (45 sec)
"Aur yeh hai pura picture. Teen products, ek ecosystem. Atlas operations sambhalta hai. Lens intelligence deta hai. Spark marketing karta hai. Yeh hai Astra Studio."

### 6. Tech Stack (30 sec)
- Next.js 14 (App Router)
- Anthropic Claude (claude-haiku)
- shadcn/ui + Tailwind CSS
- Recharts

### 7. Close (30 sec)
"6.3 crore small businesses. Unhe ek affordable business advisor chahiye. Astra Lens woh advisor hai."

---

## Judging Criteria Mapping

| Criterion | How Lens addresses it |
|-----------|----------------------|
| Idea feasibility | Working demo, real API calls, no fake slides |
| Problem relevance | 6.3 crore small businesses, real pain point |
| Technical implementation | Next.js + Claude AI + Recharts, clean code |
| Innovation | AI insights in Hinglish, ecosystem narrative |
| Completion | All 5 pages working end-to-end |
| Scalability | Multi-tenant ready (businessId pattern from Atlas/Spark) |
| Clarity | Live demo speaks for itself |

---

## Common Judge Questions

**Q: How is this different from Google Analytics or Excel?**
A: "Google Analytics is for websites, not physical shops. Excel requires manual entry and data skills. Astra Lens reads directly from their billing system (Atlas) and speaks to them in Hindi. No training required."

**Q: What if the shop doesn't use Atlas or Spark?**
A: "Lens can work standalone with manual data input. But the real power is the ecosystem — all three products feed each other. That's our GTM: start them on Atlas (billing), add Spark (marketing), Lens comes naturally."

**Q: How do you monetize?**
A: "Lens is a premium add-on (₹199/month) in the Astra Studio subscription. It increases retention because shop owners get more value from Atlas + Spark together."

**Q: Is the AI accurate?**
A: "The AI reads real business data — sales numbers, inventory levels, customer activity. It can't hallucinate because every claim is grounded in the actual data we pass it. We show the source data alongside every insight."

---

## Team Roles (adjust as needed)

- Person 1: Frontend — Dashboard + Insights pages
- Person 2: Backend — API routes + Claude integration + Mock data
- Person 3: UI/UX — Components, design, animations
- Person 4: Pitch + Ecosystem page + README

---

## Repository Structure

```
astra-studio/              ← monorepo
├── apps/
│   └── lens/              ← Astra Lens (built at hackathon)
├── README.md              ← Ecosystem overview + links to Atlas/Spark
└── PITCH.md
```

The README makes it clear:
- Atlas + Spark are existing sister products (link to their repos)
- Lens is what was built during the hackathon
- Together they form a complete ecosystem
