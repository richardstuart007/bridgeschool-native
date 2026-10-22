//==============================================================================================
//  1) DESCRIPTION
//    VideoRow — one video in the Videos list: its name, a status line (Saved / Downloading n%
//    / error / Tap to download), a progress bar while downloading, and a Remove button once
//    saved. Plain orange styling.
//
//    Parameters:
//      video        — the catalogue entry; rf_desc is shown as the name
//      isSaved      — true when the video's .mp4 is saved on the phone
//      progress     — download fraction (0 to 1) while downloading, otherwise null
//      errorMessage — message from the last failed download, otherwise null
//      onPress      — tap on the row (download then play, or play if saved)
//      onRemove     — tap on Remove
//
//  2) NOTES
//    The row ignores taps while its video is downloading.
//==============================================================================================

import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { table_Reference } from '@/types'

type Props = {
  video: table_Reference
  isSaved: boolean
  progress: number | null
  errorMessage: string | null
  onPress: () => void
  onRemove: () => void
}

export default function VideoRow(props: Props) {
  const { video, isSaved, progress, errorMessage, onPress, onRemove } = props

  const isDownloading = progress !== null
  const percent = isDownloading ? Math.round(progress * 100) : 0
  const statusText = statusLine(isDownloading, percent, errorMessage, isSaved)
  const showProgress = isDownloading
  const progressFillStyle = { width: `${percent}%` as const }
  const showRemove = isSaved && !isDownloading

  return (
    <Pressable onPress={onPress} disabled={isDownloading} style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.name}>{video.rf_desc}</Text>
        <Text style={styles.status}>{statusText}</Text>
        {showProgress && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, progressFillStyle]} />
          </View>
        )}
      </View>
      {showRemove && (
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      )}
    </Pressable>
  )
}

//----------------------------------------------------------------------------------------------
//  statusLine — the status text shown under the video name
//  Params:  isDownloading — a download is in progress
//           percent       — download percentage (used while downloading)
//           errorMessage  — last download failure, or null
//           isSaved       — the video is saved on the phone
//  Returns: e.g. 'Downloading 42%', 'Saved', 'Tap to download'
//----------------------------------------------------------------------------------------------
function statusLine(
  isDownloading: boolean,
  percent: number,
  errorMessage: string | null,
  isSaved: boolean
): string {
  let text = 'Tap to download'
  if (isDownloading) text = `Downloading ${percent}%`
  else if (errorMessage) text = errorMessage
  else if (isSaved) text = 'Saved'
  return text
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fb923c',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12
  },
  textBlock: { flex: 1, gap: 4 },
  name: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  status: { color: '#ffffff', fontSize: 13 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden'
  },
  progressFill: { height: 6, backgroundColor: '#ffffff' },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffffff'
  },
  removeText: { color: '#ffffff', fontSize: 13, fontWeight: '600' }
})
