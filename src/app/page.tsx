"use client";

import { useState } from "react";
import ArtifactsDisplay from "@/components/ArtifactsDisplay";
import { ArrowUp } from "lucide-react";

export default function Home() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState({ preview: 0, refine: 0 });

  return (
    <div className="min-h-screen bg-gray-200">
      {progress.preview > 0 || progress.refine > 0 ? (
        <GenerationProgressSection progress={progress} />
      ) : null}

      <PromptSection
        onModelUrl={setModelUrl}
        onPreviewUrl={setPreviewUrl}
        onProgress={setProgress}
      />

      <ArtifactsDisplay modelUrl={modelUrl} previewUrl={previewUrl} />
    </div>
  );
}

function PromptSection({
  onModelUrl,
  onPreviewUrl,
  onProgress,
}: {
  onModelUrl: (url: string | null) => void;
  onPreviewUrl: (url: string | null) => void;
  onProgress: (progress: { preview: number; refine: number }) => void;
}) {
  const MAX_PROMPT_HEIGHT = 800;

  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    setError(null);
    onModelUrl(null);
    onPreviewUrl(null);
    onProgress({ preview: 0, refine: 0 });

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
        onPreviewUrl(data.preview.modelUrls.glb);
      if (data.refined?.modelUrls?.glb) onModelUrl(data.refined.modelUrls.glb);

      // Optionally update progress if you have progress info in data
      // onProgress({ preview: ..., refine: ... });

      console.log(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg w-[40%] border border-white/30 p-2 z-5 absolute bottom-0 left-1/2 transform -translate-x-1/2 mb-3">
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
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
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`p-2 font-medium ${
            prompt.trim()
              ? "bg-black text-grey-900"
              : "bg-black/10 text-gray-400"
          }  rounded-full flex items-center justify-center ml-auto transition-colors`}
        >
          <ArrowUp size={20} />
        </button>
      </div>
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
