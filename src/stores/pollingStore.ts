import { create } from "zustand";

interface PollingStore {
  prompt: string;
  setPrompt: (prompt: string) => void;
  error: string | null;
  setError: (error: string | null) => void;

  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  successMessage: string | null;
  setSuccessMessage: (message: string | null) => void;
  progress: { preview: number; refine: number };
  setProgress: (progress: { preview: number; refine: number }) => void;

  currentHistoryId: string | null;
  setCurrentHistoryId: (id: string | null) => void;
}

export const usePollingStore = create<PollingStore>((set) => ({
  prompt: "",
  setPrompt: (prompt) => set({ prompt }),
  error: null,
  setError: (error) => set({ error }),

  isGenerating: false,
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  successMessage: null,
  setSuccessMessage: (successMessage) => set({ successMessage }),
  progress: { preview: 0, refine: 0 },
  setProgress: (progress) => set({ progress }),

  currentHistoryId: null,
  setCurrentHistoryId: (currentHistoryId) => {
    console.log("setting currentHistoryId", currentHistoryId);
    set({ currentHistoryId });
  },
}));
