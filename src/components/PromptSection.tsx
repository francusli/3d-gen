import { useTaskPolling } from "@/hooks/useTaskPolling";
import { usePollingStore } from "@/stores/pollingStore";
import { modelHistory } from "@/utils/modelHistory";
import { ArrowUp } from "lucide-react";
import { glassmorphic1 } from "./shared/sharedStyles";

export default function PromptSection({
  onModelUrl,
  onPreviewUrl,
}: {
  onModelUrl: (url: string | null) => void;
  onPreviewUrl: (url: string | null) => void;
}) {
  const MAX_PROMPT_HEIGHT = 800;
  const {
    prompt,
    setPrompt,
    error,
    successMessage,
    isGenerating,
    setIsGenerating,
    setSuccessMessage,
    setError,
    setProgress,
    setCurrentHistoryId,
  } = usePollingStore();
  const { startPolling, clearAllPolling } = useTaskPolling({
    onModelUrl,
    onPreviewUrl,
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    // Save to localStorage immediately
    const historyId = modelHistory.add(prompt);
    setCurrentHistoryId(historyId);

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);
    onModelUrl(null);
    onPreviewUrl(null);
    setProgress({ preview: 0, refine: 0 });
    clearAllPolling();

    try {
      const response = await fetch("/api/generate-3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: historyId,
          prompt,
          shouldRemesh: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate 3D model");
      }

      if (data.previewTaskId) {
        startPolling(data.previewTaskId, prompt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsGenerating(false);
    }
  };

  // Handler for Enter/Shift+Enter in textarea
  const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) handleGenerate();
    }
  };

  return (
    <div
      className={`${glassmorphic1} rounded-2xl shadow-lg w-[40%] p-2 z-5 absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-3`}
    >
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      <div>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the 3D model..."
          className={`w-full px-3 py-2 text-black focus:outline-none resize-none mb-2 min-h-[40px] max-h-[${MAX_PROMPT_HEIGHT}px] overflow-y-auto transition-all duration-300`}
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height =
              Math.min(target.scrollHeight, MAX_PROMPT_HEIGHT) + "px";
          }}
          onKeyDown={handlePromptKeyDown}
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`p-2 font-medium rounded-full flex items-center justify-center ml-auto transition-colors ${
            isGenerating || !prompt.trim()
              ? "cursor-not-allowed bg-black/10 text-gray-400"
              : "bg-black text-gray-300"
          }`}
        >
          <ArrowUp size={20} />
        </button>
      </div>
    </div>
  );
}
