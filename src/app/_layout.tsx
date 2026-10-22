//==============================================================================================
//  1) DESCRIPTION
//    RootLayout — the app's navigator: a stack of the Videos list (index) and the Player.
//==============================================================================================

import { Stack } from 'expo-router'

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ title: 'Bridge School Videos' }} />
      <Stack.Screen name='player/[rf_desc]' options={{ title: '' }} />
    </Stack>
  )
}
