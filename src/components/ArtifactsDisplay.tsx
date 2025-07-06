"use client";

import { useEffect, useState, useCallback } from "react";
import ModelViewer from "./ModelViewer";
import { getAllModelArtifacts, ModelArtifact } from "@/lib/supabase/queries";

export default function ArtifactsDisplay({
  onNewModelCreated,
}: {
  modelUrl: string | null;
  previewUrl: string | null;
  onNewModelCreated?: (callback: (artifact: ModelArtifact) => void) => void;
}) {
  const [artifacts, setArtifacts] = useState<ModelArtifact[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Callback to add a new artifact
  const addNewArtifact = useCallback((newArtifact: ModelArtifact) => {
    setArtifacts((prevArtifacts) => {
      // Check if artifact already exists to avoid duplicates
      const exists = prevArtifacts.some((a) => a.id === newArtifact.id);
      if (exists) return prevArtifacts;

      // Add new artifact at the beginning
      return [newArtifact, ...prevArtifacts];
    });
  }, []);

  // If new model is created, add it to the artifacts
  useEffect(() => {
    onNewModelCreated?.(addNewArtifact);
  }, [onNewModelCreated, addNewArtifact]);

  useEffect(() => {
    async function fetchArtifacts() {
      try {
        const data = await getAllModelArtifacts();
        setArtifacts(data);
      } catch (err) {
        setError("Failed to load 3D models");
        console.error("Error fetching artifacts:", err);
      }
    }

    fetchArtifacts();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <ModelViewer artifacts={artifacts} />
    </div>
  );
}
