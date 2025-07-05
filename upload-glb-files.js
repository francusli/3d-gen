const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Supabase configuration
const supabaseUrl = "https://besdrhejpveqhrvhiref.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlc2RyaGVqcHZlcWhydmhpcmVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5NTU2OTEsImV4cCI6MjA2MDUzMTY5MX0.wPiGTWkSWmxFkL1P36fvmlJ3HBzihQTDbStBr-TtdnA";
const supabase = createClient(supabaseUrl, supabaseKey);

// Directory containing .glb files
const glbDirectory = "./public/assets/3d";
const bucketName = "3d-assets";

// Function to generate random UUID
function generateUUID() {
  return crypto.randomUUID();
}

// Function to generate random timestamp for 2024
function generateRandomTimestamp() {
  const start = new Date("2024-01-01").getTime();
  const end = new Date("2024-12-31").getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString();
}

// Update this section below everytime we run it
const createdPrompts = [
  "A medieval army firing flaming arrows in battle", // army_fire_arrows.glb
  "A bush with autumn-colored leaves", // autumn_bush.glb
  "A medieval fantasy flag with ornate designs", // flag_-_-_medieval_fantasy_challenge.glb
  "A decorative flowerpot with blooming flowers", // flowerpot-ver2.glb
  "An ancient medieval book with a leather cover", // medieval_assets_20_book.glb
  "A magical potion bottle filled with glowing liquid", // potion.glb
  "A detailed medieval sword with a jeweled hilt", // sword.glb
  "A stylized 3D tree with lush green foliage", // tree02.glb
  "A majestic unicorn with a spiraled horn", // unicorn.glb
  "A stone medieval well with a wooden roof", // well.glb
];

async function uploadGlbFiles() {
  try {
    // Get all .glb files in the directory
    const files = fs
      .readdirSync(glbDirectory)
      .filter((file) => file.endsWith(".glb"));

    console.log(`Found ${files.length} .glb files to upload:`);
    files.forEach((file) => console.log(`  - ${file}`));

    // Upload each file and create database records
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = path.join(glbDirectory, fileName);

      console.log(`\nUploading ${fileName}...`);

      // Read file
      const fileBuffer = fs.readFileSync(filePath);

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileBuffer, {
          contentType: "model/gltf-binary",
          upsert: true,
        });

      if (error) {
        console.error(`Error uploading ${fileName}:`, error);
        continue;
      }

      console.log(`✅ Uploaded ${fileName}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      const modelUrl = urlData.publicUrl;
      console.log(`📎 Public URL: ${modelUrl}`);

      // Insert record into model_artifacts table
      const record = {
        id: generateUUID(),
        name: "Frankie Li",
        date: generateRandomTimestamp(),
        model_url: modelUrl,
        prompt: createdPrompts[i % createdPrompts.length],
      };

      const { error: insertError } = await supabase
        .from("model_artifacts")
        .insert([record]);

      if (insertError) {
        console.error(`Error inserting record for ${fileName}:`, insertError);
      } else {
        console.log(`✅ Created database record for ${fileName}`);
        console.log(`   ID: ${record.id}`);
        console.log(`   Date: ${record.date}`);
        console.log(`   Prompt: ${record.prompt}`);
      }
    }

    console.log("\n🎉 All files processed successfully!");
  } catch (error) {
    console.error("Error processing files:", error);
  }
}

// Run the upload function
uploadGlbFiles();
