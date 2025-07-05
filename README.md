# Text to 3D Generator

A Next.js application that uses the Meshy AI API to generate 3D models from text prompts and renders them in the browser using React Three Fiber.

## Features

- Generate 3D models from text descriptions
- Real-time 3D model preview in the browser
- Support for different art styles (realistic, cartoon, low-poly, sculpture, PBR)
- Download generated models in GLB format
- Interactive 3D viewer with orbit controls
- Automatic storage of generated models in Supabase
- Database tracking of all generated models with prompts

## Prerequisites

- Node.js 18+
- A Meshy AI API key (get one at [https://meshy.ai](https://meshy.ai))

## Setup

1. Clone the repository:

```bash
git clone <your-repo-url>
cd 3d-generation
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory:

```env
# Meshy AI Configuration
NEXT_PUBLIC_MESHY_API_KEY=msy_your_api_key_here

# Supabase Configuration (for storing generated models)
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_supabase_project_id_here
NEXT_PUBLIC_SUPABASE_API_KEY=your_supabase_anon_key_here
```

For testing, you can use the test mode API key:

```env
NEXT_PUBLIC_MESHY_API_KEY=msy_dummy_api_key_for_test_mode_12345678
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How It Works

1. **Text Input**: Enter a description of the 3D model you want to generate
2. **Preview Generation**: The API first creates a preview model without textures
3. **Texture Refinement**: The preview is then refined with textures based on your prompt
4. **3D Rendering**: The final model is displayed in an interactive 3D viewer
5. **Download**: You can download both preview and final models

## Tech Stack

- **Next.js 15**: React framework with App Router
- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D graphics library
- **Meshy AI API**: Text-to-3D generation
- **Supabase**: Database and storage for generated models
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling

## API Routes

- `POST /api/generate-3d`: Initiates 3D model generation
- `GET /api/generate-3d?taskId={id}`: Checks task status

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate-3d/
│   │       ├── route.ts      # API endpoint for 3D generation
│   │       └── refine/
│   │           └── route.ts  # API endpoint for refining models
│   └── page.tsx              # Main UI page
├── components/
│   └── ModelViewer.tsx       # 3D model viewer component
├── lib/
│   ├── meshy/
│   │   └── client.ts         # Meshy API client
│   └── supabase/
│       ├── client.ts         # Supabase client configuration
│       └── queries.ts        # Database queries and storage functions
└── utils/
    └── env.ts                # Environment utilities
```

## Deployment

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the following environment variables:
   - `NEXT_PUBLIC_MESHY_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_API_KEY`
4. Deploy!

## License

MIT
