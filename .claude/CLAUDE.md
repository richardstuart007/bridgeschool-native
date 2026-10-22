# bridgeschool-native — project instructions

## What this project is

A native mobile app (Expo / React Native, TypeScript): a cut-down, **read-only** version of
next-bridgeschool (`C:\Users\richa\claude\github\next-bridgeschool`, Next.js) showing only the
**video** content. The user sees a list of videos and taps one to watch it. **Keep it simple** —
extra fields/screens (subjects, levels, presenter, colours) are added only at a later stage.

Out of scope: quiz, login, users, sessions, any writes. The app has **no database of its own**,
holds **no DB credentials**, and does **no DB access**.

## Source data (lives in next-bridgeschool's Postgres DB — read-only reference)

Definitions: `next-bridgeschool/src/lib/tables/definitions.ts` and
`next-bridgeschool/src/lib/tables/tableSpecific/schema.sql`.

- **Videos** — `trf_reference` rows where `rf_type = 'youtube'`.
  `rf_link` = YouTube URL, `rf_desc` = title, `rf_who` = presenter/author,
  `rf_pubtype` = publication type (the web shows it as the button label).
  Linked to a subject by `rf_sbid` (also `rf_owner` + `rf_subject`, the PK side).
- **Subjects** — `tsb_subject`: `sb_sbid`, `sb_owner`, `sb_subject`, `sb_title`, `sb_level`.
- Web dashboard groups subjects by `sb_level`, ordered `sb_level, sb_title`
  (`src/ui/dashboard/subject_menu.tsx`). Web screen equivalent: `src/ui/dashboard/SubjectSection.tsx`
  (YouTube references only).
- Visual language: `src/root/constants/colours.ts` — `VIDEO_COLOR` (orange-400), `LEVELS`
  (Beginner green-300, Improver teal-300, Intermediate blue-300, Advanced purple-300,
  Random gray-200), `getLevelColor`. Not used for now (keep-it-simple) — reference only.
- Note: the web filters subjects by the signed-in user's owners (`tuo_usersowner`) and by
  `sb_cntquestions >= 1`. Neither applies directly here (no users; video-only).

## Architecture

- Separate repo (this one). Expo / React Native, TypeScript.
- The video catalogue is hard-coded in the constants file for now (see Decisions). If a
  next-bridgeschool endpoint is added later, **it is built in a session opened in
  next-bridgeschool, never from here** (project isolation). This project only defines the JSON
  contract it must return.

## Workspace rule exceptions for this project

The global `~/.claude/CLAUDE.md` assumes Next.js + nextjs-shared. **This project is neither.**

- Does **not** apply: Next.js-specific rules (router hooks, `'use client'`/`'use server'`,
  App Router), nextjs-shared rules (CONSUMING_PROJECTS.md, `table_*` functions, `write_Logging`,
  shared components, Versions tab), DB/SQL rules (schema.sql, table naming, manual SQL, cache).
- **Still applies** — all general rules: plan before code (`#plan`/`#code`), explicit choices,
  naming matches the DD source (keep `rf_`/`sb_` field names exactly as-is in the JSON contract
  and TypeScript types — no aliases), function headers, inline comment format, one constants
  file, `function` declarations, `await` not `.then()`, no calculation in JSX, ES `import` only
  (never `require()`), reusable components, approval before installs.
- Scaffolding (`npx create-expo-app` etc.) and every package install need approval — use the
  `safe-install` skill.
- Error logging: no `write_Logging` here; how errors are surfaced is to be agreed in the plan.

## Decisions (2026-10-22)

- **Data source:** to start, the video catalogue is **hard-coded in the constants file** — no
  backend, no endpoint, no DB. (An endpoint may come later; keep the data shaped like the DB
  tables so it can drop in.)
- **No YouTube.** YouTube injects ads and other unwanted content. The videos have already been
  extracted into standalone video files held in blob storage; the app plays those, never YouTube.
- Start with a handful of videos (~3), not the full catalogue.

- **Video storage:** Cloudflare R2, public bucket via `r2.dev`, plain `.mp4`, no token. Example:
  `https://pub-13d8924a0e08436b9490bcbee03bb453.r2.dev/Hollands/Bergen_Raises.mp4`

- **Video URL field:** reuse `rf_link`. (On locallocal, `rf_link` for the Hollands rows already
  holds the R2 URL; `rf_type` is still `'youtube'`.)
- **URL form:** one base-URL constant + a per-video path.
- **Player:** `expo-video` (in-app, full screen). **Navigation:** Expo Router.
- **Catalogue = minimal.** Each video holds only `rf_desc` (name) and `rf_link` (R2 path). No
  subjects, owner, level, presenter, badge, or colour constants/logic — rows are plain orange
  styling. Screens: Videos list → Player. (Simplified 2026-10-22.) First 3 videos:
  - Two Way Checkback — `Hollands/Two_Way_Checkback.mp4`
  - Bergen Raises — `Hollands/Bergen_Raises.mp4`
  - Redoubles — `Hollands/Redoubles_In_Bridge.mp4`
- **Download-then-play (no streaming):** tapping an unsaved video downloads the full `.mp4` from
  R2 into the `BridgeSchool` folder (with a progress bar), then plays the saved file. A saved
  video always plays from the phone. **No R2 streaming, no `expo-video` caching, no Save button.**
  Every watched video is saved; users can remove saved videos to free space. Saved files must
  have a **meaningful name** so the user can tell which videos are on their phone.
  (Changed 2026-10-22 from "auto-caching + Save button" — that model left a duplicate in the
  player's cache.)
  - **Never more than one saved copy of a video on the phone.**
  - **Android:** save into a `BridgeSchool` gallery album (`expo-media-library`) — that one copy
    is stored in **`Internal storage/Pictures/BridgeSchool`** (confirmed on the user's Samsung,
    2026-10-22; expo-media-library places albums under Pictures/, not Movies/), so it shows in
    both the Gallery and My Files.
  - **iPhone:** save into the app's own Documents folder only, exposed in **Files > On My iPhone >
    BridgeSchool** (`UIFileSharingEnabled` + `LSSupportsOpeningDocumentsInPlace`). Not in Photos.
    No photo-library permission needed on iPhone.
  - File name: `rf_desc.mp4` only (e.g. `Bergen Raises.mp4`) — simple names are easier to find.
    Unsafe filename characters removed. (Changed 2026-10-22 from `sb_level - rf_desc - rf_who`.)
    The user guarantees `rf_desc` is unique in the catalogue — no clash handling; a same-name
    save simply overwrites.

## Outstanding items

- r2.dev URLs are rate-limited and Cloudflare says not for production — consider a custom domain
  on the bucket before release.
- App display name: **agreed "Bridge School"** (2026-10-22; "Bridge School Native" was tried
  and reverted — too long for the home-screen label) — set `expo.name` in app.json (slug stays
  `bridgeschool-native`). Not yet applied; part of the EAS preview-build plan.
- Expo project created on expo.dev (2026-10-22) under organization `richardstuart007-team`
  (personal login `richardstuart007`), slug `bridgeschool-native`, project ID
  `d731deb1-ed1b-497f-ab42-2578d124eb92`. Link the code with
  `npx eas-cli@latest init --id d731deb1-ed1b-497f-ab42-2578d124eb92` (writes the ID into
  app.json) — part of the EAS preview-build plan. Expo Claude Code plugin offered on the page —
  not installed (see below).
- Development build not yet set up (EAS) — needed for Android saving and iPhone Files visibility.
- Unused template packages (`@expo/ui`, `expo-glass-effect`, `expo-symbols`, `expo-image`,
  `expo-web-browser`, `expo-device`) — decide whether to remove.
- Template's `.claude/settings.json` (enables `expo@claude-plugins-official` Claude Code plugin)
  was not adopted — decide whether to.
- No Cancel button for an in-progress download; iPhone Remove has no confirmation.
- **iPhone distribution** (most of the user's friends use iPhones, 2026-10-22): needs the Apple
  Developer Program (~US$99/yr), an EAS iOS build, and TestFlight for friends (install TestFlight,
  tap invite link). Android sideload link works but has several warning screens; Play Store
  internal testing (US$25 one-off) is the friendlier Android route.
- next-bridgeschool DB typo (user to run later in pgAdmin4, the web app's DB):
  `UPDATE trf_reference SET rf_desc = 'Quantitative 4NT' WHERE rf_rfid = 21;` — the app's
  `VIDEOS` already uses the corrected name.
- App icon is still Expo's template placeholder; the web app's falling-aces logos were rejected
  as icon options. Parked by the user for now.
- Phone testing of the MVP (checklist in `docs/archive/PLAN_video-app-mvp.md` › Testing).
