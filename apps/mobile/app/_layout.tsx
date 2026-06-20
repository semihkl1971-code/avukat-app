import { useEffect, useState } from 'react'
import { View, Platform } from 'react-native'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { supabase } from '../lib/supabase'
import { C } from '../lib/theme'
import type { Session } from '@supabase/supabase-js'

SplashScreen.preventAutoHideAsync()

// Web'de uygulamayı ortalanmış mobil sütunda göster (kırpma YOK — etiketler tam görünür)
function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>
  return (
    <View style={{ flex: 1, backgroundColor: '#05060b', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 420, backgroundColor: C.bg, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1a1a22' }}>
        {children}
      </View>
    </View>
  )
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized(true)
      SplashScreen.hideAsync()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!initialized) return <View style={{ flex: 1, backgroundColor: C.bg }} />

  return (
    <PhoneFrame>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        {session ? <Stack.Screen name="(tabs)" /> : <Stack.Screen name="(auth)" />}
      </Stack>
    </PhoneFrame>
  )
}
