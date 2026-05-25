# Building & Submitting Learn Flags to Google Play

This guide walks through everything from "I have the files" to "the app is live on Google Play." Plan on about 2–4 hours of active work the first time, plus 1–7 days of waiting for Google's review.

---

## What you're shipping

The Android app is a **Trusted Web Activity (TWA)** — a thin Android wrapper around your existing web app hosted on GitHub Pages. The wrapper opens your site in a full-screen Chrome window with no browser UI; Android users perceive it as a native app. This is Google's officially recommended approach for web-based games and educational apps.

Crucially, **the TWA loads content from your live URL** (`jefrix.github.io/learnflags`). It is not a fully self-contained APK. This means:
- Updates to the web app deploy instantly to all installed apps. No Play Store update needed for content changes.
- You **must** keep the GitHub Pages site live as long as the Play Store app exists.
- The app's first launch needs internet; after that the service worker caches everything for offline play.

---

## Phase 0 — Prerequisites (one-time, ~30 min)

You need on your local machine:

1. **Node.js 18 or newer** — https://nodejs.org
2. **Java JDK 17 or newer** — https://adoptium.net (download the "JDK 17" or newer)
3. **Bubblewrap CLI**:
   ```bash
   npm install -g @bubblewrap/cli
   ```
4. **A Google Play Developer account** ($25 one-time) — sign up at https://play.google.com/console

The first time you run `bubblewrap`, it will offer to download and install the Android SDK for you (~2GB). Say yes.

---

## Phase 1 — Deploy the PWA (~15 min)

Before building the Android app, your GitHub Pages site needs the new offline-ready version.

1. From the repo root, copy these files in (overwrite where needed):
   - `index.html` (the inlined-React offline version)
   - `manifest.webmanifest`
   - `sw.js`
   - `privacy.html`
   - `icons/` folder (all 8 PNGs)
   - `flags/` folder (197 SVGs — should already be there)

2. Commit and push:
   ```bash
   git add .
   git commit -m "PWA: offline-ready build for Android wrapping"
   git push
   ```

3. **Verify the deployment** at https://jefrix.github.io/learnflags/
   - Open in Chrome on a desktop. In DevTools → Application → Manifest, you should see the app name, icons, and `display: standalone`.
   - In DevTools → Application → Service Workers, the SW should be `activated and running`.
   - In Chrome's address bar there will be a small "install" icon at the right end. Clicking it should install the app to your desktop.
   - Open in Chrome on an Android phone. The browser menu (⋮) should offer "Install app" or "Add to home screen."

   If any of these don't work, the TWA won't work either — fix the PWA first.

---

## Phase 2 — Generate the Android project (~10 min)

```bash
mkdir learnflags-android
cd learnflags-android
cp ../path/to/twa-project/twa-manifest.json .
bubblewrap init --manifest=https://jefrix.github.io/learnflags/manifest.webmanifest
```

When Bubblewrap asks questions, override the defaults with these values (most should auto-detect from `twa-manifest.json`):

| Question | Answer |
|----------|--------|
| Application ID | `io.github.jefrix.learnflags` |
| App name | `Learn Flags — Atlas Project` |
| Launcher name | `Learn Flags` |
| Display mode | `standalone` |
| Status bar color | `#1a1612` |
| Splash screen color | `#f4efe6` |
| Icon URL | `https://jefrix.github.io/learnflags/icons/icon-512.png` |
| Maskable icon | `https://jefrix.github.io/learnflags/icons/icon-maskable-512.png` |
| Include Play Billing? | `No` |
| Request location permission? | `No` |

When it asks **"Do you want to create a signing key?"** → **Yes**. Use these settings:

- Key path: `./android.keystore`
- Key alias: `android`
- Key password: pick a strong password **and save it somewhere you will never lose it**
- Common Name, Organizational Unit, Organization, etc: your real info (this appears in the certificate; not user-visible)

**⚠️ CRITICAL: Save `android.keystore` and its password somewhere safe and back them up.** If you lose either, you can never update the app on Play; you'd have to publish a brand-new app with a new package ID. Apps have been orphaned this way. Put the keystore in a password manager attachment or encrypted backup. Do NOT commit it to git.

---

## Phase 3 — Get your SHA-256 fingerprint and host assetlinks.json (~10 min)

```bash
keytool -list -v -keystore android.keystore -alias android | grep SHA256
```

Enter your keystore password when prompted. Copy the SHA256 fingerprint (looks like `AB:CD:EF:01:02:...`).

Now edit `assetlinks.json` (from this folder) — replace `REPLACE_WITH_YOUR_SHA256_FINGERPRINT_FROM_KEYSTORE` with your real fingerprint. Then host it at the **exact** URL:

```
https://jefrix.github.io/.well-known/assetlinks.json
```

⚠️ Note this is at your domain ROOT, **not** inside `/learnflags/`. GitHub Pages serves your repo at `jefrix.github.io/learnflags/`, but the well-known file must be at `jefrix.github.io/.well-known/assetlinks.json` (no `learnflags` in the path).

The cleanest way to host this on GitHub Pages: create a **separate repo** named `jefrix.github.io` (your username verbatim — that's GitHub's convention for "user site"). Inside it, create `.well-known/assetlinks.json` containing your edited file. That repo's contents serve at the apex `jefrix.github.io/...`.

If you'd rather not create a second repo, alternatives include:
- A custom domain pointing to your repo (you can put `.well-known/` in any directory you control)
- A different host (Netlify, Cloudflare Pages, etc.) for that one file

**Verify it's live**:
```bash
curl https://jefrix.github.io/.well-known/assetlinks.json
```
You should see your JSON content.

Then test the asset link with Google's tool:
https://developers.google.com/digital-asset-links/tools/generator
(Fill in your domain and package name, paste in the SHA256, and it'll tell you if the link is valid.)

---

## Phase 4 — Build the Android app bundle (~5 min)

```bash
bubblewrap build
```

This will:
1. Run Gradle to build the Android project (downloads dependencies first time, ~5 min)
2. Sign with your keystore
3. Produce `app-release-bundle.aab` (the file you upload to Play) and `app-release-signed.apk` (for sideload testing)

If the build fails, the error is usually one of: missing Android SDK pieces (Bubblewrap will tell you what to install), Java version mismatch (needs JDK 17+), or a typo in `twa-manifest.json`. Re-running after fixing usually works.

---

## Phase 5 — Test locally before uploading (~10 min)

1. Enable USB debugging on your Android phone (Settings → About phone → tap Build number 7 times, then Developer options → USB debugging).
2. Connect phone to computer, accept the trust prompt.
3. Install:
   ```bash
   adb install app-release-signed.apk
   ```
4. Open the app on your phone. Critical things to check:
   - **No browser URL bar at the top.** If you see one, the asset link is broken — go back to Phase 3 and verify.
   - The game loads, all four modes work.
   - Close and reopen with phone in airplane mode — the app should still work offline.

If you see a URL bar at the top of the app, do not publish. The asset link MUST be valid before submission, or the app will look broken.

---

## Phase 6 — Create the app in Play Console (~30 min)

1. Sign in at https://play.google.com/console.
2. **Create app**:
   - App name: `Learn Flags — Atlas Project`
   - Default language: English (United States)
   - App or game: **Game**
   - Free or paid: **Free**
   - Accept declarations.

3. **Set up your app** (left sidebar) — work through each section. Use `play-store-listing.md` (in this folder) for all the copy.

4. **App content** section:
   - Privacy Policy → URL: `https://jefrix.github.io/learnflags/privacy.html`
   - Ads → No ads
   - App access → All functionality available without restrictions
   - Content rating → Fill out questionnaire (answers in `play-store-listing.md`)
   - Target audience → Ages 9-12 through 18+; not designed primarily for children
   - News app → No
   - COVID-19 contact tracing → No
   - Data safety → No data collected, no data shared (answers in `play-store-listing.md`)
   - Government app → No
   - Financial features → No
   - Health → No

5. **Main store listing**:
   - Short description, full description → from `play-store-listing.md`
   - App icon → `icons/icon-512.png`
   - Feature graphic → `pwa-assets/feature-graphic.png`
   - Phone screenshots → upload all three `screenshots/screen-*.png`
   - Tablet screenshots → optional (upload the same ones if you want)
   - Category → Educational

---

## Phase 7 — Upload the AAB and submit for review (~15 min + 1–7 days waiting)

1. In Play Console: **Production** → **Create new release**.
2. Upload `app-release-bundle.aab`.
3. Release name will auto-populate as `1 (1.0.0)`.
4. Release notes → copy the "What's new" section from `play-store-listing.md`.
5. **Save** → **Review release** → **Start rollout to Production**.

Google's review for new apps typically takes 3–7 days. Updates to existing apps usually clear in hours. You'll get an email when it's published.

If they reject it, the most common reasons are:
- **URL bar showing** → asset link issue. Re-verify Phase 3.
- **Crashes on a device they tested** → check the Play Console "Pre-launch report" for stack traces.
- **Privacy policy URL not loading** → make sure `privacy.html` is publicly accessible.
- **Inaccurate screenshot** → if your screenshots don't show the actual app, they'll bounce it. The ones I generated for you are honest mockups but if reviewers are strict you may want to replace them with real device screenshots after install.

---

## Phase 8 — After publication

- **Bookmark these**: Play Console app dashboard, your GitHub repo, and the back-up location of your keystore.
- **Once a year (every August-ish)**, Google raises the minimum target SDK. You'll need to rebuild with the new target. `bubblewrap update` followed by `bubblewrap build` handles this in a few minutes.
- **App content changes** (new flags, fixed typos, new game modes) just need a git push to your repo — installed apps pull the latest content from your URL automatically. No Play Store update needed.
- **Wrapper changes** (icon, splash screen, package metadata) require a new AAB upload with an incremented `appVersionCode` in `twa-manifest.json`.

---

## Files in this folder

| File | Purpose |
|------|---------|
| `index.html` | The offline-ready web app — drop into your repo root |
| `manifest.webmanifest` | PWA manifest — drop into your repo root |
| `sw.js` | Service worker for offline caching — drop into your repo root |
| `privacy.html` | Privacy policy page — drop into your repo root |
| `icons/` | All Android icon sizes (48, 72, 96, 144, 192, 512 plus maskable 192, 512) |
| `flags/` | The 197 flag SVGs (should already be in your repo) |
| `twa-project/twa-manifest.json` | Bubblewrap config — used in Phase 2 |
| `twa-project/assetlinks.json` | Asset link template — edit and host in Phase 3 |
| `pwa-assets/feature-graphic.png` | 1024×500 Play Store banner |
| `pwa-assets/play-store-icon-512.png` | 512×512 store icon |
| `screenshots/` | Three 1080×1920 phone screenshots |
| `play-store-listing.md` | All text content for the Play Console |
| `BUILD-AND-SUBMIT.md` | This file |

---

## Realistic time and cost summary

- **Active work**: 2–4 hours the first time (everything from Phase 1 onward)
- **Google's review**: 3–7 days for first submission, hours for updates
- **One-time cost**: $25 to Google for the developer account
- **Ongoing cost**: $0
- **Ongoing maintenance**: ~30 minutes once a year when Google raises the target SDK

If you hit a wall at any phase, the most useful resource is the Bubblewrap GitHub repo's issues page: https://github.com/GoogleChromeLabs/bubblewrap/issues. Most TWA problems have been seen before.

Good luck. The first publish always feels like a slog; the second one takes 20 minutes.
