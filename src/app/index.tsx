//==============================================================================================
//  1) DESCRIPTION
//    VideosScreen — the app's home screen: one VideoRow per catalogue video. Tapping a saved
//    video opens the Player; tapping an unsaved one downloads it (with progress) and then
//    opens the Player. Saved videos can be removed. Below the list, the installed app
//    version; on Android, an update banner above the list when a newer release exists.
//
//  2) NOTES
//    Saved state is re-read from the phone every time the screen comes into focus, because
//    files can be deleted outside the app.
//    State maps are keyed by rf_desc (unique per catalogue rule).
//    The newer-release check runs once when the screen first mounts (Android only); any
//    failure simply means no banner.
//
//  3) CHANGE HISTORY
//    2026-10-24 — version footer; Android update banner opening the Update help screen
//==============================================================================================

import { useCallback, useEffect, useState } from 'react'
import { Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { router, useFocusEffect } from 'expo-router'

import UpdateBanner from '@/components/UpdateBanner'
import VideoRow from '@/components/VideoRow'
import { appVersion, isNewerVersion, latestReleaseVersion } from '@/appVersion'
import { VIDEOS } from '@/constants'
import { downloadVideo, isVideoSaved, removeSavedVideo } from '@/savedVideos'
import type { table_Reference } from '@/types'

const DOWNLOAD_FAILED_MESSAGE = 'Download failed — tap to retry'

export default function VideosScreen() {
  const [savedByDesc, setSavedByDesc] = useState<Record<string, boolean>>({})
  const [progressByDesc, setProgressByDesc] = useState<Record<string, number>>({})
  const [errorByDesc, setErrorByDesc] = useState<Record<string, string>>({})
  const [latestVersion, setLatestVersion] = useState<string | null>(null)

  useEffect(() => {
    async function checkForUpdate() {
      if (Platform.OS !== 'android') return
      const version = await latestReleaseVersion()
      setLatestVersion(version)
    }
    checkForUpdate()
  }, [])

  //
  //  Re-read saved state whenever the screen is shown (callback must stay an arrow:
  //  useFocusEffect requires a memoised function)
  //
  useFocusEffect(
    useCallback(() => {
      refreshSaved()
    }, [])
  )

  //----------------------------------------------------------------------------------------------
  //  refreshSaved — reads from the phone which catalogue videos are saved
  //----------------------------------------------------------------------------------------------
  async function refreshSaved(): Promise<void> {
    try {
      const saved: Record<string, boolean> = {}
      for (const video of VIDEOS) saved[video.rf_desc] = await isVideoSaved(video.rf_desc)
      setSavedByDesc(saved)
    } catch (error) {
      console.error('Saved videos could not be checked: ' + (error as Error).message)
    }
  }

  //----------------------------------------------------------------------------------------------
  //  handlePress — plays a saved video; otherwise downloads it, then plays it
  //  Params:  video — the tapped catalogue entry
  //----------------------------------------------------------------------------------------------
  async function handlePress(video: table_Reference): Promise<void> {
    const { rf_desc } = video
    setErrorByDesc(prev => withoutKey(prev, rf_desc))
    try {
      const saved = await isVideoSaved(rf_desc)
      if (saved) {
        openPlayer(rf_desc)
        return
      }
      setProgressByDesc(prev => ({ ...prev, [rf_desc]: 0 }))
      await downloadVideo(video, fraction => {
        setProgressByDesc(prev => ({ ...prev, [rf_desc]: fraction }))
      })
      setSavedByDesc(prev => ({ ...prev, [rf_desc]: true }))
      openPlayer(rf_desc)
    } catch (error) {
      console.error('Video download failed, nothing saved: ' + (error as Error).message)
      setErrorByDesc(prev => ({ ...prev, [rf_desc]: DOWNLOAD_FAILED_MESSAGE }))
    } finally {
      setProgressByDesc(prev => withoutKey(prev, rf_desc))
    }
  }

  //----------------------------------------------------------------------------------------------
  //  handleRemove — deletes a saved video, then re-reads its saved state (on Android the
  //  user can decline the system delete confirmation)
  //  Params:  rf_desc — the video name
  //----------------------------------------------------------------------------------------------
  async function handleRemove(rf_desc: string): Promise<void> {
    try {
      await removeSavedVideo(rf_desc)
    } catch (error) {
      console.error('Saved video could not be removed: ' + (error as Error).message)
    }
    await refreshSaved()
  }

  const rows = VIDEOS.map(video => ({
    video,
    isSaved: savedByDesc[video.rf_desc] ?? false,
    progress: progressByDesc[video.rf_desc] ?? null,
    errorMessage: errorByDesc[video.rf_desc] ?? null
  }))
  const installedVersion = appVersion()
  const showUpdateBanner = latestVersion !== null && isNewerVersion(latestVersion, installedVersion)
  const bannerVersion = latestVersion ?? ''
  const versionText = `Bridge School v${installedVersion}`

  return (
    <ScrollView contentContainerStyle={styles.list}>
      {showUpdateBanner && <UpdateBanner latestVersion={bannerVersion} onPress={openUpdate} />}
      {rows.map(row => (
        <VideoRow
          key={row.video.rf_desc}
          video={row.video}
          isSaved={row.isSaved}
          progress={row.progress}
          errorMessage={row.errorMessage}
          onPress={() => handlePress(row.video)}
          onRemove={() => handleRemove(row.video.rf_desc)}
        />
      ))}
      <Text style={styles.version}>{versionText}</Text>
    </ScrollView>
  )
}

//----------------------------------------------------------------------------------------------
//  openPlayer — navigates to the Player for a saved video
//  Params:  rf_desc — the video name
//----------------------------------------------------------------------------------------------
function openPlayer(rf_desc: string): void {
  router.push({ pathname: '/player/[rf_desc]', params: { rf_desc } })
}

//----------------------------------------------------------------------------------------------
//  openUpdate — navigates to the Update help screen
//----------------------------------------------------------------------------------------------
function openUpdate(): void {
  router.push('/update')
}

//----------------------------------------------------------------------------------------------
//  withoutKey — copy of a state map with one key removed
//  Params:  map — the state map
//           key — the key to drop
//  Returns: the new map
//----------------------------------------------------------------------------------------------
function withoutKey<T>(map: Record<string, T>, key: string): Record<string, T> {
  const copy = { ...map }
  delete copy[key]
  return copy
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  version: { color: '#9ca3af', fontSize: 12, textAlign: 'center', marginTop: 12 }
})
