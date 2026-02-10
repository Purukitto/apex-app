import { create } from 'zustand';

interface BugReportStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useBugReportStore = create<BugReportStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
