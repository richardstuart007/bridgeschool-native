# PLAN_video-row-status-colours — bridgeschool-native

## Title
Video row status colours, development build, and Android releases via GitHub with in-app version + update banner

## Agreed design

Changes the earlier "orange only, no colour logic" decision: rows now show their status by
colour + icon (option "Colour + icon", agreed 2026-10-22). Tap behaviour unchanged — tapping the
row plays a saved video, downloads an unsaved one.

| Status | Row colour | Icon | Status text | Right side |
|---|---|---|---|---|
| Not saved | orange `#fb923c` | ⬇ | Tap to download | — |
| Downloading | orange | ⬇ | Downloading n% + progress bar | — |
| Failed | orange | ⬇ | Download failed — tap to retry | — |
| Saved | green `#16a34a` | ▶ | Saved — tap to play | small red `#dc2626` "Remove" pill |

- Icons: plain text symbols ⬇ / ▶ with the text-presentation selector (U+FE0E) so Samsung does
  not draw them as colour emoji — no new package (recommendation taken with `#plan`).
- Colours live in VideoRow's own styles (styling stays local), not the constants file.
- No Remove confirmation on iPhone for now (Android's system confirmation unchanged).

**Development build first** (added 2026-10-22, so the look can be checked live on the Samsung
without a full APK rebuild per tweak):
- `expo-dev-client` package; `development` profile in eas.json (developmentClient, internal
  distribution, APK); script `build:android:dev`.
- Same application ID as the preview APK, so the dev build installs **over** the current app
  (saved videos in Pictures/BridgeSchool are kept). `npm run build:android` still produces the
  normal standalone APK for testers.

## Plan

- [x] 1. Install `expo-dev-client` (`npx expo install expo-dev-client`).
- [x] 2. `eas.json`: add profile
      `"development": { "developmentClient": true, "distribution": "internal", "android": { "buildType": "apk" } }`.
- [x] 3. `package.json` script:
      `"build:android:dev": "npx eas-cli@latest build --profile development --platform android"`.
- [x] 4. Lock-file check (lesson from the metro-config failure): `npx npm@10 ci --dry-run` and
      local `npm ci --dry-run` both pass.
- [x] 5. `src/components/VideoRow.tsx`:
      - row style chosen by status: orange when not saved, green when saved (computed above the
        JSX as a named style const — no calculation in JSX);
      - icon ⬇︎ / ▶︎ at the left of the row (computed above the JSX);
      - status text "Saved" → "Saved — tap to play"; other texts unchanged;
      - Remove: smaller red pill (red background, white text, smaller padding/font) replacing the
        current white-outlined button;
      - header comment updated to describe the statuses.
- [x] 6. `npx tsc --noEmit` passes; Android bundle export passes.
- [x] 7. User: one development build + install, then live testing (see Testing).

### Android release via GitHub, app version, update banner + help (added 2026-10-24)

Agreed design:
- Fixed public download URL (used by richard-dashboard's "Android Download" card — must not
  change): `https://github.com/richardstuart007/bridgeschool-native/releases/latest/download/AndroidBridgeschool.apk`
  Repo confirmed public; no releases exist yet.
- **Option 2 — local script** `npm run release:android` (not manual, not GitHub Actions).
- **Release version = app.json `expo.version`**, tag `v<version>`; package.json's version stays
  the `#commit` counter. Each release needs a new app.json version (script refuses a reused tag).
- **`autoIncrement: true`** on the preview profile (Android versionCode was stuck at 1).
- Version shown in the app: small grey "Bridge School v<version>" under the video list, read via
  `expo-constants` (`Constants.expoConfig.version`) — no new package, no build number.
- **Update banner (Android only):** on opening the Videos screen the app fetches the latest
  GitHub release (`/repos/richardstuart007/bridgeschool-native/releases/latest`, unauthenticated)
  and compares its `tag_name` with the installed version. If newer: a banner at the top
  "New version v<x> available — tap to update". Offline / any error → no banner, nothing logged
  to the user.
- **Update help:** tapping the banner opens an "Update Bridge School" screen: a big
  "Download update" button (opens the fixed URL in the browser) above plain-language steps:
  1. Tap **Download update**. Your browser downloads the new version.
  2. If it warns the file may be harmful, tap **Download anyway**.
  3. Open the download (tap the notification, or My Files › Downloads › AndroidBridgeschool.apk).
  4. Tap **Update**. If asked, allow your browser to install apps: Settings → **Allow from this
     source**, then go back and tap **Update** again.
  5. If **Play Protect** warns you, tap **More details → Install anyway**.
  6. If a Samsung phone says **Auto Blocker** blocked it: Settings → Security and privacy →
     Auto Blocker → Off, then try again (you can turn it back on afterwards).
  7. Your saved videos are kept.
  (Wording to be reviewed by the user on the phone.)

- [x] 8. `eas.json`: `"autoIncrement": true` in `build.preview`.
- [x] 9. `app.json`: `expo.version` `1.0.0` → `1.0.1` (first GitHub release).
- [x] 10. `src/constants.ts`: `ANDROID_APK_URL` (the fixed URL above) and
      `GITHUB_LATEST_RELEASE_URL` (`https://api.github.com/repos/richardstuart007/bridgeschool-native/releases/latest`).
- [x] 11. `src/appVersion.ts`: `appVersion()` (installed version from expo-constants),
      `latestReleaseVersion()` (fetch + strip leading "v"; null on any failure),
      `isNewerVersion(a, b)` (numeric x.y.z compare).
- [x] 12. Videos screen (`src/app/index.tsx`): version footer; on Android, check once per app
      launch and show `UpdateBanner` when newer → navigates to the help screen.
      New component `src/components/UpdateBanner.tsx`; new route `src/app/update.tsx`
      (title "Update Bridge School", Download update button + the steps above).
- [x] 13. `scripts/releaseAndroid.mjs` + `package.json` script `"release:android"`:
      a) stop if uncommitted changes or local `main` not pushed;
      b) read app.json version → tag `v<version>`; stop if that GitHub release/tag exists
         (`gh release view`);
      c) `npx eas-cli@latest build --platform android --profile preview --non-interactive --wait --json`
         → APK URL from `artifacts.buildUrl`;
      d) download to a temp folder as exactly `AndroidBridgeschool.apk`;
      e) `gh release create v<version> <apk> --title "Bridge School v<version>" --notes "<versionCode, EAS build link>" --latest`
         (published, not draft/pre-release);
      f) HEAD-check the fixed URL resolves; print it.
      `gh` must already be logged in (script checks `gh auth status` first and explains if not).
- [x] 14. Checks: `npx tsc --noEmit`; Android bundle export; `node --check scripts/releaseAndroid.mjs`;
      script's pre-flight (a, b) exercised without building.
- [x] 15. User: `gh auth login` once; `#commit`; then `npm run release:android`; dashboard link
      downloads v1.0.1.

## Changes

### package.json / package-lock.json (steps 1, 3)
- Added `expo-dev-client ~58.0.14` (via `npx expo install`).
- Added script `"build:android:dev": "npx eas-cli@latest build --profile development --platform android"`.
- Step 4: `npx npm@10 ci --include=dev --dry-run` and local `npm ci --include=dev --dry-run`
  both pass (lock file accepted by the EAS npm and the PC's npm).

### eas.json (step 2)
- New `development` profile: `developmentClient: true`, `distribution: "internal"`,
  `android.buildType: "apk"`. Verified with `eas config --profile development --platform android`.

### src/components/VideoRow.tsx (step 5)
- Row colour by status: `rowNotSaved` orange `#fb923c` (not saved / downloading / failed),
  `rowSaved` green `#16a34a` (saved and not downloading) — chosen above the JSX
  (`rowStatusStyle`).
- Left icon: `DOWNLOAD_ICON` ⬇︎ (`⬇︎`) or `PLAY_ICON` ▶︎ (`▶︎`), file-level
  consts; U+FE0E keeps them as plain symbols, not emoji.
- Saved status text "Saved" → "Saved — tap to play".
- Remove: small red pill (`#dc2626`, white 12 pt text, padding 4/8, radius 12) replacing the
  white-outlined button.
- Header comment: statuses described; CHANGE HISTORY entry added.

### Checks (step 6)
- `npx tsc --noEmit` passes; `npx expo export --platform android` passes.

### eas.json (step 8)
- `build.preview.autoIncrement: true` — each preview build gets the next Android versionCode
  (it had stayed at 1). Verified with `eas config --profile preview --platform android`.

### app.json (step 9)
- `expo.version` `1.0.0` → `1.0.1` — the first GitHub release (`v1.0.1`).

### src/constants.ts (step 10)
- `ANDROID_APK_URL` (fixed GitHub "latest" asset URL — shared with richard-dashboard, never
  change) and `GITHUB_LATEST_RELEASE_URL` (GitHub API latest-release endpoint).

### src/appVersion.ts (new, step 11)
- `appVersion()` — installed version from `Constants.expoConfig.version` (expo-constants, already
  a dependency). `latestReleaseVersion()` — fetches the latest release, returns `tag_name`
  without "v", null on any failure (console.warn only). `isNewerVersion(candidate, current)` —
  numeric x.y.z compare; checked in isolation: 1.0.2>1.0.1 true, 1.0.1>1.0.1 false,
  1.0.10>1.0.9 true, 1.0.0>1.0.1 false, 2.0.0>1.9.9 true.

### src/components/UpdateBanner.tsx (new, step 12)
- Blue (`#1d4ed8`) banner "New version v<x> available — tap to update"; tap → onPress.

### src/app/update.tsx (new, step 12)
- "Update Bridge School" screen: big blue **Download update** button (`Linking.openURL`
  of `ANDROID_APK_URL`) above the 7 agreed help steps (`UPDATE_STEPS`).

### src/app/_layout.tsx (step 12)
- Stack screen `update` titled "Update Bridge School".

### src/app/index.tsx (step 12)
- Android only: one latest-release check on mount (`useEffect`); `UpdateBanner` above the list
  when `isNewerVersion(latest, installed)`; tap → `/update`.
- Grey footer "Bridge School v<installed version>" under the list (all platforms).

### scripts/releaseAndroid.mjs (new) + package.json `release:android` (step 13)
- Steps: `gh auth status` → clean working tree and HEAD == upstream (after `git fetch`) → tag
  `v<app.json version>` must not exist (`gh release view`) → `npx eas-cli@latest build
  --platform android --profile preview --non-interactive --wait --json` (progress on screen,
  JSON captured) → download `artifacts.buildUrl` to a temp folder as `AndroidBridgeschool.apk` →
  `gh release create <tag> <apk> --repo richardstuart007/bridgeschool-native --target <HEAD sha>
  --title "Bridge School <tag>" --notes "<versionCode, EAS build link>" --latest` → HEAD-check
  the fixed URL. Any failure stops before publishing, with a plain explanation.

### Checks (step 14)
- `npx tsc --noEmit` passes; `npx expo export --platform android` passes;
  `node --check scripts/releaseAndroid.mjs` passes.
- `npm run release:android` pre-flight: stopped at step 1 with "GitHub CLI is not logged in. Run
  "gh auth login" once, then try again." — nothing built or published (expected; gh not yet
  logged in).

## Testing
- [ ] One-time development build (asks nothing new; answer n to the emulator question):
      npm run build:android:dev
- [ ] Install it on the Samsung from the new link/QR code, as before — it replaces the current
      Bridge School app; saved videos in Pictures/BridgeSchool are kept
- [ ] On the PC, in the project folder, start the project's dev server (the `start` script);
      phone and PC on the same Wi-Fi; allow Node through Windows Firewall if asked
- [ ] Open Bridge School on the phone: it shows a development launcher — tap the PC's server
      (or scan the QR code shown in the PC terminal); the app loads
- [ ] Saved videos: green row, ▶ icon, "Saved — tap to play", small red Remove pill on the right
- [ ] Unsaved videos: orange row, ⬇ icon, "Tap to download"; tap one → "Downloading n%" + bar
      (still orange) → plays; back → row is now green
- [ ] Remove on a green row → confirm → row turns orange
- [ ] Icons show as plain white symbols, not colourful emoji
- [ ] When happy with the look, make the normal APK for testers:
      npm run build:android
- [ ] In the development build: grey "Bridge School v1.0.1" under the list; no update banner
      (no GitHub release exists yet)
- [ ] Release setup, once: log in the GitHub CLI (choose GitHub.com, HTTPS, browser login):
      gh auth login
- [ ] Commit and push everything (the release script refuses uncommitted/unpushed work)
- [ ] Publish the first release (runs the EAS build, 10–30 min, then creates release v1.0.1):
      npm run release:android
- [ ] github.com/richardstuart007/bridgeschool-native/releases shows "Bridge School v1.0.1",
      marked Latest, with AndroidBridgeschool.apk attached
- [ ] The dashboard's "Android Download" card downloads the APK (no login); install it on the
      Samsung (replaces the development build) — footer shows v1.0.1, no banner
- [ ] Banner test at the next release: bump app.json version to 1.0.2, commit, push,
      npm run release:android; open the v1.0.1 app → blue "New version v1.0.2 available — tap to
      update" banner → tap → Update screen → Download update → install → footer shows v1.0.2
