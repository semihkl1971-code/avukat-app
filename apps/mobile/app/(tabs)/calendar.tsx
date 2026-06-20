import { useEffect, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { supabase } from '../../lib/supabase'
import { C } from '../../lib/theme'

export default function CalendarScreen() {
  const [hearings, setHearings] = useState<Record<string, unknown>[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadHearings() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const { data } = await supabase.from('hearings').select('*, cases(title, clients(full_name))').eq('organization_id', profile!.organization_id).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(30)
    setHearings(data ?? [])
  }

  useEffect(() => { loadHearings() }, [])
  async function onRefresh() { setRefreshing(true); await loadHearings(); setRefreshing(false) }

  function groupByDate(items: Record<string, unknown>[]) {
    const groups: Record<string, Record<string, unknown>[]> = {}
    for (const item of items) {
      const date = (item['scheduled_at'] as string).split('T')[0]!
      if (!groups[date]) groups[date] = []
      groups[date]!.push(item)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }

  const grouped = groupByDate(hearings)

  return (
    <FlatList
      style={styles.container}
      data={grouped}
      keyExtractor={([date]) => date}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl tintColor={C.primary2} refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>📅</Text><Text style={styles.emptyText}>Yaklaşan duruşma yok</Text></View>}
      renderItem={({ item: [date, items] }) => (
        <View style={styles.group}>
          <Text style={styles.dateLabel}>{new Date(date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {items.map(h => {
            const c = h['cases'] as Record<string, unknown>
            const client = c?.['clients'] as Record<string, unknown>
            const time = new Date(h['scheduled_at'] as string).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            return (
              <View key={h['id'] as string} style={styles.card}>
                <View style={styles.timeBox}><Text style={styles.time}>{time}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.caseTitle} numberOfLines={1}>{(c?.['title'] as string) ?? 'Dava'}</Text>
                  <Text style={styles.court} numberOfLines={1}>{(h['court_name'] as string) ?? '—'}</Text>
                  {client?.['full_name'] ? <Text style={styles.client}>{client['full_name'] as string}</Text> : null}
                </View>
                {h['uyap_synced'] ? <View style={styles.uyapBadge}><Text style={styles.uyapText}>UYAP</Text></View> : null}
              </View>
            )
          })}
        </View>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 14 },
  emptyState: { alignItems: 'center', paddingTop: 70 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.textDim },
  group: { marginBottom: 18 },
  dateLabel: { fontSize: 13.5, fontWeight: '700', color: '#a78bfa', marginBottom: 8, paddingLeft: 4, textTransform: 'capitalize' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  timeBox: { width: 52, alignItems: 'center', marginRight: 12, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' },
  time: { fontSize: 15, fontWeight: '800', color: '#a78bfa' },
  caseTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  court: { fontSize: 12, color: C.textDim, marginTop: 2 },
  client: { fontSize: 12, color: C.textMute, marginTop: 2 },
  uyapBadge: { backgroundColor: 'rgba(108,99,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  uyapText: { fontSize: 10, color: '#a5b4fc', fontWeight: '700' },
})
