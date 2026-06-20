import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

// Uygulama ön plandayken de bildirim göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const { status } = await Notifications.getPermissionsAsync()
  if (status === 'granted') return true
  const req = await Notifications.requestPermissionsAsync()
  return req.status === 'granted'
}

// Hemen test bildirimi (3 sn sonra)
export async function sendTestNotification(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  if (!(await ensurePermission())) return false
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '⚖️ Avukatım',
      body: 'Bildirimler çalışıyor! Duruşma ve ödeme hatırlatmaları buradan gelecek.',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3 },
  })
  return true
}

type HearingLite = { id: string; scheduled_at: string; title: string }

// Yaklaşan duruşmalar için duruşmadan 1 gün önce yerel hatırlatma kur
export async function scheduleHearingReminders(hearings: HearingLite[]): Promise<number> {
  if (Platform.OS === 'web') return 0
  if (!(await ensurePermission())) return 0
  await Notifications.cancelAllScheduledNotificationsAsync()
  const now = Date.now()
  let count = 0
  for (const h of hearings) {
    const remindAt = new Date(h.scheduled_at).getTime() - 24 * 3600 * 1000 // 1 gün önce
    if (remindAt > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📅 Duruşma Hatırlatması',
          body: `Yarın duruşmanız var: ${h.title}`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(remindAt) },
      })
      count++
    }
  }
  return count
}
