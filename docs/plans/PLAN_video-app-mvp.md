# PLAN_video-app-mvp — bridgeschool-native

## Title
Video app MVP: video list → download-then-play, saved to a visible BridgeSchool folder

## Agreed design (summary — full record in `.claude/CLAUDE.md` › Decisions)

- **Keep it simple.** Anything beyond the below is added at a later stage.
- Expo / React Native, TypeScript, **Expo Router**, player **`expo-video`**.
- **This app has no database and connects to none** — only R2, to download `.mp4` files.
- **Constants** (the whole catalogue):
  ```ts
  R2_BASE_URL  = 'https://pub-13d8924a0e08436b9490bcbee03bb453.r2.dev'
  SAVED_FOLDER = 'BridgeSchool'
  VIDEOS = [
    { rf_desc: 'Two Way Checkback', rf_link: 'Hollands/Two_Way_Checkback.mp4' },
    { rf_desc: 'Bergen Raises',     rf_link: 'Hollands/Bergen_Raises.mp4' },
    { rf_desc: 'Redoubles',         rf_link: 'Hollands/Redoubles_In_Bridge.mp4' },
  ]
  ```
  - `rf_desc` — the video name: shown on screen, and the saved file name (`Bergen Raises.mp4`).
  - `rf_link` — path in R2, prefixed with `R2_BASE_URL` at download time.
  - Field names follow next-bridgeschool's `trf_reference` columns. No subjects, owner, level,
    presenter, badge or colour constants.
- **Screens:** 1) **Videos** — one row per video: name, Saved marker, progress bar while
  downloading, Remove. Rows styled orange (plain style, no colour constant or logic).
  2) **Player** — full screen, plays the saved file. Identified by `rf_desc` (unique).
- **Download-then-play, no streaming, no cache, no Save button.** Tap an unsaved video → download
  the full `.mp4` with a progress bar → play the saved file. Saved videos always play from the
  phone. A failed/cancelled download leaves no partial file. Saved videos can be removed.
- **One copy per video, ever.** File name `rf_desc.mp4`, unsafe filename characters removed. The
  user guarantees `rf_desc` is unique — no clash handling; same name overwrites.
- **Location:** Android — `BridgeSchool` gallery album (visible in gallery and Files). iPhone —
  app Documents/`BridgeSchool` folder exposed in the Files app.

## Decisions to confirm before `#code`

Confirmed by `#code` with the recommended defaults (2026-10-22):
- [x] Scaffold template: default `create-expo-app` template, example screens/components deleted.
- [x] Expo SDK: current stable — **SDK 58** (expo ~58.0.17, react-native 0.88.0, React 19.3).
- [x] Error surfacing: "Download failed — tap to retry" on the row, plus `console.error` with the
      `'Consequence description: ' + message` format.
- [x] Remove action placement: on the video row.

## Plan

### Phase 1 — video list + download-then-play into the app's own folder (testable in Expo Go)

- [x] 1. Scaffold the Expo project in this folder via `safe-install` (approval required), with the
      template agreed above. Remove the template's example screens/components. Record SDK version.
- [x] 2. Initialise git for the repo (`.gitignore` from the template).
- [x] 3. Install `expo-video` and `expo-file-system` via `safe-install` (approval required).
- [x] 4. Constants file `src/constants.ts` — `R2_BASE_URL`, `SAVED_FOLDER`, `VIDEOS` (above).
- [x] 5. Type `src/types.ts` — `table_Reference` with `rf_desc`, `rf_link` only.
- [x] 6. Saved-video module `src/savedVideos.ts` — one place for all file handling:
      filename from `rf_desc` (sanitised), is-saved check, download with progress (delete partial
      file on failure/cancel), local URI for playback, remove. Phase 1 stores in the app's
      Documents/`BridgeSchool` folder on both platforms.
      (Verify against the installed `expo-file-system` which API gives download progress — the
      new `File`/`Directory` API or `createDownloadResumable` — and say which is used.)
- [x] 7. Component `src/components/VideoRow.tsx` — name, Saved marker, progress bar, Remove.
- [x] 8. Screens (Expo Router): `app/index.tsx` Videos list; `app/player/[rf_desc].tsx` full-screen
      `expo-video` player reading the saved file only.
- [x] 9. On opening the Videos screen, refresh each video's saved state (files may be deleted
      outside the app).
- [x] 10. `npx tsc --noEmit` passes.

### Phase 2 — visible BridgeSchool folder (needs a development build)

- [x] 11. Install `expo-media-library` via `safe-install` (approval required).
- [x] 12. App config (`app.json`): iOS `UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`
      so Documents shows in Files › On My iPhone; Android media-library permission config.
- [x] 13. `src/savedVideos.ts` Android path: download to a temp file named `rf_desc.mp4`, move it
      into the `BridgeSchool` album via `expo-media-library` (permission prompt on first save),
      delete the temp file so only one copy remains; is-saved / play / remove look up the asset
      in the album by filename (remove shows the system delete confirmation).
      iPhone path: unchanged from Phase 1 (Documents/`BridgeSchool`), now visible in Files.
- [x] 14. Development build set-up (EAS account, `eas build --profile development`) — steps for
      the user, listed when we get here; Claude does not run builds without approval.
      → Listed in the completion message and under Testing; nothing run.
- [x] 15. `npx tsc --noEmit` passes.

## Changes

### Project scaffold (step 1)
- `npx create-expo-app@latest` (expo-template-default@sdk-58) run in the scratchpad — the tool
  refuses a non-empty folder — then copied in, **excluding** the template's `.git` (fresh repo,
  step 2) and its `.claude/settings.json` (it enables the `expo@claude-plugins-official` Claude Code
  plugin — not adopted without the user's say). Kept the template's `AGENTS.md` (Expo guidance).
- Template layout is **`src/app/`** for routes (SDK 58 default), so screens live in `src/app/…`
  rather than `app/…` as the plan wrote; `@/` resolves to `src/`.
- Deleted example code: `src/app/explore.tsx`, template `src/app/index.tsx`, `src/components/*`,
  `src/hooks/*`, `src/constants/theme.ts`, `src/global.css`, `scripts/reset-project.js`, and the
  example images (tabIcons, react-logo, expo-badge, expo-logo, logo-glow, tutorial-web). App
  icon / splash / favicon images kept.

### package.json
- Removed the `reset-project` script (its file was deleted).
- Added via `npx expo install`: `expo-video ~58.0.12`, `expo-file-system ~58.0.10`,
  `expo-media-library ~58.0.11`.
- Template dependencies now unused (`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`,
  `expo-web-browser`, `expo-device`) left in place — removal not agreed.

### .git (step 2)
- `git init -b main`; template `.gitignore` kept (ignores `node_modules`, `.expo`, `/ios`,
  `/android`). No commit made.

### src/constants.ts (step 4)
- `R2_BASE_URL`, `SAVED_FOLDER = 'BridgeSchool'`, `VIDEOS` (3 entries, `rf_desc` + `rf_link`).

### src/types.ts (step 5)
- `table_Reference` = `{ rf_desc, rf_link }`.

### src/savedVideos.ts (steps 6, 13)
- All saved-file handling: `isVideoSaved`, `downloadVideo`, `savedVideoUri`, `removeSavedVideo`
  (all async — gallery lookups on Android are async).
- Download API used: **new `File.downloadFileAsync(url, file, { idempotent: true, onProgress })`**
  (SDK 58 `expo-file-system`); not the legacy `createDownloadResumable`. Progress fraction =
  `bytesWritten / totalBytes` (0 when the server sends no length). Partial file deleted on failure.
- **iPhone:** `Documents/BridgeSchool/<rf_desc>.mp4`.
- **Android:** asks for gallery (video) permission on first download; downloads to
  `cache/<rf_desc>.mp4`, then `Asset.create(temp, album)` (or `Album.create('BridgeSchool',
  [temp], true)` the first time); temp file deleted in `finally` → one copy. Lookup = album
  assets matched by `getFilename()`; play via `asset.getUri()`; remove via `asset.delete()`
  (system confirmation). Uses the SDK 58 `expo-media-library` class API (`Album`/`Asset`) — the
  older `createAssetAsync`-style functions are deprecated stubs in this version.
- Without gallery permission, Android reports videos as not saved (permission is only asked
  for on download).

### src/components/VideoRow.tsx (step 7)
- Orange row (`#fb923c`, plain style): name, status line (Tap to download / Downloading n% /
  Saved / error), progress bar while downloading, Remove button when saved. Ignores taps while
  downloading.

### src/app/_layout.tsx (step 8)
- Replaced the template's tab navigator + animated splash with a plain `Stack`: Videos
  ("Bridge School Videos") and Player (title = `rf_desc`).

### src/app/index.tsx (steps 8, 9)
- Videos screen: state maps keyed by `rf_desc` (`savedByDesc`, `progressByDesc`, `errorByDesc`).
  Tap: saved → Player; else download with progress → Player; failure → retry message +
  `console.error`. Remove → delete then re-read state (Android user may decline the delete).
  Saved state re-read on every focus (`useFocusEffect`).

### src/app/player/[rf_desc].tsx (step 8)
- Looks up the saved copy's address, then `SavedVideoView` creates the `expo-video` player
  (`useVideoPlayer`, auto-play) with `VideoView` `nativeControls`, `contentFit='contain'`, black
  background. Shows "This video is no longer saved on the phone." if the file is gone. Never
  streams.

### app.json (step 12)
- `ios.infoPlist`: `UIFileSharingEnabled: true`, `LSSupportsOpeningDocumentsInPlace: true`.
- Plugins: `expo-video` (added by install), `expo-media-library` with
  `granularPermissions: ["video"]` → Android manifest asks for `READ_MEDIA_VIDEO` only.
  Verified with `npx expo config --type introspect`.

### Checks (steps 10, 15)
- `npx tsc --noEmit` passes.

## Testing

Expo Go limits: Android Expo Go cannot grant full gallery access, so on **Android** the app needs
a development build to save videos. On **iPhone**, Expo Go can be used for download/play/remove;
the Files-app visibility needs a development build.

- [ ] Videos screen shows 3 orange rows: Two Way Checkback, Bergen Raises, Redoubles — each
      "Tap to download"
- [ ] Tap Bergen Raises: status shows "Downloading n%" with a moving bar, then the Player opens
      and plays with native controls; header shows "Bergen Raises"
- [ ] Back: Bergen Raises now shows "Saved" and a Remove button
- [ ] Turn on airplane mode, tap Bergen Raises: plays from the phone with no network
- [ ] Still in airplane mode, tap Redoubles: shows "Download failed — tap to retry"; turn the
      network back on and tap again: downloads and plays
- [ ] Remove a saved video: row returns to "Tap to download" (Android: confirm the system delete
      prompt; decline it once and check the row still shows Saved)
- [ ] Android (dev build): first download asks for permission to access videos; the gallery shows
      a `BridgeSchool` album containing `Bergen Raises.mp4`; the Files app shows the same single
      file (check which folder Android placed it in — e.g. Movies/BridgeSchool or
      DCIM/BridgeSchool); no copy left in any other folder
- [ ] iPhone (dev build): Files › On My iPhone › bridgeschool-native › BridgeSchool contains
      `Bergen Raises.mp4`; not in Photos
- [ ] Delete a saved video from the gallery / Files app, return to the app: the row shows
      "Tap to download"
- [ ] Dev build set-up (user): create a free Expo account, then run
      npx eas-cli@latest login
      npx eas-cli@latest build --profile development --platform android
      (the first build offers to create `eas.json`; install the build on the phone from the link
      it prints, then start the dev server and open the app)
