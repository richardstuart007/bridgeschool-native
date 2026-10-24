//==============================================================================================
//  1) DESCRIPTION
//    releaseAndroid — builds the Android app on EAS and publishes it as the latest GitHub
//    release of richardstuart007/bridgeschool-native, with the APK attached as exactly
//    AndroidBridgeschool.apk, so this fixed link always downloads the newest version:
//      https://github.com/richardstuart007/bridgeschool-native/releases/latest/download/AndroidBridgeschool.apk
//    (richard-dashboard's "Android Download" card and the in-app update screen use it.)
//
//    Run with:  npm run release:android
//
//    Steps:
//      1. gh is logged in
//      2. no uncommitted changes, and local main is pushed (EAS builds the PC's files, so the
//         release must match what is on GitHub under the tag)
//      3. tag v<app.json expo.version> does not already exist as a release
//      4. EAS preview build (waits for it to finish)
//      5. download the APK to a temp folder as AndroidBridgeschool.apk
//      6. gh release create — published, not draft/pre-release, marked latest
//      7. check the fixed download link answers
//
//  2) NOTES
//    Each release needs a new app.json expo.version (bump it before running); the script
//    refuses to reuse a tag. Any failed check stops the script before anything is published.
//==============================================================================================

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO = 'richardstuart007/bridgeschool-native'
const ASSET_NAME = 'AndroidBridgeschool.apk'
const FIXED_URL = `https://github.com/${REPO}/releases/latest/download/${ASSET_NAME}`

await main()

//----------------------------------------------------------------------------------
//  main — runs the release steps in order, stopping at the first failure
//----------------------------------------------------------------------------------
async function main() {
  checkGhLoggedIn()
  checkCommittedAndPushed()
  const version = readAppVersion()
  const tag = `v${version}`
  checkReleaseIsNew(tag)
  console.log(`\nBuilding Bridge School ${tag} on EAS (this takes 10–30 minutes)...\n`)
  const build = runEasBuild()
  const apkPath = await downloadApk(build.apkUrl)
  createRelease(tag, apkPath, build)
  await checkFixedUrl()
  console.log(`\nDone. Bridge School ${tag} is the latest release:\n  ${FIXED_URL}\n`)
}

//----------------------------------------------------------------------------------
//  checkGhLoggedIn — stops with instructions if the GitHub CLI is not logged in
//----------------------------------------------------------------------------------
function checkGhLoggedIn() {
  const result = run('gh', ['auth', 'status'])
  if (result.status !== 0) stop('GitHub CLI is not logged in. Run "gh auth login" once, then try again.')
}

//----------------------------------------------------------------------------------
//  checkCommittedAndPushed — stops if there are uncommitted changes or unpushed commits
//----------------------------------------------------------------------------------
function checkCommittedAndPushed() {
  const status = run('git', ['status', '--porcelain'])
  if (status.stdout.trim() !== '') stop('There are uncommitted changes. Commit and push them first.')
  run('git', ['fetch', 'origin'])
  const local = run('git', ['rev-parse', 'HEAD']).stdout.trim()
  const remote = run('git', ['rev-parse', '@{u}']).stdout.trim()
  if (local !== remote) stop('Local commits are not pushed to GitHub (or GitHub is ahead). Push/pull first.')
}

//----------------------------------------------------------------------------------
//  readAppVersion — app.json expo.version
//  Returns: e.g. '1.0.1'
//----------------------------------------------------------------------------------
function readAppVersion() {
  const appJson = JSON.parse(readFileSync('app.json', 'utf8'))
  const version = appJson.expo.version
  if (!version) stop('app.json has no expo.version.')
  return version
}

//----------------------------------------------------------------------------------
//  checkReleaseIsNew — stops if a release with this tag already exists
//  Params:  tag — e.g. 'v1.0.1'
//----------------------------------------------------------------------------------
function checkReleaseIsNew(tag) {
  const result = run('gh', ['release', 'view', tag, '--repo', REPO])
  if (result.status === 0) {
    stop(`Release ${tag} already exists. Bump "version" in app.json, commit, push, then try again.`)
  }
}

//----------------------------------------------------------------------------------
//  runEasBuild — EAS preview build for Android, waiting for it to finish
//  Returns: { apkUrl, buildId, versionCode }
//----------------------------------------------------------------------------------
function runEasBuild() {
  //
  //  npx is a .cmd on Windows, so it needs a shell; build progress goes to stderr (shown),
  //  the JSON result to stdout (captured)
  //
  const result = spawnSync(
    'npx eas-cli@latest build --platform android --profile preview --non-interactive --wait --json',
    { shell: true, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 }
  )
  if (result.status !== 0) stop('EAS build failed — see the output above.')
  const builds = JSON.parse(result.stdout.slice(result.stdout.indexOf('[')))
  const build = builds[0]
  const apkUrl = build?.artifacts?.buildUrl
  if (!apkUrl) stop('EAS build finished but returned no APK link.')
  const details = { apkUrl, buildId: build.id, versionCode: build.appBuildVersion }
  return details
}

//----------------------------------------------------------------------------------
//  downloadApk — downloads the APK into a new temp folder as ASSET_NAME
//  Params:  apkUrl — EAS artifact link
//  Returns: the local file path
//----------------------------------------------------------------------------------
async function downloadApk(apkUrl) {
  console.log('Downloading the APK...')
  const response = await fetch(apkUrl)
  if (!response.ok) stop(`APK download failed (HTTP ${response.status}).`)
  const folder = mkdtempSync(join(tmpdir(), 'bridgeschool-release-'))
  const apkPath = join(folder, ASSET_NAME)
  writeFileSync(apkPath, Buffer.from(await response.arrayBuffer()))
  return apkPath
}

//----------------------------------------------------------------------------------
//  createRelease — publishes the GitHub release (latest, not draft, not pre-release)
//  Params:  tag     — e.g. 'v1.0.1'
//           apkPath — local AndroidBridgeschool.apk
//           build   — { buildId, versionCode } for the release notes
//----------------------------------------------------------------------------------
function createRelease(tag, apkPath, build) {
  console.log(`Creating GitHub release ${tag}...`)
  const target = run('git', ['rev-parse', 'HEAD']).stdout.trim()
  const notes = `Android versionCode ${build.versionCode}. EAS build: https://expo.dev/accounts/richardstuart007-team/projects/bridgeschool-native/builds/${build.buildId}`
  const result = run(
    'gh',
    ['release', 'create', tag, apkPath, '--repo', REPO, '--target', target, '--title', `Bridge School ${tag}`, '--notes', notes, '--latest'],
    'inherit'
  )
  if (result.status !== 0) stop('gh release create failed — see the output above.')
}

//----------------------------------------------------------------------------------
//  checkFixedUrl — confirms the fixed download link now answers
//----------------------------------------------------------------------------------
async function checkFixedUrl() {
  const response = await fetch(FIXED_URL, { method: 'HEAD' })
  if (!response.ok) stop(`Release created, but the fixed link answered HTTP ${response.status}.`)
}

//----------------------------------------------------------------------------------
//  run — runs a program (no shell) and returns its result
//  Params:  command — program name, e.g. 'git'
//           args    — argument list
//           stdout  — 'pipe' to capture (default) or 'inherit' to show
//  Returns: spawnSync result (status, stdout)
//----------------------------------------------------------------------------------
function run(command, args, stdout = 'pipe') {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['inherit', stdout, 'pipe'] })
  if (result.error) stop(`Could not run ${command}: ${result.error.message}`)
  return result
}

//----------------------------------------------------------------------------------
//  stop — prints a message and exits with failure
//  Params:  message — what went wrong and what to do
//----------------------------------------------------------------------------------
function stop(message) {
  console.error(`\nRelease stopped: ${message}\n`)
  process.exit(1)
}
