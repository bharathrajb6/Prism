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
| **Export Capabilities** | Download your data arrays seamlessly as structured `.csv` or visual `.pdf` reports |
| **Background Refresh** | Sync with external APIs on-the-fly without needing to disconnect and reconnect your tools |
| **Theme Toggling** | Fully responsive Dark/Light mode design |
| **Secure Authentication** | NextAuth integrations (Google/GitHub) protecting API Proxy paths with automatic 48-hour idle session expiration |
| **Persistent State** | Connection data & keys survive page refreshes natively (stored securely in browser `localStorage`) |
| **Database-Free Privacy** | API secrets are safely maintained inside your own browser boundaries — our server never permanently records your API keys! |

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

## � Google OAuth Setup

To enable **"Continue with Google"** login, you need to create OAuth 2.0 credentials in the Google Cloud Console:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new one).
3. Search for **"APIs & Services"** and go to the **Credentials** tab.
4. If you haven't created one yet, click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
5. Set the **"Application type"** to **Web application**.
6. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Under **"Authorized JavaScript origins"** (just above the redirect section), click **+ ADD URI** and paste:
   ```
   http://localhost:3000
   ```
8. Click **Create** — Google will now show you your **Client ID** (it usually ends in `.apps.googleusercontent.com`) and your **Client Secret**.

Once you have the Client ID and Secret, create a `.env.local` file in the project root and paste them in:

```env
NEXTAUTH_SECRET=<generate-a-random-string>
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

> **Deploying to Vercel?** Add the same environment variables in your Vercel project settings (**Settings → Environment Variables**), and update `NEXTAUTH_URL` to your production domain (e.g., `https://your-app.vercel.app`). You must also add your Vercel domain and its callback URL (`https://your-app.vercel.app/api/auth/callback/google`) to the Google Cloud Console credentials.

---

## �🔑 Connecting Your AI Tools

Log into Prism via GitHub or Google. Navigate to **Connect** (top nav) and paste your keys. Your API keys are strictly saved to your browser's local cache and are **never persisted in any centralized database**.

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

Provides **30-day API request history** using Google Cloud Monitoring. This is optional but highly recommended if you want to see daily usage trends for your Gemini API calls.

#### Step 1: Create or Select a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. If you already have a project where you use the Gemini API, select it from the project dropdown at the top. Otherwise, click **New Project**, give it a name, and create it.
3. Note your **Project ID** (shown below the project name on the dashboard, e.g., `my-project-123456`). You will need this later.

#### Step 2: Enable Required APIs

1. In the left sidebar, go to **APIs & Services** → **Library**.
2. Search for **Cloud Monitoring API** and click on it.
3. Click **Enable** (if it's not already enabled).
4. Also search for and enable the **Generative Language API** (this is the API that powers Gemini — it must be enabled on the same project for monitoring to track its requests).

#### Step 3: Create a Service Account

1. In the left sidebar, go to **IAM & Admin** → **[Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)**.
2. Click **+ CREATE SERVICE ACCOUNT** at the top.
3. Fill in the details:
   - **Service account name:** `prism-monitoring` (or any name you prefer)
   - **Service account ID:** auto-fills (e.g., `prism-monitoring@my-project.iam.gserviceaccount.com`)
4. Click **CREATE AND CONTINUE**.

#### Step 4: Grant the Monitoring Viewer Role

1. In the **"Grant this service account access to project"** step, click the **Role** dropdown.
2. Search for and select: **Monitoring Viewer** (`roles/monitoring.viewer`).
3. Click **CONTINUE**, then **DONE**.

#### Step 5: Generate a JSON Key

1. On the Service Accounts list page, find the service account you just created and click on its **email**.
2. Go to the **Keys** tab.
3. Click **ADD KEY** → **Create new key**.
4. Select **JSON** as the key type and click **CREATE**.
5. A `.json` file will automatically download to your computer. **Keep this file safe** — it contains your credentials.

#### Step 6: Connect in Prism

1. Open Prism and navigate to the **Connect** page.
2. Find the **Gemini — Cloud Monitoring** card.
3. Enter your **GCP Project ID** (from Step 1).
4. Open the downloaded JSON key file in a text editor, copy its entire contents, and paste it into the **Service Account JSON** field.
5. Click **Connect**.

**What you'll see:** Daily request trend chart, peak day, total API requests over the last 30 days.

> **Tip:** Make sure the Gemini API calls you want to monitor are happening on the **same GCP project** where you created the service account. If you use multiple projects, you'll need to connect each one separately.

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
| API keys | ✅ Securely in browser `localStorage` (required for background refresh) |
| Model lists | ✅ `localStorage` — cleared on Disconnect |
| Token counts | ✅ `localStorage` — cleared on Disconnect |
| Any server-side DB | ❌ No backend database, no server-side storage! |

All backend routes (`/api/integrations/*`) act as stateless proxies locked behind NextAuth middleware. They receive your key via POST requests, call the respective provider API, and return the result. Absolutely nothing is logged or written to server disks.

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
| Auth | [NextAuth.js](https://next-auth.js.org) (JWT Strategy) |
| Storage | Browser `localStorage` (client-only, no DB) |

---

## 🗺 Roadmap

- [ ] Cursor / Windsurf usage when APIs become available
- [ ] Multi-account support per provider
- [ ] Cost alerts / spending thresholds
