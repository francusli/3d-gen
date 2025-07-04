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
