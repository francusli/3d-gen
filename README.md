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
- Notifications for model creation progress and results
- Polling for real-time task status updates

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
MESHY_API_KEY=msy_your_api_key_here

# Supabase Configuration (for storing generated models)
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_supabase_project_id_here
NEXT_PUBLIC_SUPABASE_API_KEY=your_supabase_anon_key_here
```

For testing, you can use the test mode API key:

```env
MESHY_API_KEY=msy_dummy_api_key_for_test_mode_12345678
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
6. **Notifications**: You receive updates about the creation process and results
7. **Polling**: The app automatically checks the status of your model generation task in real time

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
│   │       └── route.ts         # API endpoint for 3D generation
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # App layout
│   └── page.tsx                 # Main UI page
├── components/
│   ├── ArtifactsDisplay.tsx     # Displays generated model artifacts
│   ├── ModelViewer.tsx          # 3D model viewer component
│   ├── PromptSection.tsx        # Prompt input and controls
│   ├── SuccessMessage.tsx       # Success notification UI
│   ├── Notifications/
│   │   ├── NotiDrawer.tsx       # Notification drawer UI
│   │   ├── Notifications.tsx    # Notification logic/UI
│   │   └── index.ts             # Notification exports
│   └── shared/
│       ├── CameraController.tsx # Camera controls for 3D viewer
│       ├── Model.tsx            # 3D model rendering logic
│       ├── Modal.tsx            # Modal UI component
│       └── sharedStyles.ts      # Shared styles
├── hooks/
│   ├── useTaskPolling.ts        # Polls for model generation status
│   └── useAnims.ts              # Animation utilities for 3D models
├── lib/
│   ├── meshy/
│   │   └── client.ts            # Meshy API client
│   └── supabase/
│       ├── client.ts            # Supabase client configuration
│       └── queries.ts           # Database queries and storage functions
├── stores/
│   ├── pollingStore.ts          # State for polling tasks
│   ├── notiStore.ts             # State for notifications
│   └── index.ts                 # Store exports
├── types/                       # (Currently empty, for type definitions)
└── utils/
    ├── format.ts                # Formatting utilities
    ├── index.ts                 # Utility exports
    ├── modelHistory.ts          # Model history utilities
    ├── positions.ts             # 3D positions helpers
    └── threejs.ts               # Three.js helpers
```

## Notifications

Notifications inform you about the progress and results of your 3D model generation tasks. As soon as you submit a prompt, a notification is created to track the task. You’ll receive updates when the model is being generated, when it’s ready, or if there’s an error. Notifications are managed by the components in `src/components/Notifications/` and the state is handled by `notiStore` in `src/stores/notiStore.ts`.

## Polling

The app uses polling to provide real-time updates on the status of your model generation tasks. The custom hook `useTaskPolling` (in `src/hooks/useTaskPolling.ts`) periodically checks the status of your task with the backend and updates the UI and notifications accordingly. The polling state is managed by `pollingStore` in `src/stores/pollingStore.ts`.

## Important Hooks and Stores

- **Hooks:**
  - `useTaskPolling`: Handles polling for model generation status and updates the UI/notifications.
  - `useAnims`: Provides animation utilities for 3D models.
- **Stores:**
  - `pollingStore`: Manages the state of ongoing polling tasks.
  - `notiStore`: Manages notification state and updates.

## Deployment

This app is ready to deploy on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the following environment variables:
   - `MESHY_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_PROJECT_ID`
   - `NEXT_PUBLIC_SUPABASE_API_KEY`
4. Deploy!

## License

MIT
