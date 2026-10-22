//==============================================================================================
//  1) DESCRIPTION
//    PlayerScreen — plays one saved video from the phone, filling the screen below the header,
//    with the platform's native controls (including their own full-screen button).
//
//    Parameters (route):
//      rf_desc — the video name; identifies the saved file
//
//  2) NOTES
//    Plays the saved copy only — never streams from R2. If it has gone (e.g. deleted outside
//    the app), a message is shown instead. The saved copy's address is looked up first, then
//    SavedVideoView creates the player for it.
//==============================================================================================

import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useVideoPlayer, VideoView } from 'expo-video'

import { savedVideoUri } from '@/savedVideos'

export default function PlayerScreen() {
  const { rf_desc } = useLocalSearchParams<{ rf_desc: string }>()
  const [uri, setUri] = useState<string | null>(null)
  const [isLookedUp, setIsLookedUp] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const savedUri = await savedVideoUri(rf_desc)
        setUri(savedUri)
      } catch (error) {
        console.error('Saved video could not be opened: ' + (error as Error).message)
      }
      setIsLookedUp(true)
    }
    load()
  }, [rf_desc])

  const showVideo = uri !== null
  const showMissing = isLookedUp && uri === null
  const videoUri = uri ?? ''

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: rf_desc }} />
      {showMissing && <Text style={styles.missing}>This video is no longer saved on the phone.</Text>}
      {showVideo && <SavedVideoView uri={videoUri} />}
    </View>
  )
}

//----------------------------------------------------------------------------------------------
//  SavedVideoView — creates a player for a saved video's address and plays it
//  Params:  uri — the saved copy's local address
//----------------------------------------------------------------------------------------------
function SavedVideoView({ uri }: { uri: string }) {
  //
  //  Start playing as soon as the player is created (callback passed straight to the hook)
  //
  const player = useVideoPlayer(uri, p => {
    p.play()
  })

  return <VideoView player={player} nativeControls contentFit='contain' style={styles.video} />
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000', justifyContent: 'center' },
  video: { flex: 1 },
  missing: { color: '#ffffff', fontSize: 15, textAlign: 'center', padding: 24 }
})
