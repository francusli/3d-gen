import { createClient } from "@supabase/supabase-js";

const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY;

if (!projectId || !apiKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, apiKey);

export default supabase;
