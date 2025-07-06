"use client";

import { useEffect, useState, useRef } from "react";
import Confetti from "react-confetti";
import ArtifactsDisplay from "@/components/ArtifactsDisplay";
import { Notifications } from "@/components/Notifications";
import PromptSection from "@/components/PromptSection";
import { usePollingStore } from "@/stores/pollingStore";
import { ModelArtifact } from "@/lib/supabase/queries";

const CONFETTI_DURATION = 2500;
const confettiConfig = {
  width: typeof window !== "undefined" ? window.innerWidth : 300,
  height: typeof window !== "undefined" ? window.innerHeight : 300,
  numberOfPieces: 200,
  recycle: false,
  gravity: 1.2,
  initialVelocityY: -8,
  initialVelocityX: 0,
  wind: 0.1,
};

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const successMessage = usePollingStore((state) => state.successMessage);
  const setSuccessMessage = usePollingStore((state) => state.setSuccessMessage);
  const [showConfetti, setShowConfetti] = useState(false);

  // Store the callback to add new artifacts
  const addNewArtifactRef = useRef<((artifact: ModelArtifact) => void) | null>(
    null
  );

  useEffect(() => {
    if (successMessage) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
        setSuccessMessage(null);
      }, CONFETTI_DURATION);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successMessage]);

  return (
    <div className="min-h-screen bg-gray-300">
      {showConfetti && <Confetti {...confettiConfig} run={showConfetti} />}

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
