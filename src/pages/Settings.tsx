import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Room as DatabaseRoom } from '../types/database';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Clock,
  Building2,
  User,
  Lock,
  Mail,
  Phone,
  X,
  Download,
  Smartphone,
  WifiOff,
  Database,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface DayHours {
  opening: string;
  closing: string;
  isOpen: boolean;
}

interface ClinicHours {
  pazartesi: DayHours;
  sali: DayHours;
  carsamba: DayHours;
  persembe: DayHours;
  cuma: DayHours;
  cumartesi: DayHours;
  pazar: DayHours;
}

type ProfessionalWorkingHours = ClinicHours;

interface ProfessionalData {
  full_name: string;
  title: string;
  email: string;
  phone: string;
}

interface AssistantData {
  full_name: string;
  clinic_name: string;
  phone: string;
}

interface ClinicInfo {
  clinic_name: string | null;
  assistant_name: string | null;
  assistant_phone: string | null; // Asistan telefon numarası için yeni alan
}

interface Room extends Omit<DatabaseRoom, 'description' | 'capacity'> {
  description?: string;
  capacity: number;
}

// Modal bileşeni
function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full mx-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const { professional, assistant, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<DatabaseRoom[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<DatabaseRoom | null>(null);
  
  // PWA state'leri
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [storageEstimate, setStorageEstimate] = useState<{ usage: number; quota: number } | null>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'active' | 'installing' | 'waiting' | 'none'>('none');
  
  // Modal state'leri
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [showAssistantModal, setShowAssistantModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showClinicHoursModal, setShowClinicHoursModal] = useState(false);
  const [showProfessionalWorkingHoursModal, setShowProfessionalWorkingHoursModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Form state'leri
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 1,
  });

  const [professionalData, setProfessionalData] = useState({
    full_name: '',
    title: '',
    email: '',
    phone: '',
  });

  const [assistantData, setAssistantData] = useState({
    full_name: '',
    clinic_name: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const [clinicHours, setClinicHours] = useState<ClinicHours>({
    pazartesi: { opening: '09:00', closing: '18:00', isOpen: true },
    sali: { opening: '09:00', closing: '18:00', isOpen: true },
    carsamba: { opening: '09:00', closing: '18:00', isOpen: true },
    persembe: { opening: '09:00', closing: '18:00', isOpen: true },
    cuma: { opening: '09:00', closing: '18:00', isOpen: true },
    cumartesi: { opening: '09:00', closing: '18:00', isOpen: false },
    pazar: { opening: '09:00', closing: '18:00', isOpen: false }
  });

  const [professionalWorkingHours, setProfessionalWorkingHours] = useState<ProfessionalWorkingHours>({
    pazartesi: { opening: '09:00', closing: '18:00', isOpen: true },
    sali: { opening: '09:00', closing: '18:00', isOpen: true },
    carsamba: { opening: '09:00', closing: '18:00', isOpen: true },
    persembe: { opening: '09:00', closing: '18:00', isOpen: true },
    cuma: { opening: '09:00', closing: '18:00', isOpen: true },
    cumartesi: { opening: '09:00', closing: '18:00', isOpen: false },
    pazar: { opening: '09:00', closing: '18:00', isOpen: false }
  });

  const [clinicInfo, setClinicInfo] = useState<ClinicInfo>({
    clinic_name: null,
    assistant_name: null,
    assistant_phone: null, // Yeni alan için başlangıç değeri
  });

  useEffect(() => {
    if (loading) return;

    const initializePage = async () => {
      try {
        if (professional) {
          await loadClinicInfo();
          await loadProfessionalData();
          await loadClinicHours();
          await loadRooms();
          await loadProfessionalWorkingHours();
        } else if (assistant) {
          await loadClinicInfo();
          await loadAssistantData();
          await loadClinicHours();
          await loadRooms();
        } else {
          console.error('No professional or assistant data found');
        }
      } catch (error) {
        console.error('Error initializing page:', error);
      }
    };

    initializePage();
  }, [loading, professional, assistant]);

  // PWA ile ilgili useEffect
  useEffect(() => {
    // PWA yükleme olayını dinle
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Kullanıcı daha önce PWA'yı yüklemiş mi kontrol et
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsPWA(true);
      }
    };

    // Çevrimiçi durumunu dinle
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    // Depolama kullanımını kontrol et
    const checkStorageEstimate = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        try {
          const estimate = await navigator.storage.estimate();
          setStorageEstimate({
            usage: estimate.usage || 0,
            quota: estimate.quota || 0
          });
        } catch (error) {
          console.error('Depolama tahmini alınamadı:', error);
        }
      }
    };

    // Service Worker durumunu kontrol et
    const checkServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length > 0) {
            const registration = registrations[0];
            
            if (registration.active) {
              setServiceWorkerStatus('active');
            } else if (registration.installing) {
              setServiceWorkerStatus('installing');
            } else if (registration.waiting) {
              setServiceWorkerStatus('waiting');
            }
          } else {
            setServiceWorkerStatus('none');
          }
        } catch (error) {
          console.error('Service Worker durumu alınamadı:', error);
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    
    checkIfInstalled();
    checkStorageEstimate();
    checkServiceWorker();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  // Tüm fonksiyonları tanımla
  async function loadClinicInfo() {
    try {
      if (professional) {
        const { data: profData, error: profError } = await supabase
          .from('professionals')
          .select('*')
          .eq('id', professional.id)
          .maybeSingle();

        if (profError) {
          setClinicInfo({
            clinic_name: 'Profesyonel bilgilerine erişilemiyor',
            assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
            assistant_phone: '-'
          });
          return;
        }

        if (!profData) {
          setClinicInfo({
            clinic_name: 'Profesyonel bilgileri bulunamadı',
            assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
            assistant_phone: '-'
          });
          return;
        }

        if (profData.assistant_id) {
          try {
            const { data: assistantData, error: assistantError } = await supabase
              .from('assistants')
              .select('*')
              .eq('id', profData.assistant_id)
              .maybeSingle();

            if (assistantError && assistantError.code !== 'PGRST116') {
              setClinicInfo({
                clinic_name: 'Asistan bilgilerine erişilemiyor',
                assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
                assistant_phone: '-'
              });
              return;
            }

            if (assistantData) {
              setClinicInfo({
                clinic_name: assistantData.clinic_name || 'Klinik adı belirtilmemiş',
                assistant_name: assistantData.full_name || 'İsim belirtilmemiş',
                assistant_phone: assistantData.phone || '-'
              });
            } else {
              setClinicInfo({
                clinic_name: 'Asistan bulunamadı',
                assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
                assistant_phone: '-'
              });
            }
          } catch (error) {
            setClinicInfo({
              clinic_name: 'Asistan bilgilerine erişilemiyor',
              assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
              assistant_phone: '-'
            });
          }
        } else if (assistant) {
          setClinicInfo({
            clinic_name: assistant.clinic_name || 'Klinik adı belirtilmemiş',
            assistant_name: assistant.full_name || 'İsim belirtilmemiş',
            assistant_phone: assistant.phone || '-'
          });
        } else {
          setClinicInfo({
            clinic_name: 'Asistan atanmamış',
            assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
            assistant_phone: '-'
          });
        }
      } else if (assistant) {
        setClinicInfo({
          clinic_name: assistant.clinic_name || 'Klinik adı belirtilmemiş',
          assistant_name: assistant.full_name || 'İsim belirtilmemiş',
          assistant_phone: assistant.phone || '-'
        });
      } else {
        setClinicInfo({
          clinic_name: 'Kullanıcı bilgisi bulunamadı',
          assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
          assistant_phone: '-'
        });
      }
    } catch (error) {
      setClinicInfo({
        clinic_name: 'Klinik bilgilerine erişilemiyor',
        assistant_name: 'Lütfen sistem yöneticinizle iletişime geçin',
        assistant_phone: '-'
      });
    }
  }

  async function loadAssistantData() {
    try {
      const { data, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistant?.id)
        .single();

      if (error) throw error;

      if (data) {
        setAssistantData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          clinic_name: data.clinic_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading assistant data:', error);
    }
  }

  async function loadClinicHours() {
    try {
      if (professional) {
        const { data: prof, error: profError } = await supabase
          .from('professionals')
          .select('*')
          .eq('id', professional.id)
          .maybeSingle();

        if (profError) {
          console.error('Error loading professional for clinic hours:', profError);
          return;
        }

        if (!prof) {
          console.error('Professional data not found for clinic hours');
          return;
        }

        if (prof.assistant_id) {
          const { data: assistantExists, error: assistantError } = await supabase
            .from('assistants')
            .select('id')
            .eq('id', prof.assistant_id)
            .maybeSingle();

          if (assistantError && assistantError.code !== 'PGRST116') {
            console.error('Error checking assistant existence:', assistantError);
            return;
          }

          if (!assistantExists) {
            return;
          }

          const { data: clinicSettings, error: settingsError } = await supabase
            .from('clinic_settings')
            .select('*')
            .eq('assistant_id', prof.assistant_id)
            .maybeSingle();

          if (settingsError) {
            console.error('Error loading clinic settings:', settingsError);
            return;
          }

          if (clinicSettings) {
            setClinicHours({
              pazartesi: {
                opening: clinicSettings.opening_time_monday || '09:00',
                closing: clinicSettings.closing_time_monday || '18:00',
                isOpen: clinicSettings.is_open_monday || false
              },
              sali: {
                opening: clinicSettings.opening_time_tuesday || '09:00',
                closing: clinicSettings.closing_time_tuesday || '18:00',
                isOpen: clinicSettings.is_open_tuesday || false
              },
              carsamba: {
                opening: clinicSettings.opening_time_wednesday || '09:00',
                closing: clinicSettings.closing_time_wednesday || '18:00',
                isOpen: clinicSettings.is_open_wednesday || false
              },
              persembe: {
                opening: clinicSettings.opening_time_thursday || '09:00',
                closing: clinicSettings.closing_time_thursday || '18:00',
                isOpen: clinicSettings.is_open_thursday || false
              },
              cuma: {
                opening: clinicSettings.opening_time_friday || '09:00',
                closing: clinicSettings.closing_time_friday || '18:00',
                isOpen: clinicSettings.is_open_friday || false
              },
              cumartesi: {
                opening: clinicSettings.opening_time_saturday || '09:00',
                closing: clinicSettings.closing_time_saturday || '18:00',
                isOpen: clinicSettings.is_open_saturday || false
              },
              pazar: {
                opening: clinicSettings.opening_time_sunday || '09:00',
                closing: clinicSettings.closing_time_sunday || '18:00',
                isOpen: clinicSettings.is_open_sunday || false
              }
            });
          }
        }
      } else if (assistant) {
        const { data: clinicSettings, error: settingsError } = await supabase
          .from('clinic_settings')
          .select('*')
          .eq('assistant_id', assistant.id)
          .maybeSingle();

        if (settingsError) {
          console.error('Error loading clinic settings for assistant:', settingsError);
          return;
        }

        if (clinicSettings) {
          setClinicHours({
            pazartesi: {
              opening: clinicSettings.opening_time_monday || '09:00',
              closing: clinicSettings.closing_time_monday || '18:00',
              isOpen: clinicSettings.is_open_monday || false
            },
            sali: {
              opening: clinicSettings.opening_time_tuesday || '09:00',
              closing: clinicSettings.closing_time_tuesday || '18:00',
              isOpen: clinicSettings.is_open_tuesday || false
            },
            carsamba: {
              opening: clinicSettings.opening_time_wednesday || '09:00',
              closing: clinicSettings.closing_time_wednesday || '18:00',
              isOpen: clinicSettings.is_open_wednesday || false
            },
            persembe: {
              opening: clinicSettings.opening_time_thursday || '09:00',
              closing: clinicSettings.closing_time_thursday || '18:00',
              isOpen: clinicSettings.is_open_thursday || false
            },
            cuma: {
              opening: clinicSettings.opening_time_friday || '09:00',
              closing: clinicSettings.closing_time_friday || '18:00',
              isOpen: clinicSettings.is_open_friday || false
            },
            cumartesi: {
              opening: clinicSettings.opening_time_saturday || '09:00',
              closing: clinicSettings.closing_time_saturday || '18:00',
              isOpen: clinicSettings.is_open_saturday || false
            },
            pazar: {
              opening: clinicSettings.opening_time_sunday || '09:00',
              closing: clinicSettings.closing_time_sunday || '18:00',
              isOpen: clinicSettings.is_open_sunday || false
            }
          });
        }
      }
    } catch (error) {
      console.error('Error in loadClinicHours:', error);
    }
  }

  async function loadRooms() {
    try {
      // Skip if assistant doesn't exist
      if (!assistant?.id) return;
      
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('assistant_id', assistant.id)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('rooms').insert([
        {
          assistant_id: assistant?.id,
          name: formData.name,
          description: formData.description || null,
          capacity: formData.capacity,
        },
      ]);

      if (error) throw error;

      setFormData({
        name: '',
        description: '',
        capacity: 1,
      });
      setShowCreateModal(false);
      await loadRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Oda oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEditRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          name: formData.name,
          description: formData.description || null,
          capacity: formData.capacity,
        })
        .eq('id', selectedRoom.id)
        .eq('assistant_id', assistant?.id);

      if (error) throw error;

      setFormData({
        name: '',
        description: '',
        capacity: 1,
      });
      setSelectedRoom(null);
      setShowEditModal(false);
      await loadRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      alert('Oda güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateClinicHours(e: React.FormEvent) {
    e.preventDefault();
    
    if (!assistant?.id) {
      alert('Asistan bilgisi bulunamadı.');
      return;
    }
    
    setLoading(true);

    try {
      // Önce mevcut kayıt var mı kontrol et
      const { data: existingSettings } = await supabase
        .from('clinic_settings')
        .select('id')
        .eq('assistant_id', assistant.id)
        .single();

      if (existingSettings) {
        // Mevcut kaydı güncelle
        const { error } = await supabase
          .from('clinic_settings')
          .update({
            opening_time_monday: clinicHours.pazartesi.opening,
            closing_time_monday: clinicHours.pazartesi.closing,
            is_open_monday: clinicHours.pazartesi.isOpen,
            opening_time_tuesday: clinicHours.sali.opening,
            closing_time_tuesday: clinicHours.sali.closing,
            is_open_tuesday: clinicHours.sali.isOpen,
            opening_time_wednesday: clinicHours.carsamba.opening,
            closing_time_wednesday: clinicHours.carsamba.closing,
            is_open_wednesday: clinicHours.carsamba.isOpen,
            opening_time_thursday: clinicHours.persembe.opening,
            closing_time_thursday: clinicHours.persembe.closing,
            is_open_thursday: clinicHours.persembe.isOpen,
            opening_time_friday: clinicHours.cuma.opening,
            closing_time_friday: clinicHours.cuma.closing,
            is_open_friday: clinicHours.cuma.isOpen,
            opening_time_saturday: clinicHours.cumartesi.opening,
            closing_time_saturday: clinicHours.cumartesi.closing,
            is_open_saturday: clinicHours.cumartesi.isOpen,
            opening_time_sunday: clinicHours.pazar.opening,
            closing_time_sunday: clinicHours.pazar.closing,
            is_open_sunday: clinicHours.pazar.isOpen
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase
          .from('clinic_settings')
          .insert([{
            assistant_id: assistant.id,
            opening_time_monday: clinicHours.pazartesi.opening,
            closing_time_monday: clinicHours.pazartesi.closing,
            is_open_monday: clinicHours.pazartesi.isOpen,
            opening_time_tuesday: clinicHours.sali.opening,
            closing_time_tuesday: clinicHours.sali.closing,
            is_open_tuesday: clinicHours.sali.isOpen,
            opening_time_wednesday: clinicHours.carsamba.opening,
            closing_time_wednesday: clinicHours.carsamba.closing,
            is_open_wednesday: clinicHours.carsamba.isOpen,
            opening_time_thursday: clinicHours.persembe.opening,
            closing_time_thursday: clinicHours.persembe.closing,
            is_open_thursday: clinicHours.persembe.isOpen,
            opening_time_friday: clinicHours.cuma.opening,
            closing_time_friday: clinicHours.cuma.closing,
            is_open_friday: clinicHours.cuma.isOpen,
            opening_time_saturday: clinicHours.cumartesi.opening,
            closing_time_saturday: clinicHours.cumartesi.closing,
            is_open_saturday: clinicHours.cumartesi.isOpen,
            opening_time_sunday: clinicHours.pazar.opening,
            closing_time_sunday: clinicHours.pazar.closing,
            is_open_sunday: clinicHours.pazar.isOpen
          }]);

        if (error) throw error;
      }

      setShowClinicHoursModal(false);
      await loadClinicHours();
      alert('Çalışma saatleri başarıyla güncellendi!');
    } catch (error) {
      console.error('Error updating clinic hours:', error);
      alert('Çalışma saatleri güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateAssistant(e: React.FormEvent) {
    e.preventDefault();
    
    if (!assistant?.id) {
      alert('Asistan bilgisi bulunamadı.');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('assistants')
        .update({
          full_name: assistantData.full_name,
          clinic_name: assistantData.clinic_name,
          phone: assistantData.phone || null,
        })
        .eq('id', assistant.id);

      if (error) throw error;

      setShowAssistantModal(false);
      await loadAssistantData();
      alert('Bilgileriniz başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating assistant:', error);
      alert('Bilgileriniz güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Yeni şifreler eşleşmiyor.');
      setLoading(false);
      return;
      }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      alert('Şifreniz başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Şifre güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteRoom(roomId: string) {
    if (!window.confirm('Bu odayı silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      // First check if there are any appointments for this room
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('room_id', roomId)
        .limit(1);

      if (appointmentsError) throw appointmentsError;

      if (appointments && appointments.length > 0) {
        alert('Bu odaya ait randevular bulunduğu için silinemez.');
        return;
      }

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId)
        .eq('assistant_id', assistant?.id);

      if (error) throw error;

      await loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Oda silinirken bir hata oluştu.');
    }
  }

  function handleEditClick(room: Room) {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity || 1,
    });
    setShowEditModal(true);
  }

  async function loadProfessionalData() {
    // Skip if professional doesn't exist
    if (!professional?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', professional.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfessionalData({
          full_name: data.full_name || '',
          title: data.title || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading professional data:', error);
    }
  }

  async function handleUpdateProfessional(e: React.FormEvent) {
    e.preventDefault();
    
    // Skip if professional doesn't exist
    if (!professional?.id) {
      alert('Profesyonel bilgisi bulunamadı.');
      return;
    }
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          full_name: professionalData.full_name,
          title: professionalData.title || null,
          email: professionalData.email || null,
          phone: professionalData.phone || null,
        })
        .eq('id', professional.id);

      if (error) throw error;

      setShowProfessionalModal(false);
      await loadProfessionalData();
      alert('Bilgileriniz başarıyla güncellendi.');
    } catch (error) {
      console.error('Error updating professional:', error);
      alert('Bilgileriniz güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  // Hesap silme fonksiyonu
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteAccountLoading(true);
    setDeleteAccountError('');

    try {
      // Önce şifreyi doğrula
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: deleteAccountPassword,
      });

      if (signInError) {
        setDeleteAccountError('Şifre yanlış. Lütfen tekrar deneyin.');
        setDeleteAccountLoading(false);
        return;
      }

      // Profesyonel/Asistan verilerini sil
      if (professional) {
        // 1. Test sonuçlarını sil
        const { error: testResultsError } = await supabase
          .from('test_results')
          .delete()
          .eq('professional_id', professional.id);

        if (testResultsError) throw testResultsError;

        // 2. Seans notlarını sil
        const { error: sessionNotesError } = await supabase
          .from('session_notes')
          .delete()
          .eq('professional_id', professional.id);

        if (sessionNotesError) throw sessionNotesError;

        // 3. Ödemeleri sil
        const { error: paymentsError } = await supabase
          .from('payments')
          .delete()
          .eq('professional_id', professional.id);

        if (paymentsError) throw paymentsError;

        // 4. Randevuları sil
        const { error: appointmentsError } = await supabase
          .from('appointments')
          .delete()
          .eq('professional_id', professional.id);

        if (appointmentsError) throw appointmentsError;

        // 5. Çalışma saatlerini sil
        const { error: workingHoursError } = await supabase
          .from('professional_working_hours')
          .delete()
          .eq('professional_id', professional.id);

        if (workingHoursError) throw workingHoursError;

        // 6. Danışanları sil
        const { error: clientsError } = await supabase
          .from('clients')
          .delete()
          .eq('professional_id', professional.id);

        if (clientsError) throw clientsError;

        // 7. Ruh sağlığı uzmanı kaydını sil
        const { error: professionalError } = await supabase
          .from('professionals')
          .delete()
          .eq('id', professional.id);

        if (professionalError) throw professionalError;

      } else if (assistant) {
        // 1. Bağlı ruh sağlığı uzmanlarının tüm verilerini sil
        const { data: professionals, error: profError } = await supabase
          .from('professionals')
          .select('id, user_id')
          .eq('assistant_id', assistant.id);

        if (profError) throw profError;

        for (const prof of professionals || []) {
          // Her ruh sağlığı uzmanı için ilişkili verileri sil
          await supabase.from('test_results').delete().eq('professional_id', prof.id);
          await supabase.from('session_notes').delete().eq('professional_id', prof.id);
          await supabase.from('payments').delete().eq('professional_id', prof.id);
          await supabase.from('appointments').delete().eq('professional_id', prof.id);
          await supabase.from('professional_working_hours').delete().eq('professional_id', prof.id);
          await supabase.from('clients').delete().eq('professional_id', prof.id);

          // Ruh sağlığı uzmanının auth hesabını devre dışı bırak
          await supabase.auth.admin.updateUserById(
            prof.user_id,
            { user_metadata: { deleted: true }, app_metadata: { deleted: true } }
          );
        }

        // 2. Ruh sağlığı uzmanlarını sil
        await supabase
          .from('professionals')
          .delete()
          .eq('assistant_id', assistant.id);

        // 3. Odaları sil
        await supabase
          .from('rooms')
          .delete()
          .eq('assistant_id', assistant.id);

        // 4. Klinik ayarlarını sil
        await supabase
          .from('clinic_settings')
          .delete()
          .eq('assistant_id', assistant.id);

        // 5. Asistanı sil
        await supabase
          .from('assistants')
          .delete()
          .eq('id', assistant.id);
      }

      // Kullanıcı hesabını devre dışı bırak
      await supabase.auth.admin.updateUserById(
        user?.id || '',
        { user_metadata: { deleted: true }, app_metadata: { deleted: true } }
      );

      // Oturumu kapat
      await supabase.auth.signOut();

      // Ana sayfaya yönlendir
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteAccountError('Hesap silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      setDeleteAccountLoading(false);
    }
  };

  async function loadProfessionalWorkingHours() {
    try {
      if (!professional?.id) return;

      const { data, error } = await supabase
        .from('professional_working_hours')
        .select('*')
        .eq('professional_id', professional.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows

      // If no data found, we'll use the default values already set in state
      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error

      if (data) {
        setProfessionalWorkingHours({
          pazartesi: {
            opening: data.opening_time_monday,
            closing: data.closing_time_monday,
            isOpen: data.is_open_monday ?? true
          },
          sali: {
            opening: data.opening_time_tuesday,
            closing: data.closing_time_tuesday,
            isOpen: data.is_open_tuesday ?? true
          },
          carsamba: {
            opening: data.opening_time_wednesday,
            closing: data.closing_time_wednesday,
            isOpen: data.is_open_wednesday ?? true
          },
          persembe: {
            opening: data.opening_time_thursday,
            closing: data.closing_time_thursday,
            isOpen: data.is_open_thursday ?? true
          },
          cuma: {
            opening: data.opening_time_friday,
            closing: data.closing_time_friday,
            isOpen: data.is_open_friday ?? true
          },
          cumartesi: {
            opening: data.opening_time_saturday,
            closing: data.closing_time_saturday,
            isOpen: data.is_open_saturday ?? false
          },
          pazar: {
            opening: data.opening_time_sunday,
            closing: data.closing_time_sunday,
            isOpen: data.is_open_sunday ?? false
          }
        });
      }
    } catch (error) {
      console.error('Error loading professional working hours:', error);
    }
  }

  async function handleUpdateProfessionalWorkingHours(e: React.FormEvent) {
    e.preventDefault();
    
    if (!professional?.id) {
      alert('Profesyonel bilgisi bulunamadı.');
      return;
    }
    
    setLoading(true);

    try {
      // Önce mevcut kayıt var mı kontrol et
      const { data: existingSettings } = await supabase
        .from('professional_working_hours')
        .select('id')
        .eq('professional_id', professional.id)
        .single();

      if (existingSettings) {
        // Mevcut kaydı güncelle
        const { error } = await supabase
          .from('professional_working_hours')
          .update({
            opening_time_monday: professionalWorkingHours.pazartesi.opening,
            closing_time_monday: professionalWorkingHours.pazartesi.closing,
            is_open_monday: professionalWorkingHours.pazartesi.isOpen,
            opening_time_tuesday: professionalWorkingHours.sali.opening,
            closing_time_tuesday: professionalWorkingHours.sali.closing,
            is_open_tuesday: professionalWorkingHours.sali.isOpen,
            opening_time_wednesday: professionalWorkingHours.carsamba.opening,
            closing_time_wednesday: professionalWorkingHours.carsamba.closing,
            is_open_wednesday: professionalWorkingHours.carsamba.isOpen,
            opening_time_thursday: professionalWorkingHours.persembe.opening,
            closing_time_thursday: professionalWorkingHours.persembe.closing,
            is_open_thursday: professionalWorkingHours.persembe.isOpen,
            opening_time_friday: professionalWorkingHours.cuma.opening,
            closing_time_friday: professionalWorkingHours.cuma.closing,
            is_open_friday: professionalWorkingHours.cuma.isOpen,
            opening_time_saturday: professionalWorkingHours.cumartesi.opening,
            closing_time_saturday: professionalWorkingHours.cumartesi.closing,
            is_open_saturday: professionalWorkingHours.cumartesi.isOpen,
            opening_time_sunday: professionalWorkingHours.pazar.opening,
            closing_time_sunday: professionalWorkingHours.pazar.closing,
            is_open_sunday: professionalWorkingHours.pazar.isOpen
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase
          .from('professional_working_hours')
          .insert([{
            professional_id: professional.id,
            opening_time_monday: professionalWorkingHours.pazartesi.opening,
            closing_time_monday: professionalWorkingHours.pazartesi.closing,
            is_open_monday: professionalWorkingHours.pazartesi.isOpen,
            opening_time_tuesday: professionalWorkingHours.sali.opening,
            closing_time_tuesday: professionalWorkingHours.sali.closing,
            is_open_tuesday: professionalWorkingHours.sali.isOpen,
            opening_time_wednesday: professionalWorkingHours.carsamba.opening,
            closing_time_wednesday: professionalWorkingHours.carsamba.closing,
            is_open_wednesday: professionalWorkingHours.carsamba.isOpen,
            opening_time_thursday: professionalWorkingHours.persembe.opening,
            closing_time_thursday: professionalWorkingHours.persembe.closing,
            is_open_thursday: professionalWorkingHours.persembe.isOpen,
            opening_time_friday: professionalWorkingHours.cuma.opening,
            closing_time_friday: professionalWorkingHours.cuma.closing,
            is_open_friday: professionalWorkingHours.cuma.isOpen,
            opening_time_saturday: professionalWorkingHours.cumartesi.opening,
            closing_time_saturday: professionalWorkingHours.cumartesi.closing,
            is_open_saturday: professionalWorkingHours.cumartesi.isOpen,
            opening_time_sunday: professionalWorkingHours.pazar.opening,
            closing_time_sunday: professionalWorkingHours.pazar.closing,
            is_open_sunday: professionalWorkingHours.pazar.isOpen
          }]);

        if (error) throw error;
      }

      setShowProfessionalWorkingHoursModal(false);
      await loadProfessionalWorkingHours();
      alert('Çalışma saatleri başarıyla güncellendi!');
    } catch (error) {
      console.error('Error updating professional working hours:', error);
      alert('Çalışma saatleri güncellenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }

  // PWA ile ilgili fonksiyonlar
  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Yükleme isteğini göster
    await installPrompt.prompt();

    // Kullanıcının seçimini bekle
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('Kullanıcı PWA yüklemeyi kabul etti');
      setIsPWA(true);
    } else {
      console.log('Kullanıcı PWA yüklemeyi reddetti');
    }

    // Yükleme isteğini sıfırla
    setInstallPrompt(null);
  };

  const handleUpdateServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        for (const registration of registrations) {
          await registration.update();
        }
        
        // Service Worker durumunu yeniden kontrol et
        const updatedRegistrations = await navigator.serviceWorker.getRegistrations();
        
        if (updatedRegistrations.length > 0) {
          const registration = updatedRegistrations[0];
          
          if (registration.active) {
            setServiceWorkerStatus('active');
          } else if (registration.installing) {
            setServiceWorkerStatus('installing');
          } else if (registration.waiting) {
            setServiceWorkerStatus('waiting');
          }
        }
      } catch (error) {
        console.error('Service Worker güncellenemedi:', error);
      }
    }
  };

  // Byte'ı insan tarafından okunabilir formata dönüştür
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

    return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-8">
            Ayarlar
          </h1>

      <div className="space-y-6">
        {/* Profesyonel için görünüm */}
        {professional && (
          <>
        {/* Kişisel Bilgiler */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-between items-start">
            <div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
                Kişisel Bilgiler
              </h2>
                  <div className="space-y-2">
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <User className="h-5 w-5 mr-2" />
                  {professionalData.full_name}
                </p>
                {professionalData.title && (
                      <p className="flex items-center text-gray-600 dark:text-gray-400 ml-7">
                    {professionalData.title}
                  </p>
                )}
                {professionalData.email && (
                  <p className="flex items-center text-gray-600 dark:text-gray-400">
                    <Mail className="h-5 w-5 mr-2" />
                    {professionalData.email}
                  </p>
                )}
                {professionalData.phone && (
                  <p className="flex items-center text-gray-600 dark:text-gray-400">
                    <Phone className="h-5 w-5 mr-2" />
                    {professionalData.phone}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowProfessionalModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200"
              >
                Düzenle
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
              >
                <Lock className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Klinik Bilgileri */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
            Klinik Bilgileri
          </h2>
          <div className="space-y-2">
            {clinicInfo.clinic_name && clinicInfo.clinic_name !== 'Asistan kaydı bulunamadı' ? (
              <>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <Building2 className="h-5 w-5 mr-2" />
                  {clinicInfo.clinic_name}
                </p>
                {clinicInfo.assistant_name && (
                  <p className="flex items-center text-gray-600 dark:text-gray-400">
                    <User className="h-5 w-5 mr-2" />
                    Asistan: {clinicInfo.assistant_name}
                  </p>
                )}
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="h-5 w-5 mr-2" />
                  {clinicInfo.assistant_phone || '-'}
                </p>
              </>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                  Henüz bir asistana bağlı değilsiniz
                </p>
                <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
                  Bir asistan tarafından sisteme eklenmeniz gerekiyor. Lütfen klinik yöneticinizle iletişime geçin.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Çalışma Saatleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kendi Çalışma Saatleri */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Çalışma Saatlerim
              </h2>
              <button
                onClick={() => setShowProfessionalWorkingHoursModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200"
              >
                Düzenle
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(professionalWorkingHours).map(([day, hours]) => (
                <div key={day} className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                    <span className={`text-sm ${
                      hours.isOpen 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {hours.isOpen ? 'Açık' : 'Kapalı'}
                    </span>
                  </div>
                  {hours.isOpen && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {hours.opening} - {hours.closing}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Klinik Çalışma Saatleri */}
              {clinicInfo.clinic_name && clinicInfo.clinic_name !== 'Asistan kaydı bulunamadı' ? (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Klinik Çalışma Saatleri
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(clinicHours).map(([day, hours]) => (
                <div key={day} className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {day.charAt(0).toUpperCase() + day.slice(1)}
                    </span>
                    <span className={`text-sm ${
                      hours.isOpen 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {hours.isOpen ? 'Açık' : 'Kapalı'}
                    </span>
                  </div>
                  {hours.isOpen && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {hours.opening} - {hours.closing}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
              ) : (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
                    Klinik Çalışma Saatleri
                  </h2>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                      Klinik çalışma saatleri bilgisi bulunamadı
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-300 text-sm mt-1">
                      Bir asistana bağlı olduğunuzda klinik çalışma saatlerini görebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
        </div>

        {/* PWA Ayarları */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
              Uygulama Ayarları
            </h2>
            {!isPWA && installPrompt && (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <Download className="h-5 w-5 mr-2" />
                <span>Uygulamayı Yükle</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* PWA Durumu */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
              <div className="flex items-center mb-2">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h4 className="font-medium text-gray-900 dark:text-white">Uygulama Durumu</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isPWA 
                  ? "Uygulama yüklü ve çalışıyor" 
                  : "Uygulama yüklü değil. Yüklemek için sağdaki butonu kullanabilirsiniz."}
              </p>
              {isPWA && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  Uygulama ana ekranınızdan erişilebilir
                </div>
              )}
            </div>

            {/* Çevrimiçi Durumu */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
              <div className="flex items-center mb-2">
                <WifiOff className={`w-5 h-5 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} mr-2`} />
                <h4 className="font-medium text-gray-900 dark:text-white">Bağlantı Durumu</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isOnline 
                  ? "Çevrimiçi - İnternet bağlantısı var" 
                  : "Çevrimdışı - İnternet bağlantısı yok"}
              </p>
              {!isOnline && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                  Çevrimdışı modda sınırlı özellikler kullanılabilir
                </div>
              )}
            </div>

            {/* Depolama Bilgisi */}
            {storageEstimate && (
              <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
                <div className="flex items-center mb-2">
                  <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Depolama Kullanımı</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Kullanılan:</span>
                    <span className="text-gray-900 dark:text-white">{formatBytes(storageEstimate.usage)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Toplam:</span>
                    <span className="text-gray-900 dark:text-white">{formatBytes(storageEstimate.quota)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full" 
                      style={{ width: `${(storageEstimate.usage / storageEstimate.quota) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Worker Durumu */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white">Uygulama Güncellemesi</h4>
                </div>
                <button 
                  onClick={handleUpdateServiceWorker}
                  className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  Güncelle
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {serviceWorkerStatus === 'active' && "Uygulama güncel"}
                {serviceWorkerStatus === 'installing' && "Güncelleme yükleniyor..."}
                {serviceWorkerStatus === 'waiting' && "Güncelleme hazır, uygulamayı yeniden başlatın"}
                {serviceWorkerStatus === 'none' && "Service Worker bulunamadı"}
              </p>
            </div>
          </div>
        </div>

        {/* Hesap Silme */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
                Hesabı Sil
              </h2>
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <Trash2 className="h-5 w-5" />
              <span>Hesabı Sil</span>
            </button>
          </div>
        </div>
                      </>
                    )}

        {/* Asistan için görünüm */}
        {assistant && (
          <>
      {/* Klinik Bilgileri */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex justify-between items-start">
          <div>
                  <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
              Klinik Bilgileri
            </h2>
                  <div className="space-y-2">
              <p className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="h-5 w-5 mr-2" />
                {assistantData.full_name}
              </p>
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <Building2 className="h-5 w-5 mr-2" />
                  {assistantData.clinic_name}
                </p>
              {assistantData.phone && (
                <p className="flex items-center text-gray-600 dark:text-gray-400">
                  <Phone className="h-5 w-5 mr-2" />
                  {assistantData.phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAssistantModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200"
            >
              Düzenle
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
            >
              <Lock className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Çalışma Saatleri */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Çalışma Saatleri
          </h2>
          <button
            onClick={() => setShowClinicHoursModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200"
          >
            Düzenle
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(clinicHours).map(([day, hours]) => (
            <div key={day} className="p-4 bg-gray-50/50 dark:bg-gray-700/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </span>
                <span className={`text-sm ${
                  hours.isOpen 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {hours.isOpen ? 'Açık' : 'Kapalı'}
                </span>
              </div>
              {hours.isOpen && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {hours.opening} - {hours.closing}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Odalar */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Odalar
          </h2>
          <div className="flex space-x-2">
            <div className="relative">
          <input
            type="text"
            placeholder="Oda ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Oda</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {room.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Kapasite: {room.capacity} kişi
                  </p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditClick(room)}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-lg transition-all duration-200"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-100/80 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Henüz oda eklenmemiş. Yeni oda eklemek için "Yeni Oda" butonuna tıklayın.
            </p>
          </div>
        )}
      </div>

      {/* Hesap Silme */}
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-100 dark:border-red-800/50">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
              Hesabı Sil
            </h2>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              Hesabınızı sildiğinizde tüm verileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
            </p>
          </div>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200 flex items-center space-x-2"
          >
            <Trash2 className="h-5 w-5" />
            <span>Hesabı Sil</span>
          </button>
        </div>
      </div>
          </>
        )}

        {/* Profesyonel Bilgileri Modal */}
        <Modal
          isOpen={showProfessionalModal}
          onClose={() => setShowProfessionalModal(false)}
          title="Kişisel Bilgileri Düzenle"
        >
          <form onSubmit={handleUpdateProfessional} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                value={professionalData.full_name}
                onChange={(e) => setProfessionalData({ ...professionalData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unvan
              </label>
              <input
                type="text"
                value={professionalData.title}
                onChange={(e) => setProfessionalData({ ...professionalData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-posta
                </label>
                <input
                type="email"
                value={professionalData.email}
                onChange={(e) => setProfessionalData({ ...professionalData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon
              </label>
              <input
                type="tel"
                value={professionalData.phone}
                onChange={(e) => setProfessionalData({ ...professionalData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
                </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                onClick={() => setShowProfessionalModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
        </Modal>

        {/* Asistan Bilgileri Modal */}
        <Modal
          isOpen={showAssistantModal}
          onClose={() => setShowAssistantModal(false)}
          title="Klinik Bilgilerini Düzenle"
        >
            <form onSubmit={handleUpdateAssistant} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={assistantData.full_name}
                onChange={(e) => setAssistantData({ ...assistantData, full_name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Klinik Adı
                </label>
                <input
                type="text"
                value={assistantData.clinic_name}
                onChange={(e) => setAssistantData({ ...assistantData, clinic_name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefon
                </label>
                <input
                type="tel"
                value={assistantData.phone}
                onChange={(e) => setAssistantData({ ...assistantData, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssistantModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
        </Modal>

        {/* Şifre Değiştirme Modal */}
        <Modal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          title="Şifre Değiştir"
        >
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mevcut Şifre
                      </label>
                        <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                autoComplete="current-password"
              />
                    </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre
                          </label>
                          <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                autoComplete="new-password"
              />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Yeni Şifre (Tekrar)
                          </label>
                          <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                autoComplete="new-password"
              />
                        </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
                >
                {loading ? 'Değiştiriliyor...' : 'Değiştir'}
                </button>
              </div>
            </form>
        </Modal>

      {/* Oda Oluşturma Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Yeni Oda Ekle"
        >
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Oda Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kapasite
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                />
              </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
                >
                {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
        </Modal>

      {/* Oda Düzenleme Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Oda Düzenle"
        >
            <form onSubmit={handleEditRoom} className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Oda Adı
                </label>
                <input
                  type="text"
                  value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kapasite
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                />
              </div>
            <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
        </Modal>

        {/* Çalışma Saatleri Modal */}
        <Modal
          isOpen={showClinicHoursModal}
          onClose={() => setShowClinicHoursModal(false)}
          title="Çalışma Saatlerini Düzenle"
        >
          <form onSubmit={handleUpdateClinicHours} className="space-y-4">
            {Object.entries(clinicHours).map(([day, hours]) => (
              <div key={day} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hours.isOpen}
                      onChange={(e) =>
                        setClinicHours({
                          ...clinicHours,
                          [day]: { ...hours, isOpen: e.target.checked },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Açık</span>
                  </label>
                </div>
                {hours.isOpen && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Açılış
                      </label>
                      <input
                        type="time"
                        value={hours.opening}
                        onChange={(e) =>
                          setClinicHours({
                            ...clinicHours,
                            [day]: { ...hours, opening: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Kapanış
                      </label>
                      <input
                        type="time"
                        value={hours.closing}
                        onChange={(e) =>
                          setClinicHours({
                            ...clinicHours,
                            [day]: { ...hours, closing: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
          </div>
        </div>
      )}
              </div>
            ))}
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setShowClinicHoursModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
              >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Profesyonel Çalışma Saatleri Modal */}
        <Modal
          isOpen={showProfessionalWorkingHoursModal}
          onClose={() => setShowProfessionalWorkingHoursModal(false)}
          title="Çalışma Saatlerini Düzenle"
        >
          <form onSubmit={handleUpdateProfessionalWorkingHours} className="space-y-4">
            {Object.entries(professionalWorkingHours).map(([day, hours]) => (
              <div key={day} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </span>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={hours.isOpen}
                      onChange={(e) =>
                        setProfessionalWorkingHours({
                          ...professionalWorkingHours,
                          [day]: { ...hours, isOpen: e.target.checked },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Açık</span>
                  </label>
                </div>
                {hours.isOpen && (
                  <div className="grid grid-cols-2 gap-4">
              <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Açılış
                </label>
                <input
                        type="time"
                        value={hours.opening}
                  onChange={(e) =>
                          setProfessionalWorkingHours({
                            ...professionalWorkingHours,
                            [day]: { ...hours, opening: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Kapanış
                </label>
                <input
                        type="time"
                        value={hours.closing}
                  onChange={(e) =>
                          setProfessionalWorkingHours({
                            ...professionalWorkingHours,
                            [day]: { ...hours, closing: e.target.value },
                          })
                        }
                        className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                onClick={() => setShowProfessionalWorkingHoursModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-50"
                >
                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
        </Modal>

        {/* Hesap Silme Modal */}
        <Modal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          title="Hesabı Sil"
        >
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Hesabınızı silmek üzeresiniz. Bu işlem geri alınamaz. Devam etmek için lütfen şifrenizi girin.
            </p>
            {deleteAccountError && (
              <p className="text-red-600 dark:text-red-400 text-sm">{deleteAccountError}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                autoComplete="current-password"
              />
          </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={deleteAccountLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
              >
                {deleteAccountLoading ? 'Siliniyor...' : 'Hesabı Sil'}
              </button>
        </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}