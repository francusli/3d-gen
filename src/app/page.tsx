"use client";

import { useState } from "react";
import ArtifactsDisplay from "@/components/ArtifactsDisplay";
import { Notifications } from "@/components/Notifications";
import PromptSection from "@/components/PromptSection";

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-200">
      <PromptSection onModelUrl={setModelUrl} onPreviewUrl={setPreviewUrl} />
      <Notifications />
      <ArtifactsDisplay modelUrl={modelUrl} previewUrl={previewUrl} />
    </div>
  );
}
