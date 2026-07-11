# 🌿 ग्रामीण पोर्टल v2 — Rural Problems Portal

AI-powered civic problem reporting platform for rural India.  
**React 18 · Groq AI (llama3-8b) · Node.js · MySQL · Vercel + Railway**

---

## 📁 Project Structure

```
rural-portal/
├── vercel.json                          ← Vercel config (rewrites API to Railway)
├── schema.sql                           ← MySQL schema (run once on your DB)
├── package.json                         ← Root workspace manifest
│
├── frontend/                            ← Deploys to Vercel
│   ├── .env.example
│   ├── public/
│   │   ├── index.html                   ← Preloader + PWA meta
│   │   └── manifest.json
│   └── src/
│       ├── index.js
│       ├── App.js                       ← Routes + Error boundary + React Query
│       ├── styles/globals.css           ← Full design system (Outfit + Inter)
│       ├── context/AuthContext.js       ← JWT state + notification polling
│       ├── hooks/useAnimations.js       ← Scroll reveal, count-up, ripple, typewriter
│       ├── utils/
│       │   ├── api.js                   ← Axios + offline guard + auto 401 redirect
│       │   └── helpers.js               ← States, status configs, formatters
│       ├── components/
│       │   ├── ui/index.js              ← Button, Badge, Skeleton, Spinner, EmptyState…
│       │   ├── layout/Navbar.js         ← Sticky + scroll-shadow + user dropdown
│       │   └── shared/ProblemCard.js    ← Animated card with heat bar + AI summary
│       └── pages/
│           ├── Home.js                  ← Hero · Heat map · Stats · AI banner
│           ├── Login.js                 ← Split layout auth pages + anonymous toggle
│           ├── Problems.js              ← Filterable list + collapsible sidebar
│           ├── ProblemDetail.js         ← AI summary · Work progress link · Comments
│           ├── ReportProblem.js         ← 4-step wizard with anonymous mode
│           ├── WorkProgress.js          ← 🆕 Work Progress Tracker with photo uploads
│           └── Admin.js                 ← Dashboard · Charts · Groq insight per row
│
└── backend/                             ← Deploys to Railway / Render
    ├── .env.example
    └── src/
        ├── server.js                    ← Express + CORS + rate limiting
        ├── config/
        │   ├── database.js              ← MySQL2 pool with SSL support
        │   ├── groq.js                  ← 3 Groq functions (analysis, insight, work)
        │   ├── s3.js                    ← Multer-S3 for problems + work photos
        │   └── logger.js                ← Winston
        ├── middleware/auth.js            ← JWT authenticate / requireAdmin
        ├── controllers/
        │   ├── authController.js
        │   ├── problemController.js     ← Calls Groq on every submission
        │   ├── workProgressController.js ← 🆕 Calls Groq on every work update
        │   └── adminController.js       ← Groq insight on demand
        └── routes/index.js              ← All 30+ endpoints
```

---

## 🚀 Deploy to Vercel (Frontend)

### Step 1 — Push to GitHub
```bash
git init && git add . && git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/rural-portal.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework: **Create React App**
5. Add Environment Variables:

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://your-backend.railway.app/api` |
| `REACT_APP_APP_NAME` | `ग्रामीण पोर्टल` |

6. Click **Deploy**

---

## 🚀 Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → New Project
2. **Deploy from GitHub repo** → select your repo → set root to `/backend`
3. Add a **MySQL plugin** (Railway provides it free)
4. Set environment variables in Railway:

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-project.vercel.app
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
DB_HOST=${{MySQL.MYSQL_HOST}}
DB_PORT=${{MySQL.MYSQL_PORT}}
DB_NAME=${{MySQL.MYSQL_DATABASE}}
DB_USER=${{MySQL.MYSQL_USER}}
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
GROQ_API_KEY=gsk_xxxxxxxxxxxx
GROQ_MODEL=llama3-8b-8192
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
S3_BUCKET_NAME=rural-portal-photos
```

5. After deploy, copy your Railway URL
6. **Run the schema** via Railway's MySQL shell or a tool like TablePlus:
   ```sql
   -- Connect to the Railway MySQL and run:
   SOURCE schema.sql;
   ```

7. Update `vercel.json` → replace `your-backend-url.railway.app` with your real Railway URL
8. Redeploy Vercel (it auto-redeploys on push)

---

## 💻 Local Development

```bash
# Terminal 1 — Backend
cd backend
cp .env.example .env     # fill in GROQ_API_KEY and DB details
npm install
npm run dev              # runs on :5000

# Terminal 2 — Frontend
cd frontend
cp .env.example .env     # set REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start                # runs on :3000
```

---

## 🤖 Groq AI Features

Get your **free** API key at **https://console.groq.com/keys**

| Feature | Trigger | Output |
|---|---|---|
| **Problem severity scoring** | Every submission | 1–10 score + progress bar |
| **Official AI summary** | Every submission | 2-3 sentence formal summary |
| **Tag extraction** | Every submission | Up to 4 topic tags |
| **Responsible dept** | Every submission | Suggested authority |
| **Admin action insight** | Admin clicks "Ask Groq" | 2-sentence action recommendation |
| **Work update analysis** | Every photo upload | Completion % + quality note |

---

## 🆕 What's New in v2

### Work Progress Tracker
The biggest addition. When an official or citizen uploads photos of work being done:
- Groq AI reads the description and **estimates completion percentage**
- Timeline view shows all updates with before/after photos
- Admins can **approve** or **dispute** updates
- Circular progress ring shows overall completion on the problem header
- Solves the core civic accountability gap: problems "resolved" on paper but not in reality

### Anonymous Whistleblower Mode
- Toggle during registration or report submission
- Reporter's name replaced with "Anonymous" across all views
- Stored at user level (persistent) or per-report

### AI Severity Heat Bars
- Every problem card shows a coloured heat bar (green → amber → red)
- Animated on scroll-reveal with the actual severity score
- Sortable in problem list by severity

### Design System
- **Outfit** display font (geometric, authoritative)
- **Forest green** `#0A3D1F` primary — feels official yet grounded
- Signature **Problem Heat Map** on home page with live animated bars
- Full `globals.css` with CSS custom properties for easy theming

---

## 🔐 Default Admin

| Email | Password |
|---|---|
| admin@ruralportal.in | Admin@1234 |

**Change immediately in production.**

---

## 📊 Database Tables

| Table | Purpose |
|---|---|
| `users` | Citizens + admins, anonymous mode |
| `categories` | 10 problem types |
| `problems` | Reports with AI scores + anonymous flag |
| `problem_photos` | S3 references |
| `work_updates` | 🆕 Progress updates with Groq analysis |
| `work_update_photos` | 🆕 S3 refs for work photos |
| `upvotes` | Unique votes per user per problem |
| `comments` | User + official comments |
| `status_history` | Full audit trail |
| `notifications` | In-app alerts |
