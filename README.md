# PsikoRan - Profesyonel Danışmanlık Merkezi

PsikoRan, ruh sağlığı uzmanları için randevu ve danışan yönetim sistemi.

## Logo Yükleme Talimatları

Uygulama logoları sıfırdan yapılandırıldı. Aşağıdaki dosyaları belirtilen boyut ve formatlarda hazırlayıp ilgili klasörlere eklemeniz gerekmektedir:

### 1. SVG Logosu (Vektörel Format)

- `src/assets/logo/app-logo.svg` - Ana logo dosyası (vektörel)

### 2. PNG Logoları (Bitmap Format)

Public klasörüne eklenmesi gereken PNG logoları:

- `public/app-logo-sm.png` - 192x192 boyutunda PNG logo
- `public/app-logo-md.png` - 512x512 boyutunda PNG logo
- `public/app-logo-lg.png` - 1024x1024 boyutunda PNG logo

### 3. Favicon

- `public/favicon.svg` - Sekme ikonları için vektör formatında favicon

## Logo Değişikliği Yapılırken Dikkat Edilmesi Gerekenler

1. Tüm logoların aynı tasarıma sahip olması önemlidir
2. PNG logolar farklı çözünürlüklerde aynı keskinliği sağlayacak şekilde hazırlanmalıdır
3. Logo dosyalarını değiştirirken dosya adlarını değiştirmemeye özen gösterin
4. SVG formatının vektörel olması nedeniyle her boyutta keskin görüntü sağladığını unutmayın

## Logo Kullanımı

Logo bileşenleri, `src/components/Logo.tsx` dosyasında tanımlanmıştır. Logolar, uygulama içinde farklı boyutlarda ve varyasyonlarda kullanılabilir.

## Görsel Dosyaları

Sistem tarafından kullanılan görsel dosyaları:

- `public/favicon.svg` - Sekme ikonları için vektör formatında favicon
- `public/logo_1.png` - İsim ve logo içeren PNG logo
- `public/logo_2.png` - Sadece logo içeren PNG logo (192x192, 512x512, 1024x1024 boyutlarında kullanılıyor)
