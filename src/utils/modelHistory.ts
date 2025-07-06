export interface ModelHistoryItem {
  id: string;
  modelUrl: string | null;
  previewUrl: string | null;
  prompt: string;
  date: number;
  status: "generating" | "preview" | "completed";
}

const STORAGE_KEY = "model_history";

/**
 * Manages 3D model generation history in localStorage.
 * Provides CRUD operations for tracking model generation progress from prompt to completion.
 * Maintains up to 50 recent items to prevent storage overflow.
 */
export const modelHistory = {
  getAll(): ModelHistoryItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error reading model history:", error);
      return [];
    }
  },

  add(prompt: string): string {
    const id = crypto.randomUUID();
    const newItem: ModelHistoryItem = {
      id,
      modelUrl: null,
      previewUrl: null,
      prompt,
      date: Date.now(),
      status: "generating",
    };

    const history = this.getAll();
    history.unshift(newItem);

    // Keep only last 50 items to prevent storage overflow
    const trimmedHistory = history.slice(0, 50);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error("Error saving model history:", error);
    }

    return id;
  },

  // Update an existing item
  update(id: string, updates: Partial<ModelHistoryItem>): void {
    const history = this.getAll();
    const index = history.findIndex((item) => item.id === id);

    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      } catch (error) {
        console.error("Error updating model history:", error);
      }
    }
  },

  updatePreview(id: string, previewUrl: string): void {
    this.update(id, { previewUrl, status: "preview" });
  },

  updateModel(id: string, modelUrl: string): void {
    this.update(id, { modelUrl, status: "completed" });
  },

  delete(id: string): void {
    const history = this.getAll().filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error deleting from model history:", error);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing model history:", error);
    }
  },
};
