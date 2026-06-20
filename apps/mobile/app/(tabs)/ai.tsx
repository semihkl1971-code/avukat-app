import { useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { supabase } from '../../lib/supabase'
import { C } from '../../lib/theme'

type Msg = { role: 'user' | 'assistant'; content: string }

const SUGGESTIONS = [
  'Kira tespit davasında izlenecek adımlar ve süreler',
  'İşçilik alacağında kıdem-ihbar tazminatı nasıl hesaplanır',
  'İcra takibinde itirazın iptali stratejisi',
]

const API = process.env.EXPO_PUBLIC_API_URL || ''

// Çok hafif markdown (kalın + başlık + madde)
function clean(t: string) {
  return t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^#{1,4}\s/gm, '').replace(/^[-*]\s/gm, '• ')
}

export default function AiScreen() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  async function send(text: string) {
    const q = text.trim()
    if (!q || loading) return
    const next: Msg[] = [...messages, { role: 'user', content: q }]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Oturum bulunamadı')
      const res = await fetch(`${API}/api/ai-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ messages: next }),
      })
      if (res.status === 401) throw new Error('Yetki hatası — tekrar giriş yapın')
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Sunucu hatası (${res.status})`)
      }
      // RN'de canlı akış yok — tüm NDJSON gövdesini al, 'x' (yanıt) parçalarını birleştir
      const body = await res.text()
      let answer = ''
      for (const line of body.split('\n')) {
        if (!line.trim()) continue
        try { const o = JSON.parse(line) as { t: string; d: string }; if (o.t === 'x') answer += o.d } catch {}
      }
      setMessages(m => [...m, { role: 'assistant', content: answer || 'Yanıt alınamadı.' }])
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Bağlantı hatası'
      setMessages(m => [...m, { role: 'assistant', content: '⚠ ' + msg + (API ? '' : '\n\n(EXPO_PUBLIC_API_URL tanımlı değil)') }])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const empty = messages.length === 0

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View style={styles.logo}><Text style={{ fontSize: 18 }}>🧠</Text></View>
        <View>
          <Text style={styles.hTitle}>Yapay Zeka Hukuk Asistanı</Text>
          <Text style={styles.hSub}>Avukatım · Türk hukuku</Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {empty ? (
          <View style={{ paddingTop: 20 }}>
            <Text style={styles.welcome}>Hukuki sorunuzu sorun</Text>
            <Text style={styles.welcomeSub}>Meslektaşınız gibi, uygulamaya dönük yanıt alın.</Text>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity key={s} style={styles.sugg} onPress={() => send(s)}>
                <Text style={styles.suggText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : messages.map((m, i) => (
          <View key={i} style={[styles.bubbleRow, m.role === 'user' && { flexDirection: 'row-reverse' }]}>
            <View style={[styles.avatar, { backgroundColor: m.role === 'user' ? 'rgba(255,255,255,0.08)' : C.primary2 }]}>
              <Text style={{ fontSize: 14 }}>{m.role === 'user' ? '🧑‍⚖️' : '🧠'}</Text>
            </View>
            <View style={[styles.bubble, { backgroundColor: m.role === 'user' ? 'rgba(108,99,255,0.16)' : 'rgba(255,255,255,0.04)' }]}>
              <Text style={styles.bubbleText}>{clean(m.content)}</Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.bubbleRow}>
            <View style={[styles.avatar, { backgroundColor: C.primary2 }]}><Text style={{ fontSize: 14 }}>🧠</Text></View>
            <View style={[styles.bubble, { backgroundColor: 'rgba(255,255,255,0.04)', flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <ActivityIndicator size="small" color={C.primary2} /><Text style={{ color: '#8b80b3' }}>düşünüyor…</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput style={styles.input} value={input} onChangeText={setInput} placeholder="Bir hukuki soru yazın…" placeholderTextColor="#5b6172" multiline editable={!loading} />
        <TouchableOpacity style={[styles.sendBtn, (loading || !input.trim()) && { opacity: 0.5 }]} disabled={loading || !input.trim()} onPress={() => send(input)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Sor</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg2 },
  logo: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(168,85,247,0.2)', alignItems: 'center', justifyContent: 'center' },
  hTitle: { fontSize: 15, fontWeight: '800', color: C.text },
  hSub: { fontSize: 11.5, color: '#9b8fc7' },
  welcome: { fontSize: 20, fontWeight: '800', color: '#c4b5fd', textAlign: 'center' },
  welcomeSub: { fontSize: 14, color: C.textDim, textAlign: 'center', marginTop: 6, marginBottom: 22 },
  sugg: { backgroundColor: 'rgba(168,85,247,0.08)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.2)', borderRadius: 14, padding: 14, marginBottom: 10 },
  suggText: { color: '#d8d4ea', fontSize: 14 },
  bubbleRow: { flexDirection: 'row', gap: 10, marginBottom: 14, alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '82%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { color: C.text, fontSize: 14.5, lineHeight: 21 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg2 },
  input: { flex: 1, maxHeight: 110, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, color: C.text, fontSize: 15 },
  sendBtn: { backgroundColor: C.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 },
})
