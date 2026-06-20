import Link from 'next/link'
import { notFound } from 'next/navigation'

type Doc = { title: string; updated: string; intro: string; sections: { h: string; p: string }[] }

const DOCS: Record<string, Doc> = {
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    updated: '20 Haziran 2026',
    intro: '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, veri sorumlusu sıfatıyla Avukatım Yazılım A.Ş. tarafından kişisel verilerinizin işlenmesine ilişkin aydınlatma metnidir.',
    sections: [
      { h: 'İşlenen Veriler', p: 'Ad-soyad, e-posta, telefon, baro sicil no, fatura bilgileri ve platform kullanım verileri işlenmektedir.' },
      { h: 'İşleme Amaçları', p: 'Hizmetin sunulması, abonelik yönetimi, UYAP entegrasyonu, güvenlik ve yasal yükümlülüklerin yerine getirilmesi.' },
      { h: 'Veri Güvenliği', p: 'Veriler Türkiye lokasyonlu sunucularda AES-256 ile şifrelenerek saklanır; yetkisiz erişime karşı teknik ve idari tedbirler alınır.' },
      { h: 'Haklarınız', p: 'KVKK 11. madde kapsamında verilerinize erişim, düzeltme, silme ve itiraz haklarınızı destek@avukatım.com üzerinden kullanabilirsiniz.' },
    ],
  },
  gizlilik: {
    title: 'Gizlilik Politikası',
    updated: '20 Haziran 2026',
    intro: 'Avukatım olarak gizliliğinize önem veriyoruz. Bu politika, verilerinizi nasıl topladığımızı ve koruduğumuzu açıklar.',
    sections: [
      { h: 'Topladığımız Bilgiler', p: 'Hesap bilgileri, kullanım istatistikleri ve entegrasyon verileri (UYAP, WhatsApp, Gmail).' },
      { h: 'Paylaşım', p: 'Verileriniz üçüncü taraflarla satılmaz; yalnızca hizmetin sunulması için gerekli sağlayıcılarla, sözleşmesel gizlilik altında paylaşılır.' },
      { h: 'Çerezler', p: 'Oturum ve tercih çerezleri kullanılır. Detaylar için Çerez Politikası sayfasına bakınız.' },
    ],
  },
  'kullanim-sartlari': {
    title: 'Kullanım Şartları',
    updated: '20 Haziran 2026',
    intro: 'Avukatım platformunu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız.',
    sections: [
      { h: 'Hizmet Tanımı', p: 'Avukatım, hukuk bürolarına dava, müvekkil ve iletişim yönetimi sunan bir SaaS platformudur.' },
      { h: 'Kullanıcı Yükümlülükleri', p: 'Hesap güvenliğinizden ve girdiğiniz verilerin doğruluğundan siz sorumlusunuz.' },
      { h: 'Sorumluluk Sınırı', p: 'UYAP ve üçüncü taraf servislerden kaynaklı kesintilerden Avukatım sorumlu tutulamaz.' },
    ],
  },
  cerez: {
    title: 'Çerez Politikası',
    updated: '20 Haziran 2026',
    intro: 'Sitemiz, deneyiminizi iyileştirmek için çerezler kullanır.',
    sections: [
      { h: 'Zorunlu Çerezler', p: 'Oturum yönetimi ve güvenlik için gereklidir, kapatılamaz.' },
      { h: 'Analitik Çerezler', p: 'Anonim kullanım istatistikleri toplar; tarayıcınızdan reddedebilirsiniz.' },
    ],
  },
  'mesafeli-satis': {
    title: 'Mesafeli Satış Sözleşmesi',
    updated: '20 Haziran 2026',
    intro: '6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında abonelik satışına ilişkin sözleşmedir.',
    sections: [
      { h: 'Konu', p: 'Avukatım abonelik hizmetinin elektronik ortamda satışı.' },
      { h: 'Ödeme', p: 'Ödemeler PayTR (TR) ve Stripe (global) üzerinden 3D Secure ile alınır.' },
      { h: 'Cayma Hakkı', p: 'Dijital hizmetlerde, hizmet kullanılmaya başlanmadan önce cayma hakkı geçerlidir.' },
    ],
  },
  'iptal-iade': {
    title: 'İptal & İade Prosedürü',
    updated: '20 Haziran 2026',
    intro: 'Abonelik iptal ve iade süreçleri aşağıda açıklanmıştır.',
    sections: [
      { h: 'İptal', p: 'Aylık aboneliklerde bir sonraki yenileme dönemine kadar; iptal panelden tek tıkla yapılır.' },
      { h: 'İade', p: 'Yıllık planlarda ilk 30 gün içinde tam iade. Talepler destek@avukatım.com adresine iletilir.' },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(DOCS).map(slug => ({ slug }))
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = DOCS[slug]
  if (!doc) notFound()

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: '#07090f', color: '#e8eaf0', minHeight: '100vh' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <Link href="/" style={{ color: '#6c63ff', textDecoration: 'none', fontSize: 14 }}>← Ana sayfa</Link>
        <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: '20px 0 8px' }}>{doc.title}</h1>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 32 }}>Son güncelleme: {doc.updated}</p>
        <p style={{ color: '#8892a4', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>{doc.intro}</p>
        {doc.sections.map(s => (
          <div key={s.h} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{s.h}</h2>
            <p style={{ color: '#8892a4', fontSize: 15, lineHeight: 1.8 }}>{s.p}</p>
          </div>
        ))}
        <div style={{ marginTop: 40, padding: '16px 20px', background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 12, fontSize: 13, color: '#8892a4' }}>
          Sorularınız için: <a href="mailto:destek@avukatım.com" style={{ color: '#a89fff' }}>destek@avukatım.com</a>
        </div>
      </div>
    </div>
  )
}
