# Security Policy

## What is in this repo — and what is NOT

This repo contains **only code**: `index.html`, `styles.css`, `app.js`, `README.md`.

It does **NOT** contain:
- Any money data, months, income, spending, or net worth
- Any password, Client Secret, API key, or access token
- Any personal information (name, email, address, phone)

Your money data lives in two places only, both under your control:
1. Your browser's `localStorage` on the device you use
2. Your private Google Drive file `money-profile.json` — only after you tap **Sync now**

## The Google OAuth Client ID is not a secret

`app.js` contains one Google OAuth Client ID. That is a **public identifier**, like a username — Google's own docs say it is not a secret.

It is safe to publish because:
- It only works from the authorized JavaScript origin `https://ramuram572.github.io`
- It only requests the `drive.file` scope — the app can only see the one file it creates
- A sign-in is still required: no one can use the Client ID alone to access your Drive
- The Client Secret is **never** in this repo, and is never used by this app
- The Google access token lives only in memory while the app is open — it is never saved, logged, or committed

If the Client ID ever leaks in a way you are uncomfortable with, rotate it in Google Cloud Console → Credentials, and update `DEFAULT_DRIVE_CLIENT_ID` in `app.js`.

## If you find a vulnerability

Do not open a public issue with exploit details. Email the repo owner directly and allow time to fix it before disclosing it.

## Hardening in place

- No secrets in code or git history (audited 2026-11-26)
- `.gitignore` blocks data exports (`money-profile.json`, `*.env`, etc.) from ever being committed
- No dependencies with known server-side attack surface — the app is static HTML/CSS/JS, no server, no database
- Google Drive sync is opt-in, per-device, and per-Google-account
