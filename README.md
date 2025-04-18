![PsikoRan Logo](/public/assets/meta/logo.png)

# PsikoRan - Profesyonel Danışmanlık Merkezi

Psikoterapistlar ve danışanlar için profesyonel danışmanlık ve randevu yönetim sistemi.

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Veritabanı Yapısı](#veritabanı-yapısı)
- [Proje Yapısı](#proje-yapısı)
- [API Dokumentasyonu](#api-dokumentasyonu)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)
- [İletişim](#iletişim)

## 🔎 Genel Bakış

PsikoRan, ruh sağlığı profesyonelleri için tasarlanmış kapsamlı bir yönetim platformudur. Uygulama, randevu takibi, danışan yönetimi, psikolojik testlerin uygulanması, çevrimiçi görüşmeler ve finansal izleme gibi temel ihtiyaçları tek bir çözümde birleştirerek klinik iş akışlarını dijitalleştirir ve optimize eder.

## 📑 Özellikler

### 👩‍⚕️ Profesyoneller İçin
- **Danışan Yönetimi**: Tüm danışanlarınızı tek bir platformda yönetin
- **Randevu Planlama**: Günlük, haftalık ve aylık görünümlerle randevularınızı organize edin
- **Test ve Değerlendirmeler**: Psikolojik testleri danışanlarınıza kolayca uygulayın ve sonuçları yorumlayın
- **Seans Notları**: Şifrelenmiş ve güvenli seans notları tutun
- **Ödeme Takibi**: Danışan ödemelerini izleyin, raporlayın ve analiz edin
- **Çevrimiçi Görüşmeler**: Entegre Jitsi teknolojisiyle güvenli video görüşmeleri yapın
- **Analitik Dashboard**: Klinik performansınızı ve istatistiklerinizi görüntüleyin

### 👨‍👩‍👧‍👦 Danışanlar İçin
- **Randevu Görüntüleme**: Gelecek randevularınızı görüntüleyin ve hatırlatmalar alın
- **Online Testler**: Size atanan psikolojik testleri çevrimiçi olarak tamamlayın
- **Çevrimiçi Görüşmeler**: Terapistinizle güvenli video görüşmeleri yapın
- **İletişim**: Terapistinizle güvenli bir şekilde iletişim kurun

### 👨‍💼 Asistanlar İçin
- **Randevu Yönetimi**: Tüm klinik randevularını oluşturun ve düzenleyin
- **Danışan Kayıtları**: Yeni danışanları sisteme ekleyin ve bilgilerini güncelleyin
- **Profesyonel Yönetimi**: Klinikte çalışan tüm ruh sağlığı uzmanlarını yönetin
- **Ödeme Takibi**: Klinik ödemelerini ve nakit akışını izleyin
- **Klinik Ayarları**: Çalışma saatleri, tatil günleri ve diğer ayarları yapılandırın
- **Blog Yönetimi**: Klinik blogunu yönetin ve içerik oluşturun

## 🚀 Teknoloji Yığını

- **Frontend**:
  - React 18.3+ ve TypeScript
  - Tailwind CSS ve çeşitli UI kütüphaneleri (Headless UI, Mantine, MUI)
  - Framer Motion ile gelişmiş animasyonlar ve geçişler
    - Sayfa geçişleri için stagger efektleri
    - Mikro-etkileşimler için hover/tap animasyonları
    - Gradyanlı arka planlar ve metin efektleri 
    - Modal açılış/kapanış animasyonları
    - Bildirim ve uyarı animasyonları
  - React Router v6 ile gelişmiş yönlendirme
  - Zustand ile durum yönetimi
  
- **UI/UX İyileştirmeleri**:
  - Karanlık/Aydınlık tema desteği
  - Tamamen responsive tasarım (mobil/tablet/masaüstü)
  - Backdrop blur efektleri ve modern cam görünümü
  - İkon entegrasyonu (Lucide React)
  - Dokunmatik cihazlar için optimize edilmiş arayüz
  - Erişilebilirlik standartlarına uygun tasarım

- **Backend & Database**:
  - Supabase (Authentication, Database, Storage, RLS)
  - PostgreSQL veritabanı
  - Row Level Security ile veri güvenliği

- **Zengin Editörler**:
  - TipTap/ProseMirror zengin metin editörü
  - CKEditor ve TinyMCE desteği

- **Grafikler ve Raporlama**:
  - Chart.js ile veri görselleştirme
  - PDF oluşturma (jsPDF ve AutoTable)
  
- **Çevrimiçi Görüşme**:
  - Jitsi Meet entegrasyonu
  
- **Mobil Deneyim**:
  - Responsive tasarım
  - Touch-optimized arayüz
  - Kolay gezinilebilir menüler

- **Güvenlik**:
  - End-to-end şifreleme (CryptoJS, Web Crypto API)
  - Row Level Security: Supabase veritabanında satır seviyesinde erişim kontrolü
  - Rol Tabanlı Erişim: Profesyonel, asistan ve sistem yöneticisi rolleri için özel izin yapısı
  - KVKK/GDPR Uyumlu: Kişisel verilerin korunması mevzuatına uygun veri işleme
  - Güvenli Oturum Yönetimi: JWT tabanlı güvenli kimlik doğrulama
  - Güvenli Şifre Politikası: Güçlü şifre gereksinimleri ve şifre sıfırlama

- **Diğer Araçlar**: 
  - Form Validasyonu (React Hook Form)
  - Tarih İşlemleri (date-fns, dayjs)
  - Email entegrasyonu (EmailJS)
  - SEO optimizasyonu (React Helmet)

## 💻 Kurulum

### Ön Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya yarn
- Supabase hesabı

### Adımlar

1. Repoyu klonlayın:
```bash
git clone https://github.com/kullaniciadi/psikoran.git
cd psikoran
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. `.env.example` dosyasını `.env` olarak kopyalayın ve gerekli değişkenleri ayarlayın:
```bash
cp .env.example .env
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

5. Tarayıcınızda `http://localhost:5173` adresine gidin.

## 🔧 Kullanım

### Oturum Açma ve Kayıt

- `/login` - Kullanıcı girişi
- `/register` - Yeni üyelik oluşturma (Profesyoneller için)
- `/create-assistant` - Asistan hesabı oluşturma
- `/forgot-password` - Şifre sıfırlama
- `/reset-password` - Yeni şifre belirleme

### Ana Sayfalar

- `/dashboard` - Ana kontrol paneli
- `/clients` - Danışan listesi ve yönetimi
- `/clients/:clientId` - Danışan detayları
- `/professionals` - Terapist listesi (Asistan paneli)
- `/appointments` - Randevu takvimi ve planlama
- `/appointment/:id` - Randevu detayları
- `/payments` - Ödeme takibi ve faturalandırma
- `/settings` - Hesap ve sistem ayarları
- `/admin/blog` - Blog yönetim paneli

### Diğer Sayfalar

- `/test/:testId/:clientId` - Test uygulama sayfası
- `/public-test/:token` - Anonim test uygulama sayfası
- `/test-completed` - Test tamamlama ekranı
- `/home` - Ana sayfa
- `/features` - Özellikler sayfası
- `/pricing` - Fiyatlandırma sayfası 
- `/blog` - Blog sayfası
- `/blog/:slug` - Blog yazı detayları
- `/demo` - Demo sayfası
- `/contact` - İletişim formu
- `/help` - Yardım merkezi
- `/privacy` - Gizlilik politikası
- `/terms` - Kullanım şartları
- `/kvkk` - KVKK bilgilendirmesi

## 🎥 Online Toplantı Sistemi

PsikoRan, Jitsi Meet entegrasyonu ile güvenli ve kullanımı kolay bir çevrimiçi görüşme deneyimi sunar:

- **Modal İçinde Görüşme**: JitsiMeetExternalAPI kullanarak, uygulamadan ayrılmadan aynı sayfada video görüşmeleri yapılabilir
- **Kesintisiz Deneyim**: Kullanıcılar sayfadan ayrılmadan veya yeni sekme açmadan görüşmelerini sürdürebilirler
- **Kolay Erişim**: Randevu detay sayfasından tek tıkla görüşmeye bağlanabilme
- **Güvenli İletişim**: End-to-end şifrelenmiş, KVKK ve GDPR uyumlu görüşmeler
- **Ekran Paylaşımı**: Terapist ve danışan arasında kolay ekran paylaşımı
- **Tam Özellik Seti**: Mikrofon/kamera kontrolü, sohbet, ekran paylaşımı, kayıt, canlı yayın ve diğer Jitsi özellikleri
- **Otomatik Yedekleme**: Bağlantı sorunu veya CSP kısıtlaması durumunda otomatik olarak yeni sekme açma moduna geçiş
- **Düşük Bant Genişliği Modu**: İnternet bağlantısı zayıf olan kullanıcılar için otomatik optimizasyon
- **Tarayıcı Uyumluluğu**: Chrome, Firefox, Safari ve Edge tarayıcılarıyla tam uyumluluk

Entegrasyon, Jitsi'nin resmi `external_api.js` kütüphanesini kullanır ve iFrame içinde tam işlevsel bir Jitsi toplantısı sunar. Bu sistem, "Görüşmeye Katıl" düğmesine tıklandığında otomatik olarak bir modal pencere içinde çalışır ve kullanıcının uygulamadan ayrılmadan görüşme yapmasını sağlar.

### 🛡️ Teknik Detaylar ve Güvenlik

- **Adaptif Çalışma Modu**: Tarayıcının Content Security Policy ayarlarını algılama ve en uygun modu otomatik seçme
- **Retry Mekanizması**: API yüklenememesi durumunda otomatik yeniden deneme (3 kez)
- **Graceful Degradation**: Tüm yöntemler başarısız olursa, kullanıcıya yeni sekmede açma seçeneği sunma
- **Otomatik CSP Tespiti**: İçerik Güvenlik Politikası kısıtlamalarının otomatik algılanması
- **P2P Modu**: Güvenlik için peer-to-peer bağlantı tercih edilir (sunucu üzerinden geçişi minimize eder)
- **Şifrelenmiş İletişim**: WebRTC üzerinden şifrelenmiş ses/video/veri iletimi
- **İleri Düzey Güvenlik Özellikleri**:
  - Lobi modu (Düşman-ortada saldırılarına karşı)
  - Toplantı şifreleme
  - Katılımcı doğrulama
  - E2EE (End-to-End şifreleme) desteği

## 📊 Psikolojik Testler

Sistem, çeşitli psikolojik testleri uygulama, puanlama ve sonuçları görselleştirme özellikleri sunar:

- **Geniş Test Kütüphanesi**: Yaygın kullanılan psikolojik ölçekleri içerir:
  - Beck Depresyon, Anksiyete, Umutsuzluk ve İntihar Ölçekleri
  - SCL-90-R (Semptom Tarama Listesi)
  - SCID-5 (Yapılandırılmış Klinik Görüşme)
  - Edinburgh Doğum Sonrası Depresyon Ölçeği
  - YTT-40 (Yeme Tutumu Testi)
  - Algılanan Stres Ölçeği
  - Arizona Cinsel Yaşantılar Ölçeği
  - Bilişsel Duygu Düzenleme Ölçeği
  - Conners Ebeveyn Değerlendirme Ölçeği
  - Yaygın Anksiyete Bozukluğu Ölçeği
  - Toronto Aleksitimi Ölçeği
- **Otomatik Puanlama**: Test sonuçlarını otomatik olarak hesaplama
- **Görsel Raporlama**: Grafiklerle desteklenmiş detaylı test sonuç raporları
- **İlerleme Kaydı**: Yarım kalan testlere sonradan devam edebilme
- **Güvenli Veri Saklama**: Test sonuçlarının şifrelenerek depolanması

## 🏛️ Veritabanı Yapısı

### Ana Veri Modelleri

- **User**: Supabase Auth kullanıcısı (tüm kullanıcı tipleri için temel kimlik doğrulama)
- **Professional**: Ruh sağlığı uzmanı (Psikoterapist, terapist vs.)
- **Assistant**: Klinik asistanı/sekreteri
- **Client**: Danışanlar/Hastalar
- **Appointment**: Randevular
- **Room**: Görüşme odaları
- **Payment**: Ödeme kayıtları
- **TestResult**: Test sonuçları
- **ClinicSettings**: Klinik çalışma saatleri ve ayarları

### İlişki Yapısı

- Assistant → Professional (1-n): Bir asistan birden çok profesyonel yönetebilir
- Professional → Client (1-n): Bir profesyonelin birden çok danışanı olabilir
- Professional → Appointment (1-n): Bir profesyonelin birden çok randevusu olabilir
- Client → Appointment (1-n): Bir danışanın birden çok randevusu olabilir
- Room → Appointment (1-n): Bir odada birden çok randevu gerçekleşebilir
- Appointment → Payment (1-1): Bir randevuya bir ödeme kaydı olabilir
- Professional/Client → TestResult (1-n): Bir danışan/profesyonel ile ilişkili birden çok test sonucu

## 📁 Proje Yapısı

```
psikoran/
├── public/                    # Statik dosyalar
│   ├── .htaccess              # Apache sunucu yapılandırması
│   ├── index.html             # Ana HTML dosyası
│   ├── robots.txt             # Arama motoru botları için yönergeler
│   ├── _redirects             # Netlify yönlendirmeleri
│   ├── google00123456789.html # Google site doğrulama dosyası
│   ├── .well-known/           # Web standartları için well-known dizini
│   └── assets/                # Organize edilmiş varlıklar
│       ├── pages/             # Statik HTML sayfaları
│       ├── images/            # Görsel dosyaları
│       ├── meta/              # Meta dosyaları (SEO)
│       └── favicons/          # Favicon çeşitleri
├── src/                       # Kaynak kod dosyaları
│   ├── assets/                # Uygulama içi varlıklar
│   │   └── logos/             # Logo dosyaları
│   ├── components/            # Yeniden kullanılabilir bileşenler
│   │   ├── AppointmentDetails.tsx     # Randevu detay bileşeni
│   │   ├── MeetingTimer.tsx           # Toplantı zamanlayıcısı
│   │   ├── JitsiMeeting.tsx           # Jitsi video görüşme bileşeni
│   │   ├── AppointmentActions.tsx     # Randevu işlemleri bileşeni
│   │   ├── OfflineIndicator.tsx       # Çevrimdışı durum göstergesi
│   │   ├── Logo.tsx                   # Logo bileşeni
│   │   ├── CreateAppointmentModal.tsx # Randevu oluşturma modal'ı
│   │   ├── Layout.tsx                 # Ana düzen bileşeni
│   │   ├── layout.css                 # Düzen stilleri
│   │   ├── AuthGuard.tsx              # Kimlik doğrulama koruyucusu
│   │   ├── AppLoader.tsx              # Uygulama yükleme animasyonu
│   │   ├── CookieBanner.tsx           # Çerez izni banner'ı
│   │   ├── AppointmentShareModal.tsx  # Randevu paylaşım modal'ı
│   │   ├── ui/                        # Temel UI bileşenleri
│   │   │   ├── LoadingSpinner.tsx     # Yükleme animasyonu
│   │   │   └── Switch.tsx             # Anahtar bileşeni
│   │   ├── settings/                  # Ayarlar sayfası bileşenleri
│   │   ├── icons/                     # İkon bileşenleri
│   │   ├── payment/                   # Ödeme bileşenleri
│   │   ├── client-details/            # Danışan detayları bileşenleri
│   │   └── layout/                    # Düzen alt bileşenleri
│   ├── data/                  # Statik veri dosyaları
│   │   ├── tests.ts                   # Test verileri ana dosyası
│   │   └── tests/                     # Psikolojik testler
│   │       ├── index.ts               # Test indeksi
│   │       ├── types.ts               # Test tip tanımlamaları
│   │       ├── beck-depression.ts     # Beck Depresyon Ölçeği
│   │       ├── beck-anxiety.ts        # Beck Anksiyete Ölçeği
│   │       ├── beck-hopelessness.ts   # Beck Umutsuzluk Ölçeği
│   │       ├── beck-suicide.ts        # Beck İntihar Ölçeği
│   │       ├── scl90r.ts              # SCL-90-R Semptom Tarama Listesi
│   │       ├── scid-5-cv.ts           # SCID-5 Klinik Versiyon
│   │       ├── scid-5-pd.ts           # SCID-5 Kişilik Bozuklukları
│   │       ├── scid-5-spq.ts          # SCID-5 Kişilik Anketi
│   │       ├── edinburgh.ts           # Edinburgh Doğum Sonrası Depresyon
│   │       ├── ytt40.ts               # Yeme Tutumu Testi
│   │       ├── algılananStres.ts      # Algılanan Stres Ölçeği
│   │       ├── arizonaCinselYasantilar.ts # Arizona Cinsel Yaşantılar
│   │       ├── bilisselDuyguDuzenleme.ts # Bilişsel Duygu Düzenleme
│   │       ├── connersEbeveyn.ts       # Conners Ebeveyn Değerlendirme
│   │       ├── yayginAnksiyete.ts      # Yaygın Anksiyete Bozukluğu
│   │       └── torontoAleksitimi.ts    # Toronto Aleksitimi Ölçeği
│   ├── lib/                   # Yardımcı kütüphaneler
│   │   ├── supabase.ts               # Supabase bağlantısı
│   │   ├── auth.ts                   # Kimlik doğrulama işlevleri
│   │   ├── theme.tsx                 # Tema yönetimi
│   │   ├── blog.ts                   # Blog işlevleri
│   │   └── notifications.ts          # Bildirim işlevleri
│   ├── pages/                 # Sayfa bileşenleri
│   │   ├── index.ts                  # Sayfaların dışa aktarılması
│   │   ├── Dashboard.tsx             # Kontrol paneli sayfası
│   │   ├── Appointments.tsx          # Randevular sayfası
│   │   ├── Settings.tsx              # Ayarlar sayfası
│   │   ├── Payments.tsx              # Ödemeler sayfası
│   │   ├── BlogPost.tsx              # Blog yazısı sayfası
│   │   ├── ClientDetails.tsx         # Danışan detayları sayfası
│   │   ├── Clients.tsx               # Danışanlar sayfası
│   │   ├── Professionals.tsx         # Profesyoneller sayfası
│   │   ├── CreateAssistant.tsx       # Asistan oluşturma sayfası
│   │   ├── ForgotPassword.tsx        # Şifremi unuttum sayfası
│   │   ├── Contact.tsx               # İletişim sayfası
│   │   ├── Login.tsx                 # Giriş sayfası
│   │   ├── Home.tsx                  # Ana sayfa
│   │   ├── Pricing.tsx               # Fiyatlandırma sayfası
│   │   ├── BlogAdmin.tsx             # Blog yönetim sayfası
│   │   ├── Test.tsx                  # Test uygulama sayfası
│   │   ├── Features.tsx              # Özellikler sayfası
│   │   ├── Blog.tsx                  # Blog listeleme sayfası
│   │   ├── Demo.tsx                  # Demo sayfası
│   │   ├── Help.tsx                  # Yardım sayfası
│   │   ├── KVKK.tsx                  # KVKK bilgilendirme sayfası
│   │   ├── Privacy.tsx               # Gizlilik politikası sayfası
│   │   ├── Terms.tsx                 # Kullanım şartları sayfası
│   │   ├── ResetPassword.tsx         # Şifre sıfırlama sayfası
│   │   ├── TestCompleted.tsx         # Test tamamlama sayfası
│   │   └── Layout.tsx                # Sayfa düzeni
│   ├── types/                 # TypeScript tip tanımlamaları
│   ├── utils/                 # Yardımcı fonksiyonlar
│   │   ├── notificationUtils.ts      # Bildirim yardımcıları
│   │   ├── encryption.ts             # Şifreleme yardımcıları
│   │   ├── generateTestPDF.ts        # PDF oluşturma araçları
│   │   ├── logoUtils.ts              # Logo işleme yardımcıları
│   │   └── fonts.ts                  # Font ayarları
│   ├── App.tsx                # Ana uygulama bileşeni
│   ├── main.tsx               # Uygulama giriş noktası
│   ├── index.css              # Temel stil dosyası
│   ├── types.ts               # Genel tip tanımlamaları
│   └── vite-env.d.ts          # Vite tipleri
├── supabase/                  # Supabase yapılandırmaları
│   ├── migrations/            # Veritabanı migrasyonları
│   │   └── 20250126211655_sunny_wood.sql # Veritabanı şema
│   ├── .gitignore             # Supabase için gitignore
│   ├── config.toml            # Supabase yapılandırması
│   └── .temp/                 # Geçici Supabase dosyaları
├── .env                       # Ortam değişkenleri
├── .env.example               # Örnek ortam değişkenleri
├── package.json               # Proje bağımlılıkları
├── package-lock.json          # Paket kilitleme dosyası
├── vite.config.ts             # Vite yapılandırması
├── tailwind.config.js         # Tailwind CSS yapılandırması
├── postcss.config.js          # PostCSS yapılandırması
├── tsconfig.json              # TypeScript yapılandırması
├── tsconfig.app.json          # Uygulama TS yapılandırması
├── tsconfig.node.json         # Node.js TS yapılandırması
├── netlify.toml               # Netlify yapılandırması
├── eslint.config.js           # ESLint yapılandırması
├── .gitignore                 # Git yoksayma dosyası
├── favicon.ico                # Favicon ikonu
└── README.md                  # Bu dosya
```

## 🧩 Dosya İstatistikleri

- **Toplam Sayfa Sayısı**: 27 sayfa bileşeni
- **Toplam Bileşen Sayısı**: 20+ ana bileşen, 50+ alt bileşen
- **Psikolojik Test Sayısı**: 18 farklı test tanımlaması
- **Görünüm Optimizasyonu**: Responsive tasarım, farklı cihazlara uygun
- **Destek Tarayıcılar**: Chrome, Firefox, Safari, Edge

## 📱 Mobil Uyumluluğu

Uygulama, mobil cihazlarda da tam işlevsellik sunacak şekilde responsive tasarıma sahiptir:

- **Responsive UI**: Tüm ekran boyutlarına uyarlanabilen arayüz
- **Touch Optimizasyonu**: Dokunmatik ekranlar için optimize edilmiş kontroller
- **Mobil İşlevler**: Push bildirimleri, kamera erişimi ve dosya yükleme desteği
- **Offline Destek**: Sınırlı offline çalışabilirlik

## 🎨 Kullanıcı Arayüzü ve Kullanıcı Deneyimi

PsikoRan, kullanıcı deneyimini ön planda tutan, estetik ve işlevsel bir tasarıma sahiptir. Modern web standartlarına uygun şekilde geliştirilen arayüz şu özellikleri sunar:

### 🌈 Görsel Tasarım ve Temalar

- **Çift Tema Desteği**: Otomatik karanlık/aydınlık mod geçişi, kullanıcının sistem tercihine göre uyarlanır
- **Renk Paleti**: Profesyonel ve rahatlatıcı bir renk paleti, klinik ortama uygun ton ve geçişler
- **Gradyan Arka Planlar**: Yumuşak ve göz yormayan gradyan geçişler
- **Cam Efekti (Glassmorphism)**: Modern UI trendlerine uygun, backdrop-blur ile zenginleştirilmiş arayüz elemanları
- **Tutarlı Tasarım Dili**: Tüm uygulama boyunca aynı tasarım prensiplerini takip eden tutarlı bir arayüz

### ⚡ Performans ve Etkileşim

- **Akıcı Animasyonlar**: Framer Motion ile sayfa geçişleri ve bileşen animasyonları
- **Mikro-Etkileşimler**: Butonlar, kartlar ve formlar için hover/tap animasyonları
- **Yükleme Durumları**: Optimistik UI yaklaşımı ile kullanıcıya anında geri bildirim
- **Bildirimler**: Zarif ve bilgilendirici bildirim sistemi (başarı, hata, uyarı)
- **Geçişler**: Yumuşak modal geçişleri ve sayfa yükleme animasyonları

### 📊 Danışan Yönetimi Arayüzü

Danışan yönetimi, PsikoRan'ın en önemli modüllerinden biridir ve şu özelliklere sahiptir:

- **Danışan Listesi**: 
  - Filtreleme ve sıralama özellikleri
  - Hızlı arama fonksiyonu
  - Kart ve liste görünümleri arasında geçiş
  - Sezgisel danışan ekleme/düzenleme

- **Danışan Detayları**: 
  - Sekmeli bilgi yapısı (Genel Bilgiler, Randevular, Notlar, Test Sonuçları)
  - Düzenlenebilir profil kartları
  - Animasyonlu veri kartları
  - İlişkisel verilerin görsel temsili

- **Modallar ve Diyaloglar**:
  - Animasyonlu açılış/kapanış efektleri
  - Keyboard-accessible arayüz 
  - Bilgi formu validasyonu
  - İşlem geri bildirimleri

### 📱 Farklı Cihaz Sınıfları İçin Optimizasyon

- **Masaüstü**: Zengin yan menüler, gelişmiş veri görselleştirme, çoklu panel desteği
- **Tablet**: Dokunmatik ekrana optimize edilmiş kontroller, ayarlanmış içerik düzeni
- **Mobil**: Tek sütunlu düzen, kolay gezinme, başparmak erişimine uygun yerleşim

### 🚀 Kullanılabilirlik Geliştirmeleri

- **Hızlı İşlemler**: Sık kullanılan işlemlere tek tıkla erişim
- **Form Tasarımı**: Kullanıcı dostu, adım adım formlar ve anında validasyon
- **Yardım İpuçları**: Bağlam duyarlı yardım ve ipuçları
- **Klavye Kısayolları**: Güç kullanıcılar için klavye navigasyonu
- **Kolay Filtreleme**: Gelişmiş arama ve filtreleme özellikleri
- **Özelleştirilebilir Dashboard**: Kullanıcının kendi ihtiyaçlarına göre düzenleyebileceği kontrol paneli

## 🧪 Teknik Perspektif: PsikoRan Nasıl Çalışır?

PsikoRan, modern web teknolojileri kullanılarak geliştirilmiş bir uygulamadır. İşte bu uygulamanın teknik açıdan nasıl çalıştığına dair detaylar:

### 🏗️ Mimari Yapı

Uygulama, istemci tarafında ağırlıklı (client-heavy) bir yaklaşımla tasarlanmıştır:

- **Frontend**: React ve TypeScript ile geliştirilen SPA (Single Page Application)
- **Backend**: Supabase platformu tarafından sağlanan sunucu taraflı hizmetler
- **Veritabanı**: PostgreSQL (Supabase tarafından yönetilen)
- **Kimlik Doğrulama**: Supabase Auth (JWT tabanlı)
- **Depolama**: Supabase Storage (dosya ve medya için)

Bu yapı, geliştirme sürecini hızlandırırken, bakım kolaylığı ve yüksek performans sağlar.

### 💾 Veri Modeli ve İlişkiler

PsikoRan'ın veri modeli, ruh sağlığı kliniklerinin ihtiyaçlarına göre özel olarak tasarlanmıştır:

- **Users**: Tüm kullanıcı tipleri için temel tablo (Supabase Auth)
- **Professionals**: Ruh sağlığı uzmanları ve bilgileri
- **Assistants**: Klinik asistanları ve yönetim personeli
- **Clients**: Danışanlar ve kişisel bilgileri
- **Appointments**: Randevular ve detayları
- **Rooms**: Klinik odaları ve özellikleri
- **Payments**: Ödeme kayıtları ve finansal veriler
- **TestResults**: Test sonuçları ve değerlendirmeler
- **ClinicSettings**: Klinik çalışma saatleri ve genel ayarlar
- **WorkingHours**: Profesyonellerin çalışma saatleri
- **Breaks**: Mola zamanları ve özel zaman blokları
- **Vacations**: İzin ve tatil kayıtları

Tablolar arasındaki ilişkiler, foreign key kısıtlamaları ile korunur ve RLS (Row Level Security) politikaları ile erişim kontrol edilir.

### 🔄 Uygulama Bileşenleri ve İş Akışı

PsikoRan, modüler bir yapıda geliştirilmiştir ve ana bileşenleri şunlardır:

1. **Auth Module**: 
   - Kullanıcı girişi, kayıt ve yetkilendirme
   - Güvenli oturum yönetimi
   - Role-based access control (RBAC)

2. **Dashboard Module**:
   - Görselleştirilmiş veri analitiği
   - Performans metrikleri ve KPI göstergeleri
   - Kişiselleştirilmiş özet ve bildirimler

3. **Appointment Module**:
   - Takvim entegrasyonu
   - Akıllı randevu algoritması (uygun zaman/oda)
   - Durum yönetimi ve bildirimler

4. **Client Module**:
   - Danışan kayıt ve profil yönetimi
   - Tedavi geçmişi ve dosya takibi
   - Şifrelenmiş seans notları

5. **Testing Module**:
   - Dijital test uygulama motoru
   - Otomatik puanlama algoritmaları
   - Sonuç görselleştirme ve raporlama

6. **Video Conferencing Module**:
   - Jitsi Meet entegrasyonu
   - WebRTC tabanlı P2P iletişim
   - Ekran paylaşımı ve chat özellikleri

7. **Payment Module**:
   - Finansal takip ve raporlama
   - Fatura oluşturma
   - Gelir analizi ve tahmin

Her modül, kendi içinde bağımsız çalışacak şekilde tasarlanmış, ancak merkezi bir veri yapısı üzerinden diğer modüllerle iletişim kurar.

### 🛠️ Kullanılan Teknolojiler ve Kütüphaneler

PsikoRan, çeşitli modern teknolojileri ve kütüphaneleri bir araya getirir:

1. **Frontend Çatısı**:
   - React 18.3+ ve TypeScript
   - Vite (hızlı derleme ve geliştirme)
   - React Router v6 (sayfa yönlendirme)
   - Zustand (hafif ve kolay durum yönetimi)

2. **UI Kütüphaneleri**:
   - Tailwind CSS (utility-first styling)
   - Headless UI (erişilebilir bileşenler)
   - Mantine ve MUI (kullanıcı arayüzü bileşenleri)
   - Lucide React ve Feather Icons (simgeler)
   - Framer Motion (animasyonlar)

3. **Veri İşleme**:
   - Chart.js ve React-Chartjs-2 (veri görselleştirme)
   - date-fns (tarih işlemleri)
   - jsPDF ve jsPDF-AutoTable (PDF oluşturma)
   - React Hook Form (form yönetimi ve doğrulama)

4. **Medya İşleme**:
   - TipTap/ProseMirror (zengin metin editörü)
   - CKEditor ve TinyMCE (alternatif WYSIWYG editörler)
   - Sharp ve WebP Converter (görüntü işleme)

5. **Güvenlik ve Şifreleme**:
   - CryptoJS (AES şifreleme)
   - Web Crypto API (modern şifreleme)
   - TweetNaCl (şifreleme primitifleri)

6. **Backend ve Veritabanı**:
   - Supabase Client (veritabanı bağlantısı)
   - PostgreSQL (ilişkisel veritabanı)
   - RLS (Row Level Security, satır bazlı erişim kontrolü)

7. **Video Konferans**:
   - Jitsi Meet SDK (görüntülü görüşme)
   - WebRTC (gerçek zamanlı iletişim)

Bu teknolojiler, modüler bir yapıda bir araya getirilerek, ölçeklenebilir, güvenli ve hızlı bir uygulama ortaya çıkarır.

### 📱 Mobil Optimizasyon

PsikoRan, mobil cihazlarda da sorunsuz çalışacak şekilde optimize edilmiştir:

- **Responsive Design**: Tüm ekran boyutları için özel UI ayarlamaları
- **Media Queries**: Farklı cihazlar için optimize edilmiş CSS
- **Touch Optimizasyonu**: Dokunmatik ekranlar için büyük tıklama alanları
- **PWA Desteği**: Progressive Web App özellikleri
- **Lazy Loading**: Sayfa performansı için geç yükleme teknikleri
- **Offline Support**: Sınırlı offline çalışabilirlik
- **Service Workers**: Arkaplan senkronizasyonu ve bildirimler

### 🔒 Güvenlik Mimarisi

Uygulama, hassas sağlık verilerini korumak için çok katmanlı bir güvenlik yaklaşımı benimser:

1. **Kimlik Doğrulama Katmanı**:
   - JWT (JSON Web Tokens) tabanlı yetkilendirme
   - Güvenli şifre politikaları
   - Oturum zaman aşımı ve yenileme mekanizmaları
   - 2FA (İki faktörlü kimlik doğrulama) desteği

2. **Veri Erişim Katmanı**:
   - Row Level Security (RLS) politikaları
   - Role-based access control (RBAC)
   - Foreign key kısıtlamaları
   - Prepared statements ile SQL injection koruması

3. **Şifreleme Katmanı**:
   - Transport Layer Security (TLS/SSL)
   - AES-256 ile hassas verilerin şifrelenmesi (seans notları için)
   - Şifreleme anahtarı yönetimi
   - Kriptografik salt ve initialization vectors (IV) kullanımı

4. **Uygulama Güvenliği**:
   - Content Security Policy (CSP)
   - XSS (Cross-Site Scripting) koruması
   - CSRF (Cross-Site Request Forgery) önlemleri
   - Input validation ve sanitization

5. **İşletim Güvenliği**:
   - Düzenli güvenlik denetimleri
   - Günlük kayıtları ve anormal aktivite tespiti
   - Otomatik güvenlik güncellemeleri
   - Veri yedekleme ve felaket kurtarma prosedürleri

Bu çok katmanlı güvenlik yaklaşımı, KVKK ve GDPR gibi veri koruma düzenlemelerine uyumluluğu sağlar.

## 🔑 Ortam Değişkenleri

Uygulama aşağıdaki ortam değişkenlerini kullanır:

```
# Admin Kimlik Bilgileri
VITE_ADMIN_EMAIL=admin@example.com
VITE_ADMIN_PASSWORD=your_secure_password_here

# Güvenlik Anahtarları
VITE_TEST_TOKEN_SECRET_KEY=your_test_token_secret_key_here

# Supabase Yapılandırması
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Uygulama Ayarları
VITE_APP_NAME=PsikoRan
VITE_APP_DESCRIPTION="Profesyonel Danışmanlık Merkezi"
VITE_APP_URL=https://psikoran.com
```

## 🚢 Dağıtım

Uygulama, Netlify üzerinde kolayca dağıtılabilir. Netlify ile dağıtım yapmak için:

1. Netlify hesabınıza giriş yapın
2. "New site from Git" seçeneğini seçin
3. GitHub reponuzu seçin
4. Build komutunu doğrulayın: `npm run build`
5. Publish directory: `dist`
6. Environment variables bölümünden gerekli değişkenleri ayarlayın
7. "Deploy site" butonuna tıklayın

## 👥 Katkıda Bulunma

1. Bu repoyu forklayın
2. Yeni bir özellik dalı oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Dalınıza push edin (`git push origin feature/amazing-feature`)
5. Bir Pull Request açın

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.

---

Geliştirici ve tasarım ekibi olarak, PsikoRan'ı sürekli geliştirmek için çalışıyoruz. Geri bildirimleriniz bizim için değerlidir! Herhangi bir sorunuz veya öneriniz varsa lütfen iletişime geçin.

İletişim: [bilgi@psikoran.com](mailto:bilgi@psikoran.com)
