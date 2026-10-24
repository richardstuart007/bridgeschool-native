//==============================================================================================
//  1) DESCRIPTION
//    UpdateScreen — "Update Bridge School": a Download update button (opens the fixed GitHub
//    download of the newest APK in the browser) above plain-language steps for installing an
//    update on Android, including the "unknown apps", Play Protect and Samsung Auto Blocker
//    prompts.
//
//  2) NOTES
//    Opened from the update banner on the Videos screen. Installing over the existing app
//    keeps saved videos (they live in Pictures/BridgeSchool, outside the app).
//==============================================================================================

import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { ANDROID_APK_URL } from '@/constants'

const UPDATE_STEPS = [
  'Tap Download update. Your browser downloads the new version.',
  'If it warns the file may be harmful, tap Download anyway.',
  'Open the download (tap the notification, or My Files › Downloads › AndroidBridgeschool.apk).',
  'Tap Update. If asked, allow your browser to install apps: Settings → Allow from this source, then go back and tap Update again.',
  'If Play Protect warns you, tap More details → Install anyway.',
  'If a Samsung phone says Auto Blocker blocked it: Settings → Security and privacy → Auto Blocker → Off, then try again (you can turn it back on afterwards).',
  'Your saved videos are kept.'
]

export default function UpdateScreen() {
  const steps = UPDATE_STEPS.map((text, index) => ({ key: String(index), label: `${index + 1}.`, text }))

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Pressable onPress={openDownload} style={styles.downloadButton}>
        <Text style={styles.downloadText}>Download update</Text>
      </Pressable>
      <Text style={styles.heading}>How to update</Text>
      {steps.map(step => (
        <View key={step.key} style={styles.step}>
          <Text style={styles.stepNumber}>{step.label}</Text>
          <Text style={styles.stepText}>{step.text}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

//----------------------------------------------------------------------------------------------
//  openDownload — opens the newest APK download in the phone's browser
//----------------------------------------------------------------------------------------------
async function openDownload(): Promise<void> {
  try {
    await Linking.openURL(ANDROID_APK_URL)
  } catch (error) {
    console.error('Update download could not be opened: ' + (error as Error).message)
  }
}

const styles = StyleSheet.create({
  screen: { padding: 16, gap: 12 },
  downloadButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center'
  },
  downloadText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  heading: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  step: { flexDirection: 'row', gap: 8 },
  stepNumber: { fontSize: 15, fontWeight: '700', width: 22 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 21 }
})
