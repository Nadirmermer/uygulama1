# PsikoRan - Profesyonel Danışmanlık Merkezi

![PsikoRan Logo](/public/assets/pwa/logo_2-192x192.png)

PsikoRan, psikologlar ve danışanlar için geliştirilmiş, kapsamlı bir danışmanlık ve randevu yönetim sistemidir. Terapistlerin danışanlarını, randevularını ve ödemelerini kolayca yönetebilmeleri için tasarlanmış, modern ve kullanıcı dostu bir web uygulamasıdır.

## 📑 İçindekiler

- [Özellikler](#özellikler)
- [Teknolojiler](#teknolojiler)
- [Kurulum](#kurulum)
- [Kullanım](#kullanım)
- [PWA Özellikleri](#pwa-özellikleri)
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
- **Test ve Değerlendirmeler**: Psikolojik testleri danışanlarınıza kolayca uygulayın
- **Ödeme Takibi**: Danışan ödemelerini izleyin ve fatura oluşturun
- **Klinik Asistanları**: Asistanlarınızı sisteme ekleyerek iş akışını optimize edin

### 👨‍👩‍👧‍👦 Danışanlar İçin
- **Randevu Görüntüleme**: Gelecek randevularınızı görüntüleyin ve hatırlatmalar alın
- **Online Testler**: Size atanan psikolojik testleri çevrimiçi olarak tamamlayın
- **İletişim**: Terapistinizle güvenli bir şekilde iletişim kurun

### 👨‍💼 Asistanlar İçin
- **Randevu Yönetimi**: Randevuları oluşturun ve düzenleyin
- **Danışan Kayıtları**: Yeni danışanları sisteme ekleyin
- **İletişim**: Danışanlarla ön görüşme ve bilgilendirme yapın

## 🚀 Teknolojiler

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Authentication, Database, Storage)
- **PWA**: Service Workers, Offline Desteği
- **Diğer Araçlar**: 
  - PDF Oluşturma (jsPDF)
  - Form Validasyonu (React Hook Form)
  - Zengin Metin Editörü (TipTap)
  - Şifreleme (CryptoJS)
  - Tarih İşlemleri (date-fns, dayjs)

## 💻 Kurulum

### Ön Gereksinimler
- Node.js (v16 veya üzeri)
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

### Ana Sayfalar

- `/dashboard` - Ana kontrol paneli
- `/clients` - Danışan listesi ve yönetimi
- `/professionals` - Terapist listesi (Sadece yönetici kullanımı için)
- `/appointments` - Randevu takvimi ve planlama
- `/payments` - Ödeme takibi ve faturalandırma
- `/settings` - Hesap ve sistem ayarları

### Diğer Sayfalar

- `/test/:testId/:clientId` - Test uygulama sayfası
- `/public-test/:token` - Halka açık test sayfası (token ile erişim)
- `/test-completed` - Test tamamlama ekranı
- `/contact` - İletişim formu
- `/help` - Yardım merkezi
- `/privacy` - Gizlilik politikası
- `/terms` - Kullanım şartları
- `/kvkk` - KVKK bilgilendirmesi

## 📱 PWA Özellikleri

PsikoRan, tam bir Progressive Web App (PWA) olarak tasarlanmıştır ve aşağıdaki özellikleri içerir:

- **Çevrimdışı Çalışma**: Temel özellikler internet bağlantısı olmadan da çalışır
- **Yüklenebilir**: Mobil cihazlara ve masaüstüne uygulama olarak eklenebilir
- **Bildirimler**: Randevu hatırlatmaları için push bildirimleri
- **Hızlı Yüklenme**: Önbelleğe alma stratejileri ile hızlı performans
- **Responsive Tasarım**: Tüm cihazlarda mükemmel görüntüleme deneyimi

Service worker uygulaması aşağıdaki özelliklere sahiptir:
- Statik varlıklar için agresif önbelleğe alma
- API istekleri için Network-First stratejisi
- Çevrimdışı sayfa yönlendirmeleri
- Önbellek versiyonlama ve otomatik güncelleme

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
│   └── index.html             # Ana HTML dosyası
├── src/                       # Kaynak kodları
│   ├── assets/                # Proje görselleri ve dosyaları
│   ├── components/            # Yeniden kullanılabilir bileşenler
│   ├── lib/                   # Yardımcı kütüphaneler
│   ├── pages/                 # Sayfa bileşenleri
│   ├── utils/                 # Yardımcı fonksiyonlar
│   ├── App.tsx                # Ana uygulama bileşeni
│   └── main.tsx               # Giriş noktası
├── .env.example               # Örnek ortam değişkenleri
├── package.json               # Proje bağımlılıkları
├── vite.config.ts             # Vite yapılandırması
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
VITE_APP_URL=https://your-site-url.netlify.app
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
