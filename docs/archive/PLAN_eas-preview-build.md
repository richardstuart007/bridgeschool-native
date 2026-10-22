# PLAN_eas-preview-build — bridgeschool-native

## Title
First Samsung test build: app name "Bridge School", link to Expo project, EAS preview APK

## Agreed design

- Display name **"Bridge School"** (`expo.name`); slug stays `bridgeschool-native`.
- Expo project already created on expo.dev: organization `richardstuart007-team`, slug
  `bridgeschool-native`, ID `d731deb1-ed1b-497f-ab42-2578d124eb92`. PC already logged in to EAS
  as `richardstuart007` (owner of both accounts).
- **Preview build** (standalone APK, no dev server, no `expo-dev-client`), built in Expo's cloud.
- `eas.json` written by hand (not `eas build:configure`, which prompts) with a `preview` profile
  only — keep it simple; development/production profiles added later when needed.

## Decisions to confirm before `#code`

- [x] `eas.json` `cli.appVersionSource`: **`remote`** (recommended default, taken with `#code`).

## Plan

- [x] 1. `app.json`: `"name": "bridgeschool-native"` → `"name": "Bridge School"`.
- [x] 2. Link the code to the Expo project (Claude runs; writes `extra.eas.projectId` and
      `owner: "richardstuart007-team"` into app.json):
      npx eas-cli@latest init --id d731deb1-ed1b-497f-ab42-2578d124eb92
      If it needs an interactive answer, the user runs it instead.
- [x] 3. Create `eas.json` (preview profile, internal distribution, APK).
- [x] 4. Checks: `npx tsc --noEmit`; `npx expo config` shows name "Bridge School", the project ID
      and owner.
- [x] 5. User starts the build — handed to the user (see Testing); not run by Claude:
      npx eas-cli@latest build --profile preview --platform android
- [x] 6. User installs the APK on the Samsung and tests — handed to the user (see Testing).
- [x] 7. Fix first build failure (build 91dda2b7, Install dependencies phase): `npm ci` on EAS
      rejected `package-lock.json` — missing optional peer `@react-native/metro-config@0.88.0` and
      its Babel deps. Cause: EAS image uses Node 22.23.2 / npm 10.9.9; the lock was written by
      local Node 26.0.0 / npm 11.12.1, which omits optional peers. Proposed fix (option 1, to be
      agreed): add `"node": "26.0.0"` to `build.preview` in eas.json so EAS uses the same
      Node/npm as the PC; then the user re-runs the build.
      → Applied, but build 94763298 failed identically on Node 26.0.0 (its bundled npm ≠ local
      11.12.1). Diagnosis was wrong — see step 8.
- [x] 8. Real cause: `react-native-worklets@0.13.0` has a **required** peer
      `@react-native/metro-config: *`; npm 10 / Node-26's npm include it, local npm 11.12.1
      omitted it from the lock (another package, `@react-native/community-cli-plugin`, marks the
      same peer optional). Proposed fix (to be agreed):
      a) `npx expo install @react-native/metro-config -- --save-dev` (→ 0.88.0) so it is in
         package.json + lock for every npm version;
      b) remove `"node": "26.0.0"` from eas.json (back to EAS default Node 22 image);
      c) verify `npx npm@10 ci --dry-run` and local `npm ci --dry-run` both pass;
      d) user re-runs the build.
      → Build 187d27c6 succeeded; installed and tested on the user's Samsung (all Android checks
      passed; files in Internal storage/Pictures/BridgeSchool, one copy each).
- [x] 9. Add 8 more videos to `VIDEOS` in `src/constants.ts` (agreed 2026-10-22), in this order
      after the existing three — values copied from locallocal `trf_reference` (`rf_link` with
      the R2 base removed):
      | rf_rfid | rf_desc | rf_link |
      |---|---|---|
      | 3 | Cue Bids 1st and 2nd Round Controls | Hollands/Cue_Bidding_-_1st_and_2nd_Round_controls.mp4 |
      | 19 | Michaels Cue Bid | Hollands/Michaels_Cue_Bid.mp4 |
      | 21 | **Quantitative 4NT** (typo "Quantative" fixed in the app, per user) | Hollands/Quantitative_4NT.mp4 |
      | 14 | Lebensohl: Part 1 Introducing the 2NT relay bid | Lebensohl/Lebensohl__Part_1_Introducing_the_2NT_relay_bid.mp4 |
      | 15 | Lebensohl: Part 2 Direct bids at the 2 level | Lebensohl/Lebensohl__Part_2_Direct_bids_on_the_2_level_are_sign_offs.mp4 |
      | 16 | Lebensohl: Part 3 Cuebid Stayman | Lebensohl/Lebensohl__Part_3_Cuebid_Stayman.mp4 |
      | 17 | Lebensohl: Part 4 Game auctions without majors | Lebensohl/Lebensohl__Part_4_Game_auctions_without_majors.mp4 |
      | 18 | Lebensohl: Part 5 The Negative Double | Lebensohl/Lebensohl__Part_5_The_Negative_Double.mp4 |
      Not added: Andrew Robson (1042–1045) and WBF Youth Riddles (1001–1039).
      Checks: `npx tsc --noEmit`; each new URL answers HTTP 200 from R2 (HEAD request).
      User then rebuilds (new APK link) to get them on the phone.
- [x] 10. `package.json` scripts: add
      `"build:android": "npx eas-cli@latest build --profile preview --platform android"`
      so the build is `npm run build:android`. Named `build:android`, not `build`, so `#commit`'s
      `npm run build` gate never starts a cloud build. (A local `"build"` check script —
      `expo export --platform android` — was proposed but not taken.)

## Changes

### app.json
- `name`: `bridgeschool-native` → `Bridge School` (home-screen / iPhone Files name).
- Written by `eas init --id … --non-interactive --force`: `extra.eas.projectId`
  `d731deb1-ed1b-497f-ab42-2578d124eb92` and `owner: "richardstuart007-team"`.
- Also written by `eas init` (it re-saves app.json from the resolved config): an explicit
  `android.permissions` list (`READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`,
  `READ_MEDIA_VISUAL_USER_SELECTED`, `READ_MEDIA_VIDEO` — the same permissions the
  expo-media-library plugin already adds) and `extra.router.asyncRoutes.web: true` (Expo Router
  default). Left as written — no behaviour change.
- `eas init` also set the project's icon on expo.dev from the app icon (server side).

- Written by the first `eas build` run (user's answer at its prompt):
  `android.package: "com.richardstuart007.bridgeschool"` — the app's permanent Android
  application ID (chosen over the suggested `com.richardstuart007team.bridgeschoolnative`).
  EAS initialised the remote versionCode at 1 and created/stores the Android keystore.

### eas.json (new)
- `cli`: `version >= 25.3.0`, `appVersionSource: "remote"`.
- `build.preview`: `distribution: "internal"`, `android.buildType: "apk"`.
- Step 7: `build.preview.node: "26.0.0"` — EAS's default image (Node 22.23.2 / npm 10.9.9)
  rejected the lock file written by local Node 26.0.0 / npm 11.12.1 (`npm ci` "not in sync":
  missing optional peer `@react-native/metro-config@0.88.0` + Babel deps). Matching the Node
  version gives EAS the same npm as the PC. Verified with
  `eas config --profile preview --platform android` (resolves `node: "26.0.0"`).
  **Did not fix it** (build 94763298 failed the same way on Node 26) — removed again in step 8.
- Step 8: `build.preview.node` removed — back to EAS's default image (Node 22.23.2 / npm 10.9.9).

### src/constants.ts (step 9)
- `VIDEOS` 3 → 11 entries: added Hollands rf_rfid 3, 19, 21 and Lebensohl Parts 1–5
  (rf_rfid 14–18), in the agreed order after the existing three. `rf_desc`/`rf_link` copied from
  locallocal `trf_reference`, except rf_rfid 21's `rf_desc` corrected to "Quantitative 4NT"
  (database still has "Quantative 4NT" — optional SQL given in chat, not part of this plan).
- Checked: every URL answers HTTP 200 from R2 (HEAD). Sizes: Two Way Checkback 82 MB, Bergen
  Raises 141 MB, Redoubles 175 MB, Cue Bids 145 MB, Michaels 139 MB, Quantitative 4NT 83 MB,
  Lebensohl Parts 1–5 14/23/31/23/16 MB — about 870 MB if every video is saved.
  `npx tsc --noEmit` passes.

### package.json (step 10)
- Added script `"build:android": "npx eas-cli@latest build --profile preview --platform android"`.
  Checked: package.json parses and `npm run` lists `build:android`.

### package.json / package-lock.json (step 8)
- Added devDependency `@react-native/metro-config` `^0.88.0` (installed 0.88.0) via
  `npx expo install @react-native/metro-config -- --save-dev`. It is a **required** peer of
  `react-native-worklets@0.13.0` that local npm 11.12.1 had left out of the lock file; now in the
  lock (with its Babel deps) for every npm version.
- Verified: `npx npm@10 ci --include=dev --dry-run` and local `npm ci --include=dev --dry-run`
  both pass (no "not in sync" error); `npx tsc --noEmit` passes.

### Checks
- `npx tsc --noEmit` passes. `npx expo config` resolves to: name `Bridge School`, slug
  `bridgeschool-native`, owner `richardstuart007-team`, projectId `d731deb1-…`.

## Testing
- [ ] In the project folder, re-run the build (application ID and keystore are already set, so
      no questions about those):
      npx eas-cli@latest build --profile preview --platform android
      "Install dependencies" should now pass (EAS default image, Node 22 / npm 10).
      Ends with a link + QR code (~10–30 min, free tier may queue).
- [ ] expo.dev › richardstuart007-team › bridgeschool-native › Builds shows the build as finished
- [ ] On the Samsung, open the link / scan the QR code, download the APK, allow the browser to
      "install unknown apps", install
- [ ] The home screen shows the app as **Bridge School**
- [ ] Run the checklist in `docs/archive/PLAN_video-app-mvp.md` › Testing (Android items); in
      Samsung's **Gallery** look for the `BridgeSchool` album, in **My Files** note which folder
      holds `Bergen Raises.mp4`
- [ ] Step 9 — rebuild to get the new videos onto the phone (step 10's script):
      npm run build:android
      Install the new APK from the new link over the existing app (the 3 saved videos should
      still show as Saved)
- [ ] The list shows 11 rows in order: Two Way Checkback, Bergen Raises, Redoubles, Cue Bids
      1st and 2nd Round Controls, Michaels Cue Bid, Quantitative 4NT, Lebensohl Parts 1–5
- [ ] Download a Lebensohl video (small, ~15–30 MB) and play it; in My Files › Pictures ›
      BridgeSchool the file name has no colon (e.g. `Lebensohl Part 1 Introducing the 2NT relay
      bid.mp4`)
