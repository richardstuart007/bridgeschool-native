//==============================================================================================
//  1) DESCRIPTION
//    savedVideos — every piece of saved-video file handling in one place: where a video is
//    saved, whether it is saved, downloading it, the local address to play it from, and
//    removing it.
//
//    Exports:
//      isVideoSaved      — true when the video's .mp4 is saved on the phone
//      downloadVideo     — downloads the full .mp4 from R2 and saves it
//      savedVideoUri     — local address of a saved video for the player, or null
//      removeSavedVideo  — deletes a saved video
//
//  2) NOTES
//    Exactly one saved copy per video, named savedFileName(rf_desc), in a folder named
//    SAVED_FOLDER:
//      Android — a gallery album (expo-media-library), so the one copy shows in both the
//                gallery and the Files app. The download goes to a temp file in the cache
//                folder, is moved into the album, and the temp file is then deleted.
//                Needs the gallery (video) permission; the first download asks for it.
//      iPhone  — the app's Documents/SAVED_FOLDER folder, shown in the Files app via the
//                UIFileSharingEnabled / LSSupportsOpeningDocumentsInPlace app settings.
//    A video is identified by rf_desc, which the catalogue guarantees is unique; no clash
//    handling.
//    On Android a failed download can leave a partial file at the destination (iOS moves the
//    file into place only on success), so any partial file is deleted on failure.
//==============================================================================================

import { Platform } from 'react-native'
import { Directory, File, Paths } from 'expo-file-system'
import { Album, Asset, getPermissionsAsync, requestPermissionsAsync } from 'expo-media-library'

import { R2_BASE_URL, SAVED_FOLDER } from '@/constants'
import type { table_Reference } from '@/types'

//----------------------------------------------------------------------------------
//  isVideoSaved — whether the video's .mp4 is saved on the phone
//  Params:  rf_desc — the video name
//  Returns: true when the saved copy exists (Android: false until gallery permission
//           has been granted — the permission is only asked for on first download)
//----------------------------------------------------------------------------------
export async function isVideoSaved(rf_desc: string): Promise<boolean> {
  if (Platform.OS === 'android') {
    const asset = await findAlbumAsset(rf_desc)
    const saved = asset !== null
    return saved
  }
  const exists = documentsFile(rf_desc).exists
  return exists
}

//----------------------------------------------------------------------------------
//  downloadVideo — downloads the full .mp4 from R2 and saves it (see NOTES for where)
//  Params:  video      — the catalogue entry (rf_desc names the file, rf_link locates it)
//           onProgress — called during the download with the fraction done (0 to 1)
//  Returns: nothing; throws when the download or save fails (no partial file is left)
//----------------------------------------------------------------------------------
export async function downloadVideo(
  video: table_Reference,
  onProgress: (fraction: number) => void
): Promise<void> {
  const url = `${R2_BASE_URL}/${video.rf_link}`
  if (Platform.OS === 'android') {
    await downloadToAlbum(url, video.rf_desc, onProgress)
    return
  }
  const folder = documentsFolder()
  folder.create({ intermediates: true, idempotent: true })
  await downloadToFile(url, documentsFile(video.rf_desc), onProgress)
}

//----------------------------------------------------------------------------------
//  savedVideoUri — local address of a saved video, for the player
//  Params:  rf_desc — the video name
//  Returns: the saved copy's URI, or null when the video is not saved
//----------------------------------------------------------------------------------
export async function savedVideoUri(rf_desc: string): Promise<string | null> {
  if (Platform.OS === 'android') {
    const asset = await findAlbumAsset(rf_desc)
    const uri = asset ? await asset.getUri() : null
    return uri
  }
  const file = documentsFile(rf_desc)
  const uri = file.exists ? file.uri : null
  return uri
}

//----------------------------------------------------------------------------------
//  removeSavedVideo — deletes a saved video (no error if it is already gone)
//  Params:  rf_desc — the video name
//  Returns: nothing; on Android the system asks the user to confirm the delete
//----------------------------------------------------------------------------------
export async function removeSavedVideo(rf_desc: string): Promise<void> {
  if (Platform.OS === 'android') {
    const asset = await findAlbumAsset(rf_desc)
    if (asset) await asset.delete()
    return
  }
  const file = documentsFile(rf_desc)
  if (file.exists) file.delete()
}

//----------------------------------------------------------------------------------
//  findAlbumAsset — Android: the video's asset in the SAVED_FOLDER gallery album
//  Params:  rf_desc — the video name
//  Returns: the asset, or null when there is no permission, no album, or no such file
//----------------------------------------------------------------------------------
async function findAlbumAsset(rf_desc: string): Promise<Asset | null> {
  const permission = await getPermissionsAsync(false, ['video'])
  if (!permission.granted) return null
  const album = await Album.get(SAVED_FOLDER)
  if (!album) return null
  const fileName = savedFileName(rf_desc)
  const assets = await album.getAssets()
  for (const asset of assets) {
    const assetFileName = await asset.getFilename()
    if (assetFileName === fileName) return asset
  }
  return null
}

//----------------------------------------------------------------------------------
//  documentsFile — iPhone: the saved-file location for a video (need not exist yet)
//  Params:  rf_desc — the video name
//  Returns: a File in Documents/SAVED_FOLDER named savedFileName(rf_desc)
//----------------------------------------------------------------------------------
function documentsFile(rf_desc: string): File {
  const file = new File(documentsFolder(), savedFileName(rf_desc))
  return file
}

//----------------------------------------------------------------------------------
//  documentsFolder — iPhone: the folder saved videos are kept in
//  Returns: Documents/SAVED_FOLDER
//----------------------------------------------------------------------------------
function documentsFolder(): Directory {
  const folder = new Directory(Paths.document, SAVED_FOLDER)
  return folder
}

//----------------------------------------------------------------------------------
//  downloadToAlbum — Android: downloads to a temp file, moves it into the SAVED_FOLDER
//  gallery album, then deletes the temp file so only the album copy remains
//  Params:  url        — full R2 address of the .mp4
//           rf_desc    — the video name
//           onProgress — download fraction callback (0 to 1)
//  Returns: nothing; throws when permission is refused or the download/save fails
//----------------------------------------------------------------------------------
async function downloadToAlbum(
  url: string,
  rf_desc: string,
  onProgress: (fraction: number) => void
): Promise<void> {
  const permission = await requestPermissionsAsync(false, ['video'])
  if (!permission.granted) throw new Error('Gallery permission not granted')
  const tempFile = new File(Paths.cache, savedFileName(rf_desc))
  try {
    await downloadToFile(url, tempFile, onProgress)
    const album = await Album.get(SAVED_FOLDER)
    if (album) await Asset.create(tempFile.uri, album)
    else await Album.create(SAVED_FOLDER, [tempFile.uri], true)
  } finally {
    //
    //  The album now holds the video — remove the temp copy (one copy only)
    //
    if (tempFile.exists) tempFile.delete()
  }
}

//----------------------------------------------------------------------------------
//  downloadToFile — downloads a URL into a file, overwriting any existing file and
//  deleting a partial file if the download fails
//  Params:  url        — full address to download
//           file       — destination file
//           onProgress — download fraction callback (0 to 1)
//  Returns: nothing; throws when the download fails
//----------------------------------------------------------------------------------
async function downloadToFile(
  url: string,
  file: File,
  onProgress: (fraction: number) => void
): Promise<void> {
  try {
    await File.downloadFileAsync(url, file, {
      idempotent: true,
      onProgress: ({ bytesWritten, totalBytes }) => {
        //
        //  totalBytes is -1 when the server sends no Content-Length
        //
        const fraction = totalBytes > 0 ? bytesWritten / totalBytes : 0
        onProgress(fraction)
      }
    })
  } catch (error) {
    //
    //  Android streams straight into the target file, so a failure can leave a partial
    //  file behind — delete it so a half video is never treated as saved
    //
    if (file.exists) file.delete()
    throw error
  }
}

//----------------------------------------------------------------------------------
//  savedFileName — file name for a saved video: rf_desc with characters that are not
//  allowed in file names removed, plus .mp4
//  Params:  rf_desc — the video name
//  Returns: e.g. 'Bergen Raises.mp4'
//----------------------------------------------------------------------------------
function savedFileName(rf_desc: string): string {
  const safeName = rf_desc.replace(/[\\/:*?"<>|]/g, '').trim()
  const fileName = `${safeName}.mp4`
  return fileName
}
