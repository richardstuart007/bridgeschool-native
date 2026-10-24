//==============================================================================================
//  1) DESCRIPTION
//    UpdateBanner — the "New version available" banner shown above the video list when a newer
//    Android release exists. Tapping it calls onPress (opens the Update help screen).
//
//    Parameters:
//      latestVersion — the newer release version, e.g. '1.0.2'
//      onPress       — tap on the banner
//==============================================================================================

import { Pressable, StyleSheet, Text } from 'react-native'

type Props = {
  latestVersion: string
  onPress: () => void
}

export default function UpdateBanner(props: Props) {
  const { latestVersion, onPress } = props

  const message = `New version v${latestVersion} available — tap to update`

  return (
    <Pressable onPress={onPress} style={styles.banner}>
      <Text style={styles.text}>{message}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14
  },
  text: { color: '#ffffff', fontSize: 15, fontWeight: '600', textAlign: 'center' }
})
