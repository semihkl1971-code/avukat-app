import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C } from '../lib/theme'

const CASE_TYPES = [
  { v: 'civil', l: 'Hukuk' }, { v: 'criminal', l: 'Ceza' }, { v: 'commercial', l: 'Ticaret' },
  { v: 'family', l: 'Aile' }, { v: 'labor', l: 'İş' }, { v: 'administrative', l: 'İdari' }, { v: 'other', l: 'Diğer' },
]
const STATUSES = [
  { v: 'active', l: 'Aktif' }, { v: 'pending', l: 'Beklemede' }, { v: 'closed', l: 'Kapandı' }, { v: 'archived', l: 'Arşiv' },
]

export default function NewCaseScreen() {
  const [clients, setClients] = useState<{ id: string; full_name: string }[]>([])
  const [form, setForm] = useState({ title: '', client_id: '', case_number: '', case_type: 'civil', court_name: '', status: 'active' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
      const { data } = await supabase.from('clients').select('id, full_name').eq('organization_id', profile!.organization_id).order('full_name')
      setClients(data ?? [])
    })()
  }, [])

  async function save() {
    if (!form.title.trim()) { Alert.alert('Eksik', 'Dava başlığı zorunludur.'); return }
    if (!form.client_id) { Alert.alert('Eksik', 'Müvekkil seçin.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()
    const { error } = await supabase.from('cases').insert({
      organization_id: profile!.organization_id,
      assigned_lawyer_id: user!.id,
      client_id: form.client_id,
      title: form.title.trim(),
      case_number: form.case_number.trim() || null,
      case_type: form.case_type,
      court_name: form.court_name.trim() || null,
      status: form.status,
    })
    setSaving(false)
    if (error) { Alert.alert('Hata', error.message); return }
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={C.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Dava</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>DAVA BAŞLIĞI *</Text>
        <TextInput style={styles.input} value={form.title} onChangeText={v => set('title', v)} placeholder="Yılmaz - Demir Alacak Davası" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>MÜVEKKİL *</Text>
        {clients.length === 0 ? (
          <Text style={styles.hint}>Önce müvekkil ekleyin (Müvekkiller sekmesi).</Text>
        ) : (
          <View style={styles.chipWrap}>
            {clients.map(c => (
              <TouchableOpacity key={c.id} onPress={() => set('client_id', c.id)} style={[styles.chip, form.client_id === c.id && styles.chipActive]}>
                <Text style={[styles.chipText, form.client_id === c.id && styles.chipTextActive]}>{c.full_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.label}>ESAS NO</Text>
        <TextInput style={styles.input} value={form.case_number} onChangeText={v => set('case_number', v)} placeholder="2026/1547" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>DAVA TÜRÜ</Text>
        <View style={styles.chipWrap}>
          {CASE_TYPES.map(t => (
            <TouchableOpacity key={t.v} onPress={() => set('case_type', t.v)} style={[styles.chip, form.case_type === t.v && styles.chipActive]}>
              <Text style={[styles.chipText, form.case_type === t.v && styles.chipTextActive]}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>MAHKEME</Text>
        <TextInput style={styles.input} value={form.court_name} onChangeText={v => set('court_name', v)} placeholder="İstanbul 5. Asliye Hukuk Mahkemesi" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>DURUM</Text>
        <View style={styles.chipWrap}>
          {STATUSES.map(s => (
            <TouchableOpacity key={s.v} onPress={() => set('status', s.v)} style={[styles.chip, form.status === s.v && styles.chipActive]}>
              <Text style={[styles.chipText, form.status === s.v && styles.chipTextActive]}>{s.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Davayı Kaydet</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg2 },
  backBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  form: { padding: 18, paddingBottom: 40 },
  label: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 8, marginTop: 16, letterSpacing: 0.3 },
  hint: { color: C.textMute, fontSize: 13.5, fontStyle: 'italic' },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, backgroundColor: 'rgba(255,255,255,0.05)' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive: { borderColor: C.primary2, backgroundColor: 'rgba(168,85,247,0.15)' },
  chipText: { color: C.textDim, fontSize: 13.5, fontWeight: '600' },
  chipTextActive: { color: '#d8d4ea' },
  saveBtn: { marginTop: 26, backgroundColor: C.primary, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
