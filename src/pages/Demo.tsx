import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Users, 
  BarChart, 
  MessageSquare, 
  FileText, 
  ChevronRight, 
  ChevronLeft, 
  PlayCircle
} from 'lucide-react';

import logo2 from '../assets/logo/logo_2.png';

export function Demo() {
  useEffect(() => {
    document.title = "Ürün Demosu - PsikoRan";
    window.scrollTo(0, 0);
  }, []);

  // Demo sekmeleri için state
  const [activeTab, setActiveTab] = useState('randevu');

  // Demo içeriği
  const demoTabs = [
    {
      id: 'randevu',
      title: 'Randevu Yönetimi',
      icon: <Calendar className="h-5 w-5" />,
      description: 'Sürükle-bırak randevu sistemi ile zaman yönetimi artık çok kolay.',
      features: [
        'Sürükle-bırak kullanıcı arayüzü',
        'Tekrarlayan randevular',
        'Otomatik hatırlatmalar',
        'Çakışmaları önleme sistemi',
        'Danışan bazlı renk kodlaması'
      ],
      video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      image: '/assets/images/demo/randevu.png'
    },
    {
      id: 'danisan',
      title: 'Danışan Portali',
      icon: <Users className="h-5 w-5" />,
      description: 'Danışanlarınız kendi hesaplarıyla randevu oluşturabilir ve geçmiş kayıtlarını görüntüleyebilir.',
      features: [
        'Danışan hesap yönetimi',
        'Online randevu oluşturma',
        'Ödevlere erişim',
        'İlerleme raporları',
        'Güvenli mesajlaşma'
      ],
      video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      image: '/assets/images/demo/danisan.png'
    },
    {
      id: 'rapor',
      title: 'Analitik ve Raporlar',
      icon: <BarChart className="h-5 w-5" />,
      description: 'Danışan demografisi, gelir analizi ve büyüme raporları ile işinizi daha etkin yönetin.',
      features: [
        'Gelir analizleri',
        'Zaman kullanım raporları',
        'Danışan demografisi',
        'Otomatik raporlama',
        'Özelleştirilebilir grafikler'
      ],
      video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      image: '/assets/images/demo/analitik.png'
    },
    {
      id: 'mesajlasma',
      title: 'Güvenli Mesajlaşma',
      icon: <MessageSquare className="h-5 w-5" />,
      description: 'KVKK ve GDPR uyumlu, uçtan uca şifreli mesajlaşma sistemi.',
      features: [
        'Uçtan uca şifreleme',
        'Dosya paylaşımı',
        'Bildirim sistemi',
        'Danışan grupları',
        'Şablon mesajlar'
      ],
      video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      image: '/assets/images/demo/mesajlasma.png'
    },
    {
      id: 'dokuman',
      title: 'Doküman Yönetimi',
      icon: <FileText className="h-5 w-5" />,
      description: 'Tüm dokümanlarınızı ve formlarınızı tek bir yerde yönetin.',
      features: [
        'Şablon kütüphanesi',
        'Online form oluşturma',
        'PDF dönüştürme',
        'Otomatik arşivleme',
        'Gelişmiş arama'
      ],
      video: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      image: '/assets/images/demo/dokuman.png'
    }
  ];

  // Şu anda aktif olan sekmeyi bul
  const activeTabContent = demoTabs.find(tab => tab.id === activeTab);

  // Önceki ve sonraki sekmelere geçiş için yardımcı fonksiyonlar
  const goToNextTab = () => {
    const currentIndex = demoTabs.findIndex(tab => tab.id === activeTab);
    const nextIndex = (currentIndex + 1) % demoTabs.length;
    setActiveTab(demoTabs[nextIndex].id);
  };

  const goToPrevTab = () => {
    const currentIndex = demoTabs.findIndex(tab => tab.id === activeTab);
    const prevIndex = (currentIndex - 1 + demoTabs.length) % demoTabs.length;
    setActiveTab(demoTabs[prevIndex].id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-900/95 shadow-sm border-b border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 p-0.5 shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300">
                <div className="absolute inset-0 rounded-xl bg-white dark:bg-slate-900 p-1">
                  <img src={logo2} alt="PsikoRan Logo" className="h-full w-full object-contain" />
                </div>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 group-hover:from-primary-600 group-hover:to-primary-500 dark:group-hover:from-primary-400 dark:group-hover:to-primary-300 transition-all duration-300">
                PsikoRan
              </span>
            </Link>
            
            <Link
              to="/create-assistant"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <span>Ücretsiz Hesap Aç</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Hero Bölümü */}
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              PsikoRan <span className="text-primary-600 dark:text-primary-400">Demo</span> Turu
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              PsikoRan'ın güçlü özelliklerini keşfedin ve platformun klinik süreçlerinizi nasıl dönüştürebileceğini görün.
            </p>
            <div className="inline-flex items-center space-x-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-medium px-4 py-2 rounded-full">
              <Clock className="h-4 w-4 mr-1" />
              <span>Demo Süresi: ~5 dakika</span>
            </div>
          </motion.div>
        </section>

        {/* Demo Sekmeleri */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-10">
          {demoTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center p-4 rounded-lg border transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 shadow-md'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:shadow-md'
              }`}
            >
              <div className={`mr-3 p-2 rounded-lg ${
                activeTab === tab.id
                  ? 'bg-primary-100 dark:bg-primary-800/40 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.icon}
              </div>
              <span className={`font-medium ${
                activeTab === tab.id
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {tab.title}
              </span>
            </button>
          ))}
        </div>

        {/* Demo İçeriği */}
        {activeTabContent && (
          <motion.div
            key={activeTabContent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
          >
            {/* Sol Taraf - İçerik */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
                {activeTabContent.icon}
                <span className="ml-3">{activeTabContent.title}</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                {activeTabContent.description}
              </p>

              <div className="space-y-4 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Öne Çıkan Özellikler</h3>
                <ul className="space-y-3">
                  {activeTabContent.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                        <svg className="h-3 w-3 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={goToPrevTab}
                  className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Önceki
                </button>
                <button
                  onClick={goToNextTab}
                  className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  Sonraki
                  <ChevronRight className="h-5 w-5 ml-2" />
                </button>
              </div>
            </div>

            {/* Sağ Taraf - Görsel veya Video */}
            <div className="relative rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 aspect-video">
              {/* Video veya görsel burada gösterilecek */}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/5 dark:bg-slate-900/40">
                <button className="p-4 rounded-full bg-primary-600/90 text-white hover:bg-primary-700 transition-colors duration-300">
                  <PlayCircle className="h-12 w-12" />
                </button>
              </div>
              {/* Görsel arka plan (istege bağlı) */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/20 dark:to-indigo-900/20 opacity-80 dark:opacity-30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-slate-500 dark:text-slate-400 text-center px-6">
                  [Demo içeriği burada görüntülenecek. Gerçek uygulamada bu alan
                  interaktif bir demo veya video içerecektir.]
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA Bölümü */}
        <section className="mt-20">
          <div className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 rounded-2xl p-8 md:p-12 border border-primary-100 dark:border-primary-800/30 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-primary-300/20 dark:bg-primary-500/10 blur-3xl"
                animate={{ 
                  x: [0, 10, 0],
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
              />
              <motion.div 
                className="absolute -left-10 bottom-10 w-48 h-48 rounded-full bg-indigo-300/30 dark:bg-indigo-500/10 blur-3xl"
                animate={{ 
                  x: [0, -10, 0],
                  y: [0, 10, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut", delay: 1 }}
              />
            </div>
            
            <div className="relative z-10">
              <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Ücretsiz Hesap Oluşturarak Deneyimlemeye Başlayın
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                  30 gün boyunca tüm premium özelliklere erişin, kredi kartı gerektirmez, istediğiniz zaman iptal edebilirsiniz.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    to="/create-assistant"
                    className="px-6 py-3 rounded-lg bg-primary-600 text-white font-medium text-center shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:bg-primary-700 transition-all duration-300 flex items-center justify-center"
                  >
                    <span>Şimdi Başlayın</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/pricing"
                    className="px-6 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium text-center hover:shadow-md transition-all duration-300"
                  >
                    <span>Fiyatlandırmayı Görüntüle</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-20 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg overflow-hidden bg-primary-100 dark:bg-primary-900/50 p-1.5">
                  <img src={logo2} alt="PsikoRan Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  PsikoRan
                </span>
              </Link>
              <span className="mx-3 text-slate-300 dark:text-slate-700">|</span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                © {new Date().getFullYear()} Tüm hakları saklıdır
              </span>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
                Gizlilik
              </Link>
              <Link to="/terms" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
                Şartlar
              </Link>
              <Link to="/contact" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors">
                İletişim
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Demo; 