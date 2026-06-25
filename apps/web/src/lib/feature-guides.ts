// Özellik rehber sayfaları içeriği — /ozellik/[slug]
// Her özellik farklı "variant" ile farklı görünür (timeline / cards / split).

export type Step = { t: string; d: string }
export type Highlight = { t: string; d: string }

export type FeatureGuide = {
  slug: string
  name: string          // navigasyon etiketi
  tag: string           // küçük üst başlık
  title: string         // sayfa H1
  color: string         // ana aksan
  color2: string        // gradyan bitiş
  icon: string          // lucide ikon anahtarı (page.tsx eşler)
  summary: string       // hero altı özet
  whatIs: string        // "Nedir" paragrafı
  howItWorks: Step[]     // Nasıl çalışır
  howToUse: Step[]       // Nasıl kullanılır (adım adım)
  highlights: Highlight[]
  variant?: 'timeline' | 'cards' | 'split'
}

export const GUIDES: FeatureGuide[] = [
  {
    slug: 'uyap',
    name: 'UYAP Otomasyonu',
    tag: 'UYAP ENTEGRASYONU',
    title: 'Dava Takibini Otomatikleştirin',
    color: '#6c63ff', color2: '#8b80ff', icon: 'landmark',
    summary: 'UYAP ile doğrudan bağlantı kurarak dava, duruşma ve kararlarınızı otomatik senkronize edin — hiçbir tarihi kaçırmayın.',
    whatIs: 'UYAP Otomasyonu, e-imza sertifikanızla UYAP üzerindeki tüm dosyalarınızı Avukatım paneline otomatik taşır. Yeni duruşma, tensip, safahat veya karar geldiğinde sizi WhatsApp ve panel bildirimiyle uyarır; belgeleri bilgisayarınıza otomatik indirir.',
    howItWorks: [
      { t: 'Güvenli bağlantı', d: 'E-imza sertifikanız ve baro sicil numaranızla UYAP\'a güvenli (şifreli) oturum açılır. Bilgileriniz Türkiye lokasyonlu sunucularda saklanır.' },
      { t: '30 dakikada bir tarama', d: 'Sistem arka planda dosyalarınızı düzenli tarar; yeni safahat, duruşma günü ve karar değişikliklerini tespit eder.' },
      { t: 'Otomatik kayıt + bildirim', d: 'Gelen belgeler bilgisayarınıza/panele kaydedilir; önemli gelişmelerde anında WhatsApp ve panel bildirimi gönderilir.' },
      { t: 'Takvime işleme', d: 'Duruşma tarihleri otomatik olarak takviminize eklenir ve hatırlatma kurulur.' },
    ],
    howToUse: [
      { t: 'UYAP\'ı bağlayın', d: 'Panel → UYAP sekmesine girin, "Bağlan" deyin ve e-imzanızı takıp onaylayın.' },
      { t: 'Dosyaları içe aktarın', d: 'İlk senkronizasyonda mevcut tüm dosyalarınız listelenir; takip etmek istediklerinizi seçin.' },
      { t: 'Bildirimleri ayarlayın', d: 'Hangi olaylarda (duruşma, karar, safahat) WhatsApp bildirimi alacağınızı seçin.' },
      { t: 'Geri yaslanın', d: 'Artık takip otomatik. Yeni bir gelişme olduğunda telefonunuza bildirim düşer.' },
    ],
    highlights: [
      { t: '30 dk senkron', d: 'Yarım saatte bir otomatik tarama' },
      { t: 'WhatsApp bildirimi', d: 'Önemli gelişmeler telefonunuzda' },
      { t: 'Otomatik belge', d: 'Kararlar bilgisayarınıza iner' },
      { t: 'Duruşma takvimi', d: 'Tarihler otomatik takvime' },
    ],
    variant: 'timeline',
  },
  {
    slug: 'iletisim',
    name: 'WhatsApp & Gmail',
    tag: 'BİRLEŞİK İLETİŞİM',
    title: 'WhatsApp & Gmail Tek Ekranda',
    color: '#10b981', color2: '#22d3ee', icon: 'message-square',
    summary: 'Müvekkil yazışmalarını tek gelen kutusunda toplayın. Mesajlar otomatik olarak ilgili davaya bağlanır.',
    whatIs: 'Birleşik İletişim, WhatsApp Business ve Gmail hesaplarınızı tek bir gelen kutusunda birleştirir. Gelen her mesaj telefon numarası/e-posta ile müvekkile ve davaya otomatik eşleşir; ekibiniz aynı yazışmayı görür, hiçbir mesaj kaybolmaz.',
    howItWorks: [
      { t: 'Kanalları bağlama', d: 'WhatsApp Business numaranızı ve Gmail hesabınızı güvenli OAuth ile bağlarsınız.' },
      { t: 'Otomatik eşleştirme', d: 'Gelen mesajın numarası/e-postası müvekkil kartıyla eşleşir ve ilgili dava dosyasına iliştirilir.' },
      { t: 'Tek gelen kutusu', d: 'Tüm kanallar tek ekranda; yanıtlarsınız, ekip arkadaşınız da aynı geçmişi görür.' },
      { t: 'Şablon & otomasyon', d: 'Sık kullanılan yanıtları şablonla gönderir, duruşma hatırlatmalarını otomatikleştirirsiniz.' },
    ],
    howToUse: [
      { t: 'Kanalı ekleyin', d: 'Panel → Mesajlar → "Kanal Bağla" ile WhatsApp ve Gmail\'i bağlayın.' },
      { t: 'Müvekkili eşleştirin', d: 'İlk mesajda sistem müvekkili önerir; onaylayın, sonrakiler otomatik eşleşir.' },
      { t: 'Şablon oluşturun', d: '"Duruşma hatırlatma", "Belge talebi" gibi hazır şablonlar tanımlayın.' },
      { t: 'Tek yerden yönetin', d: 'Tüm yazışmaları gelen kutusundan yanıtlayın; dava dosyasında geçmiş otomatik birikir.' },
    ],
    highlights: [
      { t: 'Tek gelen kutusu', d: 'WhatsApp + Gmail birlikte' },
      { t: 'Davaya otomatik bağ', d: 'Mesajlar dosyaya iliştirilir' },
      { t: 'Ekip görünürlüğü', d: 'Herkes aynı geçmişi görür' },
      { t: 'Hazır şablonlar', d: 'Tek tıkla yanıt' },
    ],
    variant: 'cards',
  },
  {
    slug: 'ai',
    name: 'AI Hukuk Asistanı',
    tag: 'YAPAY ZEKA',
    title: 'Yapay Zeka Hukuk Asistanı',
    color: '#a855f7', color2: '#6c63ff', icon: 'sparkles',
    summary: 'Meslektaşınız gibi düşünen yapay zeka: dilekçe taslağı, içtihat araştırması, dosya analizi — saniyeler içinde.',
    whatIs: 'AI Hukuk Asistanı, Türk hukukuna (TMK, TBK, HMK, İİK, İş K. vb.) hâkim, kıdemli bir hukukçu gibi davranan bir yapay zekadır. Vatandaşa değil avukata danışır gibi yanıt verir: yapılacak adımları, süreleri, dilekçe taslaklarını ve stratejiyi sunar. Yüklediğiniz dilekçe/sözleşme/kararı meslektaş gözüyle inceler.',
    howItWorks: [
      { t: 'Soru veya belge', d: 'Bir hukuki soru sorar ya da dilekçe/sözleşme/karar yüklersiniz (görsel, PDF, metin).' },
      { t: 'Derin analiz', d: 'Asistan ilgili kanun maddelerini ve Yargıtay içtihatlarını dikkate alarak uygulamaya dönük analiz yapar.' },
      { t: 'Derin araştırma (web)', d: 'İsterseniz güncel mevzuat ve içtihat için web araması yapar, kaynak ve tarih verir.' },
      { t: 'Kullanıma hazır çıktı', d: 'Dilekçe taslağı, ihtarname, hesap tablosu veya adım listesi — doğrudan kullanabileceğiniz nitelikte.' },
    ],
    howToUse: [
      { t: 'Asistanı açın', d: 'Panel → AI Asistan sekmesine girin (ya da ana sayfadaki demo kutusundan deneyin).' },
      { t: 'Meslek dilinde sorun', d: '"Kira tespit davasında yapmam gerekenler ve süreler" gibi uygulamaya dönük sorun.' },
      { t: 'Belge yükleyin', d: 'İncelenmesini istediğiniz dosyayı sürükleyin; eksik/riskli noktaları çıkarır.' },
      { t: 'Derin araştırmayı açın', d: 'Güncel içtihat gerekiyorsa "Derin Araştırma"yı etkinleştirin, kaynaklı yanıt alın.' },
    ],
    highlights: [
      { t: 'Dosya yükleme', d: 'Dilekçe/sözleşme analizi' },
      { t: 'Sesli komut', d: 'Konuşarak sorun' },
      { t: 'Düşünme modu', d: 'Adım adım muhakeme' },
      { t: 'Derin araştırma', d: 'Güncel içtihat + kaynak' },
    ],
    variant: 'split',
  },
  {
    slug: 'dava',
    name: 'Dava Yönetimi',
    tag: 'DAVA & MÜVEKKİL',
    title: 'Tüm Büronuz Tek Platformda',
    color: '#f59e0b', color2: '#f97316', icon: 'folder',
    summary: 'Müvekkil, dava, belge, duruşma ve zaman kaydını tek profesyonel arayüzde yönetin; ekibinizle gerçek zamanlı çalışın.',
    whatIs: 'Dava Yönetimi modülü, büronuzun tüm operasyonunu tek yerde toplar: müvekkil kartları, dava dosyaları, belge arşivi (arama + OCR), duruşma takvimi ve zaman/ücret takibi. Her şey birbirine bağlıdır — bir müvekkile tıkladığınızda davaları, belgeleri ve yazışmaları tek ekranda görürsünüz.',
    howItWorks: [
      { t: 'Merkezî kayıt', d: 'Müvekkil ve davalar bir kez girilir; belgeler, mesajlar ve duruşmalar otomatik ilişkilendirilir.' },
      { t: 'Akıllı arama', d: 'Binlerce belge arasında OCR ile saniyeler içinde arama yaparsınız.' },
      { t: 'Gerçek zamanlı ekip', d: 'Roller ve yetkilerle ekibiniz aynı dosyada eş zamanlı çalışır.' },
      { t: 'Raporlama', d: 'Dava durumu, tahsilat ve performans panoları otomatik üretilir.' },
    ],
    howToUse: [
      { t: 'Müvekkil ekleyin', d: 'Panel → Müvekkiller → "Yeni Müvekkil" ile kartı oluşturun.' },
      { t: 'Dava açın', d: 'Müvekkile bağlı dava oluşturun; esas no, mahkeme ve tarafları girin.' },
      { t: 'Belgeleri yükleyin', d: 'Dosyaya belge sürükleyin; sistem OCR ile aranabilir hale getirir.' },
      { t: 'Ekibi davet edin', d: 'Ekip sekmesinden meslektaşlarınızı rolleriyle davet edin.' },
    ],
    highlights: [
      { t: 'Belge + OCR', d: 'Aranabilir arşiv' },
      { t: 'Zaman/ücret', d: 'Çalışma kaydı' },
      { t: 'Ekip & rol', d: 'Yetkili erişim' },
      { t: 'Durum panoları', d: 'Anlık raporlar' },
    ],
    variant: 'timeline',
  },
  {
    slug: 'odeme',
    name: 'Ödeme Takibi',
    tag: 'TAHSİLAT',
    title: 'Müvekkil Ödeme & Tahsilat Takibi',
    color: '#22d3ee', color2: '#0ea5e9', icon: 'wallet',
    summary: 'Vekâlet ücreti ve masrafları kalem kalem izleyin; geciken tahsilatları otomatik hatırlatın.',
    whatIs: 'Ödeme Takibi, her müvekkil ve dava için ücret/masraf kayıtlarını tutar; ödenen ve bekleyen tutarları net gösterir. Vadesi geçen tahsilatlar panelde ve ana sayfada uyarı olarak çıkar; müvekkile WhatsApp ile nazik hatırlatma gönderebilirsiniz.',
    howItWorks: [
      { t: 'Ücret kaydı', d: 'Davaya vekâlet ücreti, masraf ve taksitleri girersiniz.' },
      { t: 'Durum takibi', d: 'Sistem ödenen/bekleyen tutarı ve vadeleri otomatik hesaplar.' },
      { t: 'Gecikme uyarısı', d: 'Vadesi geçen tahsilatlar kırmızı uyarıyla panele düşer.' },
      { t: 'Hatırlatma', d: 'Tek tıkla müvekkile WhatsApp ödeme hatırlatması gönderilir.' },
    ],
    howToUse: [
      { t: 'Ödeme ekleyin', d: 'Panel → Ödeme Takibi → "Yeni Kayıt" ile tutar ve vade girin.' },
      { t: 'Taksit tanımlayın', d: 'Gerekirse ödemeyi taksitlere bölün; her taksitin vadesini belirleyin.' },
      { t: 'Gecikmeyi görün', d: 'Ana sayfada "gecikmiş tahsilat" uyarısını takip edin.' },
      { t: 'Hatırlatma gönderin', d: 'Müvekkile tek tıkla nazik bir ödeme hatırlatması iletin.' },
    ],
    highlights: [
      { t: 'Kalem kalem', d: 'Ücret + masraf' },
      { t: 'Taksit takibi', d: 'Vadeli ödemeler' },
      { t: 'Gecikme uyarısı', d: 'Otomatik bildirim' },
      { t: 'WhatsApp hatırlatma', d: 'Tek tıkla' },
    ],
    variant: 'cards',
  },
  {
    slug: 'guvenlik',
    name: 'Siber Güvenlik',
    tag: 'GÜVENLİK & KVKK',
    title: 'Siber Güvenlik & KVKK Uyumu',
    color: '#ef4444', color2: '#f59e0b', icon: 'shield-check',
    summary: 'Verileriniz AES-256 ile şifreli, Türkiye lokasyonlu sunucularda. İki adımlı doğrulama ve erişim kayıtlarıyla tam koruma.',
    whatIs: 'Siber Güvenlik modülü, büronuzun hassas verilerini korur: uçtan uca şifreleme, iki adımlı doğrulama (2FA), cihaz/oturum yönetimi ve erişim günlükleri. Tüm altyapı KVKK uyumlu ve Türkiye lokasyonludur; kimin neye eriştiği kayıt altındadır.',
    howItWorks: [
      { t: 'Şifreleme', d: 'Veriler AES-256 ile şifrelenir; aktarımda TLS kullanılır.' },
      { t: 'İki adımlı doğrulama', d: 'Girişte 2FA ile hesabınız parola çalınsa bile korunur.' },
      { t: 'Erişim kaydı', d: 'Her giriş ve önemli işlem, zaman ve cihaz bilgisiyle loglanır.' },
      { t: 'KVKK uyumu', d: 'Veri işleme süreçleri KVKK\'ya uygun; Türkiye lokasyonlu sunucular.' },
    ],
    howToUse: [
      { t: '2FA\'yı açın', d: 'Panel → Siber Güvenlik → "İki Adımlı Doğrulama"yı etkinleştirin.' },
      { t: 'Cihazları gözden geçirin', d: 'Açık oturumları görün, tanımadığınız cihazı uzaktan kapatın.' },
      { t: 'Erişim günlüğünü izleyin', d: 'Kimin ne zaman eriştiğini denetleyin.' },
      { t: 'Yedek kodları saklayın', d: '2FA yedek kodlarınızı güvenli bir yerde tutun.' },
    ],
    highlights: [
      { t: 'AES-256', d: 'Uçtan uca şifre' },
      { t: '2FA', d: 'İki adımlı giriş' },
      { t: 'Erişim günlüğü', d: 'Tam denetim' },
      { t: 'KVKK + TR sunucu', d: 'Yasal uyum' },
    ],
    variant: 'split',
  },
  {
    slug: 'mobil',
    name: 'Mobil Uygulama',
    tag: 'HER YERDE YANINIZDA',
    title: 'Mobil Uygulama (Android)',
    color: '#1ec45f', color2: '#0d8b3d', icon: 'smartphone',
    summary: 'Davalar, mesajlar ve duruşmalar cebinizde. Android APK ile internet olan her yerde, bilgisayara bağlı kalmadan.',
    whatIs: 'Avukatım mobil uygulaması, panelin cepteki halidir. Davalarınızı, müvekkillerinizi, takviminizi ve AI asistanı telefonunuzdan kullanırsınız. Şu an Android için doğrudan APK ile kurulur; iOS sürümü yakında. Uygulama canlı sunucuya bağlıdır, verileriniz web ile aynıdır.',
    howItWorks: [
      { t: 'Canlı sunucuya bağlı', d: 'Uygulama web ile aynı veritabanını kullanır; telefonda yaptığınız değişiklik panelde de görünür.' },
      { t: 'Güvenli giriş', d: 'Aynı hesabınızla girersiniz; oturum telefonda güvenli (SecureStore) saklanır.' },
      { t: 'Bildirimler', d: 'Duruşma ve önemli gelişmeler için telefonunuza bildirim düşer.' },
      { t: 'Çevrimiçi çalışma', d: 'İnternet olan her yerde; ofise veya bilgisayara bağlı kalmazsınız.' },
    ],
    howToUse: [
      { t: 'APK\'yı indirin', d: 'Ana sayfadaki "APK İndir" butonundan veya bize ulaşıp bağlantıyı telefonunuzda açın.' },
      { t: 'Kurulum izni verin', d: 'Android "bilinmeyen kaynak" sorarsa izin verin (uygulama güvenlidir), kurun.' },
      { t: 'Giriş yapın', d: 'Web ile aynı e-posta/şifrenizle girin.' },
      { t: 'Kullanmaya başlayın', d: 'Alt menüden davalar, müvekkiller, takvim, mesajlar ve AI asistana erişin.' },
    ],
    highlights: [
      { t: 'Android APK', d: 'Doğrudan kurulum' },
      { t: 'AI asistan', d: 'Cepten hukuki yanıt' },
      { t: 'Bildirimler', d: 'Duruşma hatırlatma' },
      { t: 'iOS yakında', d: 'App Store için hazırlık' },
    ],
  },
  {
    slug: 'masaustu',
    name: 'Masaüstü Uygulaması',
    tag: 'BİLGİSAYARINIZA KURUN',
    title: 'Masaüstü Uygulaması (Windows & macOS)',
    color: '#6c63ff', color2: '#8b80ff', icon: 'monitor',
    summary: 'Avukatım\'ı bir program gibi bilgisayarınıza kurun — ayrı pencere, hızlı erişim, masaüstü deneyimi.',
    whatIs: 'Masaüstü uygulaması, Avukatım\'ı tarayıcı sekmesi aramadan, ayrı bir program penceresinde kullanmanızı sağlar. Windows (.exe) ve macOS (.dmg) için indirilebilir; canlı sunucuya bağlıdır, verileriniz web ile aynıdır. Başlat menüsü / Dock kısayolu oluşur.',
    howItWorks: [
      { t: 'Native pencere', d: 'Uygulama, web sürümünü kendi penceresinde açar; sekme karmaşası olmaz.' },
      { t: 'Canlı bağlantı', d: 'Web ile aynı veritabanı; nerede çalışırsanız çalışın veriler senkron.' },
      { t: 'Hızlı erişim', d: 'Masaüstü/Başlat menüsü kısayoluyla tek tıkla açılır.' },
      { t: 'Otomatik giriş', d: 'Oturumunuz hatırlanır; her seferinde yeniden giriş gerekmez.' },
    ],
    howToUse: [
      { t: 'Sürümünüzü indirin', d: 'Ana sayfadaki "Masaüstü" bölümünden Windows (.exe) veya macOS (.dmg) dosyasını indirin.' },
      { t: 'Kurun', d: 'İndirilen dosyayı çalıştırıp kurulum sihirbazını tamamlayın.' },
      { t: 'Açın', d: 'Masaüstü/Başlat menüsü kısayolundan Avukatım\'ı başlatın.' },
      { t: 'Giriş yapın', d: 'Hesabınızla girin; artık ayrı bir program gibi kullanın.' },
    ],
    highlights: [
      { t: 'Windows .exe', d: 'Tek tıkla kurulum' },
      { t: 'macOS .dmg', d: 'Apple Silicon' },
      { t: 'Ayrı pencere', d: 'Sekme aramaya son' },
      { t: 'Canlı senkron', d: 'Web ile aynı veri' },
    ],
  },
  {
    slug: 'ekip',
    name: 'Ekip Yönetimi',
    tag: 'BÜRO & EKİP',
    title: 'Ekip Yönetimi',
    color: '#f59e0b', color2: '#f97316', icon: 'users',
    summary: 'Büronuza avukat ve asistan davet edin, rol & yetki verin; herkes aynı dosyalarda güvenle çalışsın.',
    whatIs: 'Ekip Yönetimi, hukuk bürolarının birden çok kullanıcıyı tek hesapta yönetmesini sağlar. E-posta ile davet gönderir, her üyeye rol (yönetici / avukat / asistan) atarsınız. Roller, kimin neyi görüp değiştirebileceğini belirler. Koltuk (üye) limiti abonelik planınıza bağlıdır.',
    howItWorks: [
      { t: 'Davet', d: 'Üyeyi e-posta ve rolüyle davet edersiniz; davet bağlantısıyla büronuza katılır.' },
      { t: 'Rol & yetki', d: 'Yönetici tüm yetkilere sahiptir; avukat ve asistan rolleri sınırlı erişir.' },
      { t: 'Ortak çalışma', d: 'Tüm ekip aynı dava ve müvekkil dosyalarında gerçek zamanlı çalışır.' },
      { t: 'Koltuk limiti', d: 'Eklenebilecek üye sayısı abonelik planınızla belirlenir; yükseltebilirsiniz.' },
    ],
    howToUse: [
      { t: 'Ekip sayfasını açın', d: 'Panel → Ekip sekmesine girin (yönetici yetkisi gerekir).' },
      { t: 'Üye davet edin', d: '"Davet Et" ile e-posta ve rol seçip gönderin.' },
      { t: 'Rolleri yönetin', d: 'Mevcut üyelerin rolünü değiştirin veya üyeyi çıkarın.' },
      { t: 'Birlikte çalışın', d: 'Davet kabul edilince üye büronuzdaki dosyalara rolüne göre erişir.' },
    ],
    highlights: [
      { t: 'E-posta daveti', d: 'Hızlı katılım' },
      { t: 'Rol & yetki', d: 'Yönetici/avukat/asistan' },
      { t: 'Ortak dosyalar', d: 'Gerçek zamanlı' },
      { t: 'Koltuk limiti', d: 'Plana göre' },
    ],
  },
]

export const GUIDE_MAP: Record<string, FeatureGuide> = Object.fromEntries(GUIDES.map(g => [g.slug, g]))
