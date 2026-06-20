import { useCallback, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { C } from '../../lib/theme'
import { sendTestNotification, scheduleHearingReminders } from '../../lib/notifications'

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: '#6c63ff' },
  pending: { label: 'Beklemede', color: '#f59e0b' },
  closed: { label: 'Kapandı', color: '#10b981' },
  archived: { label: 'Arşiv', color: '#6b7280' },
}
const CH_ICON: Record<string, string> = { whatsapp: '💬', gmail: '📧', sms: '📱' }
const fmt = (n: number) => n.toLocaleString('tr-TR') + ' ₺'

export default function DashboardScreen() {
  const [name, setName] = useState('')
  const [statusTally, setStatusTally] = useState<Record<string, number>>({})
  const [totalCases, setTotalCases] = useState(0)
  const [clientsMonth, setClientsMonth] = useState(0)
  const [pending, setPending] = useState(0)
  const [hearings, setHearings] = useState<Record<string, unknown>[]>([])
  const [messages, setMessages] = useState<Record<string, unknown>[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('full_name, organization_id').eq('id', user.id).single()
    if (!profile) return
    setName((profile.full_name as string)?.split(' ')[0] ?? 'Avukat')
    const orgId = profile.organization_id
    const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

    const [casesRes, clientsRes, payRes, hRes, mRes] = await Promise.all([
      supabase.from('cases').select('status').eq('organization_id', orgId),
      supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).gte('created_at', monthAgo),
      supabase.from('client_payments').select('amount, paid').eq('organization_id', orgId),
      supabase.from('hearings').select('id, scheduled_at, court_name, cases(title)').eq('organization_id', orgId).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(5),
      supabase.from('messages').select('id, channel, direction, body, clients(full_name)').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(4),
    ])
    const cases = casesRes.data ?? []
    setTotalCases(cases.length)
    setStatusTally(cases.reduce<Record<string, number>>((a, c) => { const s = (c.status as string) ?? 'active'; a[s] = (a[s] ?? 0) + 1; return a }, {}))
    setClientsMonth(clientsRes.count ?? 0)
    setPending((payRes.data ?? []).filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0))
    const hs = (hRes.data ?? []) as Record<string, unknown>[]
    setHearings(hs)
    setMessages(mRes.data ?? [])
    // Yaklaşan duruşmalar için yerel hatırlatma (duruşmadan 1 gün önce)
    scheduleHearingReminders(hs.map(h => ({ id: String(h['id']), scheduled_at: String(h['scheduled_at']), title: String((h['cases'] as Record<string, unknown>)?.['title'] ?? 'Dava') })))
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))
  async function onRefresh() { setRefreshing(true); await load(); setRefreshing(false) }
  async function logout() { await supabase.auth.signOut(); router.replace('/(auth)/login') }
  async function testNotif() {
    const ok = await sendTestNotification()
    Alert.alert(ok ? '🔔 Bildirim ayarlandı' : 'Bildirim açılamadı', ok ? '3 saniye içinde bir test bildirimi alacaksınız.' : 'İzin verilmedi (ya da web önizlemede desteklenmez — gerçek telefonda çalışır).')
  }

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'

  const STATS = [
    { label: 'Aktif Dava', value: String(statusTally.active ?? 0), icon: 'briefcase' as const, color: '#a5b4fc', glow: 'rgba(108,99,255,0.3)' },
    { label: 'Yaklaşan Duruşma', value: String(hearings.length), icon: 'calendar' as const, color: '#c4b5fd', glow: 'rgba(168,85,247,0.3)' },
    { label: 'Bu Ay Müvekkil', value: String(clientsMonth), icon: 'person-add' as const, color: '#6ee7b7', glow: 'rgba(16,185,129,0.28)' },
    { label: 'Bekleyen Tahsilat', value: fmt(pending), icon: 'wallet' as const, color: '#fbbf24', glow: 'rgba(245,158,11,0.25)' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }} refreshControl={<RefreshControl tintColor={C.primary2} refreshing={refreshing} onRefresh={onRefresh} />}>
      <LinearGradient colors={['#1a1040', '#0d0b1a', C.bg]} style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greet}>{greet},</Text>
            <Text style={styles.name}>{name} 👋</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.logoutBtn} onPress={testNotif}><Ionicons name="notifications-outline" size={21} color="#c4b5fd" /></TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}><Ionicons name="log-out-outline" size={22} color={C.textDim} /></TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Stat kartları (2x2) */}
      <View style={styles.statsGrid}>
        {STATS.map(s => (
          <View key={s.label} style={styles.statCard}>
            <View style={[styles.glow, { backgroundColor: s.glow }]} />
            <Ionicons name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]} numberOfLines={1}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Dava durum dağılımı */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Dava Durum Dağılımı</Text>
          <Text style={styles.sectionMeta}>Toplam {totalCases}</Text>
        </View>
        {totalCases === 0 ? <Text style={styles.empty}>Henüz dava yok.</Text> : Object.entries(STATUS_META).map(([key, meta]) => {
          const n = statusTally[key] ?? 0
          const pct = totalCases ? Math.round((n / totalCases) * 100) : 0
          return (
            <View key={key} style={{ marginBottom: 11 }}>
              <View style={styles.barRow}><Text style={styles.barLabel}>{meta.label}</Text><Text style={styles.barVal}>{n} · %{pct}</Text></View>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${pct}%`, backgroundColor: meta.color }]} /></View>
            </View>
          )
        })}
      </View>

      {/* Yaklaşan duruşmalar */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Yaklaşan Duruşmalar</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')}><Text style={styles.link}>Tümü →</Text></TouchableOpacity>
        </View>
        {hearings.length === 0 ? <Text style={styles.empty}>Yaklaşan duruşma yok.</Text> : hearings.map(h => (
          <View key={h['id'] as string} style={styles.itemRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDay}>{new Date(h['scheduled_at'] as string).getDate()}</Text>
              <Text style={styles.dateMon}>{new Date(h['scheduled_at'] as string).toLocaleDateString('tr-TR', { month: 'short' })}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>{((h['cases'] as Record<string, unknown>)?.['title'] as string) ?? 'Dava'}</Text>
              <Text style={styles.itemSub} numberOfLines={1}>{(h['court_name'] as string) ?? '—'}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Son mesajlar */}
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Son Mesajlar</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/messages')}><Text style={styles.link}>Tümü →</Text></TouchableOpacity>
        </View>
        {messages.length === 0 ? <Text style={styles.empty}>Henüz mesaj yok.</Text> : messages.map(m => (
          <View key={m['id'] as string} style={styles.itemRow}>
            <Text style={{ fontSize: 18 }}>{CH_ICON[m['channel'] as string] ?? '✉️'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>{((m['clients'] as Record<string, unknown>)?.['full_name'] as string) ?? 'Bilinmeyen'}<Text style={styles.itemSub}>  {m['direction'] === 'inbound' ? '← gelen' : '→ giden'}</Text></Text>
              <Text style={styles.itemSub} numberOfLines={1}>{(m['body'] as string) ?? ''}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 22 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greet: { color: C.textDim, fontSize: 15 },
  name: { color: C.text, fontSize: 25, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  date: { color: '#7c7596', fontSize: 13, marginTop: 4 },
  logoutBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginTop: -4 },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, overflow: 'hidden' },
  glow: { position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: 40, opacity: 0.6 },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 8 },
  statLabel: { fontSize: 11.5, color: C.textDim, marginTop: 2 },
  section: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, margin: 14, marginBottom: 0, borderRadius: 18, padding: 16 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  sectionMeta: { fontSize: 12.5, color: C.textDim },
  link: { color: '#a78bfa', fontSize: 13 },
  empty: { color: C.textMute, fontSize: 14, paddingVertical: 8 },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  barLabel: { color: '#c4cfe0', fontSize: 13 },
  barVal: { color: C.textDim, fontSize: 12.5 },
  barTrack: { height: 8, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 100 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dateBox: { width: 44, height: 44, backgroundColor: 'rgba(108,99,255,0.15)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 17, fontWeight: '800', color: '#a78bfa' },
  dateMon: { fontSize: 10, color: '#8b80b3' },
  itemTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  itemSub: { fontSize: 12, color: C.textDim, marginTop: 2, fontWeight: '400' },
})
