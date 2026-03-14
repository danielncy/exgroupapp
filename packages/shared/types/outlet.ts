export interface Outlet {
  id: string;
  brand_id: string;
  name: string;
  address: string;
  city: string;
  country: "MY" | "SG";
  lat: number;
  lng: number;
  phone: string;
  operating_hours: OperatingHours;
  is_active: boolean;
  created_at: string;
}

export interface OperatingHours {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
}

export interface DayHours {
  open: string;  // "10:00"
  close: string; // "21:00"
  is_closed: boolean;
}

export interface Service {
  id: string;
  brand_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  buffer_minutes: number;
  price_cents: number;
  currency: "MYR" | "SGD";
  category: string;
  is_active: boolean;
  created_at: string;
}

export interface Stylist {
  id: string;
  outlet_id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StylistSchedule {
  id: string;
  stylist_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;  // "10:00"
  end_time: string;    // "19:00"
  is_available: boolean;
}
