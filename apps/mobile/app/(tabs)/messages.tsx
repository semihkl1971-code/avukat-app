import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { supabase } from '../../lib/supabase'
import { C } from '../../lib/theme'
import type { Message } from '@avukat/types'

const CHANNEL_ICON: Record<string, string> = { whatsapp: '💬', gmail: '📧', sms: '📱' }

export default function MessagesScreen() {
  const [messages, setMessages] = useState<(Message & { clients: { full_name: string } | null })[]>([])
  const [refreshing, setRefreshing] = useState(false)

  async function loadMessages() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
    const { data } = await supabase.from('messages').select('*, clients(full_name)').eq('organization_id', profile!.organization_id).order('created_at', { ascending: false }).limit(30)
    setMessages((data as (Message & { clients: { full_name: string } | null })[]) ?? [])
  }

  useEffect(() => { loadMessages() }, [])
  async function onRefresh() { setRefreshing(true); await loadMessages(); setRefreshing(false) }

  return (
    <FlatList
      style={styles.container}
      data={messages}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl tintColor={C.primary2} refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>💬</Text><Text style={styles.emptyText}>Henüz mesaj yok</Text><Text style={styles.emptySubtext}>WhatsApp veya Gmail&apos;i web uygulamasından yapılandırın</Text></View>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item} activeOpacity={0.8}>
          <View style={styles.channelBadge}><Text style={styles.channelIcon}>{CHANNEL_ICON[item.channel] ?? '✉️'}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={styles.topRow}>
              <Text style={styles.sender} numberOfLines={1}>{item.clients?.full_name ?? item.from_address ?? 'Bilinmiyor'}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
            </View>
            {item.subject ? <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text> : null}
            <Text style={styles.body} numberOfLines={2}>{item.body ?? '—'}</Text>
          </View>
          <View style={[styles.dirBadge, item.direction === 'inbound' ? styles.inbound : styles.outbound]}>
            <Text style={[styles.dirText, { color: item.direction === 'inbound' ? '#34d399' : '#a5b4fc' }]}>{item.direction === 'inbound' ? '↓' : '↑'}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  list: { padding: 12 },
  emptyState: { alignItems: 'center', paddingTop: 70 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: C.textDim },
  emptySubtext: { fontSize: 13, color: C.textMute, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
  item: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  channelBadge: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  channelIcon: { fontSize: 20 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  sender: { fontSize: 14, fontWeight: '700', color: C.text, flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: C.textMute },
  subject: { fontSize: 12, color: C.textDim, marginBottom: 3 },
  body: { fontSize: 13, color: C.textDim, lineHeight: 18 },
  dirBadge: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  inbound: { backgroundColor: 'rgba(16,185,129,0.15)' },
  outbound: { backgroundColor: 'rgba(108,99,255,0.16)' },
  dirText: { fontSize: 13, fontWeight: '800' },
})
