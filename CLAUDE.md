# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality

## Environment Setup

The application requires a Meshy AI API key to function. Create a `.env.local` file:

```env
MESHY_API_KEY=msy_your_api_key_here
```

For testing purposes, you can use: `MESHY_API_KEY=msy_dummy_api_key_for_test_mode_12345678`

## Architecture Overview

This is a Next.js 15 application that generates 3D models from text prompts using the Meshy AI API. The application follows a two-phase generation process:

1. **Preview Generation**: Creates a low-quality preview model without textures
2. **Texture Refinement**: Enhances the preview with detailed textures and geometry

### Key Components

- **MeshyClient** (`src/lib/meshy/client.ts`): Core API client that handles the two-phase generation process with polling for task completion
- **ModelViewer** (`src/components/ModelViewer.tsx`): 3D model renderer using React Three Fiber with orbit controls and lighting
- **API Route** (`src/app/api/generate-3d/route.ts`): Next.js API endpoint that proxies Meshy API requests and serves model files to avoid CORS issues

### Tech Stack

- **Frontend**: React 19 with Next.js 15 App Router
- **3D Rendering**: React Three Fiber + Three.js with @react-three/drei utilities
- **Styling**: Tailwind CSS v4
- **API Integration**: Axios for HTTP requests, custom polling mechanism for task status

### Data Flow

1. User enters text prompt in the main UI (`src/app/page.tsx`)
2. Request sent to `/api/generate-3d` endpoint
3. MeshyClient creates preview task, polls for completion
4. Upon preview success, automatically creates refinement task
5. Both models are returned and displayed in the ModelViewer component
6. Model files are proxied through the API route to avoid CORS issues

### Progress Tracking

The application includes progress tracking UI components, though the progress callback system is currently not functional (see TODO comment in `src/app/page.tsx:106`).

### File Organization

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (primarily ModelViewer)
- `src/lib/meshy/` - Meshy AI API client and related utilities
- `src/hooks/`, `src/stores/`, `src/types/`, `src/utils/` - Currently empty but reserved for future use
