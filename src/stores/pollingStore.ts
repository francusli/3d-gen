import { create } from "zustand";

interface PollingState {
  // State properties
  prompt: string;
  progress: { preview: number; refine: number };
  isGenerating: boolean;
  error: string | null;
  successMessage: string | null;

  // State setters
  setPrompt: (prompt: string) => void;
  setProgress: (progress: { preview: number; refine: number }) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (msg: string | null) => void;

  // Utility functions
  reset: () => void;
}

export const usePollingStore = create<PollingState>((set) => ({
  // Initial state values
  prompt: "",
  progress: { preview: 0, refine: 0 },
  isGenerating: false,
  error: null,
  successMessage: null,

  // State setters
  setPrompt: (prompt) => set({ prompt }),
  setProgress: (progress) => set({ progress }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  setSuccessMessage: (msg) => set({ successMessage: msg }),

  // Utility functions
  reset: () =>
    set({
      prompt: "",
      progress: { preview: 0, refine: 0 },
      isGenerating: false,
      error: null,
      successMessage: null,
    }),
}));
