# Prism — AI Usage Dashboard

> A unified, real-time dashboard for tracking your AI tool usage across **Claude**, **Gemini**, and **ChatGPT** — built with Next.js, Recharts, and Framer Motion.

![Dashboard preview](https://img.shields.io/badge/status-active-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live Dashboard** | Token usage, cost estimates, and model breakdown in one view |
| **Claude Integration** | 30-day token history via Anthropic Admin API — input/output trends, per-model breakdown, cost estimates |
| **Gemini Integration** | Model list and key validation via Google AI Studio API |
| **Gemini Cloud Monitoring** | Optional 30-day API request history via Google Cloud Monitoring service account |
| **ChatGPT Integration** | Model availability and account tier via standard OpenAI API key |
| **Tool Detail Modals** | Deep-dive per-tool popups with Overview, Usage, and Models tabs |
| **Connect Page** | Guided setup for each integration with status indicators and Disconnect buttons |
| **Persistent State** | Connection data survives page refreshes (stored in browser `localStorage`) |
| **Privacy-first** | API keys are **never stored** — only response data (model lists, token counts) is persisted |

---

## 🏗 Architecture

```
src/
├── app/
│   ├── page.tsx                        # Home → Dashboard
│   ├── connect/page.tsx                # Connect Your AI Tools page
│   └── api/
│       └── integrations/
│           ├── claude/route.ts         # POST — Anthropic Usage API
│           ├── gemini/route.ts         # POST — Google AI Studio models
│           ├── gemini-monitoring/      # POST — GCP Cloud Monitoring
│           │   └── route.ts
│           └── openai/route.ts         # POST — OpenAI models API
│
├── components/
│   ├── Dashboard.tsx                   # Main dashboard with charts & tool cards
│   ├── ConnectPage.tsx                 # API key setup & disconnect UI
│   └── ToolDetailModal.tsx             # Per-tool slide-in detail modal
│
└── hooks/
    └── useIntegrationData.ts           # Reactive localStorage hook + disconnect/persist helpers
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Install & run

```bash
# Clone the repo
git clone <your-repo-url>
cd ai-usage

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Connecting Your AI Tools

Navigate to **Connect** (top nav) and paste in your keys. All keys are sent only to your own Next.js backend and are **never persisted**.

### Claude (Anthropic)

Requires an **Admin API key** to access the 30-day Usage Report API.

1. Visit [console.anthropic.com/settings/admin-keys](https://console.anthropic.com/settings/admin-keys)
2. Create an **Admin** key (starts with `sk-ant-admin01-...`)
3. Paste it into the Claude card

**What you'll see:** Total tokens (30d), input/output split, per-model breakdown, estimated cost.

---

### Gemini (Google AI Studio)

Uses a standard **AI Studio API key** to validate connectivity and list models.

1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create an API key (starts with `AIzaSy...`)
3. Paste it into the Gemini card

**What you'll see:** All available Gemini models with context window sizes.

---

### Gemini — Cloud Monitoring *(optional)*

Provides 30-day API request history using Google Cloud Monitoring.

1. Create a **Service Account** in [GCP IAM](https://console.cloud.google.com/iam-admin/serviceaccounts) with the **Monitoring Viewer** role
2. Enable the **Cloud Monitoring API** on your project
3. Download the service account JSON key
4. Enter your GCP Project ID and paste the JSON into the card

**What you'll see:** Daily request trend chart, peak day, total requests.

---

### ChatGPT (OpenAI)

Uses your standard **API key** (`sk-...`) to validate the key and list accessible models.

1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Copy your API key
3. Paste it into the ChatGPT card

> **Note:** Historical token usage requires an Admin API key from your OpenAI organisation. With a standard key, the dashboard shows model availability and account tier.

**What you'll see:** Account tier, number of accessible models, full list of GPT/o1/o3 models.

---

## 🔒 Privacy & Security

| What | Is it stored? |
|---|---|
| API keys | ❌ **Never** — only live in React state & the HTTP request |
| Model lists | ✅ `localStorage` — cleared on Disconnect |
| Token counts | ✅ `localStorage` — cleared on Disconnect |
| Any server-side DB | ❌ No backend database, no server-side storage |

All backend routes (`/api/integrations/*`) are **stateless** — they receive the key, call the provider API, and return the result. Nothing is written to disk.

---

## 🛠 Development

```bash
# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + vanilla CSS |
| Charts | [Recharts](https://recharts.org) |
| Animations | [Framer Motion](https://framer.motion.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Storage | Browser `localStorage` (client-only, no DB) |

---

## 🗺 Roadmap

- [ ] Cursor / Windsurf usage when APIs become available
- [ ] Export usage report as CSV / PDF
- [ ] Multi-account support per provider
- [ ] Cost alerts / spending thresholds
- [ ] Dark / light theme toggle
