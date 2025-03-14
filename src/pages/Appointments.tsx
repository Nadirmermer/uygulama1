import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Appointment, Professional } from '../types/database';
import {
  Plus,
  Search,
  Calendar,
  CheckCircle,
  XCircle,
  Trash2,
  Undo,
} from 'lucide-react';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addMonths } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '../lib/auth';
import { CreateAppointmentModal } from '../components/CreateAppointmentModal';

type ViewType = 'daily' | 'weekly' | 'monthly' | 'all';

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [duration, setDuration] = useState('45');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState('weekly');
  const [recurrenceCount, setRecurrenceCount] = useState('4');
  const [clinicHours, setClinicHours] = useState({
    pazartesi: { opening: '09:00', closing: '18:00', isOpen: true },
    sali: { opening: '09:00', closing: '18:00', isOpen: true },
    carsamba: { opening: '09:00', closing: '18:00', isOpen: true },
    persembe: { opening: '09:00', closing: '18:00', isOpen: true },
    cuma: { opening: '09:00', closing: '18:00', isOpen: true },
    cumartesi: { opening: '09:00', closing: '18:00', isOpen: false },
    pazar: { opening: '09:00', closing: '18:00', isOpen: false }
  });
  const [formData, setFormData] = useState({
    clientId: '',
    roomId: '',
    startTime: '',
    endTime: '',
    notes: '',
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);

  const navigate = useNavigate();
  const { professional, assistant } = useAuth();

  useEffect(() => {
    loadAppointments();
    loadRooms();
    loadClinicHours();
    loadClients();
  }, [professional?.id, viewType, selectedDate]);

  async function loadAppointments() {
    try {
      setLoading(true);
      let startDate: Date;
      let endDate: Date;

      switch (viewType) {
        case 'daily':
          startDate = startOfDay(selectedDate);
          endDate = endOfDay(selectedDate);
          break;
        case 'weekly':
          startDate = startOfWeek(selectedDate, { locale: tr });
          endDate = endOfWeek(selectedDate, { locale: tr });
          break;
        case 'monthly':
          startDate = startOfMonth(selectedDate);
          endDate = endOfMonth(selectedDate);
          break;
        default:
          startDate = new Date(0); // Unix epoch start
          endDate = new Date(8640000000000000); // Maximum date
      }

      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(*),
          professional:professionals(*),
          room:rooms(*)
        `)
        .order('start_time', { ascending: true });

      if (viewType !== 'all') {
        query = query
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString());
      }

      if (professional) {
        query = query.eq('professional_id', professional.id);
      } else if (assistant) {
        const { data: managedProfessionals } = await supabase
          .from('professionals')
          .select('id')
          .eq('assistant_id', assistant.id);

        if (managedProfessionals) {
          const professionalIds = managedProfessionals.map(p => p.id);
          query = query.in('professional_id', professionalIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRooms() {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  }

  async function loadClinicHours() {
    try {
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
    }
  }

  async function loadClients() {
    try {
      let query = supabase
        .from('clients')
        .select('*, professional:professionals(id)')
        .order('full_name');

      if (professional) {
        query = query.eq('professional_id', professional.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
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
          const professionalIds = managedProfessionals.map(p => p.id);
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

  function calculateAvailableTimeSlots(date: string, roomId?: string) {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const days = ['pazar', 'pazartesi', 'sali', 'carsamba', 'persembe', 'cuma', 'cumartesi'] as const;
    const currentDay = days[dayOfWeek];
    const dayHours = clinicHours[currentDay];

    if (!dayHours.isOpen || !dayHours.opening || !dayHours.closing) return [];

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

        if (roomId && appointment.room_id === roomId) {
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

    return rooms.filter(room => {
      const hasConflict = existingAppointments.some(appointment => {
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

  useEffect(() => {
    if (formData.startTime) {
      const [date] = formData.startTime.split('T');
      const [, time] = formData.startTime.split('T');
      
      if (date !== selectedDate.toISOString().split('T')[0]) {
        setSelectedDate(new Date(date));
        loadExistingAppointments(date);
      }

      if (formData.roomId) {
        setAvailableTimeSlots(calculateAvailableTimeSlots(date, formData.roomId));
      } else {
        setAvailableTimeSlots(calculateAvailableTimeSlots(date));
      }

      if (time) {
        setAvailableRooms(calculateAvailableRooms(date, time.slice(0, 5)));
      }
    }
  }, [formData.startTime, formData.roomId, duration, selectedDate, existingAppointments]);

  const handleRoomChange = (roomId: string) => {
    setFormData(prev => ({
      ...prev,
      roomId,
      startTime: prev.startTime && !calculateAvailableTimeSlots(selectedDate.toISOString().split('T')[0], roomId)
        .includes(prev.startTime.split('T')[1]?.slice(0, 5))
        ? prev.startTime.split('T')[0]
        : prev.startTime
    }));
  };

  const handleTimeChange = (time: string) => {
    const date = formData.startTime.split('T')[0] || new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      startTime: `${date}T${time}`,
      roomId: prev.roomId && !calculateAvailableRooms(date, time)
        .some(room => room.id === prev.roomId)
        ? ''
        : prev.roomId
    }));
  };

  async function handleCreateAppointment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const selectedClient = clients.find(client => client.id === formData.clientId);
      if (!selectedClient) {
        throw new Error('Danışan seçilmedi');
      }

      const professionalId = professional?.id || selectedClient.professional_id;
      if (!professionalId) {
        throw new Error('Ruh sağlığı uzmanı bulunamadı');
      }

      const appointments = [];
      const startDateTime = new Date(formData.startTime);
      let currentDate = startDateTime;

      const count = isRecurring ? parseInt(recurrenceCount) : 1;

      for (let i = 0; i < count; i++) {
        const endDateTime = new Date(
          currentDate.getTime() + parseInt(duration) * 60000
        );

        appointments.push({
          client_id: formData.clientId,
          professional_id: professionalId,
          room_id: formData.roomId || null,
          start_time: currentDate.toISOString(),
          end_time: endDateTime.toISOString(),
          notes: formData.notes || null,
          status: 'scheduled',
        });

        if (recurrenceFrequency === 'weekly') {
          currentDate = addDays(currentDate, 7);
        } else if (recurrenceFrequency === 'monthly') {
          currentDate = addMonths(currentDate, 1);
        }
      }

      const { error } = await supabase
        .from('appointments')
        .insert(appointments);

      if (error) {
        if (error.message.includes('Cannot create appointments in the past')) {
          throw new Error('Geçmiş tarihe randevu oluşturulamaz.');
        }
        if (error.message.includes('Room is already booked')) {
          throw new Error('Bu oda seçilen saatte başka bir randevu için ayrılmış.');
        }
        if (error.message.includes('Professional already has an appointment')) {
          throw new Error('Ruh sağlığı uzmanının bu saatte başka bir randevusu var.');
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
      setDuration('45');
      setIsRecurring(false);
      setRecurrenceFrequency('weekly');
      setRecurrenceCount('4');
      setShowCreateModal(false);
      await loadAppointments();
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

  async function handleUpdateAppointmentStatus(
    appointmentId: string,
    status: 'completed' | 'cancelled' | 'scheduled'
  ) {
    try {
      // If cancelling, ask for confirmation
      if (status === 'cancelled' && !window.confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) {
        return;
      }

      // If reverting from completed to scheduled, ask for confirmation and delete payment record
      if (status === 'scheduled') {
        const { data: appointment } = await supabase
          .from('appointments')
          .select('status')
          .eq('id', appointmentId)
          .single();

        if (appointment?.status === 'completed') {
          if (!window.confirm('Bu işlem randevuya ait ödeme kaydını da silecektir. Devam etmek istiyor musunuz?')) {
            return;
          }

          // Delete associated payment record
          const { error: paymentDeleteError } = await supabase
            .from('payments')
            .delete()
            .eq('appointment_id', appointmentId);

          if (paymentDeleteError) throw paymentDeleteError;
        }
      }

      // Update the appointment status
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (appointmentError) throw appointmentError;

      // If the appointment is marked as completed, create a payment record
      if (status === 'completed') {
        // Get the appointment details with client and professional info
        const { data: appointmentData, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            client:clients(session_fee, professional_share_percentage, clinic_share_percentage),
            professional:professionals(*)
          `)
          .eq('id', appointmentId)
          .single();

        if (fetchError) throw fetchError;

        if (appointmentData && appointmentData.client) {
          const sessionFee = appointmentData.client.session_fee;
          const professionalShare = (sessionFee * appointmentData.client.professional_share_percentage) / 100;
          const clinicShare = (sessionFee * appointmentData.client.clinic_share_percentage) / 100;

          // Create payment record
          const { error: paymentError } = await supabase
            .from('payments')
            .insert({
              appointment_id: appointmentId,
              professional_id: appointmentData.professional_id,
              amount: sessionFee,
              professional_amount: professionalShare,
              clinic_amount: clinicShare,
              payment_status: 'pending',
              collected_by: 'clinic',
              payment_date: new Date().toISOString()
            });

          if (paymentError) throw paymentError;
        }
      }

      await loadAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Randevu durumu güncellenirken bir hata oluştu.');
    }
  }

  async function handleDeleteAppointment(appointmentId: string) {
    if (!window.confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      await loadAppointments();
      alert('Randevu başarıyla silindi.');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      alert('Randevu silinirken bir hata oluştu.');
    }
  }

  const filteredAppointments = appointments.filter(
    (appointment) =>
      appointment.client?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.professional?.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  function getViewTitle() {
    switch (viewType) {
      case 'daily':
        return format(selectedDate, 'PPP', { locale: tr });
      case 'weekly':
        return `${format(startOfWeek(selectedDate, { locale: tr }), 'PPP', { locale: tr })} - ${format(endOfWeek(selectedDate, { locale: tr }), 'PPP', { locale: tr })}`;
      case 'monthly':
        return format(selectedDate, 'MMMM yyyy', { locale: tr });
      default:
        return 'Tüm Randevular';
    }
  }

  function handleDateChange(days: number) {
    const newDate = addDays(selectedDate, days);
    setSelectedDate(newDate);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
          Randevular
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-2.5 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          <span>Yeni Randevu</span>
        </button>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as ViewType)}
            className="h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
            <option value="all">Tümü</option>
          </select>

          {viewType !== 'all' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDateChange(-1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="h-10 px-4 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 transition-all duration-200"
              >
                Bugün
              </button>
              <button
                onClick={() => handleDateChange(1)}
                className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Randevu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      {/* Date Title */}
      <div className="text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
        {getViewTitle()}
      </div>

      {/* Table Section */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tarih/Saat
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Danışan
                </th>
                {assistant && (
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ruh sağlığı uzmanı
                  </th>
                )}
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Oda
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAppointments.map((appointment) => (
                <tr 
                  key={appointment.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(new Date(appointment.start_time), 'PPP', {
                        locale: tr,
                      })}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {format(new Date(appointment.start_time), 'HH:mm', {
                        locale: tr,
                      })}{' '}
                      -
                      {format(new Date(appointment.end_time), 'HH:mm', {
                        locale: tr,
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {appointment.client?.full_name}
                    </div>
                  </td>
                  {assistant && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {appointment.professional?.full_name}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {appointment.room?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                          : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                      }`}
                    >
                      {appointment.status === 'completed'
                        ? 'Tamamlandı'
                        : appointment.status === 'cancelled'
                        ? 'İptal Edildi'
                        : 'Planlandı'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end space-x-3">
                      {appointment.status === 'scheduled' && (
                        <>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                            className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-400/10 rounded-lg transition-colors duration-150"
                            title="Tamamlandı"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'cancelled')}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 rounded-lg transition-colors duration-150"
                            title="İptal Et"
                          >
                            <XCircle className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'scheduled')}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-400/10 rounded-lg transition-colors duration-150"
                          title="Planlanmış durumuna geri al"
                        >
                          <Undo className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAppointment(appointment.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-400/10 rounded-lg transition-colors duration-150"
                        title="Sil"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Appointment Modal */}
      {showCreateModal && (
        <CreateAppointmentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadAppointments}
          clinicHours={clinicHours}
        />
      )}
    </div>
  );
}