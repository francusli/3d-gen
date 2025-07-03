"use client";

import ModelViewer from "./ModelViewer";
const testModel = "/assets/3d/refined-model.glb";

export default function ArtifactsDisplay({}: // modelUrl,
// previewUrl,
{
  modelUrl: string | null;
  previewUrl: string | null;
}) {
  // TODO: Get real model urls from the backend
  const modelUrls = Array(50).fill(testModel);

  return (
    <div>
      <ModelViewer modelUrls={modelUrls} />
    </div>
  );
}
