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

## Privacy

All data is stored in your browser's `localStorage`. Nothing is sent to any server.

## Use it

Just open `index.html` in a browser — no install, no build step.

Or host it free with GitHub Pages:
Settings → Pages → Deploy from a branch → `main` / `/ (root)` → Save. Your app will be live at `https://<your-username>.github.io/money-profile-tracker/`

## Files

- `index.html` — layout
- `styles.css` — dark, modern UI
- `app.js` — all logic + charts (Chart.js via CDN)
