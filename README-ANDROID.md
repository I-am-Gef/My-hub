# My Hub – Android version

## Option A – Install as an app (PWA, no Android Studio)
1. Upload this whole folder to any HTTPS host (GitHub Pages, Netlify Drop, Cloudflare Pages – all free).
2. Open `https://your-site/index.html` in Chrome on Android → ⋮ → **Install app** (Add to Home screen).
3. Done. Now in any browser/app: **Share → My Hub** adds the link to your Inbox.

Moving your data: on the desktop extension use 💾 Backup → export; on the phone use Backup → import.

## Option B – Real APK with Capacitor (fixes link-health checks)
    npm init -y && npm i @capacitor/core @capacitor/cli @capacitor/android
    npx cap init "My Hub" com.example.myhub --web-dir=.
    # in capacitor.config.json add:  "plugins": { "CapacitorHttp": { "enabled": true } }
    npx cap add android && npx cap sync && npx cap open android   # build the APK in Android Studio
CapacitorHttp makes fetch() skip CORS, so the "needs attention" checks, reader mode and GitHub update checks work.
To receive the Share sheet in the APK, add a `@capgo/capacitor-share-target` (or similar) plugin and
call the same import logic as share.js.

## What works / doesn't
Works: collections, search, tags, status, gallery/list, backup, notes, Today/daily list, import via paste.
Needs Option B: link health checks, reader/offline copy, GitHub release checks (CORS).
Removed (not possible on phones): save-all-open-tabs, parked research windows, side "peek" window, PiP, remote control, background re-check badge.
