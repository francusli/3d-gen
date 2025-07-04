"use client";

import { useEffect, useState } from "react";
import ModelViewer from "./ModelViewer";
import { getAllModelArtifacts, ModelArtifact } from "@/lib/supabase/queries";

export default function ArtifactsDisplay({}: {
  modelUrl: string | null;
  previewUrl: string | null;
}) {
  const [artifacts, setArtifacts] = useState<ModelArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtifacts() {
      try {
        setLoading(true);
        const data = await getAllModelArtifacts();
        setArtifacts(data);
      } catch (err) {
        setError("Failed to load 3D models");
        console.error("Error fetching artifacts:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchArtifacts();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading 3D models...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <ModelViewer artifacts={artifacts} />
    </div>
  );
}
