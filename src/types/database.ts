export type Bike = {
    id: string;
    user_id: string;
    make: string;
    model: string;
    year?: number;
    current_odo: number;
    nick_name?: string;
  };

  export type GeoJSONLineString = {
    type: "LineString";
    coordinates: [number, number][]; // [longitude, latitude] pairs
  };
  
  export type Ride = {
    id: string;
    bike_id: string;
    start_time: string;
    end_time?: string;
    distance_km: number;
    max_lean_left: number;
    max_lean_right: number;
    route_path?: GeoJSONLineString;
  };