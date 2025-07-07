"use client";

import { useState, useCallback } from "react";
import ArtifactsDisplay from "@/components/ArtifactsDisplay";
import { Notifications } from "@/components/Notifications";
import PromptSection from "@/components/PromptSection";
import { ModelArtifact } from "@/lib/supabase/queries";
import SuccessMessage from "@/components/SuccessMessage";

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Store the callback function in state instead of ref
  const [addNewArtifact, setAddNewArtifact] = useState<
    ((artifact: ModelArtifact) => void) | null
  >(null);

  // Create a stable callback that wraps the state value
  const handleNewModelCreated = useCallback(
    (artifact: ModelArtifact) => {
      if (addNewArtifact) {
        addNewArtifact(artifact);
      }
    },
    [addNewArtifact]
  );

  return (
    <div className="min-h-screen bg-gray-200">
      <SuccessMessage />
      <PromptSection
        onModelUrl={setModelUrl}
        onPreviewUrl={setPreviewUrl}
        onNewModelCreated={addNewArtifact ? handleNewModelCreated : null}
      />
      <Notifications />
      <ArtifactsDisplay
        modelUrl={modelUrl}
        previewUrl={previewUrl}
        onNewModelCreated={(callback) => {
          setAddNewArtifact(() => callback);
        }}
      />
    </div>
  );
}
