import { useState, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addMinutes,
  parseISO,
  isWithinInterval,
  addDays,
  isSameDay,
  isValid,
  getDaysInMonth,
  eachDayOfInterval,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  subDays,
  addMonths
} from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Wallet,
  CreditCard,
  HandCoins,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart4,
  Users,
  BrainCircuit,
  Layers,
  Bell,
  User,
  Settings,
  Menu,
  X,
  BarChart,
  LineChart,
  PieChart,
  Sparkles,
  Building2,
  Activity,
  CalendarOff
} from 'lucide-react';
import { TurkLiraIcon } from '../components/icons/TurkLiraIcon';
import { Appointment, Client, Professional, Room, Payment } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import { Logo } from '../components/Logo';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

// Lazy-loaded components
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Pie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));
const Doughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));
const CreateAppointmentModal = lazy(() => 
  import('../components/appointment/CreateAppointmentModal').then(module => ({ default: module.default }))
);
const DatePicker = lazy(() => import('react-datepicker'));

interface AppointmentWithRelations extends Appointment {
  client: Client;
  professional: Professional;
  room?: Room;
  service_type?: string;
}

interface CashStatus {
  opening_balance: number;
  from_professionals: number;
  to_professionals: number;
}

interface ClinicHours {
  pazartesi: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
  sali: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
  carsamba: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
  persembe: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
  cuma: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
  cumartesi: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
  pazar: {
    opening: string;
    closing: string;
    isOpen: boolean;
  };
}

interface Break {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  description?: string;
}

interface Vacation {
  id: string;
  start_date: string;
  end_date: string;
  title: string;
  description?: string;
}

const ROOM_COLORS = [
  'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
  'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
  'bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300',
  'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300',
];

// Randevu durumları için renk stilleri
const appointmentStatusStyles: Record<string, string> = {
  confirmed: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300',
  pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300',
  canceled: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300',
  completed: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300',
  missed: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300',
  rescheduled: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300',
  default: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300',
};

// Veri yükleniyor bileşeni
const LoadingData = () => {
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      <LoadingSpinner size="small" loadingText="Veri yükleniyor..." showLoadingText={true} />
    </div>
  );
};

export function Dashboard() {
  const { professional, assistant } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingClinicHours, setLoadingClinicHours] = useState(true);
  const [clinicHours, setClinicHours] = useState<ClinicHours | null>(null);
  const [professionalWorkingHours, setProfessionalWorkingHours] = useState<ClinicHours | null>(null);
  const [professionalBreaks, setProfessionalBreaks] = useState<Break[]>([]);
  const [clinicBreaks, setClinicBreaks] = useState<Break[]>([]);
  const [professionalVacations, setProfessionalVacations] = useState<Vacation[]>([]);
  const [clinicVacations, setClinicVacations] = useState<Vacation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithRelations[]>([]);
  const [monthlyAppointments, setMonthlyAppointments] = useState<AppointmentWithRelations[]>([]);
  const [todayPayments, setTodayPayments] = useState<Payment[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<Payment[]>([]);
  const [cashStatus, setCashStatus] = useState<CashStatus>({
    opening_balance: 0,
    from_professionals: 0,
    to_professionals: 0
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    clientId: '',
    roomId: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [duration, setDuration] = useState('45');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  
  // Veri yükleme durumlarını izlemek için
  const [loadingStates, setLoadingStates] = useState({
    appointments: false,
    payments: false,
    clients: false,
    breaks: false,
    vacations: false,
    charts: false,
  });
  
  // Yeni UI için eklenen durum değişkenleri
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [calendarViewMode, setCalendarViewMode] = useState('daily'); // daily, weekly, monthly
  
  // Chart verileri için durum değişkenleri - lazy initialization
  const [appointmentChartData, setAppointmentChartData] = useState<any>(null);
  const [revenueChartData, setRevenueChartData] = useState<any>(null);
  const [clientDistributionData, setClientDistributionData] = useState<any>(null);
  
  const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
  
  // Chart verilerini oluşturmak için kullanılan fonksiyonlar - memoize edilmiş
  const generateAppointmentChartData = useCallback(() => {
    if (!professional && !assistant) return;
    
    const today = new Date();
    let labels: string[] = [];
    let data: number[] = [];
    
    if (chartPeriod === 'weekly') {
      // Son 7 gün için veri oluştur
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return format(date, 'dd MMM', { locale: tr });
      });
      
      data = labels.map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + index);
        
        return monthlyAppointments.filter(appointment => 
          isSameDay(new Date(appointment.start_time), date)
        ).length;
      });
    } else if (chartPeriod === 'monthly') {
      // Son 30 gün için veri oluştur
      const daysInMonth = getDaysInMonth(today);
      labels = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
        return format(date, 'dd', { locale: tr });
      });
      
      data = labels.map((_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
        
        return monthlyAppointments.filter(appointment => 
          isSameDay(new Date(appointment.start_time), date)
        ).length;
      });
    }
    
    setAppointmentChartData({
      labels,
      datasets: [
        {
          label: 'Randevular',
          data,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    });
  }, [professional, assistant, chartPeriod, monthlyAppointments]);
  
  const generateRevenueChartData = () => {
    if ((!professional && !assistant) || !monthlyPayments.length) {
      setRevenueChartData({
        labels: ['Veri yok'],
        datasets: [{
          label: 'Gelir',
          data: [0],
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2
        }]
      });
      return;
    }
    
    const today = new Date();
    let labels: string[] = [];
    const incomeData: number[] = []; // Psikoterapistlardan Alınacaklar (gelir)
    const expenseData: number[] = []; // Psikoterapistlara Ödenecekler (gider)
    const netIncomeData: number[] = []; // Kasada Olan Para (net gelir)
    
    if (chartPeriod === 'weekly') {
      // Son 7 gün için veri oluştur
      labels = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + i);
        return format(date, 'dd MMM', { locale: tr });
      });
      
      labels.forEach((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + index);
        
        const dayPayments = monthlyPayments.filter(payment => 
          isSameDay(new Date(payment.payment_date), date)
        );
        
        // Gelir: Psikoterapistlardan alınacaklar (paid_to_professional statüsündeki klinik payı)
        const income = dayPayments
          .filter(payment => payment.payment_status === 'paid_to_professional')
          .reduce((sum, payment) => sum + Number(payment.clinic_amount || 0), 0);
        
        // Gider: Psikoterapistlara ödenecekler (paid_to_clinic statüsündeki profesyonel payı)
        const expense = dayPayments
          .filter(payment => payment.payment_status === 'paid_to_clinic')
          .reduce((sum, payment) => sum + Number(payment.professional_amount || 0), 0);
        
        incomeData.push(income);
        expenseData.push(expense);
        netIncomeData.push(income - expense);
      });
    } else if (chartPeriod === 'monthly') {
      // Bu ay için veri oluştur
      const daysInMonth = getDaysInMonth(today);
      labels = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
        return format(date, 'dd', { locale: tr });
      });
      
      labels.forEach((_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
        
        const dayPayments = monthlyPayments.filter(payment => 
          isSameDay(new Date(payment.payment_date), date)
        );
        
        // Gelir: Psikoterapistlardan alınacaklar (paid_to_professional statüsündeki klinik payı)
        const income = dayPayments
          .filter(payment => payment.payment_status === 'paid_to_professional')
          .reduce((sum, payment) => sum + Number(payment.clinic_amount || 0), 0);
        
        // Gider: Psikoterapistlara ödenecekler (paid_to_clinic statüsündeki profesyonel payı)
        const expense = dayPayments
          .filter(payment => payment.payment_status === 'paid_to_clinic')
          .reduce((sum, payment) => sum + Number(payment.professional_amount || 0), 0);
        
        incomeData.push(income);
        expenseData.push(expense);
        netIncomeData.push(income - expense);
      });
    }
    
    setRevenueChartData({
      labels,
      datasets: [
        {
          label: 'Psikoterapistlardan Alınacaklar (gelir)',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.0)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
        },
        {
          label: 'Psikoterapistlara Ödenecekler (gider)',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.0)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: 'rgb(239, 68, 68)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
        },
        {
          label: 'Kasada Olan Para (net gelir)',
          data: netIncomeData,
          backgroundColor: 'rgba(99, 102, 241, 0.0)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    });
  };
  
  const generateClientDistributionData = () => {
    // Bu fonksiyonun tamamını kaldıralım
  };
  
  // Chart konfigürasyon seçenekleri
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          borderDash: [2, 2],
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          color: '#9CA3AF',
          padding: 10,
          // Akıllı stepSize hesaplama - çok fazla tick oluşturmamak için
          stepSize: 100,
          precision: 0
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };
  
  const barChartOptions = {
    ...lineChartOptions,
    maintainAspectRatio: false,
    barPercentage: 0.6,
    categoryPercentage: 0.7,
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        type: 'linear' as const,
        beginAtZero: true,
        grid: {
          borderDash: [2, 2],
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          color: '#9CA3AF',
          padding: 10,
          stepSize: 100,
        }
      }
    }
  };
  
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          color: '#4B5563',
          font: {
            size: 12,
          },
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      },
    },
    cutout: '70%',
  };
  
  const mixedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          color: '#4B5563',
          font: {
            size: 12,
          },
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 10,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        type: 'category' as const,
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: true,
        grid: {
          borderDash: [2, 2],
          color: 'rgba(0, 0, 0, 0.06)',
        },
        ticks: {
          color: '#9CA3AF',
          padding: 10,
          stepSize: 10,
          precision: 0
        },
        title: {
          display: true,
          text: 'Randevu Sayısı',
          color: '#9CA3AF',
          font: {
            size: 12,
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        beginAtZero: true,
        grid: {
          display: false,
          drawOnChartArea: false,
        },
        ticks: {
          color: '#10B981',
          padding: 10,
          stepSize: 1000,
          callback: function(value: any) {
            return value.toLocaleString('tr-TR', {
              style: 'currency',
              currency: 'TRY',
              maximumFractionDigits: 0
            });
          }
        },
        title: {
          display: true,
          text: 'Gelir',
          color: '#10B981',
          font: {
            size: 12,
          },
        },
      },
    },
  };
  
  // Chart verileri için useEffect
  useEffect(() => {
    if (monthlyAppointments.length > 0) {
      generateAppointmentChartData();
    }
    
    if (monthlyPayments.length > 0) {
      generateRevenueChartData();
    }
    
    if (clients.length > 0) {

    }
  }, [monthlyAppointments, monthlyPayments, clients, chartPeriod]);
  
  // Periyodik olarak grafikler güncelleniyor
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Her dakika güncelle
    
    return () => clearInterval(interval);
  }, []);

  // Initialize charts with lazy loading - Optimize edilmiş
  const initializeCharts = useCallback(async () => {
    try {
      // Chart.js'yi dinamik olarak yükle
      setLoadingStates(prev => ({ ...prev, charts: true }));
      const { Chart, registerables } = await import('chart.js');
      // Tüm gerekli bileşenleri kaydet
      Chart.register(...registerables);
      setLoadingStates(prev => ({ ...prev, charts: false }));
      return true;
    } catch (error) {
      console.error('Chart.js yüklenirken hata oluştu:', error);
      setLoadingStates(prev => ({ ...prev, charts: false }));
      return false;
    }
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Chart.js'yi ilk önce yükle ve kaydet
        await initializeCharts();
        
        // Ardından kritik verileri yükleyelim
        const criticalPromises = [
          loadClinicHours(),
          loadRooms()
        ];
        
        // Kullanıcı tipine göre kritik veri yükleme
        if (professional) {
          criticalPromises.push(loadProfessionalWorkingHours());
        }
        
        // Kritik verileri paralel olarak yükle
        await Promise.all(criticalPromises);
        
        // Ana içeriği göster
        setLoading(false);
        
        // Önce takvim verilerini yükle 
        if (professional) {
          loadProfessionalData();
        } else if (assistant) {
          loadAssistantData();
        }
        
        // İkincil verileri sırayla yükle (ihtiyaç duyan görünümler için)
        // Bunlar arayüzü engellememek için sırayla yükleniyor
        const loadSecondaryData = async () => {
          try {
            // İlk olarak molalar
            await loadClinicBreaks();
            
            // Sonra tatil günleri
            await loadClinicVacations();
            
            // Profesyonel özgü veriler en son yükleniyor
            if (professional) {
              await loadProfessionalBreaks();
              await loadProfessionalVacations();
              await loadClients();
            }
          } catch (error) {
            console.error("İkincil veriler yüklenirken hata oluştu:", error);
          }
        };
        
        // Arka planda ikincil verileri yükle
        loadSecondaryData();
        
      } catch (error) {
        console.error("Veri yüklenirken hata oluştu:", error);
        setLoading(false);
      }
    };

    if (professional || assistant) {
      initializeData();
    }
    
    // Gereksiz yeniden renderları önlemek için cleanup fonksiyonu
    return () => {
      // Zamanlayıcıları temizle
    };
  }, [professional?.id, assistant?.id]);

  // Daha verimli bir chart yükleme stratejisi
  useEffect(() => {
    // Chart verilerini sadece gerektiğinde oluştur
    if (monthlyAppointments.length > 0 && !loadingStates.charts) {
      // Geciktirme ile birlikte çalıştır
      const timer = setTimeout(() => {
        generateAppointmentChartData();
        if (monthlyPayments.length > 0) {
          generateRevenueChartData();
        }
      }, 300); // sayfanın ilk gösterimi için gecikme ekledik
      
      return () => clearTimeout(timer);
    }
  }, [monthlyAppointments, monthlyPayments, chartPeriod, loadingStates.charts, generateAppointmentChartData]);

  // Yeni eklenen useEffect yeterli
  // Tarih veya görünüm modu değiştiğinde günlük, haftalık ve aylık görünümleri güncelleme
  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
      const currentDay = days[dayOfWeek];
      const dayHours = clinicHours?.[currentDay];

      // Tarihin ISO formatını alalım
      const formattedDate = date.toISOString().split('T')[0];
      
      // Her tarih veya görünüm modu değişiminde uygun randevuları yükleyelim
      if (calendarViewMode === 'daily') {
        // Günlük görünüm için randevuları yükle
        loadExistingAppointments(formattedDate);
        
        if (!dayHours?.isOpen) {
          setTimeSlots([]);
          return;
        }
        
        setTimeSlots(generateTimeSlots(dayHours));
      } else {
        // Haftalık ve aylık görünümler önceki kodda olduğu gibi çalışıyor
        // Burada değişiklik yapmaya gerek yok
      }
    }
  }, [selectedDate, clinicHours, calendarViewMode]);

  // Saat başına zaman dilimi seçme - optimize edilmiş
  const generateTimeSlots = useCallback((dayHours: { opening: string; closing: string; isOpen: boolean }) => {
    if (!dayHours.isOpen) return [];

    const dayOfWeek = selectedDate.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];

    // Tatil günlerini kontrol et
    if (isDateInVacations(selectedDate)) {
      return [];
    }

    let openingHour, openingMinute, closingHour, closingMinute;

    if (professional) {
      const profHours = professionalWorkingHours?.[currentDay];
      const clinicDayHours = clinicHours?.[currentDay];

      if (!profHours?.isOpen || !clinicDayHours?.isOpen) return [];

      const [profOpenHour, profOpenMinute = 0] = profHours.opening.split(':').map(Number);
      const [profCloseHour, profCloseMinute = 0] = profHours.closing.split(':').map(Number);
      const [clinicOpenHour, clinicOpenMinute = 0] = clinicDayHours.opening.split(':').map(Number);
      const [clinicCloseHour, clinicCloseMinute = 0] = clinicDayHours.closing.split(':').map(Number);

      openingHour = profOpenHour;
      openingMinute = profOpenMinute;
      closingHour = profCloseHour;
      closingMinute = profCloseMinute;

      if (clinicOpenHour > profOpenHour || (clinicOpenHour === profOpenHour && clinicOpenMinute > profOpenMinute)) {
        openingHour = clinicOpenHour;
        openingMinute = clinicOpenMinute;
      }

      if (clinicCloseHour < profCloseHour || (clinicCloseHour === profCloseHour && clinicCloseMinute < profCloseMinute)) {
        closingHour = clinicCloseHour;
        closingMinute = clinicCloseMinute;
      }
    } else {
      [openingHour, openingMinute = 0] = dayHours.opening.split(':').map(Number);
      [closingHour, closingMinute = 0] = dayHours.closing.split(':').map(Number);
    }

    // Başlangıç dakikasını bir sonraki tam saate yuvarla
    if (openingMinute > 0) {
      openingHour += 1;
      openingMinute = 0;
    }

    const slots: string[] = [];
    let currentHour = openingHour;
    const currentMinute = openingMinute;

    // Her tam saat için bir zaman dilimi oluştur
    while (currentHour < closingHour) {
      // Mola zamanı kontrolü - bu kısmı optimize ettik
      const profBreaksForDay = professionalBreaks.filter(b => b.day_of_week === currentDay);
      const clinicBreaksForDay = clinicBreaks.filter(b => b.day_of_week === currentDay);
      const currentTimeInBreak = isTimeInBreaks(currentHour, currentMinute, profBreaksForDay, clinicBreaksForDay);

      if (!currentTimeInBreak) {
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
      
      // Bir sonraki saat
      currentHour += 1;
    }

    // Son saat dilimini sadece kapanış dakikası 0 ise ekle
    if (closingMinute === 0 && currentHour === closingHour) {
      // Mola zamanı kontrolü
      const profBreaksForDay = professionalBreaks.filter(b => b.day_of_week === currentDay);
      const clinicBreaksForDay = clinicBreaks.filter(b => b.day_of_week === currentDay);
      const currentTimeInBreak = isTimeInBreaks(closingHour, 0, profBreaksForDay, clinicBreaksForDay);

      if (!currentTimeInBreak) {
        slots.push(`${closingHour.toString().padStart(2, '0')}:00`);
      }
    }

    return slots;
  }, [selectedDate, professionalWorkingHours, clinicHours, professionalBreaks, clinicBreaks]);

  function getTurkishDayName(day: string): string {
    const dayMap: Record<string, string> = {
      'pazartesi': 'Pazartesi',
      'sali': 'Salı',
      'carsamba': 'Çarşamba',
      'persembe': 'Perşembe',
      'cuma': 'Cuma',
      'cumartesi': 'Cumartesi',
      'pazar': 'Pazar'
    };
    return dayMap[day] || day;
  }

  function isTimeInBreaks(hour: number, minute: number, professionalBreaks: Break[], clinicBreaks: Break[]): boolean {
    const timeInMinutes = hour * 60 + minute;
    
    for (const breakItem of professionalBreaks) {
      const [startHour, startMinute] = breakItem.start_time.split(':').map(Number);
      const [endHour, endMinute] = breakItem.end_time.split(':').map(Number);
      
      const breakStartInMinutes = startHour * 60 + startMinute;
      const breakEndInMinutes = endHour * 60 + endMinute;
      
      if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
        return true;
      }
    }
    
    for (const breakItem of clinicBreaks) {
      const [startHour, startMinute] = breakItem.start_time.split(':').map(Number);
      const [endHour, endMinute] = breakItem.end_time.split(':').map(Number);
      
      const breakStartInMinutes = startHour * 60 + startMinute;
      const breakEndInMinutes = endHour * 60 + endMinute;
      
      if (timeInMinutes >= breakStartInMinutes && timeInMinutes < breakEndInMinutes) {
        return true;
      }
    }
    
    return false;
  }

  function isDateInVacations(date: Date): boolean {
    if (!isValid(date)) return false;
    
    for (const vacation of professionalVacations) {
      const startDate = new Date(vacation.start_date);
      const endDate = new Date(vacation.end_date);
      
      if (isWithinInterval(date, { start: startDate, end: endDate })) {
        return true;
      }
    }
    
    for (const vacation of clinicVacations) {
      const startDate = new Date(vacation.start_date);
      const endDate = new Date(vacation.end_date);
      
      if (isWithinInterval(date, { start: startDate, end: endDate })) {
        return true;
      }
    }
    
    return false;
  }

  function calculateAppointmentPosition(appointment: AppointmentWithRelations) {
    const startTime = new Date(appointment.start_time);
    const startHour = startTime.getHours();
    const startMinute = startTime.getMinutes();
    
    // Tam saat görünümü için, randevunun başlangıç saatini bul
    // ve başlangıç dakikasını yüzde olarak hesapla
    const topPercentage = (startMinute / 60) * 100;
    
    // Randevu süresini dakika olarak hesapla
    const endTime = new Date(appointment.end_time);
    const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    // Bir saatin piksel yüksekliği (saat bloğu yüksekliği)
    const hourHeight = 100; // Yüksekliği tr içindeki h-[100px] değeri ile eşleşmeli
    
    // Randevu yüksekliğini hesapla (saatin yüzde kaçını kapsadığına göre)
    const height = (durationInMinutes / 60) * hourHeight;
    
    return {
      top: `${topPercentage}%`,
      height: `${Math.max(22, height)}px`, // En az 22px yükseklik
      minHeight: '22px'
    };
  }

  function calculateAppointmentHeight(durationInMinutes: number) {
    const hourHeight = 120;
    return Math.max(118, (durationInMinutes / 60) * hourHeight);
  }

  function calculateTimeLinePosition() {
    const now = currentTime;
    const minutes = now.getMinutes();
    return `${(minutes / 60) * 100}%`;
  }

  async function loadClients() {
    try {
      setLoadingStates(prev => ({ ...prev, clients: true }));
      let query = supabase
        .from('clients')
        .select('*, professional:professionals(id, full_name)')
        .order('full_name');

      if (professional) {
        query = query.eq('professional_id', professional.id);
      } else if (assistant) {
        const { data: managedProfessionals } = await supabase
          .from('professionals')
          .select('id')
          .eq('assistant_id', assistant.id);

        if (managedProfessionals && managedProfessionals.length > 0) {
          const professionalIds = managedProfessionals.map((p) => p.id);
          query = query.in('professional_id', professionalIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, clients: false }));
    }
  }

  async function loadRooms() {
    try {
      let query = supabase.from('rooms').select('*').order('name');
      
      if (assistant?.id) {
        query = query.eq('assistant_id', assistant.id);
      } else if (professional?.id) {
        const { data: prof } = await supabase
          .from('professionals')
          .select('assistant_id')
          .eq('id', professional.id)
          .single();
          
        if (prof?.assistant_id) {
          query = query.eq('assistant_id', prof.assistant_id);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Online görüşme odası ekle
      const onlineRoom = {
        id: 'online',
        name: 'Çevrimiçi Oda',
        assistant_id: assistant?.id || professional?.assistant_id || null
      };
      
      setRooms([onlineRoom, ...(data || [])]);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }

  async function loadClinicHours() {
    try {
      setLoadingClinicHours(true);
      let query = supabase.from('clinic_settings').select('*');
      
      if (professional) {
        const { data: prof } = await supabase
          .from('professionals')
          .select('assistant_id')
          .eq('id', professional.id)
          .single();
          
        if (prof?.assistant_id) {
          query = query.eq('assistant_id', prof.assistant_id);
        }
      } else if (assistant) {
        query = query.eq('assistant_id', assistant.id);
      }

      query = query.order('created_at', { ascending: false }).limit(1);

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        setClinicHours({
          pazartesi: {
            opening: data[0].opening_time_monday,
            closing: data[0].closing_time_monday,
            isOpen: data[0].is_open_monday
          },
          sali: {
            opening: data[0].opening_time_tuesday,
            closing: data[0].closing_time_tuesday,
            isOpen: data[0].is_open_tuesday
          },
          carsamba: {
            opening: data[0].opening_time_wednesday,
            closing: data[0].closing_time_wednesday,
            isOpen: data[0].is_open_wednesday
          },
          persembe: {
            opening: data[0].opening_time_thursday,
            closing: data[0].closing_time_thursday,
            isOpen: data[0].is_open_thursday
          },
          cuma: {
            opening: data[0].opening_time_friday,
            closing: data[0].closing_time_friday,
            isOpen: data[0].is_open_friday
          },
          cumartesi: {
            opening: data[0].opening_time_saturday,
            closing: data[0].closing_time_saturday,
            isOpen: data[0].is_open_saturday
          },
          pazar: {
            opening: data[0].opening_time_sunday,
            closing: data[0].closing_time_sunday,
            isOpen: data[0].is_open_sunday
          }
        });
      }
    } catch (error) {
      console.error('Error loading clinic hours:', error);
    } finally {
      setLoadingClinicHours(false);
    }
  }

  async function loadProfessionalData() {
    if (!professional?.id) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, appointments: true, payments: true }));
      
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      const startOfThisMonth = startOfMonth(today);
      const endOfThisMonth = endOfMonth(today);

      // Paralel olarak çalıştıralım
      const [
        todayApptsResult,
        monthlyApptsResult,
        todayPaysResult,
        monthlyPaysResult
      ] = await Promise.all([
        // Bugünün randevuları - minimal veri
        supabase
          .from('appointments')
          .select(`
            *,
            client:clients(id, full_name),
            professional:professionals(id, full_name),
            room:rooms(id, name)
          `)
          .eq('professional_id', professional.id)
          .eq('status', 'scheduled')
          .gte('start_time', startOfToday.toISOString())
          .lte('start_time', endOfToday.toISOString())
          .order('start_time'),
          
        // Aylık randevular - minimal veri
        supabase
          .from('appointments')
          .select(`
            *,
            client:clients(id, full_name),
            professional:professionals(id, full_name),
            room:rooms(id, name)
          `)
          .eq('professional_id', professional.id)
          .eq('status', 'scheduled')
          .gte('start_time', startOfThisMonth.toISOString())
          .lte('start_time', endOfThisMonth.toISOString())
          .order('start_time'),
          
        // Bugünkü ödemeler
        supabase
          .from('payments')
          .select(`
            *,
            appointment:appointments(
              id, start_time, 
              client:clients(id, full_name),
              professional:professionals(id, full_name)
            )
          `)
          .eq('professional_id', professional.id)
          .gte('payment_date', startOfToday.toISOString())
          .lte('payment_date', endOfToday.toISOString())
          .order('payment_date'),
          
        // Aylık ödemeler
        supabase
          .from('payments')
          .select(`
            *,
            appointment:appointments(
              id, start_time, 
              client:clients(id, full_name),
              professional:professionals(id, full_name)
            )
          `)
          .eq('professional_id', professional.id)
          .gte('payment_date', startOfThisMonth.toISOString())
          .lte('payment_date', endOfThisMonth.toISOString())
          .order('payment_date')
      ]);

      // Hata kontrolü
      if (todayApptsResult.error) throw todayApptsResult.error;
      if (monthlyApptsResult.error) throw monthlyApptsResult.error;
      if (todayPaysResult.error) throw todayPaysResult.error;
      if (monthlyPaysResult.error) throw monthlyPaysResult.error;

      // Verileri state'e set edelim
      setTodayAppointments(todayApptsResult.data || []);
      setMonthlyAppointments(monthlyApptsResult.data || []);
      setTodayPayments(todayPaysResult.data || []);
      setMonthlyPayments(monthlyPaysResult.data || []);
    } catch (error) {
      console.error('Error loading professional dashboard data:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, appointments: false, payments: false }));
    }
  }

  async function loadAssistantData() {
    if (!assistant?.id) return;

    try {
      const today = new Date();
      const startToday = startOfDay(selectedDate);
      const endToday = endOfDay(selectedDate);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const startOfThisMonth = startOfMonth(today);
      const endOfThisMonth = endOfMonth(today);

      const { data: managedProfessionals, error: profError } = await supabase
        .from('professionals')
        .select('id')
        .eq('assistant_id', assistant.id);

      if (profError) throw profError;

      const professionalIds = managedProfessionals?.map(p => p.id) || [];

      const { data: todayAppts, error: apptsError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(full_name),
          professional:professionals(full_name),
          room:rooms(name)
        `)
        .in('professional_id', professionalIds)
        .eq('status', 'scheduled')
        .gte('start_time', startToday.toISOString())
        .lte('start_time', endToday.toISOString())
        .order('start_time');

      if (apptsError) throw apptsError;

      // Aylık randevuları da yükle
      const { data: monthlyAppts, error: monthlyApptsError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(full_name),
          professional:professionals(full_name),
          room:rooms(name)
        `)
        .in('professional_id', professionalIds)
        .eq('status', 'scheduled')
        .gte('start_time', startOfThisMonth.toISOString())
        .lte('start_time', endOfThisMonth.toISOString())
        .order('start_time');

      if (monthlyApptsError) throw monthlyApptsError;

      const { data: todayPays, error: paysError } = await supabase
        .from('payments')
        .select(`
          *,
          appointment:appointments(
            *,
            professional:professionals(full_name),
            client:clients(full_name)
          )
        `)
        .in('professional_id', professionalIds)
        .gte('payment_date', startToday.toISOString())
        .lte('payment_date', endToday.toISOString())
        .order('payment_date');

      if (paysError) throw paysError;

      // Aylık ödemeleri yükle
      const { data: monthlyPays, error: monthlyPaysError } = await supabase
        .from('payments')
        .select(`
          *,
          appointment:appointments(
            *,
            professional:professionals(full_name),
            client:clients(full_name)
          )
        `)
        .in('professional_id', professionalIds)
        .gte('payment_date', startOfThisMonth.toISOString())
        .lte('payment_date', endOfThisMonth.toISOString())
        .order('payment_date');

      if (monthlyPaysError) throw monthlyPaysError;

      const { data: cashData, error: cashError } = await supabase
        .from('cash_status')
        .upsert(
          {
            assistant_id: assistant.id,
            date: formattedDate,
            opening_balance: 0
          },
          {
            onConflict: 'assistant_id,date',
            ignoreDuplicates: false
          }
        )
        .select()
        .single();

      if (cashError) {
        console.error('Error upserting cash status:', cashError);
        throw cashError;
      }

      // Yüklenen verileri state'e set et
      setTodayAppointments(todayAppts || []);
      setMonthlyAppointments(monthlyAppts || []);
      setTodayPayments(todayPays || []);
      setMonthlyPayments(monthlyPays || []);
      
      // Kasa durumunu hesapla
      setCashStatus({
        opening_balance: cashData?.opening_balance || 0,
        from_professionals:
          todayPays?.reduce((sum, payment) => {
            if (payment.payment_status === 'paid_to_professional') {
              return sum + Number(payment.office_amount || 0);
            }
            return sum;
          }, 0) || 0,
        to_professionals:
          todayPays?.reduce((sum, payment) => {
            if (payment.payment_status === 'paid_to_office') {
              return sum + Number(payment.professional_amount || 0);
            }
            return sum;
          }, 0) || 0,
      });
      
      // Danışanları yükle
      await loadClients();
    } catch (error) {
      console.error('Error loading assistant dashboard data:', error);
    }
  }

  function getAppointmentForTimeSlotAndRoom(timeSlot: string, roomId: string) {
    const [hour, minute] = timeSlot.split(':').map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, minute, 0, 0);

    return todayAppointments.find((appointment) => {
      const appointmentStart = new Date(appointment.start_time);
      const appointmentEnd = new Date(appointment.end_time);

      // Online görüşme kontrolü (is_online=true) ve oda ID'si eşleşmesi
      return (
        ((appointment.room_id === roomId) || 
        (appointment.is_online && roomId === 'online')) &&
        slotTime >= appointmentStart &&
        slotTime < appointmentEnd
      );
    });
  }

  function getAppointmentDuration(appointment: any) {
    const start = parseISO(appointment.start_time);
    const end = parseISO(appointment.end_time);
    return Math.ceil((end.getTime() - start.getTime()) / (60 * 60 * 1000));
  }

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedClient = clients.find(
        (client) => client.id === formData.clientId
      );
      if (!selectedClient) {
        throw new Error('Danışan seçilmedi');
      }

      const professionalId = professional?.id || selectedClient.professional_id;
      if (!professionalId) {
        throw new Error('Ruh sağlığı uzmanı bulunamadı');
      }

      const startDateTime = new Date(formData.startTime);
      const endDateTime = new Date(
        startDateTime.getTime() + parseInt(duration) * 60000
      );

      const { error } = await supabase.from('appointments').insert({
        client_id: formData.clientId,
        professional_id: professionalId,
        room_id: formData.roomId || null,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        notes: formData.notes || null,
        status: 'scheduled',
      });

      if (error) {
        if (error.message.includes('Cannot create appointments in the past')) {
          throw new Error('Geçmiş tarihe randevu oluşturulamaz.');
        }
        if (error.message.includes('Room is already booked')) {
          throw new Error(
            'Bu oda seçilen saatte başka bir randevu için ayrılmış.'
          );
        }
        if (error.message.includes('Professional already has an appointment')) {
          throw new Error(
            'Ruh sağlığı uzmanının bu saatte başka bir randevusu var.'
          );
        }
        throw error;
      }

      setFormData({
        clientId: '',
        roomId: '',
        startTime: '',
        endTime: '',
        notes: '',
      });
      setShowCreateModal(false);
      if (professional) {
        await loadProfessionalData();
      } else if (assistant) {
        await loadAssistantData();
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Randevu oluşturulurken bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingAppointments(date: string) {
    try {
      setLoadingStates(prev => ({ ...prev, appointments: true }));
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(id, full_name),
          professional:professionals(id, full_name),
          room:rooms(id, name)
        `)
        .gte('start_time', startTime.toISOString())
        .lte('start_time', endTime.toISOString())
        .eq('status', 'scheduled');

      if (professional) {
        query = query.eq('professional_id', professional.id);
      } else if (assistant) {
        const { data: managedProfessionals } = await supabase
          .from('professionals')
          .select('id')
          .eq('assistant_id', assistant.id);

        if (managedProfessionals && managedProfessionals.length > 0) {
          const professionalIds = managedProfessionals.map((p) => p.id);
          query = query.in('professional_id', professionalIds);
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setExistingAppointments(data || []);
      
      // Günlük randevuları da güncelle - bu günlük takvim görünümü için gerekli
      setTodayAppointments(data || []);
    } catch (error) {
      console.error('Error loading existing appointments:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, appointments: false }));
    }
  }

  function calculateAvailableTimeSlots(date: Date) {
    const dayOfWeek = date.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    const dayHours = clinicHours?.[currentDay];

    if (!dayHours?.isOpen) {
      return [];
    }

    const slots: string[] = [];
    const [openingHour, openingMinute] = dayHours.opening.split(':').map(Number);
    const [closingHour, closingMinute] = dayHours.closing.split(':').map(Number);

    let currentHour = openingHour;
    let currentMinute = openingMinute;

    while (
      currentHour < closingHour ||
      (currentHour === closingHour && currentMinute <= closingMinute)
    ) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute
        .toString()
        .padStart(2, '0')}`;

      const slotTime = new Date(date);
      slotTime.setHours(currentHour, currentMinute, 0, 0);
      
      const endTime = new Date(slotTime.getTime() + parseInt(duration) * 60000);

      const hasConflict = existingAppointments.some(appointment => {
        const appointmentStart = new Date(appointment.start_time);
        const appointmentEnd = new Date(appointment.end_time);

        if (formData.roomId && appointment.room_id === formData.roomId) {
          return (
            (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
            (endTime > appointmentStart && endTime <= appointmentEnd)
          );
        }

        if (professional && appointment.professional_id === professional.id) {
          return (
            (slotTime >= appointmentStart && slotTime < appointmentEnd) ||
            (endTime > appointmentStart && endTime <= appointmentEnd)
          );
        }

        return false;
      });

      if (!hasConflict) {
        slots.push(timeString);
      }

      currentMinute += 15;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return slots;
  }

  function calculateAvailableRooms(date: string, timeSlot: string) {
    if (!rooms.length || !date || !timeSlot) return [];

    const startTime = new Date(date);
    const [hours, minutes] = timeSlot.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);

    return rooms.filter((room) => {
      const hasConflict = existingAppointments.some((appointment) => {
        if (appointment.room_id !== room.id) return false;

        const appointmentStart = new Date(appointment.start_time);
        const appointmentEnd = new Date(appointment.end_time);

        return (
          (startTime >= appointmentStart && startTime < appointmentEnd) ||
          (endTime > appointmentStart && endTime <= appointmentEnd)
        );
      });

      return !hasConflict;
    });
  }

  const handleRoomChange = (roomId: string) => {
    setFormData((prev) => {
      const startDate = prev.startTime ? new Date(prev.startTime.split('T')[0]) : selectedDate;
      return {
      ...prev,
      roomId,
      startTime:
        prev.startTime &&
          !calculateAvailableTimeSlots(startDate).includes(prev.startTime.split('T')[1]?.slice(0, 5))
          ? prev.startTime.split('T')[0]
          : prev.startTime,
      };
    });
  };

  const handleDateChange = (date: string) => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    const dayHours = clinicHours?.[currentDay];

    if (!dayHours?.isOpen) {
      setTimeSlots([]);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      startTime: `${date}T${dayHours.opening}`,
    }));
  };

  const handleTimeChange = (time: string) => {
    const date = formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0];
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    const dayHours = clinicHours?.[currentDay];

    if (!dayHours?.isOpen) {
      alert('Seçilen gün klinik kapalıdır.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      startTime: `${date}T${time}`,
      roomId: prev.roomId && !calculateAvailableRooms(date, time)
        .some(room => room.id === prev.roomId)
        ? ''
        : prev.roomId
    }));
  };

  useEffect(() => {
    if (formData.startTime) {
      const [date, time] = formData.startTime.split('T');
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.getDay();
      const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
      const currentDay = days[dayOfWeek];
      const dayHours = clinicHours?.[currentDay];

      if (!dayHours?.isOpen) {
        alert('Seçilen gün klinik kapalıdır.');
        setFormData(prev => ({ ...prev, startTime: '' }));
        return;
      }

      if (formData.roomId) {
        setAvailableTimeSlots(calculateAvailableTimeSlots(selectedDate));
      } else {
        setAvailableTimeSlots(calculateAvailableTimeSlots(selectedDate));
      }

      if (time) {
        setAvailableRooms(calculateAvailableRooms(date, time.slice(0, 5)));
      }
    }
  }, [formData.startTime, formData.roomId, duration, selectedDate, existingAppointments]);

  const isClinicOpen = (date: Date) => {
    const dayOfWeek = date.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];

    if (isDateInVacations(date)) {
      return false;
    }

    if (professional) {
      const profDay = professionalWorkingHours?.[currentDay];
      const clinicDay = clinicHours?.[currentDay];
      
      return (profDay?.isOpen && clinicDay?.isOpen) || false;
    } else {
      return clinicHours?.[currentDay]?.isOpen || false;
    }
  };

  async function loadProfessionalWorkingHours() {
    try {
      if (!professional?.id) return;

      const { data, error } = await supabase
        .from('professional_working_hours')
        .select('*')
        .eq('professional_id', professional.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Profesyonel çalışma saatleri yüklenirken hata:', error);
      }

      if (data) {
        setProfessionalWorkingHours({
          pazartesi: {
            opening: data.opening_time_monday || '09:00',
            closing: data.closing_time_monday || '18:00',
            isOpen: data.is_open_monday ?? true
          },
          sali: {
            opening: data.opening_time_tuesday || '09:00',
            closing: data.closing_time_tuesday || '18:00',
            isOpen: data.is_open_tuesday ?? true
          },
          carsamba: {
            opening: data.opening_time_wednesday || '09:00',
            closing: data.closing_time_wednesday || '18:00',
            isOpen: data.is_open_wednesday ?? true
          },
          persembe: {
            opening: data.opening_time_thursday || '09:00',
            closing: data.closing_time_thursday || '18:00',
            isOpen: data.is_open_thursday ?? true
          },
          cuma: {
            opening: data.opening_time_friday || '09:00',
            closing: data.closing_time_friday || '18:00',
            isOpen: data.is_open_friday ?? true
          },
          cumartesi: {
            opening: data.opening_time_saturday || '09:00',
            closing: data.closing_time_saturday || '18:00',
            isOpen: data.is_open_saturday ?? false
          },
          pazar: {
            opening: data.opening_time_sunday || '09:00',
            closing: data.closing_time_sunday || '18:00',
            isOpen: data.is_open_sunday ?? false
          }
        });
      } else {
        setProfessionalWorkingHours({
          pazartesi: {
            opening: '09:00',
            closing: '18:00',
            isOpen: true
          },
          sali: {
            opening: '09:00',
            closing: '18:00',
            isOpen: true
          },
          carsamba: {
            opening: '09:00',
            closing: '18:00',
            isOpen: true
          },
          persembe: {
            opening: '09:00',
            closing: '18:00',
            isOpen: true
          },
          cuma: {
            opening: '09:00',
            closing: '18:00',
            isOpen: true
          },
          cumartesi: {
            opening: '09:00',
            closing: '18:00',
            isOpen: false
          },
          pazar: {
            opening: '09:00',
            closing: '18:00',
            isOpen: false
          }
        });
      }
    } catch (error) {
      console.error('Profesyonel çalışma saatleri yüklenirken hata:', error);
      setProfessionalWorkingHours({
        pazartesi: {
          opening: '09:00',
          closing: '18:00',
          isOpen: true
        },
        sali: {
          opening: '09:00',
          closing: '18:00',
          isOpen: true
        },
        carsamba: {
          opening: '09:00',
          closing: '18:00',
          isOpen: true
        },
        persembe: {
          opening: '09:00',
          closing: '18:00',
          isOpen: true
        },
        cuma: {
          opening: '09:00',
          closing: '18:00',
          isOpen: true
        },
        cumartesi: {
          opening: '09:00',
          closing: '18:00',
          isOpen: false
        },
        pazar: {
          opening: '09:00',
          closing: '18:00',
          isOpen: false
        }
      });
    }
  }

  async function loadProfessionalBreaks() {
    if (!professional?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('professional_breaks')
        .select('*')
        .eq('professional_id', professional.id);
        
      if (error) {
        console.error('Profesyonel mola saatleri yüklenirken hata:', error);
        return;
      }
      
      setProfessionalBreaks(data || []);
    } catch (error) {
      console.error('Profesyonel mola saatleri yüklenirken hata:', error);
    }
  }
  
  async function loadClinicBreaks() {
    try {
      let query = supabase.from('clinic_breaks').select('*');
      
      if (professional) {
        const { data: prof } = await supabase
          .from('professionals')
          .select('assistant_id')
          .eq('id', professional.id)
          .single();
          
        if (prof?.assistant_id) {
          query = query.eq('clinic_id', prof.assistant_id);
        }
      } else if (assistant) {
        query = query.eq('clinic_id', assistant.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Klinik mola saatleri yüklenirken hata:', error);
        return;
      }
      
      setClinicBreaks(data || []);
    } catch (error) {
      console.error('Klinik mola saatleri yüklenirken hata:', error);
    }
  }
  
  async function loadProfessionalVacations() {
    if (!professional?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('professional_id', professional.id)
        .is('clinic_id', null);
        
      if (error) {
        console.error('Profesyonel izinleri yüklenirken hata:', error);
        return;
      }
      
      setProfessionalVacations(data || []);
    } catch (error) {
      console.error('Profesyonel izinleri yüklenirken hata:', error);
    }
  }
  
  async function loadClinicVacations() {
    try {
      let query = supabase.from('vacations').select('*').not('clinic_id', 'is', null);
      
      if (professional) {
        const { data: prof } = await supabase
          .from('professionals')
          .select('assistant_id')
          .eq('id', professional.id)
          .single();
          
        if (prof?.assistant_id) {
          query = query.eq('clinic_id', prof.assistant_id);
        }
      } else if (assistant) {
        query = query.eq('clinic_id', assistant.id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Klinik izinleri yüklenirken hata:', error);
        return;
      }
      
      setClinicVacations(data || []);
    } catch (error) {
      console.error('Klinik izinleri yüklenirken hata:', error);
    }
  }

  // Chart bileşenlerini renderla - memoize ettiğimiz
  const renderLineChart = useMemo(() => (data: any, options: any) => (
    <Suspense fallback={<LoadingSpinner size="small" loadingText="Grafik yükleniyor..." />}>
      {data && <Line data={data} options={options} />}
    </Suspense>
  ), []);

  const renderBarChart = useMemo(() => (data: any, options: any) => (
    <Suspense fallback={<LoadingSpinner size="small" loadingText="Grafik yükleniyor..." />}>
      {data && <Bar data={data} options={options} />}
    </Suspense>
  ), []);

  return (
    <>
      {loading ? (
        <LoadingSpinner fullPage size="medium" loadingText="Dashboard yükleniyor..." showLoadingText={true} />
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          {/* Arka plan efektleri */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-100 dark:bg-primary-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
            <div className="absolute top-1/3 right-10 w-64 h-64 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
            <div className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-purple-100 dark:bg-purple-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
          </div>

          {/* Ana içerik */}
          <div className="relative max-w-7xl mx-auto px-3 md:px-5 lg:px-6 py-4 space-y-4">
            {/* Üst kısım - Hoşgeldiniz ve tarih seçici */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                  Hoş Geldiniz, {professional ? professional.full_name : assistant ? assistant.full_name : 'Kullanıcı'}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  {format(new Date(), "d MMMM yyyy, EEEE", { locale: tr })}
                </p>
              </motion.div>

              <div className="flex">
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="w-full md:w-auto flex items-center justify-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    <span>Yeni Randevu</span>
                  </button>
                </motion.div>
              </div>
            </div>

            {/* Özet istatistikler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bugünkü Randevular</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayAppointments.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Danışan</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <TurkLiraIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bugünkü Kazanç</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {todayPayments.reduce(
                        (sum, payment) => sum + Number(payment.professional_amount),
                        0
                      ).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Activity className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Aylık Kazanç</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {monthlyPayments.reduce(
                        (sum, payment) => sum + Number(payment.professional_amount),
                        0
                      ).toLocaleString('tr-TR', {
                        style: 'currency',
                        currency: 'TRY',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Grafik ve bilgiler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
            >
              {/* Randevu grafiği */}
              <div className="md:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <BarChart4 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    <span>Randevu İstatistikleri</span>
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setChartPeriod('weekly')}
                      className={`text-xs px-3 py-1 rounded-full ${
                        chartPeriod === 'weekly'
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium'
                          : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Haftalık
                    </button>
                    <button
                      onClick={() => setChartPeriod('monthly')}
                      className={`text-xs px-3 py-1 rounded-full ${
                        chartPeriod === 'monthly'
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 font-medium'
                          : 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      Aylık
                    </button>
                  </div>
                </div>
                <div className="h-[280px] w-full flex items-center justify-center px-2 pt-1 pb-3">
                  {appointmentChartData ? (
                    renderLineChart(appointmentChartData, lineChartOptions)
                  ) : (
                    <LoadingData />
                  )}
                </div>
              </div>
              
              

              

              {/* Yaklaşan Randevular */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <Calendar className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  <span>Yaklaşan Randevular</span>
                </h2>
                <div className="space-y-3 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                  {todayAppointments.length > 0 ? (
                    todayAppointments
                      .filter(appointment => new Date(appointment.start_time) >= currentTime)
                      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                      .slice(0, 5)
                      .map((appointment) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {appointment.client?.full_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                              </div>
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                              ROOM_COLORS[rooms.findIndex(r => r.id === appointment.room_id) % ROOM_COLORS.length]
                            }`}>
                              {appointment.room?.name || 'Oda belirtilmedi'}
                            </div>
                          </div>
                        </motion.div>
                      ))
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <p className="text-gray-500 dark:text-gray-400">Bugün için yaklaşan randevu bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Randevu tablosu başlığı */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:justify-between md:items-center mb-6">
                  <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      <span>Randevular</span>
                    </h2>
                    
                    {/* Görünüm modu seçenekleri */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg text-xs font-medium">
                      <button
                        onClick={() => setCalendarViewMode('daily')}
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center justify-center ${
                          calendarViewMode === 'daily'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Günlük
                      </button>
                      <button
                        onClick={() => setCalendarViewMode('weekly')}
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center justify-center ${
                          calendarViewMode === 'weekly'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Haftalık
                      </button>
                      <button
                        onClick={() => setCalendarViewMode('monthly')}
                        className={`px-3 py-1.5 rounded-md transition-all flex items-center justify-center ${
                          calendarViewMode === 'monthly'
                          ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1.5" />
                        Aylık
                      </button>
                    </div>
                  </div>
                  
                  {/* Tarih seçme kontrolleri */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        if (calendarViewMode === 'daily') {
                          setSelectedDate(subDays(selectedDate, 1));
                        } else if (calendarViewMode === 'weekly') {
                          setSelectedDate(subDays(selectedDate, 7));
                        } else if (calendarViewMode === 'monthly') {
                          setSelectedDate(subMonths(selectedDate, 1));
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      aria-label="Önceki dönem"
                    >
                      <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    <DatePicker
                      selected={selectedDate}
                      onChange={(date: Date) => setSelectedDate(date)}
                      locale={tr}
                      dateFormat="d MMMM yyyy"
                      className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm text-gray-900 dark:text-white"
                      popperClassName="z-[9999]"
                      customInput={
                        <button className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {calendarViewMode === 'daily' 
                              ? format(selectedDate, "d MMMM yyyy", { locale: tr })
                              : calendarViewMode === 'weekly'
                                ? `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMM", { locale: tr })} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "d MMM", { locale: tr })}`
                                : format(selectedDate, "MMMM yyyy", { locale: tr })
                            }
                          </span>
                        </button>
                      }
                      renderDayContents={(day, date) => {
                        // Tatil ve çalışma günlerini göster
                        const dayDate = new Date(date);
                        const isVacation = isDateInVacations(dayDate);
                        const isOpen = isClinicOpen(dayDate);
                        
                        return (
                          <div className={`relative ${!isOpen || isVacation ? 'text-red-500 font-medium' : ''}`}>
                            {day}
                            {(!isOpen || isVacation) && (
                              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-1 w-1 bg-red-500 rounded-full"></div>
                            )}
                          </div>
                        );
                      }}
                    />
                    
                    <button
                      onClick={() => {
                        if (calendarViewMode === 'daily') {
                          setSelectedDate(addDays(selectedDate, 1));
                        } else if (calendarViewMode === 'weekly') {
                          setSelectedDate(addDays(selectedDate, 7));
                        } else if (calendarViewMode === 'monthly') {
                          setSelectedDate(addMonths(selectedDate, 1));
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      aria-label="Sonraki dönem"
                    >
                      <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </button>

                    <button
                      onClick={() => setSelectedDate(new Date())}
                      className="mb-2 md:mb-0 px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 transition-all hover:bg-blue-200 dark:hover:bg-blue-800/40 flex items-center text-xs font-medium"
                    >
                      <Calendar className="h-3.5 w-3.5 mr-1.5" />
                      Bugüne Git
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Takvim ve randevu görünümü - Animasyonlar ve geçişlerle geliştirilmiş */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={calendarViewMode}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className={`
                        overflow-auto
                        ${calendarViewMode === 'daily' ? 'h-[550px]' : ''}
                        ${calendarViewMode === 'weekly' ? 'h-[400px]' : ''}
                        ${calendarViewMode === 'monthly' ? 'h-[600px]' : ''}
                      `}
                    >
                      {/* Randevu bulunamadı mesajı - Sadece günlük görünümde gösteriliyor */}
                      {calendarViewMode === 'daily' && (!clinicHours || !clinicHours[days[selectedDate.getDay()]].isOpen || timeSlots.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                          <CalendarOff className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            Bu gün için randevu oluşturulamaz
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 max-w-md">
                            {isDateInVacations(selectedDate) 
                              ? "Bu tarih tatil veya izin gününe denk geliyor." 
                              : "Kliniğin bu gün için çalışma saati bulunmuyor veya kapalı."}
                          </p>
                          <button
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center"
                          >
                            <ChevronRight className="h-4 w-4 mr-1" />
                            <span>Sonraki güne git</span>
                          </button>
                        </div>
                      )}

                      {/* Randevu tablosu - Günlük görünüm */}
                      {calendarViewMode === 'daily' && clinicHours && clinicHours[days[selectedDate.getDay()]].isOpen && timeSlots.length > 0 && (
                        <div className="overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg relative table-fixed">
                          <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
                            <colgroup>
                              <col className="w-[70px]" />
                              {rooms.map((room) => (
                                <col key={room.id} style={{ width: `calc((100% - 70px) / ${rooms.length})` }} />
                              ))}
                            </colgroup>
                            <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-30">
                              <tr>
                                <th className="px-3 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 z-10 w-[70px] min-w-[70px] max-w-[70px] border-b border-gray-200 dark:border-gray-700">
                                  Saat
                                </th>
                                {rooms.map((room: any, index: number) => (
                                  <th
                                    key={room.id}
                                    className="px-3 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-3 h-3 rounded-full ${ROOM_COLORS[index % ROOM_COLORS.length].split(' ')[0]}`}></div>
                                      <span>{room.name}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl divide-y divide-gray-200 dark:divide-gray-700">
                              {timeSlots.map((timeSlot) => (
                                <tr key={timeSlot} className="relative hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors duration-200">
                                  <td className="px-3 py-3 border-r border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl sticky left-0 z-20 w-[70px] min-w-[70px] max-w-[70px]">
                                    {timeSlot}
                                  </td>
                                  {rooms.map((room, index) => (
                                    <td key={room.id} className="relative border-r border-gray-200 dark:border-gray-700 p-1 h-[100px] overflow-visible">
                                      {todayAppointments
                                        .filter(appointment => {
                                          const appointmentStart = new Date(appointment.start_time);
                                          const appointmentHour = appointmentStart.getHours();
                                          const slotHour = parseInt(timeSlot.split(':')[0]);
                                          
                                          // Çevrimiçi oda için is_online=true olan randevuları göster
                                          if (room.id === 'online') {
                                            return appointmentHour === slotHour && appointment.is_online;
                                          }
                                          
                                          // Normal odalar için room_id eşleşenler
                                          return appointmentHour === slotHour && appointment.room_id === room.id;
                                        })
                                        .map(appointment => {
                                          const position = calculateAppointmentPosition(appointment);
                                          return (
                                            <motion.div
                                              key={appointment.id}
                                              initial={{ scale: 0.95, opacity: 0.8 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                              transition={{ duration: 0.2 }}
                                              className={`absolute left-0 right-0 mx-1 p-1.5 rounded-lg shadow-sm ${
                                                ROOM_COLORS[index % ROOM_COLORS.length]
                                                } backdrop-blur-sm backdrop-filter transition-all duration-200 hover:shadow-md cursor-pointer overflow-hidden`}
                                              style={{
                                                top: position.top,
                                                height: position.height,
                                                minHeight: position.minHeight,
                                                zIndex: 25
                                              }}
                                            >
                                              {professional ? (
                                                <div className="font-medium text-sm truncate">
                                                  {appointment.client?.full_name}
                                                  {appointment.is_online && <span className="ml-1 text-xs">(Çevrimiçi)</span>}
                                                </div>
                                              ) : (
                                                <>
                                                  <div className="font-medium text-sm truncate">
                                                    {appointment.professional?.full_name}
                                                    {appointment.is_online && <span className="ml-1 text-xs">(Çevrimiçi)</span>}
                                                  </div>
                                                  <div className="text-xs truncate opacity-90">
                                                    {appointment.client?.full_name}
                                                  </div>
                                                </>
                                              )}
                                              <div className="text-xs opacity-75 mt-1">
                                                {format(new Date(appointment.start_time), 'HH:mm')}-{format(new Date(appointment.end_time), 'HH:mm')}
                                              </div>
                                            </motion.div>
                                          );
                                        })}
                                      {selectedDate && 
                                        format(selectedDate, 'yyyy-MM-dd') === format(currentTime, 'yyyy-MM-dd') && 
                                        parseInt(timeSlot.split(':')[0]) === currentTime.getHours() && (
                                          <div
                                            className="absolute left-0 right-0 border-t-2 border-red-500 pointer-events-none"
                                            style={{
                                              top: calculateTimeLinePosition(),
                                              zIndex: 20
                                            }}
                                          />
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      
                      {/* Haftalık Görünüm - Geliştirilmiş */}
                      {calendarViewMode === 'weekly' && (
                        <div className="overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg relative h-full">
                          <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-4 h-full">
                            <div className="grid grid-cols-7 gap-2 h-full">
                              {/* Haftanın günleri başlıkları */}
                              {Array.from({ length: 7 }).map((_, index) => {
                                const day = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), index);
                                const dayName = format(day, 'EEEE', { locale: tr });
                                const dayNumber = format(day, 'd');
                                const isToday = isSameDay(day, new Date());
                                const isSelected = isSameDay(day, selectedDate);
                                
                                return (
                                  <motion.div 
                                    key={index}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(day)}
                                    className={`flex flex-col items-center py-2 rounded-lg cursor-pointer
                                      ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                                      ${isSelected ? 'bg-blue-100 dark:bg-blue-800/30 ring-1 ring-blue-500' : ''}
                                    `}
                                  >
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                                      {dayName}
                                    </span>
                                    <span className={`text-lg font-semibold mt-1 ${
                                      isToday 
                                        ? 'bg-blue-600 dark:bg-blue-500 text-white w-8 h-8 flex items-center justify-center rounded-full' 
                                        : isSelected 
                                          ? 'text-blue-700 dark:text-blue-300'
                                          : 'text-gray-800 dark:text-gray-200'
                                    }`}>
                                      {dayNumber}
                                    </span>
                                  </motion.div>
                                );
                              })}
                              
                              {/* Zaman çizelgesi - Saatler */}
                              <div className="col-span-7 grid grid-cols-7 gap-2 mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                                {Array.from({ length: 7 }).map((_, dayIndex) => {
                                  const currentDay = addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), dayIndex);
                                  const formattedDay = format(currentDay, 'yyyy-MM-dd');
                                  
                                  // Bu gün için randevuları filtrele
                                  const dayAppointments = monthlyAppointments.filter(appointment => 
                                    format(new Date(appointment.start_time), 'yyyy-MM-dd') === formattedDay
                                  );
                                  
                                  // Kliniğin bu gün açık olup olmadığını kontrol et
                                  const isOpen = isClinicOpen(currentDay);
                                  const isVacation = isDateInVacations(currentDay);
                                  const isToday = isSameDay(currentDay, new Date());
                                  
                                  return (
                                    <div 
                                      key={dayIndex}
                                      className={`
                                        col-span-1 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar relative 
                                        ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/5 rounded-lg' : ''}
                                        ${!isOpen || isVacation ? 'bg-red-50/30 dark:bg-red-900/5 rounded-lg' : ''}
                                      `}
                                    >
                                      {(!isOpen || isVacation) && (
                                        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center opacity-30 pointer-events-none">
                                          <CalendarOff className="h-8 w-8 text-red-500 dark:text-red-400" />
                                        </div>
                                      )}
                                      
                                      {dayAppointments.length === 0 ? (
                                        <div className={`text-center text-xs h-32 flex items-center justify-center relative z-10 ${!isOpen || isVacation ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                                          {!isOpen || isVacation ? "Çalışma Günü Değil" : "Randevu yok"}
                                        </div>
                                      ) : (
                                        <div className="space-y-1.5 relative z-10 py-1">
                                          {dayAppointments
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                            .map((appointment, idx) => (
                                              <motion.div 
                                                key={appointment.id}
                                                initial={{ x: -10, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                whileHover={{ scale: 1.02, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                                                className={`text-xs p-2 rounded ${
                                                  appointment.room_id 
                                                    ? ROOM_COLORS[rooms.findIndex(r => r.id === appointment.room_id) % ROOM_COLORS.length]
                                                    : appointment.is_online
                                                      ? ROOM_COLORS[0] // İlk renk online randevular için
                                                      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                                                }`}
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="font-semibold">{format(new Date(appointment.start_time), 'HH:mm')}</span>
                                                  <span className="text-[10px] opacity-80">
                                                    {format(new Date(appointment.end_time), 'HH:mm')} (
                                                      {Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60))} dk
                                                    )
                                                  </span>
                                                </div>
                                                <div className="truncate font-medium">
                                                  {professional ? appointment.client?.full_name : appointment.professional?.full_name}
                                                </div>
                                                {!professional && (
                                                  <div className="truncate text-[10px] opacity-90 mt-0.5">
                                                    Danışan: {appointment.client?.full_name}
                                                  </div>
                                                )}
                                                {appointment.is_online && (
                                                  <span className="inline-flex items-center text-[10px] mt-1 bg-white/30 dark:bg-black/20 rounded-full px-1.5 py-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span> Çevrimiçi
                                                  </span>
                                                )}
                                              </motion.div>
                                            ))
                                          }
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Aylık Görünüm - Geliştirilmiş */}
                      {calendarViewMode === 'monthly' && (
                        <div className="overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg relative h-full">
                          <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-4 h-full">
                            <div className="grid grid-cols-7 gap-1 h-full">
                              {/* Hafta günü isimleri */}
                              {['Ptesi', 'Salı', 'Çarş', 'Perş', 'Cuma', 'Ctesi', 'Pazar'].map((day, index) => (
                                <div key={index} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2 border-b border-gray-200 dark:border-gray-700">
                                  {day}
                                </div>
                              ))}
                              
                              {/* Ayın günleri */}
                              {(() => {
                                // Ayın ilk günü
                                const firstDayOfMonth = startOfMonth(selectedDate);
                                // İlk günün haftanın kaçıncı günü olduğunu bul (0: Pazar, 1: Pazartesi, ...)
                                // Ancak bizim takvimde Pazartesi ilk gün olduğu için -1 çıkaralım, Pazar ise 6'ya dönüşsün
                                let firstDayIndex = firstDayOfMonth.getDay() - 1;
                                if (firstDayIndex < 0) firstDayIndex = 6;
                                
                                // Ayın toplam gün sayısı
                                const daysInMonth = getDaysInMonth(selectedDate);
                                
                                // Takvim hücreleri için gerekli günleri oluştur
                                // Önceki ayın günlerini, mevcut ayın günlerini ve sonraki ayın günlerini içerir
                                const calendarDays = [];
                                
                                // Önceki ayın günleri
                                for (let i = 0; i < firstDayIndex; i++) {
                                  calendarDays.push({ 
                                    date: subDays(firstDayOfMonth, firstDayIndex - i),
                                    isCurrentMonth: false
                                  });
                                }
                                
                                // Mevcut ayın günleri
                                for (let i = 0; i < daysInMonth; i++) {
                                  calendarDays.push({ 
                                    date: addDays(firstDayOfMonth, i),
                                    isCurrentMonth: true
                                  });
                                }
                                
                                // Sonraki ayın günleri (toplam 35 veya 42 hücre için, 5 veya 6 hafta)
                                const totalDays = calendarDays.length;
                                const remainingCells = totalDays <= 35 ? 35 - totalDays : 42 - totalDays;
                                
                                for (let i = 0; i < remainingCells; i++) {
                                  calendarDays.push({ 
                                    date: addDays(addDays(firstDayOfMonth, daysInMonth), i),
                                    isCurrentMonth: false
                                  });
                                }
                                
                                return calendarDays.map((day, index) => {
                                  const isToday = isSameDay(day.date, new Date());
                                  const isSelected = isSameDay(day.date, selectedDate);
                                  const formattedDate = format(day.date, 'yyyy-MM-dd');
                                  
                                  // Bu gün için randevuları filtrele
                                  const dayAppointments = monthlyAppointments.filter(appointment => 
                                    format(new Date(appointment.start_time), 'yyyy-MM-dd') === formattedDate
                                  );
                                  
                                  // Kliniğin bu gün açık olup olmadığını kontrol et
                                  const isOpen = isClinicOpen(day.date);
                                  const isVacation = isDateInVacations(day.date);
                                  
                                  // Haftasonunu belirle (5: Cumartesi, 6: Pazar)
                                  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
                                  
                                  return (
                                    <motion.div 
                                      key={index}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setSelectedDate(day.date)}
                                      className={`
                                        p-1 h-[90px] border border-gray-100 dark:border-gray-800 relative
                                        hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden
                                        ${!day.isCurrentMonth ? 'opacity-40' : ''}
                                        ${isToday ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : ''}
                                        ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
                                        ${!isOpen || isVacation ? 'bg-red-50/30 dark:bg-red-900/5' : ''}
                                        ${isWeekend && day.isCurrentMonth && !isSelected && !isToday ? 'bg-gray-50 dark:bg-gray-800/30' : ''}
                                      `}
                                    >
                                      <div className={`
                                        text-right text-sm font-medium mb-1 pb-1 border-b border-gray-100 dark:border-gray-800
                                        ${isToday ? 'text-blue-600 dark:text-blue-400' : ''}
                                        ${isSelected ? 'text-blue-700 dark:text-blue-300' : !day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                                      `}>
                                        {format(day.date, 'd')}
                                      </div>
                                      
                                      {(!isOpen || isVacation) && (
                                        <div className="absolute inset-x-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center opacity-20 pointer-events-none">
                                          <CalendarOff className="h-6 w-6 text-red-500 dark:text-red-400" />
                                        </div>
                                      )}
                                      
                                      {dayAppointments.length > 0 ? (
                                        <div className="space-y-1 overflow-hidden max-h-[60px]">
                                          {dayAppointments
                                            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                                            .slice(0, 3)
                                            .map((appointment, idx) => (
                                              <div 
                                                key={appointment.id}
                                                className={`text-[9px] px-1 py-0.5 truncate rounded ${
                                                  appointment.room_id 
                                                    ? ROOM_COLORS[rooms.findIndex(r => r.id === appointment.room_id) % ROOM_COLORS.length]
                                                    : appointment.is_online
                                                      ? ROOM_COLORS[0] // İlk renk online randevular için
                                                      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-300'
                                                }`}
                                              >
                                                <span className="font-semibold inline-block min-w-[28px] mr-0.5">
                                                  {format(new Date(appointment.start_time), 'HH:mm')}
                                                </span>
                                                <span className="truncate inline-block">
                                                  {professional ? appointment.client?.full_name : appointment.professional?.full_name}
                                                </span>
                                              </div>
                                            ))
                                          }
                                          
                                          {dayAppointments.length > 3 && (
                                            <div className="text-[9px] text-center text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-sm px-1 py-0.5">
                                              + {dayAppointments.length - 3} daha
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        day.isCurrentMonth && isOpen && !isVacation && (
                                          <div className="flex items-center justify-center h-[60px] opacity-0 hover:opacity-40 transition-opacity">
                                            <Plus className="h-4 w-4 text-gray-400 dark:text-gray-600" />
                                          </div>
                                        )
                                      )}
                                    </motion.div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Bugün ve Aylık istatistikler */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6"
            >
              {/* Gelir grafiği - SADECE ASISTANLAR İÇİN */}
              {assistant && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                    <LineChart className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    <span>Kasa İstatistikleri</span>
                  </h2>
                  <div className="h-[280px] w-full flex items-center justify-center px-2 pt-1 pb-3">
                    {revenueChartData ? (
                      renderLineChart(revenueChartData, lineChartOptions)
                    ) : (
                      <LoadingData />
                    )}
                  </div>
                </div>
              )}

              {/* Profesyonel Kazanç İstatistikleri - sadece ruh sağlığı uzmanları için */}
              {professional && (
                <div className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                    <TurkLiraIcon className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    <span>Net Kazanç İstatistikleri</span>
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Haftalık Kazanç</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {monthlyPayments
                          .filter(payment => {
                            const paymentDate = new Date(payment.payment_date);
                            const startOfWeekDate = startOfWeek(new Date(), { weekStartsOn: 1 });
                            const endOfWeekDate = endOfWeek(new Date(), { weekStartsOn: 1 });
                            return paymentDate >= startOfWeekDate && paymentDate <= endOfWeekDate;
                          })
                          .reduce((sum: number, payment) => {
                            // Ödeme durumuna göre net kazancı hesapla
                            if (payment.payment_status === 'paid_to_clinic') {
                              return sum + Number(payment.professional_amount || 0);
                            } else if (payment.payment_status === 'paid_to_professional') {
                              return sum + Number(payment.professional_amount || 0) - Number(payment.clinic_amount || 0);
                            }
                            return sum + Number(payment.professional_amount || 0);
                          }, 0)
                          .toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          })}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Aylık Kazanç</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {monthlyPayments
                          .reduce((sum: number, payment) => {
                            // Ödeme durumuna göre net kazancı hesapla
                            if (payment.payment_status === 'paid_to_clinic') {
                              return sum + Number(payment.professional_amount || 0);
                            } else if (payment.payment_status === 'paid_to_professional') {
                              return sum + Number(payment.professional_amount || 0) - Number(payment.clinic_amount || 0);
                            }
                            return sum + Number(payment.professional_amount || 0);
                          }, 0)
                          .toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          })}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Geçen Ay Kazanç</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                        {monthlyPayments
                          .filter(payment => {
                            const paymentDate = new Date(payment.payment_date);
                            const startLastMonth = startOfMonth(subMonths(new Date(), 1));
                            const endLastMonth = endOfMonth(subMonths(new Date(), 1));
                            return paymentDate >= startLastMonth && paymentDate <= endLastMonth;
                          })
                          .reduce((sum: number, payment) => {
                            // Ödeme durumuna göre net kazancı hesapla
                            if (payment.payment_status === 'paid_to_clinic') {
                              return sum + Number(payment.professional_amount || 0);
                            } else if (payment.payment_status === 'paid_to_professional') {
                              return sum + Number(payment.professional_amount || 0) - Number(payment.clinic_amount || 0);
                            }
                            return sum + Number(payment.professional_amount || 0);
                          }, 0)
                          .toLocaleString('tr-TR', {
                            style: 'currency',
                            currency: 'TRY',
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {showCreateModal && (
              <Suspense fallback={<LoadingSpinner fullPage size="medium" loadingText="Randevu oluşturuluyor..." showLoadingText={true} />}>
                <CreateAppointmentModal
                  isOpen={showCreateModal}
                  onClose={() => setShowCreateModal(false)}
                  onSuccess={() => {
                    if (professional) {
                      loadProfessionalData();
                    } else if (assistant) {
                      loadAssistantData();
                    }
                  }}
                  professionalId={professional?.id}
                  assistantId={assistant?.id}
                />
              </Suspense>
            )}
          </div>
        </div>
      )}
    </>
  );
}
