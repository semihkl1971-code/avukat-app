import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { C } from '../lib/theme'

export default function NewClientScreen() {
  const [form, setForm] = useState({ full_name: '', type: 'individual', phone: '', email: '', city: '', tc_kimlik_no: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function save() {
    if (!form.full_name.trim()) { Alert.alert('Eksik', 'Ad soyad zorunludur.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()
    const { error } = await supabase.from('clients').insert({
      organization_id: profile!.organization_id,
      created_by: user!.id,
      type: form.type,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      city: form.city.trim() || null,
      tc_kimlik_no: form.tc_kimlik_no.trim() || null,
      notes: form.notes.trim() || null,
    })
    setSaving(false)
    if (error) { Alert.alert('Hata', error.message); return }
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={22} color={C.text} /></TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Müvekkil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>AD SOYAD / ÜNVAN *</Text>
        <TextInput style={styles.input} value={form.full_name} onChangeText={v => set('full_name', v)} placeholder="Ahmet Yılmaz" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>TÜR</Text>
        <View style={styles.row}>
          {[['individual', '👤 Bireysel'], ['corporate', '🏢 Kurumsal']].map(([v, l]) => (
            <TouchableOpacity key={v} onPress={() => set('type', v)} style={[styles.chip, form.type === v && styles.chipActive]}>
              <Text style={[styles.chipText, form.type === v && styles.chipTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>TELEFON</Text>
        <TextInput style={styles.input} value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" placeholder="+905xxxxxxxxx" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>E-POSTA</Text>
        <TextInput style={styles.input} value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" placeholder="ornek@eposta.com" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>ŞEHİR</Text>
        <TextInput style={styles.input} value={form.city} onChangeText={v => set('city', v)} placeholder="İstanbul" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>{form.type === 'corporate' ? 'VERGİ NO' : 'TC KİMLİK NO'}</Text>
        <TextInput style={styles.input} value={form.tc_kimlik_no} onChangeText={v => set('tc_kimlik_no', v)} keyboardType="number-pad" placeholder="—" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>NOTLAR</Text>
        <TextInput style={[styles.input, { height: 90, textAlignVertical: 'top' }]} value={form.notes} onChangeText={v => set('notes', v)} multiline placeholder="Müvekkil hakkında not..." placeholderTextColor="#5b6172" />

        <TouchableOpacity onPress={save} disabled={saving} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Müvekkili Kaydet</Text>}
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
  label: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 7, marginTop: 16, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text, backgroundColor: 'rgba(255,255,255,0.05)' },
  row: { flexDirection: 'row', gap: 10 },
  chip: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center' },
  chipActive: { borderColor: C.primary2, backgroundColor: 'rgba(168,85,247,0.15)' },
  chipText: { color: C.textDim, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#d8d4ea' },
  saveBtn: { marginTop: 26, backgroundColor: C.primary, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
