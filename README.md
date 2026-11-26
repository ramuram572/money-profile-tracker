# Money Profile

Enter your money numbers **once a month**. See instantly whether you're ahead or behind — in green and red.

## What it does

- **Your profile** — name, currency ($ / ₹ / € / £), and a savings-rate goal (default 20%).
- **Monthly entry, once a month** — one form per month:
  - Take-home income
  - Spending by category: Housing, Food, Transport, Subscriptions, Shopping, Fun / Eating out, Health, Other
  - Saved / invested that month
  - Total assets and total debts (for net worth)
  - Saving the same month again updates it — so you can't accidentally double-enter.
- **Green / red verdict, every month**
  - 🟢 Green surplus = income beat spending. 🔴 Red = you spent more than you earned.
  - Net worth ▲ green / ▼ red vs the previous month.
  - Savings rate green at or above your goal, red below it.
- **Graphs**
  - Income vs Spending (bars) + Surplus line
  - Net Worth trend — green points when it rises, red when it falls
  - Where It Went — spending breakdown doughnut for the latest month
  - Savings Rate by month — green bars at/above goal, red below
- **History table** — one row per month, with edit / delete.
- **Export / Import** — download your data as JSON, restore it later.
- **Sample data** — one click to see how the graphs look, then Clear All and enter your own.

## Google Drive sync — use on any device

By default data is stored in your browser's `localStorage` only. To sync across devices, the app is wired to Google Drive: one private file, `money-profile.json`, in your Drive. Same Google account on any device = same data.

The app uses Google Identity Services with the `drive.file` scope — it can only see the file it creates, not your other Drive files. Your OAuth Client ID is pasted in the app and saved only in that browser, never in this repo.

### Setup (once, ~5 minutes, free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (any name, e.g. Money Profile).
2. Left menu → **APIs & Services → Library** → search **Google Drive API** → Enable it.
3. **APIs & Services → OAuth consent screen** → Get started → fill App name (Money Profile) and your email → Create. Audience: External. Add yourself as a test user if it asks.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type: **Web application** → Name: Money Profile.
5. Under **Authorized JavaScript origins**, add exactly: `https://ramuram572.github.io`
   (For local testing also add `http://localhost:8000` if you use it.)
6. Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`). The Client Secret is not needed — do not paste it anywhere.
7. Open the live app, go to **Google Drive sync**, paste the Client ID, tap **Connect Drive**, sign in with your Google account, and allow Drive access.
8. Tap **↑ Sync now — save to Drive**. On another device, open the app, paste the same Client ID, Connect Drive with the same Google account, tap **↓ Load from Drive**.

If Google shows "unverified app" while testing, tap Advanced → Go to Money Profile — that's normal until the app is verified, and it only affects you.

## Privacy

All data is stored in your browser's `localStorage` until you sync it. Nothing is sent to any server except Google Drive, and only after you connect it and tap Sync.

## Use it

Just open `index.html` in a browser — no install, no build step.

Or host it free with GitHub Pages:
Settings → Pages → Deploy from a branch → `main` / `/ (root)` → Save. Your app will be live at `https://<your-username>.github.io/money-profile-tracker/`

## Files

- `index.html` — layout
- `styles.css` — dark, modern UI
- `app.js` — all logic + charts (Chart.js via CDN)
