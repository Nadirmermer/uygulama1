# PsikoRan - Profesyonel Danışmanlık Merkezi

![PsikoRan Logo](/public/assets/pwa/logo_2-192x192.png)

PsikoRan, psikologlar, psikiyatristler ve diğer ruh sağlığı uzmanları için geliştirilmiş, kapsamlı bir danışmanlık ve klinik yönetim sistemidir. Modern arayüzü ve kullanıcı dostu yapısıyla, terapistlerin danışanlarını, randevularını, testlerini ve ödemelerini profesyonel bir şekilde yönetebilmelerini sağlar.

## 📑 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [Online Toplantı Sistemi](#online-toplantı-sistemi)
- [Psikolojik Testler](#psikolojik-testler)
- [PWA Özellikleri](#pwa-özellikleri)
- [Veri Güvenliği](#veri-güvenliği)
- [Klasör Yapısı](#klasör-yapısı)
- [SEO Optimizasyonu](#seo-optimizasyonu)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Dağıtım](#dağıtım)
- [Katkıda Bulunma](#katkıda-bulunma)
- [Lisans](#lisans)

## ✨ Özellikler

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

## 🚀 Teknolojiler

- **Frontend**:
  - React 18.3+ ve TypeScript
  - Tailwind CSS ve çeşitli UI kütüphaneleri (Headless UI, Mantine, MUI)
  - Framer Motion ile animasyonlar
  - React Router v6 ile gelişmiş yönlendirme
  - Zustand ile durum yönetimi
  
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
  
- **PWA & Mobil Deneyim**:
  - Service Workers
  - Offline desteği
  - Push bildirimleri
  - Responsive tasarım

- **Güvenlik**:
  - End-to-end şifreleme (CryptoJS, TweetNaCl)
  - KVKK ve GDPR uyumlu veri işleme

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
- `/blog-admin` - Blog yönetim paneli

### Diğer Sayfalar

- `/test/:testId/:clientId` - Test uygulama sayfası
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

- **Kolay Erişim**: Randevudan direkt olarak görüşmeye bağlanabilme
- **Güvenli Oturumlar**: Şifreli ve güvenli video görüşmeleri
- **Ekran Paylaşımı**: Terapist ve danışan arasında ekran paylaşımı
- **Kayıt Seçeneği**: İsteğe bağlı görüşme kaydı (KVKK uyumlu)
- **Düşük Bant Genişliği Modu**: İnternet bağlantısı zayıf olan kullanıcılar için optimizasyon

## 📊 Psikolojik Testler

Sistem, çeşitli psikolojik testleri uygulama, puanlama ve sonuçları görselleştirme özellikleri sunar:

- **Geniş Test Kütüphanesi**: Yaygın kullanılan psikolojik ölçekleri içerir
- **Otomatik Puanlama**: Test sonuçlarını otomatik olarak hesaplama
- **PDF Raporlama**: Detaylı test sonuç raporları oluşturma
- **Karşılaştırmalı Analiz**: Önceki test sonuçlarıyla karşılaştırma
- **Güvenli Veri Saklama**: Test sonuçlarının güvenli depolanması

## 📱 PWA Özellikleri

PsikoRan, tam bir Progressive Web App (PWA) olarak tasarlanmıştır:

- **Çevrimdışı Çalışma**: Temel özellikler internet bağlantısı olmadan da çalışır
- **Yüklenebilir**: Mobil cihazlara ve masaüstüne uygulama olarak eklenebilir
- **Bildirimler**: Randevu hatırlatmaları için push bildirimleri
- **Hızlı Yüklenme**: Önbelleğe alma stratejileri ile hızlı performans
- **Responsive Tasarım**: Tüm cihazlarda mükemmel görüntüleme deneyimi

Service worker özellikleri:
- Statik varlıklar için agresif önbelleğe alma
- API istekleri için Network-First stratejisi
- Çevrimdışı sayfa yönlendirmeleri
- Önbellek versiyonlama ve otomatik güncelleme

## 🔐 Veri Güvenliği

Sistem, danışan verilerinin korunması için çeşitli güvenlik önlemleri içerir:

- **Uçtan Uca Şifreleme**: Hassas danışan verilerinin şifrelenmesi
- **Row Level Security**: Supabase veritabanında satır seviyesinde erişim kontrolü
- **Rol Tabanlı Erişim**: Profesyonel, asistan ve sistem yöneticisi rolleri için özel izin yapısı
- **KVKK/GDPR Uyumlu**: Kişisel verilerin korunması mevzuatına uygun veri işleme
- **Güvenli Oturum Yönetimi**: JWT tabanlı güvenli kimlik doğrulama
- **Güvenli Şifre Politikası**: Güçlü şifre gereksinimleri ve şifre sıfırlama

## 📁 Klasör Yapısı

```
psikoran/
├── public/                    # Statik dosyalar
│   ├── assets/                # Organize edilmiş varlıklar
│   │   ├── meta/             # Meta dosyaları (SEO, PWA)
│   │   │   ├── config/       # Yapılandırma dosyaları
│   │   │   └── seo/          # SEO için gerekli dosyalar
│   │   ├── pwa/              # PWA görselleri ve Service Worker
│   │   ├── pages/            # Statik HTML sayfaları
│   │   ├── favicons/         # Favicon çeşitleri
│   │   └── images/           # Görseller
│   ├── _redirects             # Netlify yönlendirmeleri
│   └── manifest.json          # PWA manifest dosyası
├── src/                       # Kaynak kodları
│   ├── assets/                # Proje görselleri ve dosyaları
│   ├── components/            # Yeniden kullanılabilir bileşenler
│   │   ├── ui/               # UI bileşenleri
│   │   ├── layout/           # Düzen bileşenleri
│   │   ├── icons/            # Simge bileşenleri
│   │   ├── client-details/    # Danışan detayları bileşenleri
│   │   ├── settings/         # Ayarlar bileşenleri
│   │   └── payment/          # Ödeme bileşenleri
│   ├── lib/                   # Yardımcı kütüphaneler
│   │   ├── auth.ts           # Kimlik doğrulama işlevleri
│   │   ├── supabase.ts       # Supabase istemcisi
│   │   ├── theme.tsx         # Tema yönetimi
│   │   ├── blog.ts           # Blog işlevleri
│   │   └── notifications.ts  # Bildirim işlevleri
│   ├── pages/                 # Sayfa bileşenleri
│   ├── utils/                 # Yardımcı fonksiyonlar
│   │   ├── encryption.ts     # Şifreleme yardımcıları
│   │   ├── notificationUtils.ts # Bildirim yardımcıları
│   │   ├── generateTestPDF.ts  # PDF oluşturma araçları
│   │   └── sitemapClient.ts  # Sitemap oluşturma
│   ├── types/                 # TypeScript tip tanımlamaları
│   ├── data/                  # Statik veri dosyaları
│   ├── App.tsx                # Ana uygulama bileşeni
│   └── main.tsx               # Giriş noktası
├── supabase/                  # Supabase yapılandırmaları
│   └── migrations/            # Veritabanı migrasyonları
├── .env.example               # Örnek ortam değişkenleri
├── .env                       # Ortam değişkenleri
├── package.json               # Proje bağımlılıkları
├── vite.config.ts             # Vite yapılandırması
├── tailwind.config.js         # Tailwind CSS yapılandırması
├── tsconfig.json              # TypeScript yapılandırması
└── netlify.toml               # Netlify yapılandırması
```

## 🔍 SEO Optimizasyonu

Uygulama, aşağıdaki SEO optimizasyonlarına sahiptir:

- **Meta Etiketleri**: Tüm sayfalar için doğru meta açıklamaları ve başlıklar
- **Yapılandırılmış Veri**: Schema.org JSON-LD formatında yapılandırılmış veri
- **Sitemap**: XML ve HTML formatında site haritaları
  - `/assets/meta/seo/sitemap.xml` - Arama motorları için
  - `/sitemap` - Kullanıcılar için görsel site haritası
- **Robots.txt**: Arama motoru botları için yönergeler
- **Canonical URL'ler**: Çoğaltılmış içerik sorunlarını önlemek için
- **Open Graph & Twitter Cards**: Sosyal medya paylaşımları için optimize edilmiş
- **Blog SEO**: Blog yazıları için otomatik SEO optimizasyonu

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
