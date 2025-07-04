import supabase from "./client";

export interface ModelArtifact {
  id: string;
  name: string;
  date: string;
  model_url: string;
  prompt: string;
}

// Fetch all model artifacts
export async function getAllModelArtifacts(): Promise<ModelArtifact[]> {
  const { data, error } = await supabase
    .from("model_artifacts")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching model artifacts:", error);
    return [];
  }

  return data || [];
}

// Upload 3D model to Supabase storage
export async function upload3DModel(
  file: Blob,
  fileName: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("3d-assets")
      .upload(fileName, file, {
        contentType: "model/gltf-binary",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading 3D model:", error);
      return null;
    }

    if (!data?.path) {
      console.error("No path returned from upload");
      return null;
    }

    // Get the public URL for the uploaded file
    const {
      data: { publicUrl },
    } = supabase.storage.from("3d-assets").getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Error in upload3DModel:", error);
    return null;
  }
}

// Save model artifact to database
export async function saveModelArtifact(
  name: string,
  modelUrl: string,
  prompt: string
): Promise<ModelArtifact | null> {
  try {
    const { data, error } = await supabase
      .from("model_artifacts")
      .insert({
        name,
        model_url: modelUrl,
        prompt,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving model artifact:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in saveModelArtifact:", error);
    return null;
  }
}
