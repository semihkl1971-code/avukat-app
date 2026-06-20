import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Linking } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'
import { C, GRADIENT3, GRADIENT } from '../../lib/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Eksik bilgi', 'E-posta ve şifre girin.'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) Alert.alert('Giriş Hatası', error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message)
    else router.replace('/(tabs)')
  }

  function fillDemo() { setEmail('demo@avukatim.com'); setPassword('Demo123456!') }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <LinearGradient colors={GRADIENT3} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.logoBox}>
          <Text style={styles.logo}>⚖️</Text>
        </LinearGradient>
        <Text style={styles.title}>Avukat<Text style={{ color: C.primary2 }}>ım</Text></Text>
        <Text style={styles.subtitle}>Hukuk Bürosu Yönetim Platformu</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.welcome}>Tekrar Hoş Geldiniz</Text>
        <Text style={styles.welcomeSub}>Hesabınıza giriş yapın</Text>

        <TouchableOpacity style={styles.demoBtn} onPress={fillDemo}>
          <Text style={styles.demoText}>🖥  Demo Hesabıyla Doldur</Text>
        </TouchableOpacity>

        <Text style={styles.label}>E-POSTA</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholder="avukat@example.com" placeholderTextColor="#5b6172" />

        <Text style={styles.label}>ŞİFRE</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#5b6172" />

        <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85} style={{ marginTop: 20 }}>
          <LinearGradient colors={GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.button, loading && { opacity: 0.6 }]}>
            <Text style={styles.buttonText}>{loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => Linking.openURL('https://www.avukatım.com/register')}>
          <Text style={styles.link}>Hesabınız yok mu? <Text style={styles.linkBold}>Web&apos;den Kayıt Olun</Text></Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>🔒 KVKK uyumlu · Türkiye lokasyonlu sunucular</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: C.bg, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 76, height: 76, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logo: { fontSize: 38 },
  title: { fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: C.textDim, marginTop: 4 },
  form: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 24 },
  welcome: { fontSize: 22, fontWeight: '800', color: C.text },
  welcomeSub: { fontSize: 14, color: C.textMute, marginTop: 4, marginBottom: 20 },
  demoBtn: { backgroundColor: 'rgba(108,99,255,0.1)', borderWidth: 1, borderColor: C.borderPurple, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 20 },
  demoText: { color: '#a78bfa', fontSize: 14, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '700', color: '#9ca3af', marginBottom: 7, marginTop: 14, letterSpacing: 0.3 },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: C.text, backgroundColor: 'rgba(255,255,255,0.05)' },
  button: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', marginTop: 20, color: C.textMute, fontSize: 14 },
  linkBold: { color: '#a78bfa', fontWeight: '700' },
  footer: { textAlign: 'center', marginTop: 28, color: '#374151', fontSize: 12 },
})
