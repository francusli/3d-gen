import { create } from "zustand";

interface NotiStore {
  openNotis: boolean;
  setOpenNotis: (openNotis: boolean) => void;
}

export const useNotiStore = create<NotiStore>((set) => ({
  openNotis: false,
  setOpenNotis: (openNotis) => set({ openNotis }),
}));
