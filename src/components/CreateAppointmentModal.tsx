import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { format, addWeeks, addMonths, startOfToday, isBefore, isAfter, isSameDay, addMinutes } from 'date-fns';
import { Search, Calendar, Clock, Users, Home, FileText, RefreshCw, X, ArrowRight, Video, Monitor, Copy, Check, ExternalLink } from 'react-feather';
import { MantineProvider } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { tr } from 'date-fns/locale';
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

dayjs.locale('tr');

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
  clinicHours: {
    pazartesi: { opening: string; closing: string; isOpen: boolean };
    sali: { opening: string; closing: string; isOpen: boolean };
    carsamba: { opening: string; closing: string; isOpen: boolean };
    persembe: { opening: string; closing: string; isOpen: boolean };
    cuma: { opening: string; closing: string; isOpen: boolean };
    cumartesi: { opening: string; closing: string; isOpen: boolean };
    pazar: { opening: string; closing: string; isOpen: boolean };
  };
}

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

interface ProfessionalWorkingHours {
  pazartesi: { opening: string; closing: string; isOpen: boolean };
  sali: { opening: string; closing: string; isOpen: boolean };
  carsamba: { opening: string; closing: string; isOpen: boolean };
  persembe: { opening: string; closing: string; isOpen: boolean };
  cuma: { opening: string; closing: string; isOpen: boolean };
  cumartesi: { opening: string; closing: string; isOpen: boolean };
  pazar: { opening: string; closing: string; isOpen: boolean };
}

// Room tipini tanımla
interface Room {
  id: number;
  name: string;
  capacity?: number;
}

// Break tipini tanımla
interface Break {
  id: string;
  day_of_week: number; // 0: Pazar, 1: Pazartesi, ... 6: Cumartesi
  start_time: string; // HH:MM formatında
  end_time: string; // HH:MM formatında
  description: string;
}

// Tatil tipini tanımla
interface Vacation {
  id: string;
  start_date: string;
  end_date: string;
  title: string;
  description?: string;
}

function AlertModal({ isOpen, onClose, title, message }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
          >
            ✕
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all duration-200"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}

// Yardımcı fonksiyon: Geçerli saatten önceki saatleri devre dışı bırakmak için
function isTimeBeforeCurrent(time: string, selectedDate: Date | null) {
  if (!selectedDate) return false;
  
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  // Seçilen tarihi al ve saat bilgisini ayarla
  const timeDate = new Date(selectedDate);
  timeDate.setHours(hours, minutes, 0, 0);

  // Sadece tarihleri karşılaştır (saat bilgisi olmadan)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  
  // Eğer seçilen tarih bugünden sonra ise, hiçbir saat devre dışı bırakılmamalı
  if (selectedDay > today) {
    return false;
  }
  
  // Eğer seçilen tarih bugün ise, sadece şu anki saatten önceki saatler devre dışı bırakılmalı
  if (selectedDay.getTime() === today.getTime()) {
    return timeDate <= now;
  }
  
  // Eğer seçilen tarih bugünden önce ise, tüm saatler devre dışı bırakılmalı
  return true;
}

// Yardımcı fonksiyon: Ruh sağlığı uzmanının belirli bir zaman diliminde randevusu var mı kontrol et
function hasProfessionalAppointment(
  time: string, 
  selectedDate: Date, 
  existingAppointments: any[], 
  professionalId: string | null,
  duration: string
) {
  // Bu fonksiyonu daha sonra yeniden yazacağız
  return false;
}

function SuccessModal({ 
  isOpen, 
  onClose, 
  isOnlineMeeting, 
  meetingUrl 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  isOnlineMeeting: boolean; 
  meetingUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Randevu Oluşturuldu
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-5">
          <div className="flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-center text-gray-700 dark:text-gray-300 mb-4">
            Randevu başarıyla oluşturuldu.
          </p>
        </div>
        
        {isOnlineMeeting && meetingUrl && (
          <div className="mb-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h4 className="text-md font-medium text-blue-800 dark:text-blue-300 mb-3">
              Çevrimiçi Görüşme Bağlantısı
            </h4>
            
            <div className="flex items-center mb-3">
              <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg py-2 px-3 text-sm text-gray-800 dark:text-gray-200 truncate">
                {meetingUrl}
              </div>
              <button
                onClick={copyToClipboard}
                className="ml-2 p-2 bg-white dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                title="Bağlantıyı kopyala"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bu bağlantıyı danışanınızla paylaşın. Randevunuz öncesinde görüşmeye katılarak danışanınızla buluşabilirsiniz.
            </div>
            
            <button
              onClick={() => window.open(meetingUrl, '_blank')}
              className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Görüşmeyi Açın</span>
            </button>
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors duration-200"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

export function CreateAppointmentModal({
  isOpen,
  onClose,
  onAppointmentCreated,
  clinicHours,
}: CreateAppointmentModalProps) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [duration] = useState('45');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [isOnlineMeeting, setIsOnlineMeeting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    isOnlineMeeting: boolean;
    meetingUrl: string;
  }>({
    isOpen: false,
    isOnlineMeeting: false,
    meetingUrl: ''
  });
  const [professionalWorkingHours, setProfessionalWorkingHours] = useState<ProfessionalWorkingHours | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [professionalBreaks, setProfessionalBreaks] = useState<Break[]>([]);
  const [clinicBreaks, setClinicBreaks] = useState<Break[]>([]);
  const [professionalVacations, setProfessionalVacations] = useState<Vacation[]>([]);
  const [clinicVacations, setClinicVacations] = useState<Vacation[]>([]);

  const { professional, assistant } = useAuth();

  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadRooms();
    }
  }, [isOpen, professional?.id]);

  // Profesyonel molalarını yükleme fonksiyonu
  async function loadProfessionalBreaks(professionalId: string) {
    try {
      console.log("Ruh sağlığı uzmanı molaları yükleniyor, ID:", professionalId);
      
      const { data, error } = await supabase
        .from('professional_breaks')
        .select('*')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('Molalar yüklenirken hata:', error);
        throw error;
      }
      
      if (data) {
        setProfessionalBreaks(data);
        console.log(`${data.length} adet profesyonel molası yüklendi`, data);
      } else {
        setProfessionalBreaks([]);
      }
    } catch (error) {
      console.error('Error loading professional breaks:', error);
      setProfessionalBreaks([]);
    }
  }

  // Klinik molalarını yükleme fonksiyonu
  async function loadClinicBreaks() {
    try {
      let query = supabase
        .from('clinic_breaks')
        .select('*');

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

      if (error) {
        console.error('Klinik molaları yüklenirken hata:', error);
        throw error;
      }
      
      if (data) {
        setClinicBreaks(data);
        console.log(`${data.length} adet klinik molası yüklendi`, data);
      } else {
        setClinicBreaks([]);
      }
    } catch (error) {
      console.error('Error loading clinic breaks:', error);
      setClinicBreaks([]);
    }
  }

  // Profesyonel tatil günlerini yükleme fonksiyonu
  async function loadProfessionalVacations(professionalId: string) {
    try {
      console.log("Ruh sağlığı uzmanı tatilleri yükleniyor, ID:", professionalId);
      
      const { data, error } = await supabase
        .from('vacations')
        .select('*')
        .eq('professional_id', professionalId);

      if (error) {
        console.error('Tatiller yüklenirken hata:', error);
        throw error;
      }
      
      if (data) {
        setProfessionalVacations(data);
        console.log(`${data.length} adet profesyonel tatili yüklendi`, data);
      } else {
        setProfessionalVacations([]);
      }
    } catch (error) {
      console.error('Error loading professional vacations:', error);
      setProfessionalVacations([]);
    }
  }

  // Klinik tatil günlerini yükleme fonksiyonu
  async function loadClinicVacations() {
    try {
      let query = supabase
        .from('vacations')
        .select('*')
        .is('professional_id', null);

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
        console.error('Klinik tatilleri yüklenirken hata:', error);
        throw error;
      }
      
      if (data) {
        setClinicVacations(data);
        console.log(`${data.length} adet klinik tatili yüklendi`, data);
      } else {
        setClinicVacations([]);
      }
    } catch (error) {
      console.error('Error loading clinic vacations:', error);
      setClinicVacations([]);
    }
  }

  async function loadClients() {
    try {
      let query = supabase
        .from('clients')
        .select('*, professional:professionals(id, full_name)')
        .order('full_name');

      if (professional) {
        query = query.eq('professional_id', professional.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
      setFilteredClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  }

  async function loadRooms() {
    try {
      let query = supabase
        .from('rooms')
        .select('*')
        .order('name');

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

  async function loadExistingAppointments(date: string) {
    try {
      console.log(`${date} tarihindeki randevular yükleniyor...`);
      
      // Tarih aralığını genişlet (seçilen günün tamamı)
      const startTime = new Date(date);
      startTime.setHours(0, 0, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(23, 59, 59, 999);

      // Supabase sorgusu
      let query = supabase
        .from('appointments')
        .select('*, client:clients(full_name)')
        .gte('start_time', startTime.toISOString())
        .lte('start_time', endTime.toISOString())
        .eq('status', 'scheduled');

      // Eğer bir profesyonel seçilmişse, sadece onun randevularını getir
      if (selectedProfessionalId) {
        query = query.eq('professional_id', selectedProfessionalId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Randevular yüklenirken hata:', error);
        throw error;
      }

      console.log(`${date} tarihinde ${data?.length || 0} randevu bulundu`);
      
      if (selectedProfessionalId) {
        const professionalAppointments = data?.filter(
          appointment => appointment.professional_id === selectedProfessionalId
        ) || [];
        
        console.log(`${selectedProfessionalId} ID'li ruh sağlığı uzmanının ${professionalAppointments.length} randevusu var`);
      }

      // Mevcut randevuları state'e kaydet
      setExistingAppointments(data || []);
      
      // Eğer tarih ve saat seçilmişse, müsait saatleri ve odaları güncelle
      if (selectedDate && selectedTime) {
        const availableTimes = calculateAvailableTimeSlots(selectedDate);
        setAvailableTimeSlots(availableTimes);
        
        // Eğer seçilen saat artık müsait değilse, seçimi temizle
        if (selectedTime && !availableTimes.includes(selectedTime)) {
          setSelectedTime('');
          setSelectedRoom(null);
          setAlertModal({
            isOpen: true,
            title: 'Uyarı',
            message: 'Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.'
          });
        } else if (selectedTime) {
          // Seçilen saatte müsait odaları hesapla
          const availableRooms = calculateAvailableRooms(selectedDate, selectedTime);
          setAvailableRooms(availableRooms);
          
          // Eğer seçilen oda artık müsait değilse, seçimi temizle
          if (selectedRoom && !availableRooms.some(room => room.id === selectedRoom.id)) {
            setSelectedRoom(null);
            setAlertModal({
              isOpen: true,
              title: 'Uyarı',
              message: 'Seçtiğiniz oda artık müsait değil. Lütfen başka bir oda seçin.'
            });
          }
        }
      }
    } catch (error) {
      console.error('Randevular yüklenirken hata:', error);
      setAlertModal({
        isOpen: true,
        title: 'Hata',
        message: 'Randevular yüklenirken bir hata oluştu.'
      });
    }
  }

  // Klinik açık olan günleri kontrol eden fonksiyon
  const isClinicOpen = (date: Date) => {
      const dayOfWeek = date.getDay();
      const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
      const currentDay = days[dayOfWeek];
      const dayHours = clinicHours[currentDay];
    return dayHours?.isOpen ?? false;
  };

  useEffect(() => {
    if (searchTerm && !selectedClient) {
      const filtered = clients.filter(client =>
        client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.professional?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    } else if (!searchTerm) {
      setFilteredClients(clients);
    } else {
      // Eğer bir danışan seçilmişse ve arama terimi varsa, filtreleme listesini temizle
      setFilteredClients([]);
    }
  }, [searchTerm, clients, selectedClient]);

  function calculateAvailableTimeSlots(date: Date) {
    const dayOfWeek = date.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    
    // Belirli bir saatin mola saatlerine denk gelip gelmediğini kontrol et
    function isTimeInBreaks(hour: number, minute: number, dayOfWeek: number): boolean {
      // Profesyonel molalarını kontrol et
      const isProfessionalBreakTime = professionalBreaks.some(breakItem => {
        // Gün uyuşuyor mu?
        if (breakItem.day_of_week !== dayOfWeek) return false;
        
        // Saat aralığı kontrolü
        const [startHour, startMinute] = breakItem.start_time.split(':').map(Number);
        const [endHour, endMinute] = breakItem.end_time.split(':').map(Number);
        
        const currentTimeInMinutes = hour * 60 + minute;
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
      });
      
      // Klinik molalarını kontrol et
      const isClinicBreakTime = clinicBreaks.some(breakItem => {
        // Gün uyuşuyor mu?
        if (breakItem.day_of_week !== dayOfWeek) return false;
        
        // Saat aralığı kontrolü
        const [startHour, startMinute] = breakItem.start_time.split(':').map(Number);
        const [endHour, endMinute] = breakItem.end_time.split(':').map(Number);
        
        const currentTimeInMinutes = hour * 60 + minute;
        const startTimeInMinutes = startHour * 60 + startMinute;
        const endTimeInMinutes = endHour * 60 + endMinute;
        
        return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes;
      });
      
      return isProfessionalBreakTime || isClinicBreakTime;
    }
    
    console.log(`${date.toLocaleDateString()} (${currentDay}) için müsait saatler hesaplanıyor...`);
    
    // Hem ruh sağlığı uzmanı hem de klinik saatlerini kontrol et
    const profHours = professionalWorkingHours?.[currentDay];
    const clinicDayHours = clinicHours[currentDay];

    // Eğer herhangi biri çalışmıyorsa, boş liste döndür
    if (!profHours?.isOpen || !clinicDayHours.isOpen) {
      console.log(`Klinik veya ruh sağlığı uzmanı ${currentDay} günü çalışmıyor. Klinik: ${clinicDayHours.isOpen ? 'Açık' : 'Kapalı'}, Uzman: ${profHours?.isOpen ? 'Açık' : 'Kapalı'}`);
      return [];
    }

    // En geç başlangıç ve en erken bitiş saatlerini al
    const [profOpenHour, profOpenMinute = 0] = profHours.opening.split(':').map(Number);
    const [profCloseHour, profCloseMinute] = profHours.closing.split(':').map(Number);
    const [clinicOpenHour, clinicOpenMinute] = clinicDayHours.opening.split(':').map(Number);
    const [clinicCloseHour, clinicCloseMinute] = clinicDayHours.closing.split(':').map(Number);

    console.log(`Ruh sağlığı uzmanı çalışma saatleri: ${profHours.opening}-${profHours.closing}`);
    console.log(`Klinik çalışma saatleri: ${clinicDayHours.opening}-${clinicDayHours.closing}`);

    // Başlangıç saati: Ruh sağlığı uzmanı ve klinik açılış saatlerinden en geç olanı
    let openingHour, openingMinute;
    if (profOpenHour > clinicOpenHour || (profOpenHour === clinicOpenHour && profOpenMinute > clinicOpenMinute)) {
      openingHour = profOpenHour;
      openingMinute = profOpenMinute;
    } else {
      openingHour = clinicOpenHour;
      openingMinute = clinicOpenMinute;
    }

    // Bitiş saati: Ruh sağlığı uzmanı ve klinik kapanış saatlerinden en erken olanı
    let closingHour, closingMinute;
    if (profCloseHour < clinicCloseHour || (profCloseHour === clinicCloseHour && profCloseMinute < clinicCloseMinute)) {
      closingHour = profCloseHour;
      closingMinute = profCloseMinute;
    } else {
      closingHour = clinicCloseHour;
      closingMinute = clinicCloseMinute;
    }

    console.log(`Hesaplanan çalışma saatleri: ${openingHour.toString().padStart(2, '0')}:${openingMinute.toString().padStart(2, '0')}-${closingHour.toString().padStart(2, '0')}:${closingMinute.toString().padStart(2, '0')}`);

    // Müsait zaman dilimlerini oluştur (saatlik aralıklarla)
    const slots: string[] = [];
    const unavailableSlots: string[] = [];
    let currentHour = openingHour;
    let currentMinute = openingMinute;
    
    // Dakikaları bir sonraki tam saate yuvarla
    if (currentMinute > 0) {
      currentHour += 1;
      currentMinute = 0;
    }

    // Şu anki saat
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const isToday = selectedDay.getTime() === today.getTime();

    // Bitiş saati kontrolü için
    const endTimeInMinutes = closingHour * 60 + closingMinute;

    while (currentHour < closingHour) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Geçmiş saat kontrolü
      let isPastTime = false;
      if (isToday) {
        // Yeni bir Date nesnesi oluştur, orijinal nesneyi değiştirme
        const timeDate = new Date(date);
        timeDate.setHours(currentHour, currentMinute, 0, 0);
        isPastTime = timeDate <= now;
        if (isPastTime) {
          unavailableSlots.push(`${timeString} (geçmiş saat)`);
        }
      }
      
      // Mola saatlerini kontrol et
      const isBreakTime = isTimeInBreaks(currentHour, currentMinute, date.getDay());
      if (isBreakTime) {
        unavailableSlots.push(`${timeString} (mola saati)`);
      }
      
      // Eğer geçmiş saat veya mola saati değilse, zaman dilimini ekle
      if (!isPastTime && !isBreakTime) {
        slots.push(timeString);
      }

      // Bir sonraki saat
      currentHour += 1;
    }

    // Son saati kontrol et, sadece kapanış dakikası 0 ise ekle
    if (closingMinute === 0 && currentHour === closingHour) {
      const timeString = `${closingHour.toString().padStart(2, '0')}:00`;
      
      // Geçmiş saat kontrolü
      let isPastTime = false;
      if (isToday) {
        const timeDate = new Date(date);
        timeDate.setHours(closingHour, 0, 0, 0);
        isPastTime = timeDate <= now;
        if (isPastTime) {
          unavailableSlots.push(`${timeString} (geçmiş saat)`);
        }
      }
      
      // Mola saatlerini kontrol et
      const isBreakTime = isTimeInBreaks(closingHour, 0, date.getDay());
      if (isBreakTime) {
        unavailableSlots.push(`${timeString} (mola saati)`);
      }
      
      // Eğer geçmiş saat veya mola saati değilse, zaman dilimini ekle
      if (!isPastTime && !isBreakTime) {
        slots.push(timeString);
      }
    }

    console.log(`Müsait olmayan saatler (${unavailableSlots.length}):`, unavailableSlots);
    console.log(`Müsait saatler (${slots.length}):`, slots);

    return slots;
  }

  function calculateAvailableRooms(date: Date, time: string) {
    console.log(`${date.toLocaleDateString()} ${time} için müsait odalar hesaplanıyor...`);
    
    if (!date || !time) {
      console.log('Tarih veya saat seçilmediği için odalar hesaplanamıyor');
      return [];
    }

    // Tüm odaları al
    console.log(`Toplam oda sayısı: ${rooms.length}`);
    
    // Şimdilik tüm odaları müsait olarak kabul edelim
    return rooms;
  }

  const handleClientSelect = async (client: any) => {
    setSelectedClient(client);
    setSearchTerm(client.full_name);
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedRoom(null);
    setFilteredClients([]);
    
    // Seçilen danışanın ruh sağlığı uzmanının ID'sini kaydet
    const professionalId = client.professional_id;
    setSelectedProfessionalId(professionalId);
    
    // Ruh sağlığı uzmanının çalışma saatlerini yükle
    if (professionalId) {
      try {
        await loadProfessionalWorkingHours(professionalId);
        await loadProfessionalBreaks(professionalId);
        await loadProfessionalVacations(professionalId);
        await loadClinicBreaks();
        await loadClinicVacations();
      } catch (error) {
        console.error('Error loading professional data:', error);
        setAlertModal({
          isOpen: true,
          title: 'Hata',
          message: 'Ruh sağlığı uzmanının verileri yüklenirken bir hata oluştu.'
        });
      }
    } else {
      setAlertModal({
        isOpen: true,
        title: 'Hata',
        message: 'Danışanın ruh sağlığı uzmanı bulunamadı.'
      });
    }
  };

  // Günün müsait olup olmadığını kontrol eden fonksiyon
  const isDateAvailable = (date: Date) => {
    // Tarihin tatil günlerine denk gelip gelmediğini kontrol eden iç fonksiyon
    function isDateInVacations(date: Date): boolean {
      // Tarih kontrolü için formatlama
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Profesyonel tatillerini kontrol et
      const isProfessionalOnVacation = professionalVacations.some(vacation => {
        const startDate = vacation.start_date.split('T')[0];
        const endDate = vacation.end_date.split('T')[0];
        return formattedDate >= startDate && formattedDate <= endDate;
      });
      
      // Klinik tatillerini kontrol et
      const isClinicOnVacation = clinicVacations.some(vacation => {
        const startDate = vacation.start_date.split('T')[0];
        const endDate = vacation.end_date.split('T')[0];
        return formattedDate >= startDate && formattedDate <= endDate;
      });
      
      return isProfessionalOnVacation || isClinicOnVacation;
    }

    // Danışan seçilmemişse, tarih müsait değil
    if (!selectedClient) return false;
    
    // Ruh sağlığı uzmanı bilgileri yoksa, tarih müsait değil
    if (!selectedProfessionalId || !professionalWorkingHours) return false;

    const dayOfWeek = date.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    
    // Klinik ve ruh sağlığı uzmanı için o günün çalışma bilgilerini al
    const clinicDay = clinicHours[currentDay];
    const profDay = professionalWorkingHours[currentDay];

    // İkisinden biri çalışmıyorsa veya bilgileri yoksa, tarih müsait değil
    if (!clinicDay || !profDay) return false;
    
    // Tatilleri kontrol et
    if (isDateInVacations(date)) {
      return false;
    }
    
    // İkisi de çalışıyorsa, tarih müsait
    return clinicDay.isOpen && profDay.isOpen;
  };

  const handleDateSelect = async (date: Date | null) => {
    if (!date) return;
    
    // Danışan seçilmemişse işlemi durdur
    if (!selectedClient) {
      setAlertModal({
        isOpen: true,
        title: 'Danışan Seçilmedi',
        message: 'Lütfen önce bir danışan seçin. Randevu oluşturmak için öncelikle danışan seçilmelidir.'
      });
      return;
    }
    
    // Önce tarihin geçerli olup olmadığını kontrol et
    const now = new Date();
    
    // Sadece tarihleri karşılaştır (saat bilgisi olmadan)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Geçmiş tarih kontrolü
    if (selectedDay < today) {
      setAlertModal({
        isOpen: true,
        title: 'Geçersiz Tarih',
        message: 'Geçmiş bir tarih seçemezsiniz. Lütfen bugün veya gelecek bir tarih seçin.'
      });
      return;
    }

    // Klinik ve ruh sağlığı uzmanı çalışma günü kontrolü
    if (!isDateAvailable(date)) {
      setAlertModal({
        isOpen: true,
        title: 'Uygun Değil',
        message: `Seçilen tarihte klinik veya ${selectedClient.professional?.full_name || 'ruh sağlığı uzmanı'} çalışmıyor.`
      });
      return;
    }
    
    // Tarih seçimini kaydet ve diğer değerleri sıfırla
    setSelectedDate(date);
    setSelectedTime('');
    setSelectedRoom(null);
    
    // Seçilen tarih için mevcut randevuları yükle
    try {
      await loadExistingAppointments(date.toISOString().split('T')[0]);
      
      // Müsait saatleri hesapla
      const availableTimes = calculateAvailableTimeSlots(date);
      setAvailableTimeSlots(availableTimes);
      
      console.log(`${availableTimes.length} adet müsait saat bulundu:`, availableTimes);
    } catch (error) {
      console.error('Randevular yüklenirken hata:', error);
      setAlertModal({
        isOpen: true,
        title: 'Hata',
        message: 'Randevular yüklenirken bir hata oluştu.'
      });
    }
  };

  function handleTimeSelect(time: string) {
    console.log(`Seçilen saat: ${time}`);
    
    // Seçilen saatin gerçekten müsait olup olmadığını kontrol et
    const availableTimes = calculateAvailableTimeSlots(selectedDate);
    
    if (!availableTimes.includes(time)) {
      console.error(`Seçilen saat (${time}) müsait değil!`);
      setAlertModal({
        isOpen: true,
        title: 'Hata',
        message: 'Bu saat dilimi dolu veya geçmiş bir zaman. Lütfen başka bir saat seçin.'
      });
      return;
    }
    
    setSelectedTime(time);
    
    // Seçilen saatte müsait odaları hesapla
    const availableRooms = calculateAvailableRooms(selectedDate, time);
    setAvailableRooms(availableRooms);
    
    // Eğer hiç müsait oda yoksa, kullanıcıyı uyar
    if (availableRooms.length === 0) {
      setAlertModal({
        isOpen: true,
        title: 'Müsait Oda Yok',
        message: 'Seçilen saatte müsait oda bulunmamaktadır. Lütfen başka bir saat seçin.'
      });
      setSelectedRoom(null);
    } else {
      // Eğer daha önce seçilmiş bir oda varsa, hala müsait mi kontrol et
      if (selectedRoom) {
        const isRoomStillAvailable = availableRooms.some(room => room.id === selectedRoom.id);
        if (!isRoomStillAvailable) {
          setSelectedRoom(null);
          console.log(`Önceden seçilen oda (${selectedRoom.name}) artık müsait değil`);
          setAlertModal({
            isOpen: true,
            title: 'Oda Müsait Değil',
            message: 'Önceden seçtiğiniz oda artık müsait değil. Lütfen başka bir oda seçin.'
          });
        }
      }
    }
  }

  function handleRoomSelect(room: Room) {
    console.log(`Seçilen oda: ${room.name} (ID: ${room.id})`);
    
    // Seçilen odanın gerçekten müsait olup olmadığını kontrol et
    const availableRooms = calculateAvailableRooms(selectedDate, selectedTime);
    
    const isRoomAvailable = availableRooms.some(r => r.id === room.id);
    if (!isRoomAvailable) {
      console.error(`Seçilen oda (${room.name}) müsait değil!`);
      setAlertModal({
        isOpen: true,
        title: 'Hata',
        message: 'Bu oda seçilen saat için müsait değil. Lütfen başka bir oda seçin.'
      });
      return;
    }
    
    setSelectedRoom(room);
  }

  // Form alanlarını sıfırlama fonksiyonu
  function resetForm() {
    setSelectedClient(null);
    setSelectedProfessionalId(null);
    setSelectedDate(null);
    setSelectedTime('');
    setSelectedRoom(null);
    setSearchTerm('');
    setFilteredClients([]);
    setAvailableTimeSlots([]);
    setAvailableRooms([]);
    setIsOnlineMeeting(false);
    setMeetingUrl('');
    setSuccessModal({
      isOpen: false,
      isOnlineMeeting: false,
      meetingUrl: ''
    });
  }

  async function handleCreateAppointment() {
    console.log('Randevu oluşturma işlemi başlatılıyor...');
    
    // Tüm gerekli alanların doldurulduğunu kontrol et
    if (!selectedClient || !selectedProfessionalId || !selectedDate || !selectedTime) {
      console.error('Eksik bilgi var:', {
        client: !!selectedClient,
        professional: !!selectedProfessionalId,
        date: !!selectedDate,
        time: !!selectedTime,
        room: !!selectedRoom
      });
      
      setAlertModal({
        isOpen: true,
        title: 'Eksik Bilgi',
        message: 'Lütfen tüm alanları doldurun.'
      });
      return;
    }

    // Fiziksel randevu için oda seçimi zorunlu
    if (!isOnlineMeeting && !selectedRoom) {
      setAlertModal({
        isOpen: true,
        title: 'Oda Seçilmedi',
        message: 'Yüz yüze görüşme için lütfen bir oda seçin.'
      });
      return;
    }

    try {
      // Randevu başlangıç ve bitiş zamanlarını hesapla
      const startTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + parseInt(duration) * 60000);
      
      console.log(`Randevu zamanı: ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`);
      if (!isOnlineMeeting) {
        console.log(`Seçilen oda: ${selectedRoom.name} (ID: ${selectedRoom.id})`);
      } else {
        console.log('Çevrimiçi görüşme seçildi');
      }
      
      // Son bir kez daha müsaitlik kontrolü yap
      const availableTimes = calculateAvailableTimeSlots(selectedDate);
      if (!availableTimes.includes(selectedTime)) {
        console.error(`Seçilen saat (${selectedTime}) artık müsait değil!`);
        setAlertModal({
          isOpen: true,
          title: 'Saat Müsait Değil',
          message: 'Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.'
        });
        return;
      }
      
      // Oda müsaitliği kontrolü sadece fiziksel görüşmeler için
      if (!isOnlineMeeting) {
        const availableRooms = calculateAvailableRooms(selectedDate, selectedTime);
        const isRoomAvailable = availableRooms.some(r => r.id === selectedRoom.id);
        if (!isRoomAvailable) {
          console.error(`Seçilen oda (${selectedRoom.name}) artık müsait değil!`);
          setAlertModal({
            isOpen: true,
            title: 'Oda Müsait Değil',
            message: 'Seçtiğiniz oda artık müsait değil. Lütfen başka bir oda seçin.'
          });
          return;
        }
      }

      // Randevu verilerini hazırla
      const appointmentData: any = {
        client_id: selectedClient.id,
        professional_id: selectedProfessionalId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        is_online: isOnlineMeeting
      };
      
      // Eğer çevrimiçi görüşme ise, toplantı URL'sini ekle
      // Değilse, oda ID'sini ekle
      if (isOnlineMeeting) {
        const jitsiUrl = createJitsiMeetUrl(appointmentData);
        appointmentData.meeting_url = jitsiUrl;
        setMeetingUrl(jitsiUrl);
      } else {
        appointmentData.room_id = selectedRoom.id;
      }
      
      console.log('Randevu verileri:', appointmentData);

      // Randevuyu oluştur
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select();

      if (error) {
        console.error('Randevu oluşturma hatası:', error);
        setAlertModal({
          isOpen: true,
          title: 'Hata',
          message: `Randevu oluşturulurken bir hata oluştu: ${error.message}`
        });
        return;
      }

      console.log('Randevu başarıyla oluşturuldu:', data);
      
      // Mevcut randevuları yeniden yükle
      if (selectedDate) {
        await loadExistingAppointments(selectedDate.toISOString().split('T')[0]);
      }
      
      // Başarılı mesajı göster
      let successMessage = 'Randevu başarıyla oluşturuldu.';
      if (isOnlineMeeting) {
        successMessage += ' Çevrimiçi görüşme bağlantısı kayıt edildi.';
      }
      
      setSuccessModal({
        isOpen: true,
        isOnlineMeeting: isOnlineMeeting,
        meetingUrl: meetingUrl
      });

      // Formu sıfırla ve modalı kapat
      resetForm();
      
      // onAppointmentCreated fonksiyonunu kontrol et ve çağır
      if (typeof onAppointmentCreated === 'function') {
        onAppointmentCreated();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Beklenmeyen hata:', error);
      setAlertModal({
        isOpen: true,
        title: 'Hata',
        message: 'Randevu oluşturulurken beklenmeyen bir hata oluştu.'
      });
    }
  }

  // Ruh sağlığı uzmanının çalışma saatlerini yükleme fonksiyonu
  async function loadProfessionalWorkingHours(professionalId: string) {
    try {
      console.log("Ruh sağlığı uzmanı çalışma saatleri yükleniyor, ID:", professionalId);
      
      const { data, error } = await supabase
        .from('professional_working_hours')
        .select('*')
        .eq('professional_id', professionalId)
        .maybeSingle();

      // Eğer "no rows" hatası varsa veya başka bir hata varsa
      if (error && error.code !== 'PGRST116') {
        console.error('Çalışma saatleri yüklenirken hata:', error);
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
        // Veri yoksa varsayılan değerler kullan
        console.warn('Varsayılan çalışma saatleri kullanılıyor');
        setProfessionalWorkingHours({
          pazartesi: { opening: '09:00', closing: '18:00', isOpen: true },
          sali: { opening: '09:00', closing: '18:00', isOpen: true },
          carsamba: { opening: '09:00', closing: '18:00', isOpen: true },
          persembe: { opening: '09:00', closing: '18:00', isOpen: true },
          cuma: { opening: '09:00', closing: '18:00', isOpen: true },
          cumartesi: { opening: '09:00', closing: '18:00', isOpen: false },
          pazar: { opening: '09:00', closing: '18:00', isOpen: false }
        });
      }
    } catch (error) {
      console.error('Error loading professional working hours:', error);
      
      // Hata durumunda varsayılan çalışma saatleri oluştur
      setProfessionalWorkingHours({
        pazartesi: { opening: '09:00', closing: '18:00', isOpen: true },
        sali: { opening: '09:00', closing: '18:00', isOpen: true },
        carsamba: { opening: '09:00', closing: '18:00', isOpen: true },
        persembe: { opening: '09:00', closing: '18:00', isOpen: true },
        cuma: { opening: '09:00', closing: '18:00', isOpen: true },
        cumartesi: { opening: '09:00', closing: '18:00', isOpen: false },
        pazar: { opening: '09:00', closing: '18:00', isOpen: false }
      });
      
      // Kullanıcıya bilgi ver
      setAlertModal({
        isOpen: true,
        title: 'Bilgi',
        message: 'Ruh sağlığı uzmanının çalışma saatleri yüklenemedi. Varsayılan çalışma saatleri kullanılıyor.'
      });
    }
  }

  // Yardımcı fonksiyon: Güvenli toplantı ID'si oluştur
  function generateMeetingId(appointmentInfo: any): string {
    // Rastgele ve benzersiz bir toplantı kimliği oluştur
    const clientId = appointmentInfo.client_id || '';
    const professionalId = appointmentInfo.professional_id || '';
    const timestamp = new Date().getTime();
    const randomPart = Math.random().toString(36).substring(2, 10);
    
    // Daha güvenli bir hash oluştur
    const baseString = `${clientId}-${professionalId}-${timestamp}-${randomPart}`;
    
    try {
      // Base64 ile kodla ve URL için güvenli karakterlere dönüştür
      const hash = btoa(baseString)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .substring(0, 16); // Yeterince uzun tutarak çakışmaları önle
        
      return `therapy-${hash}`;
    } catch (error) {
      console.error('Hash oluşturma hatası:', error);
      // Hata durumunda basit bir yedek mekanizma
      return `therapy-${timestamp}-${randomPart}`;
    }
  }

  // Yardımcı fonksiyon: Jitsi Meet URL oluştur
  function createJitsiMeetUrl(appointmentInfo: any): string {
    try {
      const meetingId = generateMeetingId(appointmentInfo);
      // Jitsi için standart bir URL formatı
      const baseUrl = 'https://meet.jit.si/';
      return `${baseUrl}${meetingId}`;
    } catch (error) {
      console.error('Jitsi URL oluşturma hatası:', error);
      // Hata durumunda basit bir yedek mekanizma ile yine de bir URL oluştur
      const fallbackId = `therapy-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      return `https://meet.jit.si/${fallbackId}`;
    }
  }

  // Yardımcı fonksiyon: Jitsi toplantı odasını adından ayıkla
  function extractRoomNameFromUrl(url: string): string {
    try {
      // URL'nin temel kısmını kaldır ve oda adını al
      const baseUrl = 'https://meet.jit.si/';
      if (url.startsWith(baseUrl)) {
        return url.substring(baseUrl.length);
      }
      return url.split('/').pop() || '';
    } catch (error) {
      console.error('Oda adı çıkarma hatası:', error);
      return '';
    }
  }

  if (!isOpen) return null;

  return (
    <>
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        title={alertModal.title}
        message={alertModal.message}
      />
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
        isOnlineMeeting={successModal.isOnlineMeeting}
        meetingUrl={successModal.meetingUrl}
      />
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9990]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-6xl p-6 space-y-6 max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Yeni Randevu Oluştur
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Taraf - Danışan Seçimi */}
            <div className="space-y-6">
              {/* Danışan Arama */}
              <div ref={searchRef} className="relative">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <label className="text-lg font-medium text-gray-900 dark:text-white">
                    Danışan Seç
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (selectedClient) {
                        setSelectedClient(null);
                        setSelectedDate(null);
                        setSelectedTime('');
                        setSelectedRoom(null);
                      }
                    }}
                    placeholder="Danışan ara..."
                    className="w-full px-4 py-3 pl-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>

                {/* Arama Sonuçları */}
                {searchTerm && !selectedClient && filteredClients.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between group"
                      >
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {client.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.professional?.full_name || 'Ruh sağlığı uzmanı atanmamış'}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all duration-200" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seçilen Danışan */}
              {selectedClient && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {selectedClient.full_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedClient.professional?.full_name || 'Ruh sağlığı uzmanı atanmamış'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedClient(null);
                        setSelectedDate(null);
                        setSelectedTime('');
                        setSelectedRoom(null);
                        setSearchTerm('');
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tarih Seçimi */}
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <label className="text-lg font-medium text-gray-900 dark:text-white">
                    Tarih Seç
                  </label>
                </div>
                <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden w-full max-w-[320px] ${!selectedClient ? 'opacity-50 pointer-events-none' : ''}`}>
                  <MantineProvider>
                    <DatePicker
                      value={selectedDate}
                      onChange={(date) => {
                        if (date && selectedClient) {
                          handleDateSelect(date);
                        } else if (date && !selectedClient) {
                          setAlertModal({
                            isOpen: true,
                            title: 'Danışan Seçilmedi',
                            message: 'Lütfen önce bir danışan seçin.'
                          });
                        }
                      }}
                      minDate={new Date()}
                      excludeDate={(date) => {
                        // Bugünden önceki tarihleri devre dışı bırak
                        const now = new Date();
                        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                        
                        // Geçmiş tarihleri her zaman devre dışı bırak
                        if (checkDate < today) {
                          return true;
                        }
                        
                        // Eğer danışan seçilmişse ve ruh sağlığı uzmanı bilgileri varsa
                        // ruh sağlığı uzmanının ve kliniğin çalışma günlerine göre filtreleme yap
                        if (selectedClient && selectedProfessionalId && professionalWorkingHours) {
                          // isDateAvailable fonksiyonu hem ruh sağlığı uzmanı hem de klinik çalışma günlerini kontrol eder
                          return !isDateAvailable(date);
                        }
                        
                        // Danışan seçilmemişse tüm günler devre dışı olmalı
                        if (!selectedClient) {
                          return true;
                        }
                        
                        // Varsayılan olarak sadece klinik çalışma günlerini kontrol et
                        return !isClinicOpen(date);
                      }}
                      locale="tr"
                      size="md"
                      className="w-full"
                    />
                  </MantineProvider>
                </div>
              </div>

              {/* Görüşme Tipi Seçimi */}
              {selectedDate && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-lg font-medium text-gray-900 dark:text-white">
                      Görüşme Tipi
                    </label>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsOnlineMeeting(false)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
                          ${!isOnlineMeeting 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          } transition-colors duration-200`}
                      >
                        <Home className="h-5 w-5" />
                        <span>Yüz Yüze</span>
                      </button>
                      <button
                        onClick={() => setIsOnlineMeeting(true)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
                          ${isOnlineMeeting 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          } transition-colors duration-200`}
                      >
                        <Video className="h-5 w-5" />
                        <span>Çevrimiçi</span>
                      </button>
                    </div>
                    {isOnlineMeeting && (
                      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                        Çevrimiçi görüşme için Jitsi Meet platformu kullanılacaktır. Görüşme bağlantısı randevu oluşturulduktan sonra danışana otomatik olarak iletilecektir.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Taraf - Saat ve Oda Seçimi */}
            <div className="space-y-6">
              {/* Saat Seçimi */}
              {selectedDate && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-lg font-medium text-gray-900 dark:text-white">
                      Saat Seç
                    </label>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    {availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {availableTimeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleTimeSelect(time)}
                            className={`
                              px-4 py-2 rounded-lg text-sm font-medium
                              ${selectedTime === time
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600/50'
                              }
                              transition-colors duration-200
                            `}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <div className="flex justify-center mb-2">
                          <RefreshCw className="h-6 w-6 text-gray-400" />
                        </div>
                        <p>Seçilen tarihte müsait saat bulunmuyor.</p>
                        <p className="text-sm mt-1">Lütfen başka bir tarih seçin.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Oda Seçimi */}
              {selectedTime && !isOnlineMeeting && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-lg font-medium text-gray-900 dark:text-white">
                      Oda Seç
                    </label>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    {availableRooms.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availableRooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => handleRoomSelect(room)}
                            className={`
                              px-4 py-2 rounded-lg text-sm font-medium
                              ${selectedRoom?.id === room.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }
                              transition-colors duration-200
                            `}
                          >
                            {room.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <div className="flex justify-center mb-2">
                          <RefreshCw className="h-6 w-6 text-gray-400" />
                        </div>
                        <p>Seçilen saatte müsait oda bulunmuyor.</p>
                        <p className="text-sm mt-1">Lütfen başka bir saat seçin.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Çevrimiçi Görüşme Bilgileri */}
              {selectedTime && isOnlineMeeting && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                      <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <label className="text-lg font-medium text-gray-900 dark:text-white">
                      Çevrimiçi Görüşme
                    </label>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      Çevrimiçi görüşme için güvenli bir Jitsi Meet bağlantısı oluşturulacaktır.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Randevu oluşturulduğunda, görüşme bağlantısı otomatik olarak oluşturulacak ve randevu detaylarında görüntülenebilecektir.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              İptal
            </button>
            <button
              onClick={handleCreateAppointment}
              disabled={!selectedClient || !selectedDate || !selectedTime || 
                       (!isOnlineMeeting && !selectedRoom) || 
                       loading}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>Randevu Oluştur</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}