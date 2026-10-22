//==============================================================================================
//  1) DESCRIPTION
//    The project's single constants file — every tunable value, including the whole video
//    catalogue.
//
//    R2_BASE_URL  — public Cloudflare R2 bucket address; each video's rf_link is appended to it
//    SAVED_FOLDER — name of the folder saved videos are kept in on the phone
//    VIDEOS       — the video catalogue; rf_desc must be unique (it is the saved file name)
//
//  2) NOTES
//    r2.dev addresses are rate-limited and not meant for production — connect a custom domain
//    to the bucket before release; only R2_BASE_URL then changes.
//==============================================================================================

import type { table_Reference } from '@/types'

export const R2_BASE_URL = 'https://pub-13d8924a0e08436b9490bcbee03bb453.r2.dev'

export const SAVED_FOLDER = 'BridgeSchool'

export const VIDEOS: table_Reference[] = [
  { rf_desc: 'Two Way Checkback', rf_link: 'Hollands/Two_Way_Checkback.mp4' },
  { rf_desc: 'Bergen Raises', rf_link: 'Hollands/Bergen_Raises.mp4' },
  { rf_desc: 'Redoubles', rf_link: 'Hollands/Redoubles_In_Bridge.mp4' }
]
