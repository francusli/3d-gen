import { useRef, useEffect, useCallback } from "react";
import { usePollingStore } from "@/stores";
import { modelHistory } from "@/utils/modelHistory";
import { useNotiStore } from "@/stores";
import { ModelArtifact } from "@/lib/supabase/queries";

interface UseTaskPollingProps {
  onModelUrl: (url: string | null) => void;
  onPreviewUrl: (url: string | null) => void;
  onNewModelCreated?: ((artifact: ModelArtifact) => void) | null;
}

const POLL_INTERVAL = 2000;

export function useTaskPolling({
  onModelUrl,
  onPreviewUrl,
  onNewModelCreated,
}: UseTaskPollingProps) {
  const {
    progress,
    setProgress,
    setError,
    setSuccessMessage,
    setIsGenerating,
  } = usePollingStore();

  const setOpenNotis = useNotiStore((state) => state.setOpenNotis);

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

        // Add the current history ID to the request if it's a refine task
        if (isRefine) {
          const currentHistoryId = usePollingStore.getState().currentHistoryId;
          if (currentHistoryId) {
            params.append("id", currentHistoryId);
          }
        }

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

          if (data.modelUrls?.glb) {
            onPreviewUrl(data.modelUrls.glb);
            // Update localStorage with preview URL
            const currentHistoryId =
              usePollingStore.getState().currentHistoryId;
            if (currentHistoryId) {
              modelHistory.updatePreview(currentHistoryId, data.modelUrls.glb);
            }
          }

          setProgress({ ...progress, preview: 100 });

          // Start refine process
          const currentHistoryId = usePollingStore.getState().currentHistoryId;
          const refineResponse = await fetch(
            `/api/generate-3d?taskId=${taskId}&action=refine${
              currentHistoryId ? `&id=${currentHistoryId}` : ""
            }${
              originalPrompt
                ? `&prompt=${encodeURIComponent(originalPrompt)}`
                : ""
            }`
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

        // Update with final model URL from Supabase
        if (data.stored?.modelUrl) {
          onModelUrl(data.stored.modelUrl);
          // Update localStorage with final model URL
          const currentHistoryId = usePollingStore.getState().currentHistoryId;
          if (currentHistoryId) {
            modelHistory.updateModel(currentHistoryId, data.stored.modelUrl);
          }

          // Call the callback to add the new model to the grid
          if (data.stored?.artifact && onNewModelCreated) {
            onNewModelCreated(data.stored.artifact);
          }
        } else if (data.modelUrls?.glb) onModelUrl(data.modelUrls.glb);

        if (data.stored?.artifact)
          setSuccessMessage("3D model generated and saved successfully!");

        setIsGenerating(false);
        setOpenNotis(false);
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
      onNewModelCreated,
      progress,
      setProgress,
      setError,
      setIsGenerating,
      setSuccessMessage,
      setOpenNotis,
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
  };
}
