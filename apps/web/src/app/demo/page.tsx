'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ── TİPLER ─────────────────────────────────────────────────────────────────
type ClientT = { id: string; full_name: string; type: 'individual' | 'corporate'; email: string; phone: string; city: string }
type CaseT = { id: string; title: string; case_number: string; clientId: string; court: string; status: 'active' | 'pending' | 'closed'; case_type: string; next_hearing: string }
type DocT = { id: string; name: string; caseTitle: string; source: 'upload' | 'uyap' | 'email'; size: string; date: string; type: 'pdf' | 'excel' | 'image' }
type HearingT = { id: string; caseTitle: string; date: string; time: string; court: string; type: string; uyap: boolean }
type MsgT = { id: string; text: string; dir: 'in' | 'out'; time: string }
type ConvT = { id: string; name: string; channel: 'whatsapp' | 'gmail'; messages: MsgT[] }

const uid = () => Math.random().toString(36).slice(2, 10)
const todayStr = () => new Date().toLocaleDateString('tr-TR')
const nowTime = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

// ── BAŞLANGIÇ VERİSİ ───────────────────────────────────────────────────────
const SEED_CLIENTS: ClientT[] = [
  { id: 'c1', full_name: 'Ahmet Yılmaz', type: 'individual', email: 'ahmet@example.com', phone: '0532 123 45 67', city: 'İstanbul' },
  { id: 'c2', full_name: 'Fatma Kaya', type: 'individual', email: 'fatma@example.com', phone: '0533 123 45 67', city: 'Ankara' },
  { id: 'c3', full_name: 'Aras Holding A.Ş.', type: 'corporate', email: 'info@aras.com.tr', phone: '0212 123 45 67', city: 'İstanbul' },
  { id: 'c4', full_name: 'Kemal Demirci', type: 'individual', email: 'kemal@example.com', phone: '0534 123 45 67', city: 'İzmir' },
]
const SEED_CASES: CaseT[] = [
  { id: 'k1', title: 'Yılmaz - Demir Alacak Davası', case_number: '2024/1547', clientId: 'c1', court: 'İstanbul 5. Asliye Hukuk', status: 'active', case_type: 'Hukuk', next_hearing: '15.07.2025' },
  { id: 'k2', title: 'Kaya Boşanma Davası', case_number: '2024/0892', clientId: 'c2', court: 'Ankara 3. Aile Mahkemesi', status: 'active', case_type: 'Aile', next_hearing: '30.07.2025' },
  { id: 'k3', title: 'Aras Holding İş Uyuşmazlığı', case_number: '2023/3301', clientId: 'c3', court: 'İstanbul İş Mahkemesi', status: 'active', case_type: 'İş', next_hearing: '08.07.2025' },
  { id: 'k4', title: 'Demirci Miras Davası', case_number: '2023/2100', clientId: 'c4', court: 'İstanbul 2. Sulh Hukuk', status: 'pending', case_type: 'Hukuk', next_hearing: '—' },
]
const SEED_DOCS: DocT[] = [
  { id: 'd1', name: 'Dava Dilekçesi - Yılmaz.pdf', caseTitle: 'Yılmaz - Demir Alacak', source: 'upload', size: '245 KB', date: '10.06.2025', type: 'pdf' },
  { id: 'd2', name: 'Tensip Zaptı - 2024_1547.pdf', caseTitle: 'Yılmaz - Demir Alacak', source: 'uyap', size: '128 KB', date: '15.06.2025', type: 'pdf' },
  { id: 'd3', name: 'Nafaka Hesap Tablosu.xlsx', caseTitle: 'Kaya Boşanma', source: 'upload', size: '52 KB', date: '01.07.2025', type: 'excel' },
]
const SEED_CONVS: ConvT[] = [
  { id: 'c1', name: 'Ahmet Yılmaz', channel: 'whatsapp', messages: [
    { id: 'm1', text: 'Duruşma saat kaçta hocam?', dir: 'in', time: '14:23' },
    { id: 'm2', text: 'Saat 10:00, İstanbul 5. Asliye Hukuk Mahkemesi 4. kat', dir: 'out', time: '14:31' },
    { id: 'm3', text: 'Tamam, orada olacağım 🙏', dir: 'in', time: '14:32' },
  ] },
  { id: 'c2', name: 'Fatma Kaya', channel: 'gmail', messages: [
    { id: 'm4', text: 'Belgeleri ilettim, incelemenizi bekliyorum.', dir: 'in', time: 'Dün' },
  ] },
  { id: 'c3', name: 'Aras Holding', channel: 'gmail', messages: [
    { id: 'm5', text: 'Duruşmaya hazırız, ek belgeler ekte.', dir: 'in', time: '2 gün önce' },
  ] },
]

const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', closed: 'bg-gray-100 text-gray-600' }
const STATUS_LABELS: Record<string, string> = { active: 'Aktif', pending: 'Beklemede', closed: 'Kapandı' }

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Panel', icon: '⊞' },
  { id: 'cases', label: 'Davalar', icon: '⚖' },
  { id: 'clients', label: 'Müvekkiller', icon: '👤' },
  { id: 'documents', label: 'Belgeler', icon: '📄' },
  { id: 'calendar', label: 'Takvim', icon: '📅' },
  { id: 'messages', label: 'Mesajlar', icon: '💬' },
  { id: 'uyap', label: 'UYAP', icon: '🏛' },
  { id: 'billing', label: 'Abonelik', icon: '💳' },
  { id: 'settings', label: 'Ayarlar', icon: '⚙' },
]

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'
const labelCls = 'block text-xs font-semibold text-gray-500 mb-1'

export default function DemoPage() {
  const [active, setActive] = useState('dashboard')
  const [clients, setClients] = useState<ClientT[]>(SEED_CLIENTS)
  const [cases, setCases] = useState<CaseT[]>(SEED_CASES)
  const [docs, setDocs] = useState<DocT[]>(SEED_DOCS)
  const [convs, setConvs] = useState<ConvT[]>(SEED_CONVS)
  const [tier, setTier] = useState('pro')

  const [modal, setModal] = useState<null | 'client' | 'case'>(null)
  const [form, setForm] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [selectedConv, setSelectedConv] = useState(0)
  const [msgInput, setMsgInput] = useState('')
  const [uyapSyncing, setUyapSyncing] = useState(false)
  const [uyapLastSync, setUyapLastSync] = useState('2 dakika önce')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }
  function clientName(id: string) { return clients.find(c => c.id === id)?.full_name ?? '—' }

  // ── Müvekkil ekle ──
  function openClientModal() { setForm({ type: 'individual' }); setModal('client') }
  function submitClient() {
    const fullName = form.full_name?.trim()
    if (!fullName) { showToast('⚠ Ad soyad zorunlu'); return }
    setClients(prev => [{ id: uid(), full_name: fullName, type: (form.type as ClientT['type']) || 'individual', email: form.email || '—', phone: form.phone || '—', city: form.city || '—' }, ...prev])
    setModal(null); showToast('✓ Müvekkil eklendi')
  }

  // ── Dava ekle ──
  function openCaseModal() {
    if (!clients.length) { showToast('⚠ Önce müvekkil ekleyin'); return }
    setForm({ status: 'active', case_type: 'Hukuk', clientId: clients[0]!.id }); setModal('case')
  }
  function submitCase() {
    const title = form.title?.trim()
    if (!title) { showToast('⚠ Dava başlığı zorunlu'); return }
    setCases(prev => [{ id: uid(), title, case_number: form.case_number || '—', clientId: form.clientId || clients[0]!.id, court: form.court || '—', status: (form.status as CaseT['status']) || 'active', case_type: form.case_type || 'Hukuk', next_hearing: form.next_hearing ? new Date(form.next_hearing).toLocaleDateString('tr-TR') : '—' }, ...prev])
    setModal(null); showToast('✓ Dava eklendi')
  }

  // ── Belge yükle ──
  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    const newDocs: DocT[] = Array.from(files).map(f => ({
      id: uid(), name: f.name, caseTitle: '—',
      source: 'upload' as const, size: f.size < 1024 * 1024 ? `${Math.max(1, Math.round(f.size / 1024))} KB` : `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      date: todayStr(), type: f.name.endsWith('.pdf') ? 'pdf' : f.name.match(/\.(xlsx?|csv)$/) ? 'excel' : f.name.match(/\.(jpe?g|png)$/i) ? 'image' : 'pdf',
    }))
    setDocs(prev => [...newDocs, ...prev])
    showToast(`✓ ${newDocs.length} belge yüklendi`)
    e.target.value = ''
  }

  // ── Mesaj gönder ──
  function sendMsg() {
    if (!msgInput.trim()) return
    const text = msgInput
    setConvs(prev => prev.map((c, i) => i === selectedConv ? { ...c, messages: [...c.messages, { id: uid(), text, dir: 'out', time: nowTime() }] } : c))
    setMsgInput('')
    // sahte otomatik yanıt
    setTimeout(() => {
      setConvs(prev => prev.map((c, i) => i === selectedConv ? { ...c, messages: [...c.messages, { id: uid(), text: 'Teşekkür ederim, anladım. 👍', dir: 'in', time: nowTime() }] } : c))
    }, 1200)
  }

  // ── UYAP sync ──
  function syncUyap() {
    setUyapSyncing(true)
    setTimeout(() => { setUyapSyncing(false); setUyapLastSync('az önce'); showToast('✓ UYAP senkronizasyonu tamamlandı') }, 1500)
  }

  // ── Arama filtresi ──
  const q = search.trim().toLowerCase()
  const filteredCases = useMemo(() => !q ? cases : cases.filter(c => c.title.toLowerCase().includes(q) || c.case_number.includes(q) || clientName(c.clientId).toLowerCase().includes(q)), [q, cases, clients])
  const filteredClients = useMemo(() => !q ? clients : clients.filter(c => c.full_name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)), [q, clients])

  const upcomingHearings: HearingT[] = useMemo(() => cases.filter(c => c.next_hearing !== '—').map(c => ({ id: c.id, caseTitle: c.title, date: c.next_hearing, time: '10:00', court: c.court, type: c.case_type, uyap: true })).sort((a, b) => a.date.localeCompare(b.date)), [cases])

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Demo Banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-center py-1.5 text-xs font-medium">
        🖥 Demo Modu — Tüm özellikler çalışır (veriler tarayıcıda tutulur, kalıcı değildir).{' '}
        <Link href="/register" className="underline font-bold ml-2">Gerçek Hesap Aç →</Link>
        <Link href="/" className="underline font-bold ml-4">← Ana Sayfa</Link>
      </div>

      {/* Sidebar */}
      <aside className="w-60 bg-indigo-900 text-white flex flex-col shrink-0 pt-8">
        <div className="px-5 py-5 border-b border-indigo-800">
          <div className="text-base font-bold">⚖️ Avukat<span className="text-indigo-300">ım</span></div>
          <div className="text-indigo-300 text-xs mt-0.5 truncate">Demo Hukuk Bürosu</div>
          <span className="inline-block mt-2 text-xs bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded-full capitalize">{tier === 'pro' ? 'Profesyonel' : tier === 'starter' ? 'Başlangıç' : tier === 'enterprise' ? 'Kurumsal' : 'Ücretsiz'}</span>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActive(item.id)} className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors text-left ${active === item.id ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'}`}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-indigo-800">
          <div className="text-xs text-indigo-300 mb-1">Av. Demo Kullanıcı</div>
          <div className="text-xs text-indigo-400">demo@avukatim.com</div>
          <Link href="/login" className="mt-3 block text-xs text-indigo-300 hover:text-white transition">Gerçek Hesapla Giriş →</Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden pt-8">
        {/* TopBar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value && !['cases', 'clients'].includes(active)) setActive('cases') }} placeholder="Dava, müvekkil ara..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => showToast('🔔 3 yeni bildirim')} className="relative p-2 text-gray-500 hover:text-gray-700">
              <span className="text-lg">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">D</div>
              <span className="text-sm text-gray-700 font-medium">Av. Demo</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ── PANEL ── */}
          {active === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Hoş Geldiniz, Av. Demo</h2>
                <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Aktif Davalar', value: cases.filter(c => c.status === 'active').length, icon: '⚖', color: 'bg-blue-50 text-blue-700', go: 'cases' },
                  { label: 'Yaklaşan Duruşma', value: upcomingHearings.length, icon: '📅', color: 'bg-purple-50 text-purple-700', go: 'calendar' },
                  { label: 'Müvekkil', value: clients.length, icon: '👤', color: 'bg-green-50 text-green-700', go: 'clients' },
                  { label: 'Belge', value: docs.length, icon: '📄', color: 'bg-amber-50 text-amber-700', go: 'documents' },
                ].map(s => (
                  <button key={s.label} onClick={() => setActive(s.go)} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition text-left">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${s.color}`}>{s.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Yaklaşan Duruşmalar</h3>
                    <button onClick={() => setActive('calendar')} className="text-indigo-600 text-sm hover:underline">Tümü</button>
                  </div>
                  <div className="space-y-3">
                    {upcomingHearings.slice(0, 4).map(h => (
                      <div key={h.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-center min-w-12">
                          <div className="text-sm font-bold text-indigo-700">{h.date.slice(0, 5)}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{h.caseTitle}</div>
                          <div className="text-xs text-gray-500">{h.court} · {h.time}</div>
                        </div>
                        {h.uyap && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">UYAP</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Son Mesajlar</h3>
                    <button onClick={() => setActive('messages')} className="text-indigo-600 text-sm hover:underline">Tümü</button>
                  </div>
                  <div className="space-y-3">
                    {convs.map((c, i) => {
                      const last = c.messages[c.messages.length - 1]
                      return (
                        <button key={c.id} onClick={() => { setSelectedConv(i); setActive('messages') }} className="w-full flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition text-left">
                          <span className="text-lg">{c.channel === 'whatsapp' ? '💬' : '📧'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{c.name}</div>
                            <div className="text-xs text-gray-500 truncate">{last?.text}</div>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0">{last?.time}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DAVALAR ── */}
          {active === 'cases' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Davalar {q && <span className="text-sm font-normal text-gray-500">— "{search}" için {filteredCases.length} sonuç</span>}</h2>
                <button onClick={openCaseModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Yeni Dava</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Başlık', 'Esas No', 'Müvekkil', 'Mahkeme', 'Durum', 'Duruşma', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCases.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                        <td className="px-4 py-3 text-gray-600">{c.case_number}</td>
                        <td className="px-4 py-3 text-gray-600">{clientName(c.clientId)}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.court}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span></td>
                        <td className="px-4 py-3 text-gray-600">{c.next_hearing}</td>
                        <td className="px-4 py-3"><button onClick={() => setCases(prev => prev.filter(x => x.id !== c.id))} className="text-red-500 hover:text-red-700 text-xs">Sil</button></td>
                      </tr>
                    ))}
                    {!filteredCases.length && <tr><td colSpan={7} className="text-center text-gray-500 py-10">Dava bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MÜVEKKİLLER ── */}
          {active === 'clients' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Müvekkiller {q && <span className="text-sm font-normal text-gray-500">— {filteredClients.length} sonuç</span>}</h2>
                <button onClick={openClientModal} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">+ Yeni Müvekkil</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Ad Soyad', 'Tür', 'E-posta', 'Telefon', 'Şehir', 'Dava', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredClients.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.type === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{c.type === 'individual' ? 'Bireysel' : 'Kurumsal'}</span></td>
                        <td className="px-4 py-3 text-gray-600">{c.email}</td>
                        <td className="px-4 py-3 text-gray-600">{c.phone}</td>
                        <td className="px-4 py-3 text-gray-600">{c.city}</td>
                        <td className="px-4 py-3 text-gray-600">{cases.filter(k => k.clientId === c.id).length}</td>
                        <td className="px-4 py-3"><button onClick={() => setClients(prev => prev.filter(x => x.id !== c.id))} className="text-red-500 hover:text-red-700 text-xs">Sil</button></td>
                      </tr>
                    ))}
                    {!filteredClients.length && <tr><td colSpan={7} className="text-center text-gray-500 py-10">Müvekkil bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── BELGELER ── */}
          {active === 'documents' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Belgeler</h2>
                <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
                  + Belge Yükle
                  <input type="file" multiple onChange={handleUpload} className="hidden" />
                </label>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>{['Belge Adı', 'Kaynak', 'İlgili Dava', 'Boyut', 'Tarih', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {docs.map(d => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><span>{d.type === 'pdf' ? '📄' : d.type === 'excel' ? '📊' : '🖼'}</span><span className="font-medium text-gray-900">{d.name}</span></div></td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.source === 'upload' ? 'bg-blue-100 text-blue-700' : d.source === 'uyap' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>{d.source === 'upload' ? 'Yüklendi' : d.source === 'uyap' ? 'UYAP' : 'E-posta'}</span></td>
                        <td className="px-4 py-3 text-gray-600">{d.caseTitle}</td>
                        <td className="px-4 py-3 text-gray-500">{d.size}</td>
                        <td className="px-4 py-3 text-gray-500">{d.date}</td>
                        <td className="px-4 py-3"><button onClick={() => setDocs(prev => prev.filter(x => x.id !== d.id))} className="text-red-500 hover:text-red-700 text-xs">Sil</button></td>
                      </tr>
                    ))}
                    {!docs.length && <tr><td colSpan={6} className="text-center text-gray-500 py-10">Belge yok. Yukarıdan yükleyin.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAKVİM ── */}
          {active === 'calendar' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-900">Duruşma Takvimi</h2>
              {!upcomingHearings.length ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">📅 Yaklaşan duruşma yok.</div>
              ) : upcomingHearings.map(h => (
                <div key={h.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-indigo-50 px-5 py-3 border-b border-gray-100"><h3 className="font-semibold text-indigo-800 text-sm">{h.date}, {h.time}</h3></div>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="flex-1"><div className="font-medium text-gray-900">{h.caseTitle}</div><div className="text-sm text-gray-500">{h.court}</div></div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{h.type}</span>
                    {h.uyap && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">UYAP</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── MESAJLAR ── */}
          {active === 'messages' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Mesajlar</h2>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex" style={{ height: 520 }}>
                <div className="w-64 border-r border-gray-100 flex flex-col">
                  {convs.map((c, i) => {
                    const last = c.messages[c.messages.length - 1]
                    return (
                      <button key={c.id} onClick={() => setSelectedConv(i)} className={`flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-gray-50 text-left ${selectedConv === i ? 'bg-indigo-50' : ''}`}>
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold shrink-0">{c.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">{c.name} <span className="text-xs">{c.channel === 'whatsapp' ? '💬' : '📧'}</span></div>
                          <div className="text-xs text-gray-500 truncate">{last?.text}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">{convs[selectedConv]?.name[0]}</div>
                    <div><div className="font-medium text-gray-900 text-sm">{convs[selectedConv]?.name}</div><div className="text-xs text-gray-500">{convs[selectedConv]?.channel === 'whatsapp' ? 'WhatsApp' : 'Gmail'} · Çevrimiçi</div></div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {convs[selectedConv]?.messages.map(m => (
                      <div key={m.id} className={`flex ${m.dir === 'out' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm rounded-2xl px-4 py-2 ${m.dir === 'out' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                          <p className="text-sm">{m.text}</p>
                          <p className={`text-xs mt-1 ${m.dir === 'out' ? 'text-indigo-200' : 'text-gray-400'}`}>{m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <input value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMsg()} className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Mesaj yazın..." />
                      <button onClick={sendMsg} className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition shrink-0">→</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── UYAP ── */}
          {active === 'uyap' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">UYAP Entegrasyonu</h2>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Bağlı (Demo)</span>
                  <button onClick={syncUyap} disabled={uyapSyncing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60">{uyapSyncing ? '⏳ Senkronize ediliyor...' : '🔄 Şimdi Senkronize Et'}</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[{ label: 'Son Sync', value: uyapLastSync, icon: '🕐' }, { label: 'Senkronize Dava', value: String(cases.length), icon: '⚖' }, { label: 'Duruşma', value: String(upcomingHearings.length), icon: '📅' }].map(s => (
                  <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"><span className="text-2xl">{s.icon}</span><div><div className="text-xl font-bold text-gray-900">{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div></div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50"><h3 className="font-semibold text-gray-900 text-sm">UYAP'tan Senkronize Davalar</h3></div>
                <div className="divide-y divide-gray-50">
                  {cases.map(c => (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
                      <div className="text-indigo-600 font-mono text-sm font-semibold w-28 shrink-0">{c.case_number}</div>
                      <div className="flex-1 min-w-0"><div className="font-medium text-gray-900">{c.title}</div><div className="text-sm text-gray-500">{c.court}</div></div>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{STATUS_LABELS[c.status]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ABONELİK ── */}
          {active === 'billing' && (
            <div className="space-y-6">
              <div><h2 className="text-2xl font-bold text-gray-900">Abonelik ve Ödeme</h2><p className="text-gray-500 text-sm mt-1">Mevcut Plan: <span className="font-semibold text-indigo-700 capitalize">{tier === 'pro' ? 'Profesyonel' : tier === 'starter' ? 'Başlangıç' : tier === 'enterprise' ? 'Kurumsal' : 'Ücretsiz'}</span></p></div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { id: 'free', name: 'Ücretsiz', price: '₺0', features: ['1 Avukat', '10 Dava', '100 Belge'] },
                  { id: 'starter', name: 'Başlangıç', price: '₺299/ay', features: ['3 Avukat', '100 Dava', 'UYAP Okuma'] },
                  { id: 'pro', name: 'Profesyonel', price: '₺599/ay', features: ['10 Avukat', 'Sınırsız Dava', 'UYAP Tam', '1000 WhatsApp'] },
                  { id: 'enterprise', name: 'Kurumsal', price: 'Teklif', features: ['Sınırsız', 'Özel SLA', '7/24 Destek'] },
                ].map(p => (
                  <div key={p.id} className={`bg-white rounded-xl border-2 p-5 shadow-sm ${tier === p.id ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'}`}>
                    {tier === p.id && <div className="text-xs font-semibold text-indigo-600 mb-1">✓ Mevcut Plan</div>}
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-2xl font-bold text-indigo-700 mt-1 mb-3">{p.price}</div>
                    <ul className="space-y-1.5 mb-4">{p.features.map(f => <li key={f} className="text-xs text-gray-600 flex gap-1.5"><span className="text-indigo-500">✓</span>{f}</li>)}</ul>
                    {tier !== p.id && <button onClick={() => { setTier(p.id); showToast(`✓ ${p.name} planına geçildi`) }} className="w-full py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-semibold hover:bg-indigo-100 transition">{p.id === 'enterprise' ? 'Teklif İste' : 'Bu Plana Geç'}</button>}
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Ödeme Yöntemi</h3>
                <div className="flex gap-3 flex-wrap">
                  <div className="px-4 py-2 rounded-lg border-2 border-indigo-300 bg-indigo-50 text-sm font-medium text-indigo-700">🇹🇷 PayTR (Türkiye — TRY)</div>
                  <div className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500">🌍 Stripe (Global)</div>
                </div>
              </div>
            </div>
          )}

          {/* ── AYARLAR ── */}
          {active === 'settings' && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-900">Ayarlar</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-2xl">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Profil Bilgileri</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[['Ad Soyad', 'Av. Demo Kullanıcı'], ['E-posta', 'demo@avukatim.com'], ['Telefon', '0500 123 45 67'], ['Baro Sicil No', 'DEMO-001']].map(([l, v]) => (
                      <div key={l}><label className={labelCls}>{l}</label><input defaultValue={v} className={inputCls} /></div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Bildirimler</h3>
                  <div className="space-y-2">
                    {['Duruşma hatırlatmaları', 'UYAP güncellemeleri', 'Yeni mesaj bildirimleri'].map(n => (
                      <label key={n} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 cursor-pointer">
                        <span className="text-sm text-gray-700">{n}</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-600" />
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={() => showToast('✓ Ayarlar kaydedildi')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition">Kaydet</button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL ── */}
      {modal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">{modal === 'client' ? 'Yeni Müvekkil' : 'Yeni Dava'}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {modal === 'client' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className={labelCls}>AD SOYAD / ÜNVAN *</label><input autoFocus value={form.full_name ?? ''} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className={inputCls} placeholder="Ahmet Yılmaz" /></div>
                  <div><label className={labelCls}>TÜR</label><select value={form.type ?? 'individual'} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls}><option value="individual">Bireysel</option><option value="corporate">Kurumsal</option></select></div>
                  <div><label className={labelCls}>ŞEHİR</label><input value={form.city ?? ''} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputCls} placeholder="İstanbul" /></div>
                  <div><label className={labelCls}>TELEFON</label><input value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} placeholder="05xx..." /></div>
                  <div><label className={labelCls}>E-POSTA</label><input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="ornek@email.com" /></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className={labelCls}>DAVA BAŞLIĞI *</label><input autoFocus value={form.title ?? ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="Yılmaz - Demir Alacak Davası" /></div>
                  <div className="col-span-2"><label className={labelCls}>MÜVEKKİL *</label><select value={form.clientId ?? ''} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className={inputCls}>{clients.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}</select></div>
                  <div><label className={labelCls}>ESAS NO</label><input value={form.case_number ?? ''} onChange={e => setForm(f => ({ ...f, case_number: e.target.value }))} className={inputCls} placeholder="2024/1547" /></div>
                  <div><label className={labelCls}>DAVA TÜRÜ</label><select value={form.case_type ?? 'Hukuk'} onChange={e => setForm(f => ({ ...f, case_type: e.target.value }))} className={inputCls}>{['Hukuk', 'Ceza', 'Ticaret', 'Aile', 'İş', 'İdari'].map(t => <option key={t}>{t}</option>)}</select></div>
                  <div className="col-span-2"><label className={labelCls}>MAHKEME</label><input value={form.court ?? ''} onChange={e => setForm(f => ({ ...f, court: e.target.value }))} className={inputCls} placeholder="İstanbul 5. Asliye Hukuk" /></div>
                  <div><label className={labelCls}>DURUM</label><select value={form.status ?? 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}><option value="active">Aktif</option><option value="pending">Beklemede</option><option value="closed">Kapandı</option></select></div>
                  <div><label className={labelCls}>SONRAKİ DURUŞMA</label><input type="date" value={form.next_hearing ?? ''} onChange={e => setForm(f => ({ ...f, next_hearing: e.target.value }))} className={inputCls} /></div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t">
              <button onClick={modal === 'client' ? submitClient : submitCase} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition">Kaydet</button>
              <button onClick={() => setModal(null)} className="text-gray-500 hover:text-gray-700 text-sm">İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[110] bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-[fadeIn_0.2s]">
          {toast}
        </div>
      )}
    </div>
  )
}
