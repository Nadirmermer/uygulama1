import { useState, useEffect } from 'react';
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
  subDays
} from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Calendar,
  DollarSign,
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
import { CreateAppointmentModal } from '../components/CreateAppointmentModal';
import { Appointment, Client, Professional, Room, Payment } from '../types/database';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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
  
  // Yeni UI için eklenen durum değişkenleri
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [calendarViewMode, setCalendarViewMode] = useState('daily'); // daily, weekly, monthly
  
  // Chart verileri için durum değişkenleri
  const [appointmentChartData, setAppointmentChartData] = useState<any>(null);
  const [revenueChartData, setRevenueChartData] = useState<any>(null);
  const [clientDistributionData, setClientDistributionData] = useState<any>(null);
  const [professionalPerformanceData, setProfessionalPerformanceData] = useState<any>(null);
  
  const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
  
  // Chart verilerini oluşturmak için kullanılan fonksiyonlar
  const generateAppointmentChartData = () => {
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
    
    const gradient = {
      id: 'appointmentGradient',
      beforeDatasetsDraw(chart: any) {
        const { ctx, chartArea: { top, bottom, left, right } } = chart;
        const gradientBg = ctx.createLinearGradient(0, top, 0, bottom);
        gradientBg.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradientBg.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradientBg;
      }
    };
    
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
  };
  
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
        
        return monthlyPayments
          .filter(payment => isSameDay(new Date(payment.payment_date), date))
          .reduce((sum, payment) => {
            return sum + (professional 
              ? Number(payment.professional_amount) 
              : Number(payment.amount)
            );
          }, 0);
      });
    } else if (chartPeriod === 'monthly') {
      // Bu ay için veri oluştur
      const daysInMonth = getDaysInMonth(today);
      labels = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
        return format(date, 'dd', { locale: tr });
      });
      
      data = labels.map((_, index) => {
        const date = new Date(today.getFullYear(), today.getMonth(), index + 1);
        
        return monthlyPayments
          .filter(payment => isSameDay(new Date(payment.payment_date), date))
          .reduce((sum, payment) => {
            return sum + (professional 
              ? Number(payment.professional_amount) 
              : Number(payment.amount)
            );
          }, 0);
      });
    }
    
    setRevenueChartData({
      labels,
      datasets: [{
        label: 'Gelir',
        data,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        fill: true,
        borderRadius: 4,
      }]
    });
  };
  
  const generateClientDistributionData = () => {
    if (!clients.length) {
      setClientDistributionData({
        labels: ['Veri yok'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(99, 102, 241, 0.2)'],
          borderColor: ['rgb(99, 102, 241)'],
          borderWidth: 1,
        }]
      });
      return;
    }
    
    // Basit bir dağılım için cinsiyet veya yaş grupları kullanılabilir
    // Bu örnekte rastgele kategoriler oluşturacağım
    const categories = {
      'Kadın': Math.floor(clients.length * 0.6), // %60
      'Erkek': Math.floor(clients.length * 0.4), // %40
    };
    
    setClientDistributionData({
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          'rgba(249, 115, 22, 0.2)',
          'rgba(99, 102, 241, 0.2)',
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(99, 102, 241)',
        ],
        borderWidth: 1,
        hoverOffset: 4
      }]
    });
  };
  
  // Uzman performans grafiği - Sadece asistan için
  const generateProfessionalPerformanceData = () => {
    if (!assistant || !monthlyAppointments.length) {
      setProfessionalPerformanceData({
        labels: ['Veri yok'],
        datasets: [{
          label: 'Veri yok',
          data: [0],
          backgroundColor: ['rgba(99, 102, 241, 0.2)'],
          borderColor: ['rgb(99, 102, 241)'],
          borderWidth: 1,
        }]
      });
      return;
    }
    
    // Uzmanları al ve randevularına göre gruplama yap
    const professionalsMap = new Map();
    
    monthlyAppointments.forEach(appointment => {
      if (appointment.professional && appointment.professional.id) {
        const profId = appointment.professional.id;
        const profName = appointment.professional.full_name;
        
        if (!professionalsMap.has(profId)) {
          professionalsMap.set(profId, {
            name: profName,
            appointmentCount: 0,
            revenue: 0
          });
        }
        
        const profData = professionalsMap.get(profId);
        profData.appointmentCount += 1;
        
        // İlgili ödeme verisi varsa gelir hesapla
        const payment = monthlyPayments.find(p => p.appointment_id === appointment.id);
        if (payment) {
          profData.revenue += Number(payment.amount);
        }
      }
    });
    
    // Verimlilik sıralamasına göre 
    const sortedProfessionals = Array.from(professionalsMap.values())
      .sort((a, b) => b.appointmentCount - a.appointmentCount)
      .slice(0, 6); // En aktif 6 uzmanı göster
    
    const labels = sortedProfessionals.map(prof => prof.name);
    const appointmentData = sortedProfessionals.map(prof => prof.appointmentCount);
    const revenueData = sortedProfessionals.map(prof => prof.revenue);
    
    setProfessionalPerformanceData({
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Randevu Sayısı',
          data: appointmentData,
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgb(99, 102, 241)',
          borderWidth: 1
        },
        {
          type: 'line' as const,
          label: 'Gelir',
          data: revenueData,
          backgroundColor: 'transparent',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          yAxisID: 'y1'
        }
      ]
    });
  };
  
  // Chart konfigürasyon seçenekleri
  const lineChartOptions = {
    responsive: true,
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
          stepSize: Math.max(1, Math.ceil(Math.max(...(appointmentChartData?.datasets[0]?.data || [1])) / 10)),
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
    barPercentage: 0.6,
    categoryPercentage: 0.7,
    scales: {
      ...lineChartOptions.scales,
      y: {
        ...lineChartOptions.scales.y,
        ticks: {
          ...lineChartOptions.scales.y.ticks,
          stepSize: Math.max(1, Math.ceil(Math.max(...(revenueChartData?.datasets[0]?.data || [1])) / 10)),
        }
      }
    }
  };
  
  const doughnutChartOptions = {
    responsive: true,
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
          stepSize: Math.max(1, Math.ceil(Math.max(...(professionalPerformanceData?.datasets?.[0]?.data || [1])) / 10)),
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
          stepSize: Math.max(1, Math.ceil(Math.max(...(professionalPerformanceData?.datasets?.[1]?.data || [1])) / 10)),
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
      generateClientDistributionData();
    }

    if (assistant && monthlyAppointments.length > 0) {
      generateProfessionalPerformanceData();
    }
  }, [monthlyAppointments, monthlyPayments, clients, chartPeriod]);
  
  // Periyodik olarak grafikler güncelleniyor
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Her dakika güncelle
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        await loadClinicHours();
        await loadClinicBreaks();
        await loadClinicVacations();
        await loadRooms();
        if (professional) {
          await loadProfessionalWorkingHours();
          await loadProfessionalBreaks();
          await loadProfessionalVacations();
          await loadProfessionalData();
        } else if (assistant) {
          await loadAssistantData();
        }
      } finally {
        setLoading(false);
      }
    };

    if (professional || assistant) {
      initializeData();
    }
  }, [professional?.id, assistant?.id]);

  useEffect(() => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
      const currentDay = days[dayOfWeek];
      const dayHours = clinicHours?.[currentDay];

      if (!dayHours?.isOpen) {
        setTimeSlots([]);
        return;
      }

      loadExistingAppointments(date.toISOString().split('T')[0]);
      setTimeSlots(generateTimeSlots(dayHours));
    }
  }, [selectedDate, clinicHours]);

  function generateTimeSlots(dayHours: { opening: string; closing: string; isOpen: boolean }) {
    if (!dayHours.isOpen) return [];

    const dayOfWeek = selectedDate.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    const dayName = getTurkishDayName(currentDay);

    // Tatil günlerini kontrol et
    if (isDateInVacations(selectedDate)) {
      console.log(`${format(selectedDate, 'dd.MM.yyyy')} tarihi tatil/izin gününe denk geliyor.`);
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
    let currentMinute = openingMinute;

    const endTimeInMinutes = closingHour * 60 + closingMinute;

    // Her tam saat için bir zaman dilimi oluştur
    while (currentHour < closingHour) {
      // Mola zamanı kontrolü
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
  }

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
    const hourHeight = 96; // Yüksekliği tr içindeki h-[96px] değeri ile eşleşmeli
    
    // Randevu yüksekliğini hesapla (saatin yüzde kaçını kapsadığına göre)
    const height = (durationInMinutes / 60) * hourHeight;
    
    return {
      top: `${topPercentage}%`,
      height: `${Math.max(24, height)}px`, // En az 24px yükseklik
      minHeight: '24px'
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
    }
  }

  async function loadRooms() {
    try {
      let query = supabase.from('rooms').select('*').order('name');

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

      const { data, error } = await query;

      if (error) throw error;
      setRooms(data || []);
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
      const today = new Date();
      const startOfToday = startOfDay(today);
      const endOfToday = endOfDay(today);
      const startOfThisMonth = startOfMonth(today);
      const endOfThisMonth = endOfMonth(today);

      const { data: todayAppts, error: todayApptsError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          professional:professionals(*),
          room:rooms(*)
        `)
        .eq('professional_id', professional.id)
        .eq('status', 'scheduled')
        .gte('start_time', startOfToday.toISOString())
        .lte('start_time', endOfToday.toISOString())
        .order('start_time');

      if (todayApptsError) throw todayApptsError;

      const { data: monthlyAppts, error: monthlyApptsError } = await supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          professional:professionals(*),
          room:rooms(*)
        `)
        .eq('professional_id', professional.id)
        .eq('status', 'scheduled')
        .gte('start_time', startOfThisMonth.toISOString())
        .lte('start_time', endOfThisMonth.toISOString())
        .order('start_time');

      if (monthlyApptsError) throw monthlyApptsError;

      const { data: todayPays, error: todayPaysError } = await supabase
        .from('payments')
        .select(`
          *,
          appointment:appointments(
            *,
            client:clients(*),
            professional:professionals(*)
          )
        `)
        .eq('professional_id', professional.id)
        .gte('payment_date', startOfToday.toISOString())
        .lte('payment_date', endOfToday.toISOString())
        .order('payment_date');

      if (todayPaysError) throw todayPaysError;

      const { data: monthlyPays, error: monthlyPaysError } = await supabase
        .from('payments')
        .select(`
          *,
          appointment:appointments(
            *,
            client:clients(*),
            professional:professionals(*)
          )
        `)
        .eq('professional_id', professional.id)
        .gte('payment_date', startOfThisMonth.toISOString())
        .lte('payment_date', endOfThisMonth.toISOString())
        .order('payment_date');

      if (monthlyPaysError) throw monthlyPaysError;

      setTodayAppointments(todayAppts || []);
      setMonthlyAppointments(monthlyAppts || []);
      setTodayPayments(todayPays || []);
      setMonthlyPayments(monthlyPays || []);
    } catch (error) {
      console.error('Error loading professional dashboard data:', error);
    }
  }

  async function loadAssistantData() {
    if (!assistant?.id) return;

    try {
      const startToday = startOfDay(selectedDate);
      const endToday = endOfDay(selectedDate);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

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

      setTodayAppointments(todayAppts || []);
      setTodayPayments(todayPays || []);
      setCashStatus({
        opening_balance: cashData?.opening_balance || 0,
        from_professionals:
          todayPays?.reduce((sum, payment) => {
            if (payment.payment_status === 'paid_to_professional') {
              return sum + Number(payment.office_amount);
            }
            return sum;
          }, 0) || 0,
        to_professionals:
          todayPays?.reduce((sum, payment) => {
            if (payment.payment_status === 'paid_to_office') {
              return sum + Number(payment.professional_amount);
            }
            return sum;
          }, 0) || 0,
      });
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

      return (
        appointment.room_id === roomId &&
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
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      let query = supabase
        .from('appointments')
        .select('*')
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
    } catch (error) {
      console.error('Error loading existing appointments:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  if (loadingClinicHours || !clinicHours) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
        <p className="text-gray-600 dark:text-gray-400">
          Klinik çalışma saatleri yükleniyor...
        </p>
      </div>
    );
  }

  if (professional) {
    const todayEarnings = todayPayments.reduce(
      (sum, payment) => sum + Number(payment.professional_amount),
      0
    );
    const monthlyEarnings = monthlyPayments.reduce(
      (sum, payment) => sum + Number(payment.professional_amount),
      0
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        {/* Arka plan efektleri */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-100 dark:bg-primary-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
          <div className="absolute top-1/3 right-10 w-64 h-64 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
          <div className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-purple-100 dark:bg-purple-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
        </div>

        {/* Ana içerik */}
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
          {/* Üst kısım - Hoşgeldiniz ve tarih seçici */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                Hoş Geldiniz, {professional.full_name}
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
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Bugünkü Kazanç</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {todayEarnings.toLocaleString('tr-TR', {
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
                    {monthlyEarnings.toLocaleString('tr-TR', {
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
            <div className="md:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50">
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
              <div className="h-64">
                {appointmentChartData ? (
                  <Line data={appointmentChartData} options={lineChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Danışan dağılımı ve kazanç grafiği */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                <PieChart className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                <span>Danışan Dağılımı</span>
              </h2>
              <div className="h-64 flex items-center justify-center">
                {clientDistributionData ? (
                  <Doughnut data={clientDistributionData} options={doughnutChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
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
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                <span>Günlük Randevular - {format(selectedDate, "d MMMM yyyy", { locale: tr })}</span>
              </h2>

                {/* Tarih seçme kontrolleri */}
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <button
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label="Önceki gün"
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
                          {format(selectedDate, "d MMMM yyyy", { locale: tr })}
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
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    aria-label="Sonraki gün"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Takvim ve randevu görünümü */}
                <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                  {/* Randevu bulunamadı mesajı */}
                  {(!clinicHours || !clinicHours[days[selectedDate.getDay()]].isOpen || timeSlots.length === 0) && (
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

                  {/* Randevu tablosu */}
                  {clinicHours && clinicHours[days[selectedDate.getDay()]].isOpen && timeSlots.length > 0 && (
                <div className="overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg relative">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-30">
                      <tr>
                        <th className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 z-10 min-w-[100px] border-b border-gray-200 dark:border-gray-700">
                          Saat
                        </th>
                        {rooms.map((room: any, index: number) => (
                          <th
                            key={room.id}
                            className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px] max-w-[250px] border-b border-gray-200 dark:border-gray-700"
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
                          <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl sticky left-0 z-20">
                            {timeSlot}
                          </td>
                          {rooms.map((room, index) => (
                            <td key={room.id} className="relative border-r border-gray-200 dark:border-gray-700 p-1 h-[96px]">
                              {todayAppointments
                                .filter(appointment => {
                                  const appointmentStart = new Date(appointment.start_time);
                                  const appointmentHour = appointmentStart.getHours();
                                  const slotHour = parseInt(timeSlot.split(':')[0]);
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
                                      className={`absolute left-0 right-0 mx-2 p-2 rounded-lg shadow-sm ${
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
                                        <div className="font-medium truncate">
                                          {appointment.client?.full_name}
                                        </div>
                                      ) : (
                                        <>
                                          <div className="font-medium text-base truncate">
                                            {appointment.professional?.full_name}
                                          </div>
                                          <div className="text-sm truncate opacity-90">
                                            {appointment.client?.full_name}
                                          </div>
                                        </>
                                      )}
                                      <div className="text-xs opacity-75">
                                        {format(new Date(appointment.start_time), 'HH:mm')} - 
                                        {format(new Date(appointment.end_time), 'HH:mm')}
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
              </div>
            </div>
          </div>
          </motion.div>

          {/* Bugün ve Aylık istatistikler */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
          >
            {/* Gelir grafiği */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-6">
                <BarChart className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                <span>Gelir İstatistikleri</span>
              </h2>
              <div className="h-64">
                {revenueChartData ? (
                  <Bar data={revenueChartData} options={barChartOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Yaklaşan randevular */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                <span>Yaklaşan Randevular</span>
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
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

          {showCreateModal && (
            <CreateAppointmentModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onAppointmentCreated={() => {
                if (professional) {
                  loadProfessionalData();
                } else if (assistant) {
                  loadAssistantData();
                }
              }}
              clinicHours={clinicHours}
            />
          )}
        </div>
      </div>
    );
  }

  // Assistant kullanıcısı için arayüz
  const totalCash =
    cashStatus.opening_balance +
    cashStatus.from_professionals -
    cashStatus.to_professionals;
    
  const totalMonthlyAppointments = monthlyAppointments.length;
  const totalMonthlyRevenue = monthlyPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
  const totalTodayRevenue = todayPayments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const totalProfessionals = new Set(monthlyAppointments.map(a => a.professional_id)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-100 dark:bg-primary-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
        <div className="absolute top-1/3 right-10 w-64 h-64 rounded-full bg-blue-100 dark:bg-blue-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 rounded-full bg-purple-100 dark:bg-purple-900/20 blur-3xl opacity-50 dark:opacity-20"></div>
      </div>

      {/* Ana içerik */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Üst kısım - Hoşgeldiniz ve tarih seçici */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Hoş Geldiniz, {assistant.full_name}
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

        {/* Özet kart alanı */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6"
        >
          {/* Kasa durumu kartı */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Toplam Kasa</p>
                <p className={`text-2xl font-bold ${
                  totalCash >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {totalCash.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>
            </div>
          </div>
          
          {/* Toplam uzman kartı */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <BrainCircuit className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Aktif Uzmanlar</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalProfessionals}</p>
              </div>
            </div>
          </div>
          
          {/* Günlük randevu kartı */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Bugünkü Randevular</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{todayAppointments.length}</p>
              </div>
            </div>
          </div>
          
          {/* Günlük gelir kartı */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-4 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-start">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Bugünkü Gelir</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalTodayRevenue.toLocaleString('tr-TR', {
                    style: 'currency',
                    currency: 'TRY',
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Randevu tablosu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                <span>Günlük Randevular - {format(selectedDate, "d MMMM yyyy", { locale: tr })}</span>
            </h2>

              {/* Tarih seçme kontrolleri */}
              <div className="flex items-center space-x-4 mt-4 md:mt-0">
                <button
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-label="Önceki gün"
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
                        {format(selectedDate, "d MMMM yyyy", { locale: tr })}
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
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-label="Sonraki gün"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Takvim ve randevu görünümü */}
              <div className="overflow-x-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {/* Randevu bulunamadı mesajı */}
                {(!clinicHours || !clinicHours[days[selectedDate.getDay()]].isOpen || timeSlots.length === 0) && (
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

                {/* Randevu tablosu */}
                {clinicHours && clinicHours[days[selectedDate.getDay()]].isOpen && timeSlots.length > 0 && (
              <div className="overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10 md:rounded-lg relative">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl sticky top-0 z-30">
                    <tr>
                          <th className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 z-10 min-w-[100px] border-b border-gray-200 dark:border-gray-700">
                        Saat
                      </th>
                      {rooms.map((room: any, index: number) => (
                        <th
                          key={room.id}
                              className="px-4 py-3 bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-xl text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[200px] max-w-[250px] border-b border-gray-200 dark:border-gray-700"
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
                            <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl sticky left-0 z-20">
                          {timeSlot}
                        </td>
                        {rooms.map((room, index) => (
                          <td key={room.id} className="relative border-r border-gray-200 dark:border-gray-700 p-1 h-[96px]">
                            {todayAppointments
                              .filter(appointment => {
                                const appointmentStart = new Date(appointment.start_time);
                                const appointmentHour = appointmentStart.getHours();
                                const slotHour = parseInt(timeSlot.split(':')[0]);
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
                                    className={`absolute left-0 right-0 mx-2 p-2 rounded-lg shadow-sm ${
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
                                      <div className="font-medium truncate">
                                        {appointment.client?.full_name}
                                      </div>
                                    ) : (
                                      <>
                                        <div className="font-medium text-base truncate">
                                          {appointment.professional?.full_name}
                                        </div>
                                        <div className="text-sm truncate opacity-90">
                                          {appointment.client?.full_name}
                                        </div>
                                      </>
                                    )}
                                    <div className="text-xs opacity-75">
                                      {format(new Date(appointment.start_time), 'HH:mm')} - 
                                      {format(new Date(appointment.end_time), 'HH:mm')}
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
            </div>
          </div>
        </div>
        </motion.div>

        {assistant && (
          <>
            {/* Grafik ve performans istatistikleri - Asistan için */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6"
            >
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <BarChart4 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    <span>Uzman Performansı</span>
            </h2>
                  
                  <div className="flex space-x-2 mt-3 md:mt-0">
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
                
                <div className="h-72">
                  {professionalPerformanceData ? (
                    <Chart 
                      type="bar" 
                      data={professionalPerformanceData} 
                      options={mixedChartOptions} 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
            </div>
                  )}
          </div>
              </div>
            </motion.div>
            
            {/* İstatistik kartları - Asistan için */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6"
            >
              {/* Danışan dağılımı */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <PieChart className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                  <span>Danışan Dağılımı</span>
                </h2>
                
                <div className="h-48 flex items-center justify-center">
                  {clientDistributionData ? (
                    <Doughnut data={clientDistributionData} options={doughnutChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
                      </div>
                  )}
                      </div>
                    </div>
              
              {/* Randevu sayısı */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <BarChart className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                  <span>Randevu İstatistikleri</span>
                </h2>
                
                <div className="h-48">
                  {appointmentChartData ? (
                    <Line data={appointmentChartData} options={lineChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
                    </div>
                  )}
                  </div>
                </div>
              
              {/* Gelir */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-md p-5 border border-gray-200/50 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                  <LineChart className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                  <span>Gelir İstatistikleri</span>
                </h2>
                
                <div className="h-48">
                  {revenueChartData ? (
                    <Bar data={revenueChartData} options={barChartOptions} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">Veri yükleniyor...</p>
            </div>
                  )}
          </div>
        </div>
            </motion.div>
          </>
        )}

        {showCreateModal && (
          <CreateAppointmentModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onAppointmentCreated={() => {
              if (professional) {
                loadProfessionalData();
              } else if (assistant) {
                loadAssistantData();
              }
            }}
            clinicHours={clinicHours}
          />
        )}
      </div>
    </div>
  );
}

function getAppointmentDurationInMinutes(appointment: any) {
  const start = parseISO(appointment.start_time);
  const end = parseISO(appointment.end_time);
  return (end.getTime() - start.getTime()) / (60 * 1000);
}

// Randevu görünüm modu fonksiyonları
const getWeekDates = (date: Date): Date[] => {
  // Pazartesiden başlayacak şekilde haftanın günlerini hesapla
  const start = startOfWeek(date, { weekStartsOn: 1 }); // 1 = Pazartesi
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

function isCurrentWeek(date: Date): boolean {
  const today = new Date();
  const weekDates = getWeekDates(today);
  return weekDates.some(weekDate => isSameDay(weekDate, date));
}

function getMonthWeeks(date: Date): Date[][] {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  // Ayın ilk gününün haftanın hangi günü olduğunu bul (0: Pazar, 1: Pazartesi, ...)
  const dayOfWeekOfFirstDay = getDay(firstDayOfMonth);
  
  // Pazartesiden başlatmak için düzenleme yapılıyor (getDay'de Pazar=0)
  const daysToSubtract = dayOfWeekOfFirstDay === 0 ? 6 : dayOfWeekOfFirstDay - 1;
  
  // Takvimin ilk gününü hesapla (önceki ayın günlerini içerebilir)
  const firstCalendarDate = addDays(firstDayOfMonth, -daysToSubtract);
  
  // Takvimin son gününü hesapla (sonraki ayın günlerini içerebilir)
  const lastDayIndex = getDay(lastDayOfMonth);
  const daysToAdd = lastDayIndex === 0 ? 0 : 7 - lastDayIndex;
  const lastCalendarDate = addDays(lastDayOfMonth, daysToAdd);
  
  // Tüm takvim günlerini al
  const calendarDates = eachDayOfInterval({
    start: firstCalendarDate,
    end: lastCalendarDate
  });
  
  // Günleri haftalara böl
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDates.length; i += 7) {
    weeks.push(calendarDates.slice(i, i + 7));
  }
  
  return weeks;
}
