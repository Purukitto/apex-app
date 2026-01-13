import { create } from 'zustand';
import type { Bike } from '../types/database';

interface Coordinate {
  longitude: number;
  latitude: number;
  timestamp: number;
  speed?: number;
}

interface RideStore {
  // Ride state
  isRecording: boolean;
  isPaused: boolean;
  selectedBike: Bike | null;
  startTime: Date | null;
  isPocketMode: boolean;
  
  // Telemetry
  coords: Coordinate[];
  currentLean: number;
  maxLeanLeft: number;
  maxLeanRight: number;
  distanceKm: number;
  
  // Actions
  setRecording: (recording: boolean) => void;
  setPaused: (paused: boolean) => void;
  setSelectedBike: (bike: Bike | null) => void;
  setStartTime: (time: Date | null) => void;
  setPocketMode: (pocketMode: boolean) => void;
  addCoord: (coord: Coordinate) => void;
  setCurrentLean: (lean: number) => void;
  updateMaxLean: (left: number, right: number) => void;
  setDistanceKm: (distance: number) => void;
  resetRide: () => void;
}

export const useRideStore = create<RideStore>((set) => ({
  // Initial state
  isRecording: false,
  isPaused: false,
  selectedBike: null,
  startTime: null,
  isPocketMode: false,
  coords: [],
  currentLean: 0,
  maxLeanLeft: 0,
  maxLeanRight: 0,
  distanceKm: 0,

  // Actions
  setRecording: (recording) => set({ isRecording: recording }),
  setPaused: (paused) => set({ isPaused: paused }),
  setSelectedBike: (bike) => set({ selectedBike: bike }),
  setStartTime: (time) => set({ startTime: time }),
  setPocketMode: (pocketMode) => set({ isPocketMode: pocketMode }),
  addCoord: (coord) => set((state) => ({ coords: [...state.coords, coord] })),
  setCurrentLean: (lean) => set({ currentLean: lean }),
  updateMaxLean: (left, right) => set({ maxLeanLeft: left, maxLeanRight: right }),
  setDistanceKm: (distance) => set({ distanceKm: distance }),
  resetRide: () => set({
    isRecording: false,
    isPaused: false,
    isPocketMode: false,
    coords: [],
    currentLean: 0,
    maxLeanLeft: 0,
    maxLeanRight: 0,
    startTime: null,
    distanceKm: 0,
  }),
}));
