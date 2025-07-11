/**
 * API route for 3D model generation using Meshy AI
 *
 * POST: Generate 3D models from text prompts
 * GET: Proxy model files or get task status
 */
import { NextRequest, NextResponse } from "next/server";
import { MeshyClient } from "@/lib/meshy/client";
import { upload3DModel, saveModelArtifact } from "@/lib/supabase/queries";

const MESHY_API_KEY = process.env.MESHY_API_KEY;

const meshyClient = new MeshyClient({
  apiKey: MESHY_API_KEY || "",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, prompt, negativePrompt, artStyle, shouldRemesh = true } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!MESHY_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Meshy API key is not configured. Please set MESHY_API_KEY in your .env.local file",
        },
        { status: 500 }
      );
    }

    // Create preview task
    const previewTaskId = await meshyClient.createTextTo3DPreview({
      prompt,
      negative_prompt: negativePrompt,
      art_style: artStyle,
      should_remesh: shouldRemesh,
    });

    // Return task ID immediately so frontend can poll for progress
    return NextResponse.json({
      success: true,
      previewTaskId,
      id,
      message: "3D generation started. Poll for progress using the task ID.",
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
    const action = searchParams.get("action");

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

    // Add logging for debugging
    console.log(`Task ${taskId} status:`, {
      status: taskStatus.status,
      progress: taskStatus.progress,
      hasModelUrls: !!taskStatus.model_urls,
      previewUrl: taskStatus.model_urls?.glb,
      modelUrlsContent: taskStatus.model_urls,
      isRefine: searchParams.get("isRefine") === "true",
      action: action,
      error: taskStatus.error,
    });

    const previewSuccess =
      action === "refine" &&
      taskStatus.status === "SUCCEEDED" &&
      taskStatus.model_urls;
    if (previewSuccess) {
      console.log(`Creating refine task for preview ${taskId}`);

      const idParam = searchParams.get("id");
      const promptParam = searchParams.get("prompt");

      try {
        const refineTaskId = await meshyClient.createTextTo3DRefine(taskId);
        console.log(`Created refine task: ${refineTaskId}`);
        return NextResponse.json({
          refineTaskId,
          previewStatus: taskStatus,
          previewUrl: taskStatus.model_urls?.glb,
          id: idParam,
          prompt: promptParam,
        });
      } catch (refineError) {
        console.error("Error creating refine task:", refineError);
        return NextResponse.json(
          {
            error:
              refineError instanceof Error
                ? refineError.message
                : "Failed to create refine task",
            previewUrl: taskStatus.model_urls?.glb,
          },
          { status: 500 }
        );
      }
    }

    // If this is a refine task that succeeded, save to Supabase
    const refineSuccess =
      taskStatus.status === "SUCCEEDED" &&
      taskStatus.model_urls?.glb &&
      searchParams.get("isRefine") === "true";
    if (refineSuccess) {
      // Debug: Log what we're actually getting from searchParams for refine
      const idParam = searchParams.get("id");
      const promptParam = searchParams.get("prompt");

      try {
        const modelResponse = await fetch(taskStatus.model_urls?.glb || "");
        if (modelResponse.ok) {
          const modelBlob = await modelResponse.blob();
          const timestamp = Date.now();
          const fileName = `model_${timestamp}.glb`;

          const storedModelUrl = await upload3DModel(modelBlob, fileName);
          if (storedModelUrl) {
            const savedArtifact = await saveModelArtifact(
              idParam,
              "User Generated",
              storedModelUrl,
              promptParam || "3D Model"
            );
            console.log("Model saved successfully:", savedArtifact);

            return NextResponse.json({
              ...taskStatus,
              stored: {
                modelUrl: storedModelUrl,
                artifact: savedArtifact,
              },
            });
          }
        }
      } catch (uploadError) {
        console.error("Error uploading model:", uploadError);
      }
    }

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
