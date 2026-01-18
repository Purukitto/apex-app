export type Bike = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year?: number | null;
  current_odo: number; // Odometer reading in kilometers (integer)
  nick_name?: string | null;
  image_url?: string | null;
  specs_engine?: string | null;
  specs_power?: string | null;
  avg_mileage?: number | null; // Average mileage in km per litre (calculated from full tank logs)
  last_fuel_price?: number | null; // Most recent price per litre from fuel logs
  created_at: string;
};

export type GeoJSONLineString = {
  type: "LineString";
  coordinates: [number, number][]; // [longitude, latitude] pairs
};

export type Ride = {
  id: string;
  bike_id: string;
  user_id: string;
  start_time: string;
  end_time?: string | null;
  distance_km: number;
  max_lean_left: number;
  max_lean_right: number;
  route_path?: GeoJSONLineString | null;
  ride_name?: string | null;
  notes?: string | null;
  image_url?: string | null;
  created_at: string;
};

export type MaintenanceLog = {
  id: string;
  bike_id: string;
  service_type: string; // Required by database constraint
  odo_at_service: number;
  date_performed: string; // date format
  notes?: string | null;
  receipt_url?: string | null;
  created_at: string;
};

export type FuelLog = {
  id: string;
  bike_id: string;
  odometer: number;
  litres: number;
  price_per_litre: number;
  total_cost: number;
  is_full_tank: boolean;
  date: string; // date format
  created_at: string;
};

export type MaintenanceSchedule = {
  id: string;
  bike_id: string;
  part_name: string;
  interval_km: number;
  interval_months: number;
  last_service_date?: string | null; // date format, nullable
  last_service_odo?: number | null; // nullable
  is_active: boolean;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  type: 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  read_at?: string | null;
  dismissed_at?: string | null;
  created_at: string;
  bike_id?: string | null;
  schedule_id?: string | null;
  source?: string | null;
  dedupe_key?: string | null;
};

export type ServiceHistory = {
  id: string;
  bike_id: string;
  schedule_id: string;
  service_date: string; // date format
  service_odo: number;
  cost?: number | null; // nullable
  notes?: string | null; // nullable
  created_at: string;
};

export type GlobalBikeSpec = {
  id: string;
  make: string;
  model: string;
  year: number | null;
  category: string | null;
  displacement: string | null;
  power: string | null;
  torque: string | null;
  image_url: string | null;
  is_verified: boolean;
  report_count: number;
  created_by: string | null;
  search_text: string | null; // Computed search field: "make model year"
  created_at: string;
  updated_at: string;
};
