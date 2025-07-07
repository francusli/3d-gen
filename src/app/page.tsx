"use client";

import { useState, useRef } from "react";
import ArtifactsDisplay from "@/components/ArtifactsDisplay";
import { Notifications } from "@/components/Notifications";
import PromptSection from "@/components/PromptSection";
import { ModelArtifact } from "@/lib/supabase/queries";
import SuccessMessage from "@/components/SuccessMessage";

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Store the callback to add new artifacts
  const addNewArtifactRef = useRef<((artifact: ModelArtifact) => void) | null>(
    null
  );

  return (
    <div className="min-h-screen bg-gray-200">
      <SuccessMessage />
      <PromptSection
        onModelUrl={setModelUrl}
        onPreviewUrl={setPreviewUrl}
        onNewModelCreated={addNewArtifactRef.current}
      />
      <Notifications />
      <ArtifactsDisplay
        modelUrl={modelUrl}
        previewUrl={previewUrl}
        onNewModelCreated={(callback) => {
          addNewArtifactRef.current = callback;
        }}
      />
    </div>
  );
}
