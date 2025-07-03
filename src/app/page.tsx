"use client";

import { useState } from "react";
import ArtifactsDisplay from "@/components/ArtifactsDisplay";
import { error } from "console";
import { div } from "three/tsl";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ preview: 0, refine: 0 });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setModelUrl(null);
    setPreviewUrl(null);
    setProgress({ preview: 0, refine: 0 });

    try {
      const response = await fetch("/api/generate-3d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          shouldRemesh: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate 3D model");
      }

      if (data.preview?.modelUrls?.glb)
        setPreviewUrl(data.preview.modelUrls.glb);
      if (data.refined?.modelUrls?.glb) setModelUrl(data.refined.modelUrls.glb);

      console.log(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {isGenerating && <GenerationProgressSection progress={progress} />}

      <ArtifactsDisplay modelUrl={modelUrl} previewUrl={previewUrl} />

      {/* <PromptSection
        error={error}
        prompt={prompt}
        setPrompt={setPrompt}
        isGenerating={isGenerating}
        handleGenerate={handleGenerate}
      /> */}
    </div>
  );
}

function PromptSection({
  error,
  prompt,
  setPrompt,
  isGenerating,
  handleGenerate,
}: {
  error: string | null;
  prompt: string;
  setPrompt: (prompt: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}
      <textarea
        id="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the 3D model you want to generate..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        rows={3}
      />

      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className={`w-full py-3 px-4 rounded-md font-medium text-white ${
          isGenerating
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        } transition-colors`}
      >
        {isGenerating ? "Loading..." : "Generate 3D Model"}
      </button>
    </div>
  );
}

// TODO: Fix this, it doesn't work
function GenerationProgressSection({
  progress,
}: {
  progress: { preview: number; refine: number };
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4">Generation Progress</h2>
      <div className="space-y-2">
        <div>
          <p className="text-sm text-gray-600">Preview Generation</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.preview}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600">Texture Refinement</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.refine}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
