import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { C } from '../../lib/theme'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary2,
        tabBarInactiveTintColor: '#8089a0',
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: { backgroundColor: C.bg2, borderTopColor: C.border, height: 64, paddingBottom: 10, paddingTop: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        headerStyle: { backgroundColor: C.bg2 },
        headerTintColor: C.text,
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Panel', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="cases" options={{ title: 'Davalar', tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="clients" options={{ title: 'Müvekkiller', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="ai" options={{ title: 'AI', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="sparkles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: 'Takvim', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: 'Mesajlar', tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} /> }} />
    </Tabs>
  )
}
