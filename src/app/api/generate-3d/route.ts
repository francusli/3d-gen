/**
 * API route for 3D model generation using Meshy AI
 *
 * POST: Generate 3D models from text prompts
 * GET: Proxy model files or get task status
 */
import { NextRequest, NextResponse } from "next/server";
import { MeshyClient } from "@/lib/meshy/client";

const MESHY_API_KEY = process.env.NEXT_PUBLIC_MESHY_API_KEY;

const meshyClient = new MeshyClient({
  apiKey: MESHY_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, negativePrompt, artStyle, shouldRemesh = true } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!MESHY_API_KEY) {
      return NextResponse.json(
        { error: "Meshy API key is not configured" },
        { status: 500 }
      );
    }

    const result = await meshyClient.generateTextTo3D(prompt, {
      negative_prompt: negativePrompt,
      art_style: artStyle,
      should_remesh: shouldRemesh,
      onPreviewProgress: (progress) => {
        console.log(`Preview progress: ${progress}%`);
      },
      onRefineProgress: (progress) => {
        console.log(`Refine progress: ${progress}%`);
      },
    });

    return NextResponse.json({
      success: true,
      preview: {
        modelUrls: result.preview.model_urls,
        status: result.preview.status,
      },
      refined: {
        modelUrls: result.refined.model_urls,
        status: result.refined.status,
      },
    });
  } catch (error) {
    console.error("Error generating 3D model:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate 3D model",
      },
      { status: 500 }
    );
  }
}

// Add a new endpoint to proxy model files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const modelUrl = searchParams.get("modelUrl");

    // If modelUrl is provided, proxy the model file
    if (modelUrl) {
      const response = await fetch(modelUrl);
      if (!response.ok)
        throw new Error(`Failed to fetch model: ${response.statusText}`);

      const arrayBuffer = await response.arrayBuffer();
      const headers = new Headers();
      headers.set(
        "Content-Type",
        response.headers.get("Content-Type") || "application/octet-stream"
      );
      headers.set("Content-Length", arrayBuffer.byteLength.toString());

      return new Response(arrayBuffer, { headers });
    }

    // Original task status endpoint
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID or model URL is required" },
        { status: 400 }
      );
    }

    if (!MESHY_API_KEY) {
      return NextResponse.json(
        { error: "Meshy API key is not configured" },
        { status: 500 }
      );
    }

    const taskStatus = await meshyClient.getTaskStatus(taskId);

    return NextResponse.json({
      id: taskStatus.id,
      status: taskStatus.status,
      progress: taskStatus.progress,
      modelUrls: taskStatus.model_urls,
      error: taskStatus.error,
    });
  } catch (error) {
    console.error("Error in GET request:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Request failed",
      },
      { status: 500 }
    );
  }
}
