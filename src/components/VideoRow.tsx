//==============================================================================================
//  1) DESCRIPTION
//    VideoRow — one video in the Videos list, coloured by status:
//      Not saved / downloading / failed — orange row, ⬇ icon, status text (Tap to download /
//        Downloading n% with a progress bar / Download failed — tap to retry)
//      Saved — green row, ▶ icon, "Saved — tap to play", and a small red Remove pill
//    Tapping the row plays a saved video and downloads an unsaved one (handled by onPress).
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
//    Icons are plain text symbols followed by U+FE0E (text presentation) so phones draw them as
//    simple symbols rather than colour emoji.
//
//  3) CHANGE HISTORY
//    2026-10-22 — status colours: orange (not saved) / green (saved), ⬇ / ▶ icons, "Saved — tap
//                 to play", Remove is now a small red pill
//==============================================================================================

import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { table_Reference } from '@/types'

const DOWNLOAD_ICON = '⬇︎'
const PLAY_ICON = '▶︎'

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
  const showSaved = isSaved && !isDownloading
  const percent = isDownloading ? Math.round(progress * 100) : 0
  const statusText = statusLine(isDownloading, percent, errorMessage, isSaved)
  const showProgress = isDownloading
  const progressFillStyle = { width: `${percent}%` as const }
  const rowStatusStyle = showSaved ? styles.rowSaved : styles.rowNotSaved
  const icon = showSaved ? PLAY_ICON : DOWNLOAD_ICON
  const showRemove = showSaved

  return (
    <Pressable onPress={onPress} disabled={isDownloading} style={[styles.row, rowStatusStyle]}>
      <Text style={styles.icon}>{icon}</Text>
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
//  Returns: e.g. 'Downloading 42%', 'Saved — tap to play', 'Tap to download'
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
  else if (isSaved) text = 'Saved — tap to play'
  return text
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12
  },
  rowNotSaved: { backgroundColor: '#fb923c' },
  rowSaved: { backgroundColor: '#16a34a' },
  icon: { color: '#ffffff', fontSize: 22, width: 24, textAlign: 'center' },
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#dc2626'
  },
  removeText: { color: '#ffffff', fontSize: 12, fontWeight: '600' }
})
