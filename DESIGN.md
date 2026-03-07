# Astra Lens — Design System

---

## Brand Identity

| Property | Value |
|----------|-------|
| Product Name | Astra Lens |
| Tagline | "Your business, understood." |
| Primary Color | Indigo `#6366F1` |
| Accent Color | Amber `#F59E0B` (for alerts/warnings) |
| Success Color | Emerald `#10B981` |
| Danger Color | Rose `#F43F5E` |
| Background | Slate `#0F172A` (dark) / `#F8FAFC` (light) |
| Font | Inter |
| Border Radius | `rounded-xl` (cards), `rounded-lg` (buttons) |
| Company | Astra Studio |

---

## Color Palette

```
Indigo (Primary — Intelligence)
  50:  #EEF2FF
  100: #E0E7FF
  500: #6366F1  ← primary
  600: #4F46E5  ← hover
  700: #4338CA  ← active

Amber (Alerts — Attention)
  500: #F59E0B
  100: #FEF3C7  ← alert background

Emerald (Success — Growth)
  500: #10B981
  100: #D1FAE5  ← success background

Rose (Danger — Warning)
  500: #F43F5E
  100: #FFE4E6  ← danger background

Slate (Neutral)
  50:  #F8FAFC  ← page background
  100: #F1F5F9  ← card background
  200: #E2E8F0  ← border
  600: #475569  ← body text
  800: #1E293B  ← heading text
  900: #0F172A  ← dark bg
```

---

## Typography

```
Font: Inter (Google Fonts)
Hindi support: Noto Sans Devanagari

Headings:
  H1: text-3xl font-bold text-slate-800
  H2: text-2xl font-semibold text-slate-800
  H3: text-lg font-semibold text-slate-700

Body:
  Default: text-sm text-slate-600
  Muted:   text-xs text-slate-400

Labels:
  text-xs font-medium uppercase tracking-wide text-slate-500
```

---

## Layout

### Sidebar (Left, 240px wide)
```
+------------------------------------------+
| [Lens Logo]  Astra Lens                  |
|------------------------------------------|
| [icon] Dashboard          ← active       |
| [icon] AI Insights                       |
| [icon] Business Chat                     |
| [icon] Smart Alerts       [3]            |
| [icon] Ecosystem                         |
|------------------------------------------|
|                                          |
| [bottom]                                 |
| Sharma General Store                     |
| Kanpur, UP                               |
| [Atlas] [Spark] links                    |
+------------------------------------------+
```

### Topbar (Right content area, full width)
```
+------------------------------------------+
| Dashboard          [Refresh] [Hi, Rajesh] |
+------------------------------------------+
```

### Content Area
- Max width: `max-w-7xl mx-auto`
- Padding: `p-6`
- Gap between cards: `gap-4` or `gap-6`

---

## Components

### StatCard
```
+----------------------------------+
| [icon bg-indigo-100]             |
| Total Revenue                    |
| ₹1,24,350          +12% vs last  |
|                    week [green]  |
+----------------------------------+

Props:
  title: string
  value: string
  change?: string       // "+12%"
  changeType?: "up" | "down" | "neutral"
  icon: LucideIcon
  color?: "indigo" | "emerald" | "amber" | "rose"
```

### InsightCard
```
+----------------------------------+
| [dot color by type] OPPORTUNITY  |
| [title: bold]                    |
| [body: text-sm text-slate-600]   |
|                                  |
| [CTA Button → Spark/Atlas]       |
+----------------------------------+

Types & colors:
  opportunity  → indigo border + indigo dot
  warning      → amber border + amber dot
  achievement  → emerald border + emerald dot
  recommendation → slate border + slate dot
```

### AlertCard
```
+----------------------------------+
| [!] HIGH     [timestamp]         |
| Stock Alert: Basmati Rice        |
| Only 5 kg remaining. At current  |
| rate, runs out in 3 days.        |
| [Restock Now →]                  |
+----------------------------------+
```

### ChatMessage
```
User message (right-aligned):
  +------------------------+
  |  How did I do today?  |
  +------------------------+

AI message (left-aligned):
  [Lens logo]
  +------------------------------------------+
  | Aaj aapne ₹12,400 ki bikri ki, jo kal   |
  | se 18% zyada hai. Basmati rice aur Tata  |
  | Salt sabse zyada bika.                   |
  +------------------------------------------+
```

---

## Page Designs

### 1. Dashboard (`/`)

```
[Topbar: "Dashboard"]

[Stats Row — 4 cards]
+----------+ +----------+ +----------+ +----------+
| Revenue  | | Customers| | Top Item | | Campaigns|
| ₹12,400  | | 847      | | Rice     | | 2 Active |
| +18% ↑   | | 23 new   | | 45 sold  | |          |
+----------+ +----------+ +----------+ +----------+

[Two Column]
+----------------------+  +-------------------+
| Revenue Trend        |  | AI Insights       |
| [7-day line chart]   |  | [3 insight cards] |
|                      |  | [View All →]      |
+----------------------+  +-------------------+

[Full Width]
+--------------------------------------------------+
| Top Products                                     |
| 1. Basmati Rice    ₹4,200   [████████░░] 84%    |
| 2. Tata Salt       ₹2,100   [██████░░░░] 60%    |
| 3. Surf Excel      ₹1,800   [█████░░░░░] 52%    |
+--------------------------------------------------+

[Two Column]
+----------------------+  +-------------------+
| Recent Customers     |  | Smart Alerts      |
| [activity list]      |  | [2-3 alert cards] |
+----------------------+  +-------------------+
```

### 2. AI Insights (`/insights`)

```
[Topbar: "AI Insights"]
[Refresh button → regenerates with Claude]

[Filter: All | Opportunity | Warning | Achievement | Recommendation]

[Grid: 2 columns]
+------------------+ +------------------+
| InsightCard      | | InsightCard      |
+------------------+ +------------------+
+------------------+ +------------------+
| InsightCard      | | InsightCard      |
+------------------+ +------------------+
```

### 3. AI Chat (`/chat`)

```
[Topbar: "Business Advisor"]

[Full height chat window]
+--------------------------------------------------+
|                                                  |
|  [AI] Namaste Rajesh! Main aapka business        |
|       advisor hoon. Aaj kya jaanna chahte ho?    |
|                                                  |
|                [User] How did I do this week?    |
|                                                  |
|  [AI] Is hafte aapne ₹67,200 ki bikri ki...     |
|                                                  |
+--------------------------------------------------+
| [Quick: "Best products?"] [Quick: "Slow items?"] |
| [Type your question...              ] [Send]     |
+--------------------------------------------------+
```

### 4. Smart Alerts (`/alerts`)

```
[Topbar: "Smart Alerts"]
[Badges: HIGH (2) MEDIUM (1) LOW (1)]

[List grouped by priority]

HIGH
  [AlertCard: Low stock — Basmati Rice]
  [AlertCard: 40 customers inactive 30+ days]

MEDIUM
  [AlertCard: Sales down 15% vs last Tuesday]

LOW
  [AlertCard: Tata Salt slow-moving this week]
```

### 5. Ecosystem (`/ecosystem`)

```
[Topbar: "Astra Ecosystem"]

[Center — visual flow diagram]

+----------------+      +----------------+      +----------------+
|  ASTRA ATLAS   |  →   |  ASTRA LENS    |  →   |  ASTRA SPARK   |
|                |      |                |      |                |
| Billing        |      | AI Insights    |      | WhatsApp       |
| Inventory      |      | Smart Alerts   |      | Social Media   |
| Customers      |      | Chat Advisor   |      | Reel Scripts   |
| GST Reports    |      | Predictions    |      | Ad Campaigns   |
|                |      |                |      |                |
| [Open Atlas →] |      | You are here   |      | [Open Spark →] |
+----------------+      +----------------+      +----------------+

[Below: Stats from each product]
Atlas: 847 customers | 2,341 invoices
Lens: 6 insights generated today
Spark: 2 active campaigns | 1,240 messages sent

[Bottom CTA]
"This is your complete business operating system."
```

---

## shadcn/ui Components Used

- `Card`, `CardHeader`, `CardContent`, `CardTitle`
- `Button` (primary=indigo, ghost, outline)
- `Badge` (for alert levels, insight types)
- `Separator`
- `ScrollArea` (chat window)
- `Tabs` (filter tabs on insights page)
- `Skeleton` (loading states)
- `Tooltip`

---

## Icons

Library: `lucide-react`

| Page | Icon |
|------|------|
| Dashboard | `LayoutDashboard` |
| Insights | `Lightbulb` |
| Chat | `MessageCircle` |
| Alerts | `Bell` |
| Ecosystem | `Network` |
| Revenue | `TrendingUp` |
| Customers | `Users` |
| Products | `Package` |
| Campaigns | `Megaphone` |
| Warning | `AlertTriangle` |
| Success | `CheckCircle2` |

---

## Responsive Behavior

- **Desktop** (1280px+): Full sidebar + 2-column content grids
- **Tablet** (768px–1279px): Collapsed sidebar (icon only) + 2-column
- **Mobile** (< 768px): Bottom nav + single column stacked cards

---

## Animation

- Insight cards: `animate-fade-in` staggered (0.1s delay each)
- Chat messages: slide in from bottom
- Alert pulse: `animate-pulse` on HIGH priority dot
- Chart: Recharts default animation (300ms ease)
- Loading skeleton: shimmer effect via shadcn Skeleton
