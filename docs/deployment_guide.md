# StreamFlix - Step-by-Step Render Deployment & Live URL Guide

Follow these exact steps to get your live Render backend URL (`https://<your-app-name>.onrender.com`), connect your Supabase database, and set up your 24/7 keep-alive ping.

---

## Step 1: Push Code to GitHub

Before Render can create your live API link, your code needs to be on GitHub.

1. Open PowerShell / Terminal in `e:\Projects\streamflix`:
2. Commit all your changes:
   ```powershell
   git add .
   git commit -m "StreamFlix phase updates & cloud deployment readiness"
   ```
3. Push to your main branch:
   ```powershell
   git push origin main
   ```

---

## Step 2: Create Web Service on Render & Get Your Live URL

1. Go to [Render Dashboard](https://dashboard.render.com/) and log in with your existing account.
2. Click **New +** -> Select **Web Service**.
3. Connect your GitHub repository (`Someshwar-Sahu/StreamFLIX`).
4. Configure the Web Service settings:
   - **Name**: `streamflix-api` (or any unique name you prefer)
   - **Region**: Choose the closest region (e.g. Singapore, Oregon, Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `apps/backend`
   - **Environment**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: Select **Free** ($0/month).

5. Under **Environment Variables**, add:
   - `DATABASE_URL`: *(Your Supabase connection string, e.g. `postgresql+asyncpg://postgres:YOUR_PASSWORD@db.YOUR_SUPABASE_ID.supabase.co:5432/postgres`)*
   - `SECRET_KEY`: *(Generate any secret random string)*
   - `ALGORITHM`: `HS256`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `10080`
   - `CORS_ORIGINS`: `*`

6. Click **Create Web Service**.

---

## Step 3: Copy Your Live Backend URL

Once Render finishes deploying (takes ~2 minutes), Render will display your live HTTPS URL at the top left of your dashboard:

```text
https://streamflix-api.onrender.com
```

👉 **Save this URL!** This is your official production backend link.

Test it in your browser:
- `https://streamflix-api.onrender.com/health`
It will return:
```json
{
  "status": "ok",
  "db": "ok"
}
```

---

## Step 4: Set Up Free 24/7 Keep-Alive (Render + Supabase)

To prevent Render from sleeping after 15 minutes and Supabase from pausing after 7 days:

1. Go to **[Cron-Job.org](https://cron-job.org/)** (or [UptimeRobot.com](https://uptimerobot.com/)) and sign up for a free account.
2. Click **Create Cronjob**.
3. **URL**: `https://streamflix-api.onrender.com/health`
4. **Execution Schedule**: Every 14 minutes.
5. Save the cron job!

Now your backend and database will stay awake 24/7 automatically.

---

## Step 5: Replace Localhost with Your Render Live URL

Now you can plug your live Render URL (`https://streamflix-api.onrender.com`) into all 3 apps:

### A. Mobile App (Android APK)
In `apps/mobile/src/config.ts`:
```typescript
export const API_BASE_URL = 'https://streamflix-api.onrender.com';
```
*(Or enter `https://streamflix-api.onrender.com` directly inside the Mobile App under Settings -> Backend Host IP!)*

### B. Web App
When deploying Web app (e.g. Vercel or Render Static Site), set environment variable:
```env
VITE_API_BASE_URL=https://streamflix-api.onrender.com
```

### C. Desktop App
When building the Desktop App installer, your web build will automatically use `https://streamflix-api.onrender.com`!
