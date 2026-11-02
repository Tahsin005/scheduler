# 📅 Scheduler — AI-Powered Social Media Scheduler

A full-stack social media scheduling platform that lets you create, generate with AI, and automatically publish posts to Twitter/X, LinkedIn, Facebook, and Instagram — all from a single dashboard.

---

## ✨ Features

- **AI Post Generation** — Generate social media content using Google Gemini 2.5 Flash with tone selection (Professional, Creative, Funny, Minimalist, Excited). Optional AI image generation via Pollinations.ai, persisted to Cloudinary.
- **Multi-Platform Scheduling** — Schedule posts to Twitter/X, LinkedIn, Facebook, and Instagram simultaneously with a future date/time picker.
- **Automated Publishing** — A `node-cron` job runs every minute to automatically publish due posts via the Zernio API. Uses atomic status claiming to prevent duplicate publishing.
- **Social OAuth** — Connect social accounts via Zernio's OAuth flow. One-click connect/disconnect with real-time sync.
- **Media Upload** — Attach images or videos (up to 50 MB) to posts. Files are stored in Cloudinary.
- **Activity Feed** — Dashboard tracks recent publishing activity and account stats.
- **JWT Auth with Silent Refresh** — Short-lived access tokens with silent refresh via queued Axios interceptor. Refresh token rotation for security.
- **Cold-Start Aware Frontend** — Full-screen health-check gate that polls the backend `/health` endpoint before rendering the app (handles Render free-tier spin-up).

---

## 🏗️ Tech Stack

### Backend (`/server`)
| Category | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Framework | Express v5 |
| Language | TypeScript |
| Database | MongoDB via Mongoose |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Scheduler | node-cron |
| AI (text) | Google Gemini 2.5 Flash (`@google/genai`) |
| AI (image) | Pollinations.ai (free, no key needed) |
| Media Storage | Cloudinary v2 |
| File Upload | Multer (memory storage) |
| Social API | Zernio (`@zernio/node`) |
| Deployment | [Render](https://render.com) |

### Frontend (`/client`)
| Category | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite |
| Routing | React Router v7 |
| HTTP Client | Axios (with request queue for token refresh) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Deployment | [Vercel](https://vercel.com) |

---

## 📁 Project Structure

```
scheduler/
├── client/                          # React frontend
│   ├── public/
│   │   ├── favicon.svg
│   │   └── logo.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts             # Axios instance + auth interceptors + token refresh queue
│   │   ├── assets/                  # Images and static asset exports
│   │   ├── components/
│   │   │   ├── Home/                # Landing page section components
│   │   │   ├── AccountList.tsx
│   │   │   ├── Layout.tsx           # Protected route shell (sidebar + header + outlet)
│   │   │   ├── PlatformPicekerModal.tsx
│   │   │   ├── ServerHealthGate.tsx # Cold-start screen (polls /health before rendering app)
│   │   │   └── Sidebar.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx      # Global auth state, localStorage sync, logout events
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Public marketing landing page
│   │   │   ├── Login.tsx            # Combined login / register
│   │   │   ├── Dashboard.tsx        # Stats overview + activity feed
│   │   │   ├── Scheduler.tsx        # Post scheduling UI with polling
│   │   │   ├── Accounts.tsx         # Social account connect / disconnect + OAuth callback
│   │   │   └── AIComposer.tsx       # AI generation → schedule workflow
│   │   ├── App.tsx                  # Route tree
│   │   ├── main.tsx                 # App entry (wrapped in ServerHealthGate)
│   │   └── index.css                # Tailwind + custom theme variables
│   ├── vercel.json                  # SPA rewrite rule for Vercel
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
│
└── server/                          # Express backend
    ├── config/
    │   ├── db.ts                    # Mongoose connection
    │   ├── cloudinary.ts            # Cloudinary v2 client config
    │   ├── multer.ts                # Multer memory storage (50 MB limit)
    │   └── zernio.ts                # Zernio SDK singleton
    ├── controllers/
    │   ├── authControllers.ts       # register, login, refresh, logout
    │   ├── postControllers.ts       # generatePost (AI), schedulePost, getPosts, getGenerations
    │   ├── accountControllers.ts    # getAccounts, addAccount, disconnectAccount
    │   ├── socialAuthControllers.ts # generateAuthUrl, syncAccounts, getOrCreateZernioProfile
    │   └── activityControllers.ts   # getActivities (last 10 logs)
    ├── middlewares/
    │   └── authMiddleware.ts        # JWT Bearer token verification → req.user
    ├── models/
    │   ├── User.ts
    │   ├── Post.ts
    │   ├── Account.ts
    │   ├── Generation.ts
    │   └── ActivityLog.ts
    ├── routes/
    │   ├── authRoutes.ts
    │   ├── postRoutes.ts
    │   ├── accountRoutes.ts
    │   ├── socialAuthRoutes.ts
    │   └── activityRoutes.ts
    ├── services/
    │   └── schedulerService.ts      # node-cron publishing engine
    ├── server.ts                    # Entry point
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB instance (Atlas or local)
- Accounts on: [Zernio](https://zernio.com), [Cloudinary](https://cloudinary.com), [Google AI Studio](https://aistudio.google.com) (Gemini API key)

### 1. Clone the repository

```bash
git clone git@github.com:Tahsin005/scheduler.git
cd scheduler
```

### 2. Configure the backend

Create `server/.env`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/scheduler

# JWT
JWT_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Zernio (social publishing API)
ZERNIO_API_KEY=sk_...

# Google Gemini (AI text generation)
GEMINI_API_KEY=...

# Cloudinary (media storage)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 3. Configure the frontend

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 4. Install & run

```bash
# Backend
cd server
npm install
npm run dev        # nodemon + tsx (hot reload)

# Frontend (in a separate terminal)
cd client
npm install
npm run dev        # Vite dev server
```

---

## 🌐 API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a new account |
| POST | `/login` | Public | Sign in, returns access + refresh tokens |
| POST | `/refresh` | Public | Exchange refresh token for new token pair (rotation) |
| POST | `/logout` | Public | Invalidates the stored refresh token |

### Posts — `/api/posts` *(protected)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all scheduled/published posts for the user |
| POST | `/` | Schedule a new post (multipart/form-data — supports media upload) |
| GET | `/generations` | Get AI generation history |
| POST | `/generate` | Generate post text (+ optional image) with Gemini AI |

### Accounts — `/api/accounts` *(protected)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | List connected social accounts |
| POST | `/` | Manually add an account |
| DELETE | `/:id` | Disconnect and delete an account |

### Social OAuth — `/api/oauth` *(protected)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/:platform/url` | Get Zernio OAuth connect URL for a platform |
| GET | `/sync` | Sync Zernio accounts to local DB |

### Activity — `/api/activity` *(protected)*
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get last 10 activity log entries |

### Health Check
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` or `/api/health` | Returns server status, uptime, and DB state |

---

## 🔌 Supported Platforms

| Platform | OAuth Connect | Scheduling |
|---|---|---|
| Twitter / X | ✅ | ✅ |
| LinkedIn | ✅ | ✅ |
| Facebook | ✅ | ✅ |
| Instagram | ✅ | ✅ (requires media) |

---

## ⚙️ How the Scheduler Works

1. A `node-cron` job fires **every minute**.
2. It queries all posts with `status: "scheduled"` and `scheduledFor <= now`.
3. Each qualifying post is **atomically claimed** (status → `"publishing"`) to prevent duplicate publishing on concurrent runs.
4. The user's connected Zernio accounts matching the post's target platforms are looked up.
5. A publish request is sent to the Zernio API with the post content and optional media.
6. On success → `status: "published"` + `ActivityLog` entry created.
7. On failure → `status: "failed"`.

---

## 🔐 Authentication Flow

```
Client → POST /api/auth/login → { token (15m), refreshToken (7d) }
         ↓
     Stored in localStorage
         ↓
     Axios request interceptor injects Bearer token
         ↓
     On 401 → Axios interceptor calls POST /api/auth/refresh
              → New token pair issued (rotation)
              → All queued requests retried with new token
              → On refresh failure → dispatch "auth:logout" event → clear session
```

---

## 🤖 AI Generation Flow

```
User enters prompt + selects tone + optionally enables image generation
         ↓
POST /api/posts/generate
         ↓
Gemini 2.5 Flash → generates post text + imagePrompt (JSON response)
         ↓ (if image enabled)
Pollinations.ai → generates image from imagePrompt
         ↓
Cloudinary → image uploaded, URL stored
         ↓
Generation saved to DB → returned to client
         ↓
User reviews → clicks "Schedule Post"
         ↓
POST /api/posts (with mediaUrl from Generation)
```

---

## ☁️ Deployment

### Backend → Render

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Set all environment variables from `server/.env` in the Render dashboard.

> **Note:** The `dist/` folder (compiled JS) is in `.gitignore`. Render runs `tsc` at build time.

### Frontend → Vercel

| Setting | Value |
|---|---|
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |

Set in Vercel environment variables:

```env
VITE_API_BASE_URL=https://<your-render-service>.onrender.com
```

The [`vercel.json`](./client/vercel.json) rewrite rule ensures React Router routes work on direct navigation/refresh:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Free Tier Cold Start

The frontend includes a `ServerHealthGate` component that shows a full-screen loading screen while the Render backend wakes up. It polls `/health` every few seconds and automatically renders the app once the server responds — no manual refresh needed.

---

## 🗄️ Data Models

### User
```ts
{ name, email, password (bcrypt), zernioProfileId?, refreshToken?, timestamps }
```

### Post
```ts
{ user, content, platforms[], scheduledFor, status, mediaUrl?, mediaType?, timestamps }
// status: "draft" | "scheduled" | "publishing" | "published" | "failed"
```

### Account
```ts
{ user, platform, handle, zernioAccountId?, status, avatarUrl?, timestamps }
```

### Generation
```ts
{ user, prompt, content, tone?, mediaUrl?, mediaType?, timestamps }
```

### ActivityLog
```ts
{ user, actionType, description, relatedPost?, platform?, timestamps }
// actionType: "POST_PUBLISHED" | "AI_REPLY"
```

---

## 📜 License

MIT

