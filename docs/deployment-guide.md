# ZK-Aid: Run & Deploy Guide

## Prerequisites

Ensure you have installed:
- **Node.js 18+** (LTS recommended)
- **npm 9+** or **pnpm**
- **Git** (for version control)

Verify:
```bash
node --version   # v18.x.x or higher
npm --version    # 9.x.x or higher
```

---

## Environment Setup

### 1. Install Dependencies

```bash
cd web
npm install
```

This installs:
- `next` — Next.js framework
- `react`, `react-dom` — UI library
- `tailwindcss` — styling engine
- `framer-motion` — animations
- `lucide-react` — icons
- `@supabase/supabase-js` — auth & database client
- `snarkjs` — ZK proof generation
- And dev dependencies (TypeScript, ESLint, etc.)

### 2. Configure Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
# Supabase (frontend-safe keys)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Server-only (optional, for API routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Only if using admin API routes
```

**How to get these keys:**
1. Go to [Supabase Dashboard](https://supabase.com)
2. Select your project
3. Navigate to **Settings → API**
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

**Important:** Never commit `.env.local` to git. Add it to `.gitignore`.

---

## Local Development

### 1. Start Dev Server

```bash
cd web
npm run dev
```

Output:
```
  ▲ Next.js 16.1.6
  - Local:        http://localhost:3000
  - Environments: .env.local
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Hot Reload

- **Component changes** auto-reload (Fast Refresh)
- **CSS changes** appear instantly
- **API route changes** require manual refresh

### 3. Testing Pages Locally

| URL | Role | What It Tests |
|---|---|---|
| `http://localhost:3000` | Public | Landing page, HeroTerminal demo, features |
| `http://localhost:3000/auth/login` | Public | Email/Google login form |
| `http://localhost:3000/auth/signup` | Public | Registration form |
| `http://localhost:3000/dashboard` | Auth | Redirects to `/student` or `/admin` |
| `http://localhost:3000/student` | Student | Submit proof, view application history |
| `http://localhost:3000/admin` | Admin | Review applications, verify/audit toggle |

### 4. Debugging Tips

**Browser DevTools:**
- Open **DevTools** (F12)
- Go to **Console** to see errors/logs
- Go to **Network** to inspect API calls
- Go to **Storage** to view auth tokens

**Server Logs:**
- Watch terminal for errors during `npm run dev`
- Check Supabase logs at [Supabase Dashboard → Logs](https://supabase.com)

**Common Issues:**

| Error | Fix |
|---|---|
| `Cannot find module 'snarkjs'` | Run `npm install snarkjs` |
| `NEXT_PUBLIC_SUPABASE_URL is not set` | Create `.env.local` with env vars |
| `401 Unauthorized` on API calls | Check Bearer token in request headers |
| `Glass cards look weird on mobile` | Test with DevTools device emulation (Ctrl+Shift+M) |

---

## Production Build

### 1. Build Optimized Bundle

```bash
cd web
npm run build
```

**Expected output:**
```
✓ Next.js 16.1.6 (webpack)
  Creating an optimized production build ...
  Compiled with warnings in X.Xs

Route (app)
● (Static)   / 
● (Dynamic)  /admin
● (Dynamic)  /student
...
```

### 2. Start Production Server (Local Testing)

```bash
npm start
```

Runs on `http://localhost:3000` but with optimized, minified code.

### 3. Test Before Deploy

```bash
# Test login flow
# 1. Open http://localhost:3000
# 2. Click "Get Started" → sign up with test email
# 3. Verify confirmation email (check Supabase auth logs)
# 4. Log in
# 5. Submit a fake application (student page)
# 6. Check admin dashboard
```

---

## Deployment

### Option 1: Vercel (Recommended) ⭐

Vercel is built by Next.js creators — best integration, 0-config deployment.

#### Step 1: Connect GitHub

```bash
# Push your code to GitHub
git init
git add .
git commit -m "Initial ZK-Aid UI implementation"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/zk-aid.git
git push -u origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New... → Project**
3. Select your GitHub repo (`zk-aid`)
4. Click **Import**

#### Step 3: Configure Environment

In Vercel dashboard, go to **Settings → Environment Variables** and add:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGc...  (optional, for server routes)
```

#### Step 4: Deploy

Click **Deploy** — Vercel will:
- Build your app (`npm run build`)
- Optimize assets
- Deploy to CDN (~30s)
- Provide a URL: `https://zk-aid.vercel.app`

#### Updates

Every push to `main` auto-deploys. To disable, check **Settings → Git**.

---

### Option 2: Docker + Cloud Run (Google Cloud) 

For more control, containerize and deploy to Google Cloud Run.

#### Step 1: Create Dockerfile

```dockerfile
# web/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Step 2: Build & Test Locally

```bash
docker build -t zk-aid:latest .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="..." \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="..." \
  zk-aid:latest
```

#### Step 3: Push to Registry

```bash
# Google Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
docker tag zk-aid:latest us-central1-docker.pkg.dev/YOUR_PROJECT/docker/zk-aid:latest
docker push us-central1-docker.pkg.dev/YOUR_PROJECT/docker/zk-aid:latest
```

#### Step 4: Deploy to Cloud Run

```bash
gcloud run deploy zk-aid \
  --image=us-central1-docker.pkg.dev/YOUR_PROJECT/docker/zk-aid:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --set-env-vars=NEXT_PUBLIC_SUPABASE_URL="...",NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

Provides a URL: `https://zk-aid-xxxxx-uc.a.run.app`

---

### Option 3: Self-Hosted (AWS EC2, Linode, etc.)

For complete control but more maintenance.

#### Step 1: SSH into Server

```bash
ssh ubuntu@your-server-ip
```

#### Step 2: Install Node.js & PM2

```bash
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2
```

#### Step 3: Clone & Deploy

```bash
git clone https://github.com/YOUR_USERNAME/zk-aid.git
cd zk-aid/web

npm ci --omit=dev
npm run build

# Create .env.local with Supabase keys
echo "NEXT_PUBLIC_SUPABASE_URL=..." > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=..." >> .env.local

# Start with PM2 (auto-restart on crash)
pm2 start npm --name "zk-aid" -- start
pm2 save
pm2 startup
```

#### Step 4: Reverse Proxy (Nginx)

```bash
sudo vim /etc/nginx/sites-available/zk-aid
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/zk-aid /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### Step 5: Enable HTTPS (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Monitoring & Logs

### Local Development
```bash
npm run dev 2>&1 | tee logs.txt
```

### Production (Vercel)
- Go to [vercel.com/dashboard](https://vercel.com/dashboard) → your project → **Deployments**
- Click any deployment → **Logs**

### Production (Docker/Self-Hosted)
```bash
# View live logs
pm2 logs zk-aid
pm2 save

# Or with Docker
docker logs -f <container_id>
```

---

## Common Deployment Issues

| Issue | Solution |
|---|---|
| **500 Error on /api/submit-application** | Check `SUPABASE_SERVICE_ROLE_KEY` is set in env |
| **Login redirects to /dashboard forever** | Session cookie domain mismatch — verify auth config in Supabase |
| **Glass cards look broken** | Tailwind purge issue — ensure `web/app/**/*.{ts,tsx}` in `tailwind.config` |
| **snarkjs fails on production** | Build succeeded locally but needs `NODE_ENV=production` — verify during build |
| **Slow proof generation** | snarkjs is CPU-intensive on first run (cache after) — expected behavior |

---

## Performance Tips

### 1. Bundle Size
```bash
npm install -g next-bundle-analyzer
npm run analyze
```

snarkjs (~500KB gzipped) is the largest dependency. Consider:
- Lazy-loading on student page only
- Or pre-loading before user clicks "Submit"

### 2. Image Optimization
Already handled by Next.js `Image` component (if added).

### 3. Caching
Configure in Vercel **Settings → Caching**:
- Static pages: 1 year
- API routes: 5 minutes (or vary-by)

### 4. Database Queries
- Use Supabase indexing on `student_id`, `created_at`
- Add RLS policies to prevent N+1 queries
- Check query logs in Supabase Dashboard

---

## Continuous Integration (CI)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd web && npm ci
      - run: cd web && npm run build
      - run: cd web && npm run lint
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npx vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## Rollback

### Vercel
1. Go to **Deployments**
2. Click the ⋮ menu on a previous deployment
3. Select **Promote to Production**

### Self-Hosted (PM2)
```bash
git revert <commit_hash>
npm run build
pm2 restart zk-aid
```

---

## Checklist Before Going Live

- [ ] All env vars set (Supabase keys, domain)
- [ ] Email confirmation working (check Supabase auth logs)
- [ ] Student can submit proof, admin can verify
- [ ] No console errors (F12 → Console)
- [ ] Mobile responsive (DevTools device emulation)
- [ ] HTTPS enabled (SSL cert)
- [ ] Monitoring set up (Sentry, Vercel logs, etc.)
- [ ] Backup strategy in place (Supabase auto-backups enabled)
- [ ] Rate limiting on API routes (prevent spam)
- [ ] Legal/privacy docs added to landing page

---

## Support & Troubleshooting

**Questions?**
- Check [Next.js Docs](https://nextjs.org/docs)
- Check [Supabase Docs](https://supabase.com/docs)
- Check [Framer Motion Docs](https://www.framer.com/motion/)

**Errors in production?**
1. Check Vercel logs: Dashboard → Deployments → Logs
2. Check Supabase logs: Dashboard → Logs
3. Check browser Console (F12)
4. Rollback to known-working deployment

**Performance issues?**
1. Use `npm run analyze` to check bundle size
2. Profile with Chrome DevTools Lighthouse
3. Check Supabase query performance
4. Enable Vercel Analytics (Settings → Analytics)

---

## Summary

| Task | Command |
|---|---|
| **Develop locally** | `npm run dev` → http://localhost:3000 |
| **Build for prod** | `npm run build && npm start` |
| **Deploy to Vercel** | Push to GitHub → auto-deploys |
| **Deploy to Docker** | `docker build -t zk-aid . && docker run ...` |
| **View logs** | Vercel Dashboard or `pm2 logs zk-aid` |

**Recommended:** Use **Vercel** for fastest, most reliable deployment with zero backend maintenance.

The project is **ready to deploy**. Choose your preferred platform above and follow the steps — you'll have a live ZK-Aid instance in <10 minutes.
