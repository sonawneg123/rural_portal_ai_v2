# ग्रामीण पोर्टल — Frontend v3.0

Modern React 19 + Vite frontend for the Rural Governance Portal.
This is a **frontend-only rewrite** — the backend API is unchanged.

## Stack

- React 19 + Vite 6
- React Router DOM 7
- TanStack Query 5
- React Hook Form 7
- Tailwind CSS 3
- Framer Motion 11
- Recharts 2
- Leaflet 1.9
- react-dropzone 14
- react-hot-toast 2

## Setup

```bash
cp .env.example .env
# edit .env — set VITE_API_URL to your backend

npm install
npm run dev      # local dev server on :3000
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Environment

```
VITE_API_URL=http://INTERNAL_ALB_DNS/api
```

Access in code via `import.meta.env.VITE_API_URL`.

## Deployment (AWS EC2 + Nginx)

```bash
npm run build
scp -r dist/* ec2-user@YOUR_EC2_IP:/var/www/rural-portal/

# Nginx config
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/rural-portal;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Folder Structure

```
src/
├── api/          — axios client + endpoint modules (auth, problems, admin)
├── assets/       — static assets
├── components/
│   ├── ui/       — Button-less atoms: Badge, Modal, Spinner, Pagination, ImageUpload…
│   ├── layout/   — Navbar, Footer
│   └── shared/   — ProblemCard, PhotoGallery, CommentCard, AnnouncementBanner…
├── context/      — AuthContext, ThemeContext
├── hooks/        — useAnimations (scroll reveal, count-up, debounce, localStorage)
├── layouts/      — MainLayout (navbar+footer), GovernanceLayout (sidebar)
├── pages/        — one file per route
├── routes/       — route definitions + guards
├── styles/       — Tailwind entry + custom component classes
├── utils/        — helpers.js (formatters, configs, constants)
├── App.jsx
└── main.jsx
```

## API Endpoints Used (unchanged from backend)

All endpoints are called exactly as documented in the backend — no renames, no payload changes. See `src/api/*.js` for the full mapping.
