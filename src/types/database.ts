export type Bike = {
  id: string;
  user_id: string;
  make: string;
  model: string;
  year?: number;
  current_odo: number; // Odometer reading in kilometers (integer)
  nick_name?: string;
  image_url?: string;
  specs_engine?: string;
  specs_power?: string;
  avg_mileage?: number; // Average mileage in km per litre (calculated from full tank logs)
  last_fuel_price?: number; // Most recent price per litre from fuel logs
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
  end_time?: string;
  distance_km: number;
  max_lean_left: number;
  max_lean_right: number;
  route_path?: GeoJSONLineString;
  ride_name?: string;
  notes?: string;
  created_at: string;
};

export type MaintenanceLog = {
  id: string;
  bike_id: string;
  service_type: string; // Required by database constraint
  odo_at_service: number;
  date_performed: string; // date format
  notes?: string;
  receipt_url?: string;
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
