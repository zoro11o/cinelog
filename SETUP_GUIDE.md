# WatchVault Live on https://watchvaultx.netlify.app/

# WatchVault — Setup Guide (Beginner Friendly)

This guide walks you through every step, from zero to a live website.
Estimated time: **30–45 minutes**.

---

## What you'll need (all free)

| Tool | What it does |
|------|-------------|
| [Node.js](https://nodejs.org) | Runs the app on your computer for testing |
| [Supabase](https://supabase.com) | Your database + user login system |
| [TMDB](https://themoviedb.org) | Movie & TV show data + posters |
| [Vercel](https://vercel.com) | Hosts your website for free |
| [GitHub](https://github.com) | Stores your code (required for Vercel) |
| [VS Code](https://code.visualstudio.com) | Code editor (recommended) |

---

## Step 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the one that says "Recommended For Most Users")
3. Run the installer — click Next through everything
4. To verify it worked, open **Terminal** (Mac) or **Command Prompt** (Windows) and type:
   ```
   node --version
   ```
   You should see something like `v20.11.0`

---

## Step 2 — Set up Supabase (your database)

### 2a — Create a free account
1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with GitHub or email
3. Click **New project**
4. Fill in:
   - **Name:** WatchVault
   - **Database Password:** pick something strong and save it somewhere
   - **Region:** pick the one closest to you
5. Click **Create new project** — wait about 2 minutes for it to set up

### 2b — Run the database schema
This creates the tables WatchVault needs to store data.

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase-schema.sql` from this project folder
4. Copy everything in that file
5. Paste it into the SQL Editor
6. Click the green **Run** button
7. You should see "Success. No rows returned" — that means it worked

### 2c — Get your API keys
1. In your Supabase project, click **Project Settings** (gear icon, bottom left)
2. Click **API** in the settings menu
3. You'll see two values you need:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — a long string starting with `eyJ`
4. Copy these somewhere — you'll need them in Step 4

### 2d — Enable email sign-ups
1. In your Supabase project, click **Authentication** in the left sidebar
2. Click **Providers**
3. Make sure **Email** is enabled (it is by default)
4. Optional: turn off **Confirm email** if you want users to log in immediately without email verification
   - Go to **Authentication → Settings → Email Auth**
   - Toggle off "Enable email confirmations"

---

## Step 3 — Get a TMDB API key (movie data)

1. Go to **https://www.themoviedb.org** and create a free account
2. After logging in, click your profile icon → **Settings**
3. Click **API** in the left menu
4. Click **Create** or **Request an API Key**
5. Choose **Developer** (for personal projects)
6. Fill in the form — for the website URL just put `http://localhost:5173`
7. Once approved (usually instant), copy your **API Key (v3 auth)** — it looks like `a1b2c3d4e5f6...`

---

## Step 4 — Set up the project on your computer

### 4a — Extract the zip
1. Unzip the `watchwault.zip` file you downloaded
2. You'll have a folder called `watchwault`

### 4b — Open it in VS Code
1. Open VS Code
2. Go to **File → Open Folder**
3. Select the `watchwault` folder

### 4c — Create your environment file
This file holds your secret keys. It is **never uploaded to GitHub** (it's in `.gitignore`).

1. In VS Code, right-click in the file explorer panel → **New File**
2. Name it exactly: `.env`
3. Paste this inside, replacing the placeholder values with your real keys:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_TMDB_API_KEY=a1b2c3d4e5f6g7h8i9...
```

### 4d — Install dependencies
1. In VS Code, open the Terminal: **Terminal → New Terminal**
2. Type this and press Enter:
   ```
   npm install
   ```
   Wait for it to finish (might take 1–2 minutes)

### 4e — Run the app locally
```
npm run dev
```
Open your browser and go to **http://localhost:5173** — you should see WatchVault!

---

## Step 5 — Deploy to the internet (free with Vercel)

### 5a — Push your code to GitHub
1. Create a free account at **https://github.com**
2. Click **New repository** → name it `watchwault` → click **Create repository**
3. In VS Code terminal, run these commands one by one:
   ```
   git init
   git add .
   git commit -m "Initial WatchVault commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/watchwault.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your actual GitHub username

### 5b — Deploy on Vercel
1. Go to **https://vercel.com** and sign up with your GitHub account
2. Click **Add New Project**
3. Find your `watchwault` repository and click **Import**
4. Before clicking Deploy, click **Environment Variables** and add all three:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
   - `VITE_TMDB_API_KEY` → your TMDB API key
5. Click **Deploy**
6. In about 1 minute, Vercel will give you a live URL like `https://watchwault-xyz.vercel.app`

---

## Step 6 — Update Supabase allowed URLs (important!)

After you have your Vercel URL, you need to tell Supabase it's allowed:

1. Go to your Supabase project → **Authentication → URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://watchwault-xyz.vercel.app`
3. Add to **Redirect URLs**: `https://watchwault-xyz.vercel.app/**`
4. Click Save

---

## Project folder structure explained

```
watchwault/
│
├── src/
│   ├── main.jsx              ← App entry point (don't touch)
│   ├── App.jsx               ← Root — manages pages and shared data
│   │
│   ├── lib/                  ← Shared utilities
│   │   ├── supabase.js       ← Supabase connection
│   │   ├── tmdb.js           ← TMDB API calls
│   │   └── constants.js      ← Shared values (status colors etc.)
│   │
│   ├── hooks/                ← Reusable logic
│   │   ├── useAuth.js        ← Login/logout/signup
│   │   ├── useEntries.js     ← Load/add/update/remove list entries
│   │   ├── useProfile.js     ← Load/update user profile
│   │   └── useDebounce.js    ← Delay search while typing
│   │
│   ├── components/
│   │   ├── ui/               ← Small reusable pieces
│   │   │   ├── Avatar.jsx         ← Profile picture or initials
│   │   │   ├── StatCard.jsx       ← Stats display card
│   │   │   ├── ScoreSelector.jsx  ← Score 1–10 picker
│   │   │   └── LoadingSpinner.jsx ← Loading screen
│   │   │
│   │   ├── layout/           ← Page structure
│   │   │   └── Navbar.jsx         ← Top navigation bar
│   │   │
│   │   └── modals/           ← Popup dialogs
│   │       └── AddToListModal.jsx ← Add/edit/remove an entry
│   │
│   ├── pages/                ← Full pages
│   │   ├── AuthPage.jsx      ← Login / sign up
│   │   ├── HomePage.jsx      ← Landing page after login
│   │   ├── SearchPage.jsx    ← Search TMDB and add titles
│   │   ├── MyListPage.jsx    ← View all tracked titles
│   │   └── ProfilePage.jsx   ← Stats, breakdown, recently added
│   │
│   └── styles/
│       └── global.css        ← Base CSS reset and body styles
│
├── supabase-schema.sql       ← Paste this into Supabase SQL editor
├── .env                      ← YOUR SECRET KEYS (never share this)
├── .env.example              ← Template showing which keys are needed
├── .gitignore                ← Tells git to ignore node_modules and .env
├── index.html                ← HTML entry point
├── vite.config.js            ← Build tool config
└── package.json              ← Project dependencies
```

---

## Common problems & fixes

**"Missing Supabase environment variables" error**
→ Your `.env` file is missing or the variable names are wrong. Check they start with `VITE_`.

**Search returns no results**
→ Your TMDB API key is wrong. Double-check it in `.env`.

**Can't sign up / "Invalid API key"**
→ Your Supabase URL or anon key is wrong. Go to Supabase → Settings → API to copy them again.

**The app works locally but not on Vercel**
→ You forgot to add the environment variables in Vercel. Go to your Vercel project → Settings → Environment Variables.

**Avatar image doesn't show**
→ Some image hosting sites block hotlinking. Try a direct image URL from imgur.com or upload to postimages.org.
