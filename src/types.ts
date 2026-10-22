//==============================================================================================
//  1) DESCRIPTION
//    Data shapes for the app. Field names match next-bridgeschool's database columns exactly
//    (no aliases), holding only the columns this app uses.
//
//    table_Reference — one video (next-bridgeschool trf_reference):
//      rf_desc — the video name; shown on screen and used as the saved file name
//      rf_link — the video's path in R2, prefixed with R2_BASE_URL at download time
//==============================================================================================

export type table_Reference = {
  rf_desc: string
  rf_link: string
}
