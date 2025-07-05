import { useRef, useEffect, useCallback } from "react";
import { usePollingStore } from "@/stores/pollingStore";

interface UseTaskPollingProps {
  onModelUrl: (url: string | null) => void;
  onPreviewUrl: (url: string | null) => void;
}

export function useTaskPolling({
  onModelUrl,
  onPreviewUrl,
}: UseTaskPollingProps) {
  const POLL_INTERVAL = 2000;

  const {
    progress,
    setProgress,
    setError,
    setSuccessMessage,
    setIsGenerating,
    reset,
  } = usePollingStore();

  const previewPollRef = useRef<NodeJS.Timeout | null>(null);
  const refinePollRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (previewPollRef.current) clearInterval(previewPollRef.current);
      if (refinePollRef.current) clearInterval(refinePollRef.current);
    };
  }, []);

  const clearAllPolling = useCallback(() => {
    if (previewPollRef.current) {
      clearInterval(previewPollRef.current);
      previewPollRef.current = null;
    }
    if (refinePollRef.current) {
      clearInterval(refinePollRef.current);
      refinePollRef.current = null;
    }
  }, []);

  const pollTaskStatus = useCallback(
    async (
      taskId: string,
      isRefine: boolean = false,
      originalPrompt?: string
    ) => {
      try {
        const params = new URLSearchParams({
          taskId,
          ...(isRefine && { isRefine: "true" }),
          ...(originalPrompt && { prompt: originalPrompt }),
        });

        const response = await fetch(`/api/generate-3d?${params}`);
        const data = await response.json();

        if (!response.ok)
          throw new Error(data.error || "Failed to get task status");

        // Update progress
        if (isRefine) {
          setProgress({ ...progress, refine: data.progress || 0 });
        } else setProgress({ ...progress, preview: data.progress || 0 });

        // Handle failure cases
        if (data.status === "FAILED" || data.status === "EXPIRED") {
          clearAllPolling();
          throw new Error(data.error || `Task ${data.status.toLowerCase()}`);
        }
        if (data.status !== "SUCCEEDED") return;

        // Handle preview completion - start refine process
        if (!isRefine) {
          if (previewPollRef.current) {
            clearInterval(previewPollRef.current);
            previewPollRef.current = null;
          }

          if (data.modelUrls?.glb) onPreviewUrl(data.modelUrls.glb);

          setProgress({ ...progress, preview: 100 });

          // Start refine process
          const refineResponse = await fetch(
            `/api/generate-3d?taskId=${taskId}&action=refine`
          );
          const refineData = await refineResponse.json();

          if (refineData.refineTaskId) {
            // Start polling for refine progress
            refinePollRef.current = setInterval(() => {
              pollTaskStatus(refineData.refineTaskId, true, originalPrompt);
            }, POLL_INTERVAL);
          }
          return;
        }

        // Handle refine completion
        if (refinePollRef.current) {
          clearInterval(refinePollRef.current);
          refinePollRef.current = null;
        }

        if (data.modelUrls?.glb) onModelUrl(data.modelUrls.glb);

        if (data.stored?.artifact)
          setSuccessMessage("3D model generated and saved successfully!");

        setIsGenerating(false);
        setProgress({ ...progress, refine: 100 });
      } catch (err) {
        // Clear intervals on error
        clearAllPolling();

        setError(err instanceof Error ? err.message : "An error occurred");
        setIsGenerating(false);
      }
    },
    [
      clearAllPolling,
      onModelUrl,
      onPreviewUrl,
      progress,
      setProgress,
      setError,
      setIsGenerating,
      setSuccessMessage,
    ]
  );

  const startPolling = useCallback(
    (previewTaskId: string, prompt: string) => {
      setIsGenerating(true);
      setError(null);
      setSuccessMessage(null);
      setProgress({ preview: 0, refine: 0 });
      clearAllPolling();
      previewPollRef.current = setInterval(() => {
        pollTaskStatus(previewTaskId, false, prompt);
      }, POLL_INTERVAL);
    },
    [
      clearAllPolling,
      pollTaskStatus,
      setIsGenerating,
      setError,
      setSuccessMessage,
      setProgress,
    ]
  );

  return {
    startPolling,
    clearAllPolling,
    reset,
  };
}
