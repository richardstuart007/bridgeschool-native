//==============================================================================================
//  1) DESCRIPTION
//    appVersion — the installed app version and the latest released version, for the version
//    footer and the update banner.
//
//    Exports:
//      appVersion           — installed version from app.json (expo.version), e.g. '1.0.1'
//      latestReleaseVersion — newest GitHub release version (tag without the leading 'v'), or
//                             null when it cannot be read (offline, rate-limited, no release)
//      isNewerVersion       — whether one x.y.z version is newer than another
//
//  2) NOTES
//    Release tags are 'v' + app.json expo.version (set by scripts/releaseAndroid.mjs), so the
//    two versions compare directly.
//==============================================================================================

import Constants from 'expo-constants'

import { GITHUB_LATEST_RELEASE_URL } from '@/constants'

//----------------------------------------------------------------------------------
//  appVersion — installed version from app.json (expo.version)
//  Returns: e.g. '1.0.1', or '' if unavailable
//----------------------------------------------------------------------------------
export function appVersion(): string {
  const version = Constants.expoConfig?.version ?? ''
  return version
}

//----------------------------------------------------------------------------------
//  latestReleaseVersion — newest GitHub release version
//  Returns: e.g. '1.0.2', or null on any failure (failures are not shown to the user)
//----------------------------------------------------------------------------------
export async function latestReleaseVersion(): Promise<string | null> {
  try {
    const response = await fetch(GITHUB_LATEST_RELEASE_URL, {
      headers: { Accept: 'application/vnd.github+json' }
    })
    if (!response.ok) return null
    const release = (await response.json()) as { tag_name?: string }
    const version = release.tag_name ? release.tag_name.replace(/^v/, '') : null
    return version
  } catch (error) {
    console.warn('Latest release version could not be read: ' + (error as Error).message)
    return null
  }
}

//----------------------------------------------------------------------------------
//  isNewerVersion — compares two x.y.z versions number by number
//  Params:  candidate — the version that may be newer (e.g. latest release)
//           current   — the version to compare against (e.g. installed)
//  Returns: true when candidate is newer than current
//----------------------------------------------------------------------------------
export function isNewerVersion(candidate: string, current: string): boolean {
  const candidateParts = candidate.split('.').map(Number)
  const currentParts = current.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const a = candidateParts[i] ?? 0
    const b = currentParts[i] ?? 0
    if (a !== b) return a > b
  }
  return false
}
