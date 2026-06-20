import { useCallback, useState } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl, TextInput, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { C, STATUS, GRADIENT } from '../../lib/theme'
import type { Case } from '@avukat/types'

type Row = Case & { clients: { full_name: string } | null }

export default function CasesScreen() {
  const [cases, setCases] = useState<Row[]>([])
  const [filtered, setFiltered] = useState<Row[]>([])
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function loadCases() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const { data } = await supabase.from('cases').select('*, clients(full_name)').eq('organization_id', profile!.organization_id).order('created_at', { ascending: false })
    setCases((data as Row[]) ?? [])
    setFiltered((data as Row[]) ?? [])
  }

  useFocusEffect(useCallback(() => { loadCases() }, []))

  function handleSearch(text: string) {
    setSearch(text)
    const q = text.toLowerCase()
    setFiltered(cases.filter(c => c.title.toLowerCase().includes(q) || c.clients?.full_name?.toLowerCase().includes(q) || (c.case_number ?? '').includes(text)))
  }

  async function onRefresh() { setRefreshing(true); await loadCases(); setRefreshing(false) }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={C.textMute} />
        <TextInput style={styles.searchInput} value={search} onChangeText={handleSearch} placeholder="Dava, müvekkil, esas no ara..." placeholderTextColor="#5b6172" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl tintColor={C.primary2} refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Dava bulunamadı</Text>}
        renderItem={({ item }) => {
          const st = STATUS[item.status as keyof typeof STATUS] ?? STATUS.active
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: st.bg }]}>
                  <Text style={[styles.badgeText, { color: st.fg }]}>{st.label}</Text>
                </View>
              </View>
              <Text style={styles.client}>{item.clients?.full_name ?? '—'}{item.case_number ? `  ·  ${item.case_number}` : ''}</Text>
              {item.court_name ? <Text style={styles.court}>{item.court_name}</Text> : null}
              {item.next_hearing_at ? <Text style={styles.hearing}>📅 {new Date(item.next_hearing_at).toLocaleDateString('tr-TR')}</Text> : null}
            </View>
          )
        }}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/case-new')}>
        <LinearGradient colors={GRADIENT} style={styles.fabInner}>
          <Ionicons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  fab: { position: 'absolute', right: 18, bottom: 22 },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: C.primary, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, margin: 12, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11 },
  searchInput: { flex: 1, fontSize: 15, color: C.text },
  list: { padding: 12, paddingTop: 0, gap: 10 },
  empty: { textAlign: 'center', color: C.textMute, fontSize: 15, marginTop: 50 },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: C.text, marginRight: 8 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 100 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  client: { fontSize: 13, color: C.textDim },
  court: { fontSize: 12, color: C.textMute, marginTop: 3 },
  hearing: { fontSize: 12, color: '#a78bfa', marginTop: 5, fontWeight: '600' },
})
