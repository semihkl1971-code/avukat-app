import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Linking, RefreshControl } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { C, GRADIENT } from '../../lib/theme'
import type { Client } from '@avukat/types'

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([])
  const [filtered, setFiltered] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function loadClients() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const { data } = await supabase.from('clients').select('*').eq('organization_id', profile!.organization_id).order('full_name')
    setClients(data ?? [])
    setFiltered(data ?? [])
  }

  useFocusEffect(useCallback(() => { loadClients() }, []))

  function handleSearch(text: string) {
    setSearch(text)
    const q = text.toLowerCase()
    setFiltered(clients.filter(c => c.full_name.toLowerCase().includes(q) || (c.phone ?? '').includes(text) || (c.email ?? '').toLowerCase().includes(q)))
  }

  async function onRefresh() { setRefreshing(true); await loadClients(); setRefreshing(false) }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={17} color={C.textMute} />
        <TextInput style={styles.searchInput} value={search} onChangeText={handleSearch} placeholder="Ad, telefon veya e-posta ara..." placeholderTextColor="#5b6172" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl tintColor={C.primary2} refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>Müvekkil bulunamadı</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <LinearGradient colors={GRADIENT} style={styles.avatar}>
              <Text style={styles.avatarText}>{item.full_name[0]?.toUpperCase() ?? '?'}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.type}>{item.type === 'corporate' ? '🏢 Kurumsal' : '👤 Bireysel'}{item.city ? `  ·  ${item.city}` : ''}</Text>
            </View>
            <View style={styles.actions}>
              {item.phone ? (
                <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL(`tel:${item.phone}`)}>
                  <Ionicons name="call" size={18} color="#a5b4fc" />
                </TouchableOpacity>
              ) : null}
              {item.phone ? (
                <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL(`whatsapp://send?phone=${item.phone?.replace(/\D/g, '')}`)}>
                  <Ionicons name="logo-whatsapp" size={18} color="#34d399" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => router.push('/client-new')}>
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
  list: { padding: 12, paddingTop: 0, gap: 8 },
  empty: { textAlign: 'center', color: C.textMute, fontSize: 15, marginTop: 50 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  name: { fontSize: 15, fontWeight: '700', color: C.text },
  type: { fontSize: 12.5, color: C.textDim, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
})
