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
  { rf_desc: 'Redoubles', rf_link: 'Hollands/Redoubles_In_Bridge.mp4' },
  {
    rf_desc: 'Cue Bids 1st and 2nd Round Controls',
    rf_link: 'Hollands/Cue_Bidding_-_1st_and_2nd_Round_controls.mp4'
  },
  { rf_desc: 'Michaels Cue Bid', rf_link: 'Hollands/Michaels_Cue_Bid.mp4' },
  { rf_desc: 'Quantitative 4NT', rf_link: 'Hollands/Quantitative_4NT.mp4' },
  {
    rf_desc: 'Lebensohl: Part 1 Introducing the 2NT relay bid',
    rf_link: 'Lebensohl/Lebensohl__Part_1_Introducing_the_2NT_relay_bid.mp4'
  },
  {
    rf_desc: 'Lebensohl: Part 2 Direct bids at the 2 level',
    rf_link: 'Lebensohl/Lebensohl__Part_2_Direct_bids_on_the_2_level_are_sign_offs.mp4'
  },
  {
    rf_desc: 'Lebensohl: Part 3 Cuebid Stayman',
    rf_link: 'Lebensohl/Lebensohl__Part_3_Cuebid_Stayman.mp4'
  },
  {
    rf_desc: 'Lebensohl: Part 4 Game auctions without majors',
    rf_link: 'Lebensohl/Lebensohl__Part_4_Game_auctions_without_majors.mp4'
  },
  {
    rf_desc: 'Lebensohl: Part 5 The Negative Double',
    rf_link: 'Lebensohl/Lebensohl__Part_5_The_Negative_Double.mp4'
  }
]
