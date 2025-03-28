export interface Professional {
  id: string;
  created_at: string;
  user_id: string;
  full_name: string;
  title?: string;
  email?: string;
  phone?: string;
  assistant_id: string;
  specialization: string | null;
  status: string;
  profile_image_url: string | null;
}

export interface Assistant {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  clinic_name?: string;
  created_at: string;
  address: string | null;
  status: string;
  profile_image_url: string | null;
}

export interface Client {
  id: string;
  created_at: string;
  full_name: string;
  email?: string;
  phone?: string;
  birth_date?: string;
  notes?: string;
  session_fee: number;
  professional_share_percentage: number;
  clinic_share_percentage: number;
  professional_id: string;
  professional?: Professional;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  status: string;
}

export interface Room {
  id: string;
  created_at: string;
  name: string;
  description?: string;
  capacity: number;
  assistant_id: string;
}

export interface Appointment {
  id: string;
  created_at: string;
  client_id: string;
  professional_id: string;
  room_id?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  client?: Client;
  professional?: Professional;
  room?: Room;
  is_online?: boolean;
  meeting_url?: string;
}

export interface Payment {
  id: string;
  appointment_id: string;
  professional_id: string;
  amount: number;
  professional_amount: number;
  clinic_amount: number;
  payment_method?: 'cash' | 'credit_card';
  payment_status: 'pending' | 'paid_to_clinic' | 'paid_to_professional';
  collected_by: 'clinic' | 'professional';
  payment_date: string;
  created_at: string;
  appointment?: {
    client?: {
      full_name: string;
    };
    professional?: {
      full_name: string;
    };
  };
  notes: string | null;
}

export interface TestResult {
  id: string;
  client_id: string;
  professional_id: string;
  test_type: string;
  score: number;
  answers: Record<string, any>;
  created_at: string;
  encrypted_answers?: string;
  encryption_key?: string;
  iv?: string;
  notes?: string;
  duration_seconds?: number;
  started_at?: string;
  completed_at?: string;
  is_public_access?: boolean;
}