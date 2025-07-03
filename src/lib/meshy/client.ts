import axios, { AxiosInstance } from "axios";

// Default polling interval and timeout for task polling
const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds
const DEFAULT_TIMEOUT = 600000; // 10 minutes
type ArtStyles = "realistic" | "cartoon" | "low-poly" | "sculpture" | "pbr";

interface MeshyClientConfig {
  apiKey: string;
  baseURL?: string;
}

interface TextTo3DPreviewRequest {
  mode: "preview";
  prompt: string;
  negative_prompt?: string;
  art_style?: ArtStyles;
  should_remesh?: boolean;
}

interface TaskResponse {
  result: string;
}

interface TaskStatus {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "EXPIRED";
  progress: number;
  model_urls?: {
    glb: string;
    fbx?: string;
    usdz?: string;
    obj?: string;
    mtl?: string;
    thumbnail?: string;
  };
  error?: string;
}

/**
 * MeshyClient - Client for Meshy AI's text-to-3D API
 *
 * Handles 3D model generation through two phases:
 * 1. Preview: Creates initial low-quality model
 * 2. Refine: Enhances preview model with better textures/geometry
 *
 * Uses polling to monitor task status with configurable intervals and timeouts.
 * Supports progress callbacks for real-time updates during generation.
 */
export class MeshyClient {
  private client: AxiosInstance;

  constructor(config: MeshyClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || "https://api.meshy.ai/openapi/v2",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async createTextTo3DPreview(
    request: Omit<TextTo3DPreviewRequest, "mode">
  ): Promise<string> {
    const response = await this.client.post<TaskResponse>("/text-to-3d", {
      mode: "preview",
      ...request,
    });
    return response.data.result;
  }

  async createTextTo3DRefine(previewTaskId: string): Promise<string> {
    const response = await this.client.post<TaskResponse>("/text-to-3d", {
      mode: "refine",
      preview_task_id: previewTaskId,
    });
    return response.data.result;
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const response = await this.client.get<TaskStatus>(`/text-to-3d/${taskId}`);
    return response.data;
  }

  async waitForTask(
    taskId: string,
    options?: {
      pollInterval?: number;
      timeout?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<TaskStatus> {
    const pollInterval = options?.pollInterval || DEFAULT_POLL_INTERVAL;
    const timeout = options?.timeout || DEFAULT_TIMEOUT; // 10 minutes default
    const startTime = Date.now();

    while (true) {
      const task = await this.getTaskStatus(taskId);

      // Call onProgress callback to update progress
      if (options?.onProgress) options.onProgress(task.progress);

      // Return task if it's done
      const isTaskDone =
        task.status === "SUCCEEDED" ||
        task.status === "FAILED" ||
        task.status === "EXPIRED";
      if (isTaskDone) return task;

      // Check if task has timed out
      if (task.status === "IN_PROGRESS") {
        const timeElapsed = Date.now() - startTime;
        const timeRemaining = timeout - timeElapsed;

        if (timeRemaining <= 0) throw new Error("Task timeout");
      }

      if (Date.now() - startTime > timeout) throw new Error("Task timeout");

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  async generateTextTo3D(
    prompt: string,
    options?: {
      negative_prompt?: string;
      art_style?: ArtStyles;
      should_remesh?: boolean;
      onPreviewProgress?: (progress: number) => void;
      onRefineProgress?: (progress: number) => void;
    }
  ): Promise<{ preview: TaskStatus; refined: TaskStatus }> {
    // Create preview
    const previewTaskId = await this.createTextTo3DPreview({
      prompt,
      negative_prompt: options?.negative_prompt,
      art_style: options?.art_style,
      should_remesh: options?.should_remesh,
    });

    // Wait for preview to complete
    const previewTask = await this.waitForTask(previewTaskId, {
      onProgress: options?.onPreviewProgress,
    });

    if (previewTask.status !== "SUCCEEDED") {
      throw new Error(
        `Preview failed: ${previewTask.error || previewTask.status}`
      );
    }

    // Create refined version
    const refineTaskId = await this.createTextTo3DRefine(previewTaskId);

    // Wait for refine to complete
    const refinedTask = await this.waitForTask(refineTaskId, {
      onProgress: options?.onRefineProgress,
    });

    if (refinedTask.status !== "SUCCEEDED") {
      throw new Error(
        `Refine failed: ${refinedTask.error || refinedTask.status}`
      );
    }

    return {
      preview: previewTask,
      refined: refinedTask,
    };
  }
}
