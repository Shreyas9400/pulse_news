# PulseNews — Continuous AI News & Market Intelligence Platform

A modern, high-performance daily news aggregator and AI executive digest designed for seamless, free-tier deployment on **Vercel** with real-time **Yahoo Finance** market monitoring and continuous updates.

---

## 🌟 Key Features

1. **Continuous Real-Time Monitoring**:
   - **Yahoo Finance & Stock Tickers**: Live market movers, S&P 500, Nasdaq, Dow Jones, Nvidia, Apple, and crypto.
   - **Multi-Source RSS Aggregation**: Google News RSS, BBC, Reuters, TechCrunch, The Verge, Hacker News, and Science feeds.
   - **Dynamic Topic & Keyword Search**: Generates custom RSS streams on the fly for any company, person, or theme.

2. **Overcoming Vercel 12-Hour Cron Limitations**:
   - **Next.js Edge ISR (Incremental Static Regeneration)**: Configured with `revalidate = 900` (15 mins) and Stale-While-Revalidate caching. Serves feeds in <50ms without running 24/7 background servers.
   - **Free GitHub Actions Cron (`.github/workflows/sync-news.yml`)**: Pings `/api/cron/sync-news` every 20 minutes for high-frequency updates using GitHub's 2,000 free minutes/month.
   - **Vercel Cron Fallback (`vercel.json`)**: Configured for twice-daily runs as a baseline safety net.

3. **AI Executive Intelligence**:
   - **Daily Briefing**: Morning/Evening executive takeaways, sentiment gauges, and key bullet points.
   - **Hands-Free Voice Narrator**: Listen to the daily briefing or articles aloud using the Web Speech API.
   - **Distraction-Free Reader Mode & Bookmarking**: Clean reader overlay and local bookmarks.
   - **3 Rich Themes**: Cyber Dark (Default), Clean Light, and Pitch OLED.

---

## 🚀 Step-by-Step Vercel Deployment

### 1. Push to GitHub
Initialize your Git repository and push the code to your GitHub account:
```bash
git init
git add .
git commit -m "Initial commit of PulseNews"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### 2. Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import your repository.
3. In **Environment Variables**, add the following (optional):
   - `CRON_SECRET`: Any random secure string (e.g. `pulse_secret_998124`)
   - `GEMINI_API_KEY`: *(Optional)* Your Google AI Gemini API key for frontier LLM daily briefings (the app includes a built-in semantic NLP summarizer if omitted).
4. Click **Deploy**.

### 3. Setup High-Frequency GitHub Action Cron (Free 15-20 Min Sync)
1. Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following Repository Secrets:
   - `VERCEL_APP_URL`: Your deployed Vercel domain (e.g., `https://your-news-app.vercel.app`)
   - `CRON_SECRET`: Same value as configured in Vercel.
3. The included `.github/workflows/sync-news.yml` will automatically ping your app every 20 minutes to keep your cache fresh!

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Open http://localhost:3000
```
