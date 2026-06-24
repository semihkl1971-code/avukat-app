'use client'

// ════════════════════════════════════════════════════════════════════════════
//  Avukatım — Landing animasyon bileşenleri
//  Marka kimliği: koyu tema · gradient #6c63ff → #a855f7 → #22d3ee
//  Saf CSS/SVG + Web Animations API. Bağımlılık yok. prefers-reduced-motion uyumlu.
//  Sınıf adları "la-"/benzersiz; page.tsx inline-style'larıyla çakışmaz.
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react'

/* ── Scroll-reveal gözlemcisi (sayfada bir kez render edilir) ── */
export function LandingReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.la-reveal, .la-stagger')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.18 }
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
  return null
}

/* ── Hero arka plan: aurora + ışık ızgarası + yüzen parçacıklar ── */
export function HeroBackdrop() {
  const ref = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const box = ref.current
    if (!box) return
    const made: HTMLElement[] = []
    for (let i = 0; i < 28; i++) {
      const p = document.createElement('span')
      p.className = 'la-particle'
      const dur = 9 + Math.random() * 12
      p.style.left = Math.random() * 100 + '%'
      p.style.bottom = '-10px'
      p.style.animationDuration = dur + 's'
      p.style.animationDelay = -Math.random() * dur + 's'
      const s = 2 + Math.random() * 3
      p.style.width = p.style.height = s + 'px'
      if (i % 3 === 0) { p.style.background = '#a855f7'; p.style.boxShadow = '0 0 8px 1px rgba(168,85,247,.8)' }
      if (i % 5 === 0) { p.style.background = '#22d3ee'; p.style.boxShadow = '0 0 8px 1px rgba(34,211,238,.8)' }
      box.appendChild(p); made.push(p)
    }
    return () => made.forEach((m) => m.remove())
  }, [])

  // 3D parallax: katmanlar fareyle farklı derinliklerde kayar
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = rootRef.current
    if (!root) return
    const lawyers = root.querySelector<HTMLElement>('.la-lawyers')
    const aurora = root.querySelector<HTMLElement>('.la-aurora')
    const grid = root.querySelector<HTMLElement>('.la-grid')
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (lawyers) lawyers.style.transform = `scale(1.1) translate3d(${x * -16}px, ${y * -12}px, 0)`
        if (aurora) aurora.style.transform = `translate3d(${x * 26}px, ${y * 20}px, 0)`
        if (grid) grid.style.transform = `translate3d(${x * 12}px, ${y * 9}px, 0)`
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div className="la-backdrop" aria-hidden ref={rootRef}>
      <div className="la-lawyers">
        {LAWYER_PHOTOS.map((u, i) => (
          <div key={i} style={{ backgroundImage: `url(${u})` }} />
        ))}
      </div>
      <div className="la-lawyers-ov" />
      <div className="la-aurora"><span className="la-blob b1" /><span className="la-blob b2" /><span className="la-blob b3" /></div>
      <div className="la-grid" />
      <div className="la-particles" ref={ref} />
    </div>
  )
}

// Takım elbiseli / cüppeli gerçek avukat görselleri (Unsplash) — hero arka planı
const LAWYER_PHOTOS = [
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=520&q=80&auto=format&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=520&q=80&auto=format&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=520&q=80&auto=format&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=520&q=80&auto=format&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=520&q=80&auto=format&fit=crop&crop=faces',
]

/* ── Üst kutucuklar: hover'da içi açılır ── */
export function QuickFeatures() {
  const gridRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const grid = gridRef.current
    if (!grid) return
    const els = Array.from(grid.querySelectorAll<HTMLElement>('.la-qf'))
    const cleanups: Array<() => void> = []
    els.forEach((el) => {
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        el.style.transform = `perspective(800px) rotateX(${(-py * 11).toFixed(2)}deg) rotateY(${(px * 13).toFixed(2)}deg) translateY(-8px) scale(1.03)`
        el.style.setProperty('--gx', `${(px * 100 + 50).toFixed(1)}%`)
        el.style.setProperty('--gy', `${(py * 100 + 50).toFixed(1)}%`)
      }
      const onLeave = () => { el.style.transform = '' }
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      cleanups.push(() => { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave) })
    })
    return () => cleanups.forEach((c) => c())
  }, [])

  const cards = [
    { ic: '⚖️', t: 'UYAP Entegrasyonu', d: '30 dakikada bir otomatik senkronizasyon, duruşma hatırlatmaları, belge indirme ve safahat takibi.' },
    { ic: '💬', t: 'WhatsApp & Gmail', d: 'Tüm müvekkil yazışmaları tek gelen kutusunda; mesajlar otomatik olarak ilgili davaya bağlanır.' },
    { ic: '🧠', t: 'Yapay Zeka Asistan', d: 'Türk hukuku eğitimli AI ile dilekçe taslağı, içtihat araması ve strateji önerileri saniyeler içinde.' },
    { ic: '📱', t: 'Mobil & Masaüstü', d: 'iOS, Android, Windows, macOS ve Linux — davalarınız her cihazda, her an yanınızda.' },
  ]
  return (
    <section className="la-block la-qf-sec">
      <div className="la-wrap">
        <div className="la-center la-reveal" style={{ marginBottom: 26 }}>
          <div className="la-kicker">TEK PLATFORM</div>
          <h2>Bir bakışta <span className="la-grad">Avukatım</span></h2>
          <p className="la-lead">Kutuların üstüne gelin — detaylar açılsın.</p>
        </div>
        <div className="la-qf-grid la-reveal d1" ref={gridRef}>
          {cards.map((c) => (
            <div className="la-qf" key={c.t}>
              <span className="la-qf-glow" />
              <span className="la-qf-shine" />
              <div className="la-qf-body">
                <span className="la-qf-ic">{c.ic}</span>
                <div className="la-qf-t">{c.t}</div>
                <div className="la-qf-d">{c.d}</div>
                <div className="la-qf-cta">Keşfet →</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Dünya: dönen gerçek Dünya + yörünge + şehir pinleri ── */
const EARTH_MAP = (
  <svg viewBox="0 0 360 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <g fill="#46b85f">
      <path d="M38 32 Q70 20 98 34 Q114 44 105 57 Q114 63 101 71 L86 74 Q79 90 70 78 Q53 74 51 60 Q39 56 37 45 Q35 35 38 32 Z" />
      <path d="M118 18 Q140 13 145 27 Q141 39 127 39 Q115 33 118 25 Z" />
      <path d="M103 95 Q121 89 123 106 Q127 125 112 143 Q101 156 97 139 Q93 120 98 107 Q98 99 103 95 Z" />
      <path d="M168 33 Q192 28 198 41 Q191 52 178 52 Q166 50 165 43 Q165 37 168 33 Z" />
      <path d="M175 63 Q201 56 209 76 Q214 97 199 117 Q188 132 182 117 Q173 98 173 82 Q171 69 175 63 Z" />
      <path d="M198 29 Q251 20 302 39 Q319 50 301 64 Q281 75 257 70 Q231 77 214 65 Q199 56 197 44 Q197 33 198 29 Z" />
      <path d="M230 69 Q245 71 242 87 Q235 98 229 87 Q226 76 230 69 Z" />
      <path d="M285 77 Q301 75 305 86 Q298 95 288 90 Q281 83 285 77 Z" />
      <path d="M297 111 Q325 105 333 122 Q329 139 308 139 Q293 133 293 122 Q293 113 297 111 Z" />
    </g>
    <path d="M0 169 H360 V180 H0 Z" fill="#dceefb" opacity=".5" />
  </svg>
)

export function GlobeSection() {
  return (
    <section className="la-block la-globe-sec" id="dunya">
      <div className="la-wrap la-globe-stage">
        <div className="la-reveal">
          <div className="la-globe-wrap">
            <div className="la-earth-atmo" />
            <div className="la-orbit-tilt o1"><div className="la-orbit"><span className="la-sat" /></div></div>
            <div className="la-orbit-tilt o2"><div className="la-orbit"><span className="la-sat" /></div></div>
            <div className="la-earth">
              <div className="la-earth-surface">{EARTH_MAP}{EARTH_MAP}</div>
              <div className="la-earth-clouds" />
              <div className="la-earth-shade" />
            </div>
            <span className="la-pin p1" /><span className="la-pin p2" /><span className="la-pin p3" /><span className="la-pin p4" />
          </div>
        </div>
        <div className="la-reveal d1">
          <div className="la-kicker">DÜNYA ÇAPINDA ERİŞİM</div>
          <h2>Davalarınız <span className="la-grad">her yerde</span><br />yanınızda</h2>
          <p className="la-lead">Bulut altyapısı sayesinde dava dosyalarınıza dünyanın neresinden olursa olsun saniyeler içinde ulaşın. Türkiye lokasyonlu sunucular, global erişim.</p>
          <div className="la-gstats">
            <div className="la-gstat"><span className="la-gic">🌍</span><div><div className="la-gv la-grad">7/24 Erişim</div><div className="la-gl">Adliyeden, evden, tatilden — dosyalarınız her an açık</div></div></div>
            <div className="la-gstat"><span className="la-gic">⚡</span><div><div className="la-gv la-grad">&lt;100ms</div><div className="la-gl">Şimşek hızı senkron: bir değişiklik anında tüm cihazlarda</div></div></div>
            <div className="la-gstat"><span className="la-gic">🔒</span><div><div className="la-gv la-grad">AES-256</div><div className="la-gl">Banka düzeyinde şifreleme, KVKK uyumlu yerli sunucu</div></div></div>
            <div className="la-gstat"><span className="la-gic">☁️</span><div><div className="la-gv la-grad">%99,9 SLA</div><div className="la-gl">Otomatik yedekleme ile veri kaybı yok, her zaman çevrimiçi</div></div></div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Adliye koridoru / sütunlu salon (Unsplash) — yürüyen insanların arka planı
const CORRIDOR_IMG = 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1400&q=80&auto=format&fit=crop'

/* ── Hareket eden insanlar: gerçek koridorda yürüyen insanlar + avatar şeridi ── */
export function PeopleSection() {
  const crowd = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const box = crowd.current
    if (!box) return
    // Takım elbiseli insan silueti (baş + ceket gövde + bacaklar + yer gölgesi)
    const fig = (c: string, rim: string) => `<svg width="64" height="140" viewBox="0 0 64 140"><ellipse cx="32" cy="135" rx="19" ry="5" fill="rgba(0,0,0,.5)"/><g fill="${c}" stroke="${rim}" stroke-width="1"><circle cx="32" cy="17" r="11.5"/><path d="M14 44 Q32 30 50 44 L47 96 Q32 104 17 96 Z"/><rect x="18" y="92" width="11" height="40" rx="5"/><rect x="35" y="92" width="11" height="40" rx="5"/></g></svg>`
    const cfg = [
      { c: '#0c0c16', rim: 'rgba(120,130,160,.18)', scale: 0.62, y: '30%', dur: 21, delay: 0, o: 0.5, blur: 1.6 },
      { c: '#12121f', rim: 'rgba(140,150,180,.2)', scale: 0.8, y: '22%', dur: 16, delay: -4, o: 0.7, blur: 0.6 },
      { c: '#191926', rim: 'rgba(165,175,205,.26)', scale: 1.08, y: '11%', dur: 12, delay: -7, o: 0.96, blur: 0 },
      { c: '#101019', rim: 'rgba(130,140,170,.18)', scale: 0.72, y: '26%', dur: 18, delay: -10, o: 0.6, blur: 1 },
      { c: '#16161f', rim: 'rgba(150,160,190,.22)', scale: 0.92, y: '16%', dur: 14, delay: -5, o: 0.85, blur: 0.3 },
      { c: '#1b1b28', rim: 'rgba(175,185,215,.26)', scale: 1.0, y: '13%', dur: 13, delay: -9, o: 0.9, blur: 0 },
    ]
    const made: HTMLElement[] = []
    cfg.forEach((k) => {
      const w = document.createElement('div')
      w.className = 'la-walk'
      w.innerHTML = `<div class="la-walker" style="transform:scale(${k.scale})">${fig(k.c, k.rim)}</div>`
      w.style.bottom = k.y; w.style.opacity = String(k.o); w.style.filter = k.blur ? `blur(${k.blur}px)` : ''
      if (reduce) { w.style.left = Math.random() * 80 + '%' }
      else {
        w.style.left = '-80px'
        w.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(calc(100vw + 140px))' }],
          { duration: k.dur * 1000, iterations: Infinity, delay: k.delay * 1000, easing: 'linear' }
        )
      }
      box.appendChild(w); made.push(w)
    })
    return () => made.forEach((m) => m.remove())
  }, [])

  const lawyers = [
    ['SA', 'Av. Selin Arslan', 'İstanbul Barosu'], ['MY', 'Av. Mert Yıldız', 'Ankara Barosu'],
    ['ZK', 'Av. Zeynep Kaya', 'İzmir Barosu'], ['EB', 'Av. Emre Bal', 'Bursa Barosu'],
    ['NÇ', 'Av. Nur Çelik', 'Antalya Barosu'], ['KD', 'Av. Kaan Demir', 'Konya Barosu'],
    ['GA', 'Av. Gül Aydın', 'Adana Barosu'], ['OT', 'Av. Onur Tan', 'Gaziantep Barosu'],
  ]
  return (
    <section className="la-block la-people-sec" id="insanlar">
      <div className="la-wrap la-center">
        <div className="la-reveal">
          <div className="la-kicker">BÜYÜYEN TOPLULUK</div>
          <h2>Binlerce avukat <span className="la-grad">hareket halinde</span></h2>
          <p className="la-lead">Adliye koridorlarından bürolara — meslektaşlarınız işlerini Avukatım ile yönetiyor.</p>
        </div>
        <div className="la-scene la-reveal d1">
          <video className="la-scene-video" src="/videos/adliye-koridoru.mp4" autoPlay muted loop playsInline preload="metadata" />
          <div className="la-scene-ov" />
        </div>
        <div className="la-ribbon la-reveal d2">
          <div className="la-ribbon-track">
            {[...lawyers, ...lawyers].map((d, i) => (
              <div className="la-chip" key={i}>
                <span className="la-ava">{d[0]}</span>
                <span><span className="la-nm">{d[1]}</span><br /><span className="la-ct">{d[2]}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Duruşma salonu: tokmak + terazi + ışık huzmesi ── */
export function CourtroomSection() {
  return (
    <section className="la-block la-court-sec" id="salon">
      <div className="la-wrap la-center">
        <div className="la-reveal">
          <div className="la-kicker">DURUŞMAYA HAZIR</div>
          <h2>Duruşma salonuna <span className="la-grad">tam donanımlı</span> girin</h2>
          <p className="la-lead">Tüm safahat, deliller ve dilekçeler tek dokunuşla elinizin altında. Hâkim karşısında hiçbir detayı kaçırmayın.</p>
        </div>
        <div className="la-court-wrap la-reveal d1">
          <div className="la-court-frame">
            <video className="la-court-video" src="/videos/durusma-salonu.mp4" autoPlay muted loop playsInline preload="metadata" />
            <div className="la-court-tint" />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Özellik görselleri: canlı animasyonlu mockup'lar ── */
const WA_ICON = <svg width="16" height="16" viewBox="0 0 32 32" fill="#fff"><path d="M16 3C9 3 3.5 8.5 3.5 15.5c0 2.4.7 4.6 1.9 6.5L4 29l7.2-1.9c1.8 1 3.8 1.5 5.8 1.5 7 0 12.5-5.5 12.5-12.5S23 3 16 3z" /></svg>
const GM_ICON = <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#EA4335" d="M4 4h16a2 2 0 0 1 2 2v.4L12 13 2 6.4V6a2 2 0 0 1 2-2z" /><path fill="#34A853" d="M2 8.3l10 6.5 10-6.5V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" /></svg>

export function FeatureVisual({ kind }: { kind: 'uyap' | 'inbox' | 'dash' }) {
  if (kind === 'inbox') {
    return (
      <div className="la-fv">
        <div className="la-fv-head"><div className="la-fv-title">📥 Birleşik Gelen Kutusu</div><span className="la-fv-new">3 yeni</span></div>
        <div className="la-fv-chip-row">
          <span className="la-fv-chip"><i style={{ background: '#25d366' }}>{WA_ICON}</i> WhatsApp</span>
          <span className="la-fv-chip"><i style={{ background: '#fff' }}>{GM_ICON}</i> Gmail</span>
        </div>
        <div className="la-fv-msg"><span className="la-fv-src" style={{ background: '#25d366' }}>{WA_ICON}</span><div className="la-fv-mb"><div className="la-fv-mr"><b>Ahmet Yılmaz</b><span>09:24</span></div><p>Duruşma tarihi kesinleşti mi avukat bey?</p></div></div>
        <div className="la-fv-msg"><span className="la-fv-src" style={{ background: '#fff' }}>{GM_ICON}</span><div className="la-fv-mb"><div className="la-fv-mr"><b>İcra Müdürlüğü</b><span>08:51</span></div><p>2026/1487 E. dosyasına ödeme bildirimi…</p></div></div>
        <div className="la-fv-msg"><span className="la-fv-src" style={{ background: '#25d366' }}>{WA_ICON}</span><div className="la-fv-mb"><div className="la-fv-mr"><b>Elif Kaya</b><span>08:30</span></div><p>Belgeleri ilettim, teşekkürler 🙏</p></div></div>
        <div className="la-fv-typing"><i /><i /><i /><span>Müvekkil yazıyor…</span></div>
      </div>
    )
  }
  if (kind === 'dash') {
    const bars = ['58%', '74%', '46%', '88%', '64%', '92%']
    return (
      <div className="la-fv">
        <div className="la-fv-head"><div className="la-fv-title">📊 Büro Paneli</div><span className="la-fv-ava">SK</span></div>
        <div className="la-fv-stat-row">
          <div className="la-fv-stat"><b className="la-grad">128</b><small>Aktif Dava</small></div>
          <div className="la-fv-stat"><b className="la-grad">₺240K</b><small>Bu Ay Tahsilat</small></div>
        </div>
        <div className="la-fv-chart">
          {bars.map((h, i) => (
            <span key={i} className="la-fv-bar" style={{ height: h, animationDelay: `${i * 0.22}s` }} />
          ))}
        </div>
        <div className="la-fv-case"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63ff', flexShrink: 0 }} /><div className="la-fv-cinfo"><b>Kaya İnşaat — Alacak</b><small>2026/1487 E. · Aktif</small></div></div>
        <div className="la-fv-case"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', flexShrink: 0 }} /><div className="la-fv-cinfo"><b>Çelik — Tazminat</b><small>2025/7741 E. · Kapandı</small></div></div>
      </div>
    )
  }
  // uyap
  return (
    <div className="la-fv">
      <div className="la-fv-head">
        <div className="la-fv-title"><span className="la-fv-sync"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" /></svg></span> UYAP Senkronizasyon</div>
        <span className="la-fv-badge">● Bağlı</span>
      </div>
      <div className="la-fv-progress"><i /></div>
      <div className="la-fv-sub">Son senkron: az önce · 30 dk’da bir otomatik</div>
      <div className="la-fv-case"><span className="la-fv-check">✓</span><div className="la-fv-cinfo"><b>2026/1487 E. — Alacak</b><small>Duruşma 14.07.2026 · İstanbul 5. ATM</small></div></div>
      <div className="la-fv-case"><span className="la-fv-check">✓</span><div className="la-fv-cinfo"><b>2026/0932 E. — İş Davası</b><small>Bilirkişi raporu geldi · Beyan süresi 2 gün</small></div></div>
      <div className="la-fv-case"><span className="la-fv-check">✓</span><div className="la-fv-cinfo"><b>2025/7741 E. — Tazminat</b><small>Karar kesinleşti · Safahat güncellendi</small></div></div>
    </div>
  )
}

/* ── Gerçekçi 3D telefon mockup (mobil bölümü) ── */
export function PhoneMockup() {
  return (
    <div className="la-reveal" style={{ perspective: 1200 }}>
      <div className="la-phone">
        <span className="la-phone-bl" /><span className="la-phone-br" />
        <div className="la-screen">
          <span className="la-island" />
          <div className="la-phstatus">
            <span>9:41</span>
            <span className="ic">
              <svg width="17" height="11" viewBox="0 0 18 12" fill="#e8eaf0"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="7" rx="1" /><rect x="10" y="2.5" width="3" height="9.5" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
              <svg width="15" height="12" viewBox="0 0 16 12" fill="#e8eaf0"><path d="M8 11.5l2-2.4a3 3 0 0 0-4 0zM3 5.6l1.6 1.9a6 6 0 0 1 6.8 0L13 5.6a8.5 8.5 0 0 0-10 0z" /></svg>
              <svg width="23" height="12" viewBox="0 0 24 12"><rect x="1" y="1" width="20" height="10" rx="2.5" fill="none" stroke="#e8eaf0" strokeWidth="1.2" /><rect x="2.6" y="2.6" width="15" height="6.8" rx="1.4" fill="#e8eaf0" /><rect x="22" y="3.6" width="1.6" height="4.8" rx="1" fill="#e8eaf0" /></svg>
            </span>
          </div>
          <div className="la-phapp">
            <div className="la-phtop">
              <div className="la-phhi">Merhaba, Av. Semih 👋<small>Bugün 2 duruşmanız var</small></div>
              <div className="la-phava">SK</div>
            </div>
            <div className="la-phstats">
              <div className="la-phst"><b className="la-grad">24</b><small>Aktif Dava</small></div>
              <div className="la-phst"><b className="la-grad">3</b><small>Bu Hafta Duruşma</small></div>
            </div>
            <div className="la-phhl">
              <div className="lbl">⏰ YAKLAŞAN DURUŞMA</div>
              <div className="ttl">Yılmaz / Demir — Boşanma</div>
              <div className="meta">Bugün 14:00 · İstanbul 5. Aile Mah.</div>
            </div>
            <div className="la-phsec">SON DAVALAR</div>
            <div className="la-phrow"><span className="dot" style={{ background: '#6c63ff' }} /><div className="info"><b>Kaya İnşaat — Alacak</b><small>2026/1487 E. · Aktif</small></div></div>
            <div className="la-phrow"><span className="dot" style={{ background: '#fbbf24' }} /><div className="info"><b>Arslan — İş Davası</b><small>2026/0932 E. · Beklemede</small></div></div>
            <div className="la-phrow"><span className="dot" style={{ background: '#34d399' }} /><div className="info"><b>Çelik — Tazminat</b><small>2025/7741 E. · Kapandı</small></div></div>
          </div>
          <div className="la-phtabs">
            <span className="la-phtab on">🏠</span>
            <span className="la-phtab">📁</span>
            <span className="la-phtab">📅</span>
            <span className="la-phtab">💬<span className="la-phntf" /></span>
            <span className="la-phtab">🧠</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Tüm animasyon CSS'i (sayfada bir kez) ── */
export function LandingStyles() {
  return (
    <style>{`
    .la-kicker { font-size:12px; font-weight:700; letter-spacing:1.5px; color:#6c63ff; margin-bottom:12px; }
    .la-grad { background:linear-gradient(120deg,#6c63ff,#a855f7,#22d3ee,#6c63ff); background-size:300% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; color:transparent; animation: la-shine 8s linear infinite; }
    section.la-block { position:relative; padding:clamp(70px,10vw,120px) 24px; overflow:hidden; border-top:1px solid rgba(255,255,255,.05); }
    .la-wrap { max-width:1100px; margin:0 auto; }
    .la-center { text-align:center; }
    section.la-block h2 { font-size:clamp(28px,4.4vw,46px); font-weight:800; letter-spacing:-1.2px; line-height:1.12; margin:0 0 16px; color:#f1f5f9; }
    section.la-block p.la-lead { color:#aeb6c6; font-size:clamp(16px,1.9vw,19px); line-height:1.78; letter-spacing:.1px; max-width:740px; margin:0; }
    .la-center p.la-lead { margin:0 auto; }
    .la-reveal { opacity:0; transform:translateY(40px); transition:opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); }
    .la-reveal.in { opacity:1; transform:none; }
    .la-reveal.d1 { transition-delay:.12s; } .la-reveal.d2 { transition-delay:.24s; }
    /* Sıralı (stagger) metin animasyonu — başlık + açıklama + maddeler tek tek belirir */
    .la-stagger > * { opacity:0; transform:translateY(20px); transition:opacity .7s cubic-bezier(.2,.7,.2,1), transform .7s cubic-bezier(.2,.7,.2,1); }
    .la-stagger.in > * { opacity:1; transform:none; }
    .la-stagger.in > *:nth-child(1){ transition-delay:.06s; } .la-stagger.in > *:nth-child(2){ transition-delay:.16s; } .la-stagger.in > *:nth-child(3){ transition-delay:.26s; } .la-stagger.in > *:nth-child(4){ transition-delay:.36s; } .la-stagger.in > *:nth-child(5){ transition-delay:.46s; } .la-stagger.in > *:nth-child(6){ transition-delay:.56s; }

    /* Hero arka plan */
    .la-backdrop { position:absolute; top:0; height:100%; left:calc(50% - 50vw); width:100vw; overflow:hidden; z-index:0; pointer-events:none; }
    .la-lawyers { position:absolute; inset:0; display:flex; opacity:.34; }
    .la-lawyers > div { flex:1; background-size:cover; background-position:center 18%; filter:grayscale(.25) contrast(1.05) brightness(.9); }
    .la-lawyers-ov { position:absolute; inset:0; background:
      linear-gradient(180deg, rgba(7,9,15,.55) 0%, rgba(7,9,15,.32) 38%, rgba(7,9,15,.85) 100%),
      radial-gradient(ellipse 62% 56% at 50% 44%, rgba(7,9,15,.9) 0%, rgba(7,9,15,.45) 58%, rgba(7,9,15,0) 100%); }
    .la-lawyers, .la-aurora, .la-grid { transition:transform .2s ease-out; will-change:transform; }
    .la-lawyers { transform:scale(1.1); }
    .la-aurora { position:absolute; inset:-20% -10%; filter:blur(70px); }
    .la-blob { position:absolute; border-radius:50%; opacity:.42; mix-blend-mode:screen; }
    .la-blob.b1 { width:46vw; height:46vw; left:8%; top:2%; background:radial-gradient(circle at 30% 30%, #6c63ff, transparent 70%); animation: la-drift1 18s ease-in-out infinite; }
    .la-blob.b2 { width:40vw; height:40vw; right:6%; top:6%; background:radial-gradient(circle at 60% 40%, #a855f7, transparent 70%); animation: la-drift2 22s ease-in-out infinite; }
    .la-blob.b3 { width:34vw; height:34vw; left:32%; bottom:-8%; background:radial-gradient(circle at 50% 50%, #22d3ee, transparent 70%); opacity:.28; animation: la-drift3 26s ease-in-out infinite; }
    .la-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(108,99,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,.06) 1px, transparent 1px); background-size:54px 54px; -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 75%); mask-image:radial-gradient(ellipse 70% 60% at 50% 40%, #000 30%, transparent 75%); }
    .la-particles { position:absolute; inset:0; }
    .la-particle { position:absolute; border-radius:50%; background:#6c63ff; box-shadow:0 0 8px 1px rgba(108,99,255,.8); animation: la-float linear infinite; opacity:0; }

    /* Üst kutucuklar (3D tilt) */
    .la-qf-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; perspective:1100px; }
    .la-qf { position:relative; border-radius:16px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.03); padding:22px; overflow:hidden; transform-style:preserve-3d; will-change:transform; transition:transform .16s ease-out, border-color .3s, box-shadow .3s; }
    .la-qf-glow { position:absolute; inset:0; background:linear-gradient(160deg,rgba(108,99,255,.18),rgba(168,85,247,.08)); opacity:0; transition:opacity .35s; pointer-events:none; }
    .la-qf-shine { position:absolute; inset:0; pointer-events:none; opacity:0; transition:opacity .3s; background:radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,.22), transparent 42%); }
    .la-qf:hover .la-qf-shine { opacity:1; }
    .la-qf-body { position:relative; z-index:1; }
    .la-qf-ic { font-size:30px; display:inline-block; transition:transform .35s; }
    .la-qf-t { font-weight:700; font-size:15.5px; margin-top:12px; color:#e8eaf0; }
    .la-qf-d { font-size:13px; color:#8892a4; line-height:1.6; max-height:0; opacity:0; overflow:hidden; transition:max-height .45s ease, opacity .35s ease, margin-top .45s; }
    .la-qf-cta { font-size:12.5px; font-weight:600; color:#a89fff; max-height:0; opacity:0; overflow:hidden; transition:max-height .45s ease, opacity .35s ease, margin-top .45s; }
    .la-qf:hover { transform:translateY(-6px); border-color:rgba(108,99,255,.5); box-shadow:0 18px 50px rgba(0,0,0,.4), 0 0 50px rgba(108,99,255,.12); }
    .la-qf:hover .la-qf-glow { opacity:1; }
    .la-qf:hover .la-qf-ic { transform:scale(1.12) rotate(-6deg); }
    .la-qf:hover .la-qf-d { max-height:140px; opacity:1; margin-top:10px; }
    .la-qf:hover .la-qf-cta { max-height:30px; opacity:1; margin-top:12px; }

    /* Dünya */
    .la-globe-sec { background:radial-gradient(900px 500px at 50% 0%, rgba(108,99,255,.14), transparent 70%); }
    .la-globe-stage { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
    .la-globe-wrap { position:relative; width:min(440px,80vw); aspect-ratio:1; margin:0 auto; perspective:1100px; transform-style:preserve-3d; }
    .la-earth-atmo { position:absolute; inset:-11%; border-radius:50%; pointer-events:none; filter:blur(5px);
      background:radial-gradient(circle at 50% 50%, rgba(90,170,255,0) 53%, rgba(90,170,255,.4) 63%, rgba(34,211,238,.16) 72%, transparent 80%); }
    .la-earth { position:absolute; inset:0; border-radius:50%; overflow:hidden; transform:rotateX(8deg) rotateZ(-6deg); background:radial-gradient(circle at 38% 32%, #2a7fd0 0%, #1659a6 42%, #0a2c63 78%, #061d45 100%); box-shadow:inset -22px -24px 60px rgba(0,0,0,.78), inset 16px 16px 46px rgba(130,190,255,.28), 0 0 70px rgba(108,99,255,.4), 0 0 130px rgba(34,211,238,.16); }
    .la-earth::after { content:''; position:absolute; inset:0; border-radius:50%; pointer-events:none; box-shadow:inset 0 0 14px 2px rgba(120,200,255,.4); }
    .la-earth-surface { position:absolute; inset:0; width:200%; height:100%; display:flex; animation: la-earthrot 36s linear infinite; filter:saturate(1.15); }
    .la-earth-surface svg { width:50%; height:100%; display:block; }
    .la-earth-surface svg g { filter:drop-shadow(0 1px 1px rgba(0,40,10,.5)); }
    .la-earth-clouds { position:absolute; inset:0; width:200%; height:100%; opacity:.6; mix-blend-mode:screen; animation: la-earthrot 58s linear infinite; background:radial-gradient(ellipse 10% 6% at 14% 28%, #fff, transparent 60%),radial-gradient(ellipse 13% 7% at 30% 52%, #fff, transparent 60%),radial-gradient(ellipse 9% 5% at 46% 70%, #fff, transparent 60%),radial-gradient(ellipse 8% 5% at 58% 22%, #fff, transparent 60%),radial-gradient(ellipse 12% 6% at 72% 44%, #fff, transparent 60%),radial-gradient(ellipse 9% 5% at 84% 64%, #fff, transparent 60%),radial-gradient(ellipse 7% 4% at 94% 34%, #fff, transparent 60%); }
    .la-earth-shade { position:absolute; inset:0; border-radius:50%; pointer-events:none; background:radial-gradient(circle at 30% 26%, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 32%), radial-gradient(circle at 50% 52%, rgba(0,0,0,0) 52%, rgba(0,0,0,.45) 82%, rgba(0,0,0,.7) 100%); }
    .la-orbit-tilt { position:absolute; inset:-12%; transform-style:preserve-3d; transform:rotateX(72deg); }
    .la-orbit-tilt.o2 { inset:-4%; transform:rotateX(68deg) rotateZ(50deg); }
    .la-orbit { position:absolute; inset:0; border-radius:50%; border:1px dashed rgba(108,99,255,.32); animation: la-spin 18s linear infinite; }
    .la-orbit-tilt.o2 .la-orbit { border-color:rgba(34,211,238,.3); animation-duration:26s; animation-direction:reverse; }
    .la-sat { position:absolute; top:-6px; left:50%; margin-left:-6px; width:12px; height:12px; border-radius:50%; background:#22d3ee; box-shadow:0 0 14px 3px rgba(34,211,238,.95); }
    .la-orbit-tilt.o2 .la-sat { background:#a855f7; box-shadow:0 0 14px 3px rgba(168,85,247,.95); }
    .la-pin { position:absolute; width:9px; height:9px; border-radius:50%; background:#22d3ee; box-shadow:0 0 0 0 rgba(34,211,238,.55), 0 0 10px 2px rgba(34,211,238,.9); animation: la-pulsec 2.4s infinite; z-index:3; }
    .la-pin.p1 { top:34%; left:30%; } .la-pin.p2 { top:52%; left:60%; animation-delay:.6s; background:#a855f7; box-shadow:0 0 0 0 rgba(168,85,247,.55), 0 0 10px 2px rgba(168,85,247,.9); } .la-pin.p3 { top:26%; left:64%; animation-delay:1.2s; } .la-pin.p4 { top:66%; left:38%; animation-delay:1.8s; background:#a855f7; }
    .la-gstats { display:flex; flex-direction:column; gap:14px; margin-top:26px; }
    .la-gstat { display:flex; align-items:center; gap:14px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:14px 16px; }
    .la-gic { font-size:24px; } .la-gv { font-size:20px; font-weight:800; } .la-gl { font-size:13px; color:#8892a4; }
    /* Özellik madde kartları — Dünya bilgi kartı stili */
    .la-fcard { display:flex; align-items:center; gap:13px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:13px 15px; font-size:15px; color:#cdd6e4; font-weight:600; transition:transform .25s ease, border-color .25s ease, background .25s ease; }
    .la-fcard:hover { transform:translateX(5px); border-color:rgba(108,99,255,.45); background:rgba(108,99,255,.06); }
    .la-fcard .la-fic { width:30px; height:30px; border-radius:9px; display:grid; place-items:center; font-size:14px; font-weight:800; color:#fff; flex-shrink:0; box-shadow:0 4px 12px rgba(0,0,0,.25); }

    /* Hareket eden insanlar */
    .la-people-sec { background:linear-gradient(180deg, transparent, rgba(108,99,255,.04), transparent); }
    .la-scene { position:relative; height:340px; margin-top:40px; border-radius:22px; overflow:hidden; border:1px solid rgba(255,255,255,.08); background:#0a0a14; }
    .la-scene-photo { position:absolute; inset:0; background-position:center 35%; background-size:cover; filter:brightness(.5) contrast(1.06) saturate(.9); transform:scale(1.05); }
    .la-scene-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:brightness(.82) contrast(1.05) saturate(1.02); }
    .la-scene-ov { position:absolute; inset:0; pointer-events:none; background:linear-gradient(180deg, rgba(7,9,15,.45) 0%, rgba(7,9,15,.22) 45%, rgba(7,9,15,.92) 100%), radial-gradient(ellipse 78% 66% at 50% 36%, transparent 38%, rgba(7,9,15,.55) 100%); }
    .la-ground { position:absolute; left:0; right:0; bottom:0; height:30%; background:linear-gradient(180deg, transparent, rgba(7,9,15,.6)); }
    .la-walk { position:absolute; bottom:12%; will-change:transform; z-index:2; }
    .la-walk svg { display:block; }
    .la-walker { animation: la-bob 1.05s ease-in-out infinite; }
    .la-ribbon { margin-top:30px; -webkit-mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image:linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); overflow:hidden; }
    .la-ribbon-track { display:flex; gap:14px; width:max-content; animation: la-marquee 26s linear infinite; }
    .la-chip { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:100px; padding:8px 16px 8px 8px; white-space:nowrap; }
    .la-ava { width:34px; height:34px; border-radius:50%; display:grid; place-items:center; font-size:13px; font-weight:700; color:#fff; background:linear-gradient(135deg,#6c63ff,#a855f7); }
    .la-nm { font-size:13px; font-weight:700; color:#e8eaf0; } .la-ct { font-size:11px; color:#8892a4; }

    /* Duruşma salonu */
    .la-court-sec { background:radial-gradient(800px 460px at 50% 100%, rgba(168,85,247,.14), transparent 70%); }
    .la-court-wrap { width:min(760px,92vw); margin:36px auto 0; }
    .la-court-wrap svg { width:100%; height:auto; display:block; filter:drop-shadow(0 30px 70px rgba(0,0,0,.6)); }
    .la-court-frame { position:relative; border-radius:20px; overflow:hidden; border:1px solid rgba(255,255,255,.1); box-shadow:0 30px 80px rgba(0,0,0,.6); aspect-ratio:16/9; }
    .la-court-video { width:100%; height:100%; object-fit:cover; display:block; }
    .la-court-tint { position:absolute; inset:0; pointer-events:none; background:radial-gradient(ellipse 82% 72% at 50% 50%, transparent 56%, rgba(7,9,15,.5) 100%), linear-gradient(135deg, rgba(108,99,255,.12), transparent 55%); }
    .la-spotlight { animation: la-glow 4s ease-in-out infinite; transform-origin:center top; }
    .la-gavel { transform-box:fill-box; transform-origin:78% 12%; animation: la-tap 2.6s ease-in-out infinite; }
    .la-scale-beam { transform-box:fill-box; transform-origin:50% 10%; animation: la-swing 5s ease-in-out infinite; }

    /* Animasyonlu butonlar */
    .la-btn-anim { position:relative; overflow:hidden; transition:transform .2s, box-shadow .2s; }
    .la-btn-anim:hover { transform:translateY(-2px); }
    .la-btn-anim::after { content:''; position:absolute; top:0; left:-130%; width:55%; height:100%; background:linear-gradient(100deg, transparent, rgba(255,255,255,.5), transparent); transform:skewX(-20deg); animation: la-sweep 3.2s ease-in-out infinite; pointer-events:none; }
    .la-btn-pulse { animation: la-btnpulse 2.6s ease-in-out infinite; }

    /* Görsel: Ken Burns + hover zoom */
    .la-kenburns { animation: la-kenburns 18s ease-in-out infinite alternate; transition:transform .5s ease; }
    .la-img-wrap:hover .la-kenburns { transform:scale(1.1); }

    /* Kart hover (yorumlar / fiyatlar) */
    .la-tcard { transition:transform .3s ease, box-shadow .3s ease, border-color .3s; }
    .la-tcard:hover { transform:translateY(-7px); box-shadow:0 22px 55px rgba(0,0,0,.45); border-color:rgba(108,99,255,.4); }
    .la-plan-anim { transition:transform .28s ease, box-shadow .28s ease; }
    .la-plan-anim:hover { transform:translateY(-10px); box-shadow:0 26px 64px rgba(0,0,0,.5); }

    /* 3D Telefon mockup */
    .la-phone { position:relative; width:256px; aspect-ratio:9/19.5; margin:34px auto 10px; border-radius:44px; padding:10px; background:linear-gradient(155deg,#2a2545,#14111f 60%,#0c0a16); box-shadow:0 50px 110px rgba(0,0,0,.65), 0 0 80px rgba(108,99,255,.18), inset 0 0 0 2px rgba(255,255,255,.06); animation: la-bob 6s ease-in-out infinite; transform:rotateY(-13deg) rotateX(4deg); transform-style:preserve-3d; transition:transform .45s ease; }
    .la-phone:hover { transform:rotateY(0deg) rotateX(0deg) scale(1.03); }
    .la-phone-bl { position:absolute; left:-3px; top:118px; width:3px; height:32px; border-radius:3px; background:#2c2848; box-shadow:0 46px 0 #2c2848; }
    .la-phone-br { position:absolute; right:-3px; top:150px; width:3px; height:58px; border-radius:3px; background:#2c2848; }
    .la-screen { position:relative; width:100%; height:100%; border-radius:35px; overflow:hidden; background:linear-gradient(180deg,#0a0817,#0c0a1a); display:flex; flex-direction:column; }
    .la-island { position:absolute; top:10px; left:50%; transform:translateX(-50%); width:80px; height:22px; background:#000; border-radius:14px; z-index:6; }
    .la-phstatus { display:flex; justify-content:space-between; align-items:center; padding:13px 18px 2px; font-size:11px; font-weight:700; color:#e8eaf0; }
    .la-phstatus .ic { display:flex; gap:5px; align-items:center; }
    .la-phapp { flex:1; padding:8px 12px 4px; display:flex; flex-direction:column; gap:9px; overflow:hidden; }
    .la-phtop { display:flex; align-items:center; justify-content:space-between; }
    .la-phhi { font-size:13px; font-weight:800; line-height:1.2; color:#e8eaf0; } .la-phhi small { display:block; font-size:9.5px; font-weight:500; color:#8892a4; }
    .la-phava { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,#6c63ff,#a855f7); display:grid; place-items:center; font-size:12px; font-weight:700; color:#fff; }
    .la-phstats { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .la-phst { background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:9px 10px; text-align:left; }
    .la-phst b { font-size:19px; font-weight:800; } .la-phst small { display:block; font-size:9px; color:#8892a4; margin-top:1px; }
    .la-phhl { border-radius:14px; padding:11px 12px; background:linear-gradient(135deg,rgba(108,99,255,.45),rgba(168,85,247,.25)); border:1px solid rgba(108,99,255,.4); text-align:left; }
    .la-phhl .lbl { font-size:8.5px; color:#ddd6fe; font-weight:700; letter-spacing:.6px; } .la-phhl .ttl { font-size:12.5px; font-weight:700; margin-top:3px; color:#fff; } .la-phhl .meta { font-size:9.5px; color:#e7e3f5; margin-top:4px; }
    .la-phsec { font-size:9.5px; font-weight:700; color:#8892a4; letter-spacing:.5px; margin:1px 0 -2px; text-align:left; }
    .la-phrow { display:flex; align-items:center; gap:9px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:11px; padding:7px 10px; text-align:left; }
    .la-phrow .dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
    .la-phrow .info { flex:1; min-width:0; } .la-phrow .info b { font-size:11px; font-weight:700; display:block; color:#e8eaf0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; } .la-phrow .info small { font-size:9px; color:#8892a4; }
    .la-phtabs { display:flex; justify-content:space-around; align-items:center; padding:9px 6px 13px; border-top:1px solid rgba(255,255,255,.07); background:rgba(7,9,15,.6); }
    .la-phtab { position:relative; font-size:17px; opacity:.38; }
    .la-phtab.on { opacity:1; filter:drop-shadow(0 0 7px rgba(108,99,255,.9)); }
    .la-phntf { position:absolute; top:-3px; right:-5px; width:7px; height:7px; border-radius:50%; background:#f87171; animation: la-glow 1.4s ease-in-out infinite; }

    @keyframes la-sweep { 0%,15% { left:-130%; } 55%,100% { left:140%; } }
    @keyframes la-btnpulse { 0%,100% { box-shadow:0 8px 32px rgba(108,99,255,.4); } 50% { box-shadow:0 8px 40px rgba(108,99,255,.75), 0 0 0 4px rgba(108,99,255,.12); } }
    @keyframes la-kenburns { from { transform:scale(1); } to { transform:scale(1.09); } }

    /* Özellik görselleri — canlı animasyonlu mockup'lar */
    .la-fv { position:relative; border-radius:20px; border:1px solid rgba(255,255,255,.1); background:linear-gradient(160deg, rgba(255,255,255,.05), rgba(255,255,255,.02)); box-shadow:0 30px 80px rgba(0,0,0,.5); padding:18px; overflow:hidden; }
    .la-fv-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
    .la-fv-title { font-size:14px; font-weight:700; color:#e8eaf0; display:flex; align-items:center; gap:8px; }
    .la-fv-sync { width:26px; height:26px; border-radius:8px; background:rgba(108,99,255,.15); display:grid; place-items:center; color:#a89fff; }
    .la-fv-sync svg { animation: la-spin 2.2s linear infinite; }
    .la-fv-badge { font-size:11px; font-weight:700; color:#34d399; background:rgba(52,211,153,.12); border:1px solid rgba(52,211,153,.3); border-radius:100px; padding:3px 10px; }
    .la-fv-new { font-size:11px; font-weight:700; color:#fff; background:linear-gradient(135deg,#6c63ff,#a855f7); border-radius:100px; padding:3px 10px; animation: la-glow 1.8s ease-in-out infinite; }
    .la-fv-progress { height:6px; border-radius:100px; background:rgba(255,255,255,.06); overflow:hidden; margin-bottom:10px; }
    .la-fv-progress i { display:block; height:100%; border-radius:100px; background:linear-gradient(90deg,#6c63ff,#a855f7); animation: la-prog 2.8s ease-in-out infinite; }
    .la-fv-sub { font-size:11px; color:#8892a4; margin-bottom:14px; }
    .la-fv-case { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06); border-radius:11px; padding:10px 12px; margin-bottom:8px; }
    .la-fv-check { width:20px; height:20px; border-radius:50%; background:rgba(52,211,153,.15); color:#34d399; display:grid; place-items:center; font-size:11px; flex-shrink:0; animation: la-pop 2.8s ease-in-out infinite; }
    .la-fv-case:nth-child(3) .la-fv-check { animation-delay:.5s; } .la-fv-case:nth-child(4) .la-fv-check { animation-delay:1s; } .la-fv-case:nth-child(5) .la-fv-check { animation-delay:1.5s; }
    .la-fv-cinfo b { font-size:12.5px; font-weight:700; color:#e8eaf0; display:block; } .la-fv-cinfo small { font-size:10.5px; color:#8892a4; }
    /* inbox */
    .la-fv-chip-row { display:flex; gap:8px; margin-bottom:12px; }
    .la-fv-chip { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:600; color:#cfd6e4; background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08); border-radius:100px; padding:5px 12px 5px 5px; }
    .la-fv-chip i { width:20px; height:20px; border-radius:50%; display:grid; place-items:center; }
    .la-fv-msg { display:flex; gap:10px; align-items:flex-start; background:rgba(255,255,255,.03); border-radius:12px; padding:9px 10px; margin-bottom:8px; opacity:0; animation: la-msgin .5s ease forwards; }
    .la-fv-msg:nth-child(4){ animation-delay:.18s; } .la-fv-msg:nth-child(5){ animation-delay:.36s; }
    .la-fv-src { width:30px; height:30px; border-radius:8px; display:grid; place-items:center; flex-shrink:0; }
    .la-fv-mb { flex:1; min-width:0; } .la-fv-mr { display:flex; justify-content:space-between; align-items:baseline; } .la-fv-mr b { font-size:12.5px; font-weight:700; color:#e8eaf0; } .la-fv-mr span { font-size:10px; color:#8892a4; } .la-fv-mb p { font-size:11.5px; color:#8892a4; margin:2px 0 0; }
    .la-fv-typing { display:flex; gap:5px; align-items:center; padding:8px 10px; } .la-fv-typing i { width:7px; height:7px; border-radius:50%; background:#6c63ff; animation: la-blink 1.2s infinite; } .la-fv-typing i:nth-child(2){ animation-delay:.2s; } .la-fv-typing i:nth-child(3){ animation-delay:.4s; } .la-fv-typing span { font-size:11px; color:#8892a4; margin-left:4px; }
    /* dashboard */
    .la-fv-ava { width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#6c63ff,#a855f7); display:grid; place-items:center; font-size:12px; font-weight:700; color:#fff; }
    .la-fv-stat-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px; }
    .la-fv-stat { background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07); border-radius:12px; padding:10px 12px; } .la-fv-stat b { font-size:22px; font-weight:800; } .la-fv-stat small { display:block; font-size:10px; color:#8892a4; margin-top:1px; }
    .la-fv-chart { display:flex; align-items:flex-end; gap:8px; height:96px; padding:12px; background:rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06); border-radius:12px; margin-bottom:10px; }
    .la-fv-bar { flex:1; border-radius:6px 6px 0 0; background:linear-gradient(180deg,#a855f7,#6c63ff); transform-origin:bottom; animation: la-bargrow 3s ease-in-out infinite; }

    @keyframes la-pop { 0%,100% { transform:scale(1); } 50% { transform:scale(1.2); } }
    @keyframes la-prog { 0% { width:6%; } 60% { width:88%; } 100% { width:100%; opacity:.55; } }
    @keyframes la-blink { 0%,80%,100% { opacity:.25; transform:translateY(0); } 40% { opacity:1; transform:translateY(-4px); } }
    @keyframes la-msgin { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
    @keyframes la-bargrow { 0%,100% { transform:scaleY(.45); } 50% { transform:scaleY(1); } }

    @keyframes la-shine { to { background-position:300% 0; } }
    @keyframes la-pulsec { 0% { box-shadow:0 0 0 0 rgba(34,211,238,.5), 0 0 10px 2px rgba(34,211,238,.9);} 70% { box-shadow:0 0 0 12px rgba(34,211,238,0), 0 0 10px 2px rgba(34,211,238,.6);} 100% { box-shadow:0 0 0 0 rgba(34,211,238,0), 0 0 10px 2px rgba(34,211,238,.9);} }
    @keyframes la-bob { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-7px);} }
    @keyframes la-drift1 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(6%,8%) scale(1.12);} }
    @keyframes la-drift2 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(-7%,6%) scale(1.08);} }
    @keyframes la-drift3 { 0%,100% { transform:translate(0,0) scale(1);} 50% { transform:translate(4%,-8%) scale(1.15);} }
    @keyframes la-float { 0% { transform:translateY(0) scale(1); opacity:0;} 10% { opacity:.9;} 90% { opacity:.6;} 100% { transform:translateY(-90vh) scale(.4); opacity:0;} }
    @keyframes la-spin { to { transform:rotate(360deg); } }
    @keyframes la-earthrot { to { transform:translateX(-50%); } }
    @keyframes la-marquee { to { transform:translateX(-50%); } }
    @keyframes la-glow { 0%,100% { opacity:.35; } 50% { opacity:.75; } }
    @keyframes la-tap { 0%,72%,100% { transform:rotate(0deg);} 80% { transform:rotate(-26deg);} 88% { transform:rotate(2deg);} }
    @keyframes la-swing { 0%,100% { transform:rotate(-4deg);} 50% { transform:rotate(4deg);} }

    @media (max-width:820px) {
      .la-globe-stage { grid-template-columns:1fr; }
      .la-qf-grid { grid-template-columns:1fr 1fr; }
    }
    @media (max-width:520px) {
      .la-qf-grid { grid-template-columns:1fr; }
    }
    @media (prefers-reduced-motion: reduce) {
      .la-reveal, .la-stagger > * { opacity:1 !important; transform:none !important; }
      .la-aurora, .la-earth-surface, .la-earth-clouds, .la-orbit, .la-pin, .la-walker, .la-ribbon-track, .la-spotlight, .la-gavel, .la-scale-beam, .la-grad, .la-btn-anim::after, .la-btn-pulse, .la-kenburns, .la-phone, .la-phntf { animation-duration:.001s !important; animation-iteration-count:1 !important; }
      .la-phone { transform:none !important; }
    }
    `}</style>
  )
}
