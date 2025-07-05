"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  Center,
  Environment,
  Clone,
  OrbitControls,
} from "@react-three/drei";
import * as THREE from "three";
import Modal from "@/components/shared/Modal";
import { setBrightness } from "@/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { ModelArtifact } from "@/lib/supabase/queries";

// Utility function to create proxied URLs to avoid CORS issues
export function createProxiedUrl(originalUrl: string): string {
  return `/api/generate-3d?modelUrl=${encodeURIComponent(originalUrl)}`;
}

function Model({
  url,
  position,
  onClick,
  variant = "grid",
}: {
  url: string;
  position: [number, number, number];
  onClick?: () => void;
  variant?: "grid" | "modal";
}) {
  const { scene } = useGLTF(url);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const enableBrightness = variant === "grid";
  const targetSize = 2.5;

  // Deep clone the scene and all materials for this instance
  const localScene = React.useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material;
        if (Array.isArray(material)) {
          mesh.material = material.map((mat) => mat.clone());
        } else mesh.material = material.clone();
      }
    });
    return clone;
  }, [scene]);

  // Set the scale of the model to the target size to have uniform size
  const { modelScale, yOffset } = React.useMemo(() => {
    if (!scene) return { modelScale: 1, yOffset: 0 };

    // Calculate the bounding box of the original scene
    const boundingBox = new THREE.Box3().setFromObject(scene);
    const size = boundingBox.getSize(new THREE.Vector3());

    // Calculate scale factor based on the largest dimension
    const maxDimension = Math.max(size.x, size.y, size.z);
    if (maxDimension === 0) return { modelScale: 1, yOffset: 0 };

    const scaleFactor = targetSize / maxDimension;

    // Calculate Y offset to place model bottom on ground plane
    // This creates a consistent "floor" that all models sit on
    const minY = boundingBox.min.y;
    const yOffset = -minY * scaleFactor;

    return { modelScale: scaleFactor, yOffset };
  }, [scene, targetSize]);

  // Update brightness on hover state change for grid view
  useEffect(() => {
    if (groupRef.current && groupRef.current.children[0]) {
      if (!enableBrightness) return;
      setBrightness(groupRef.current.children[0], hovered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, hovered]);

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + yOffset, position[2]]}
      scale={[modelScale, modelScale, modelScale]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = "default";
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
    >
      <Clone object={localScene} />
    </group>
  );
}

// Extracted main content for the modal
function ModalMainContent({
  selectedArtifact,
  MAX_WIDTH,
}: {
  selectedArtifact: ModelArtifact | null;
  MAX_WIDTH: number;
}) {
  const PFP_DIMENSIONS = 32;

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const glassmorphic2 = "bg-white/50 backdrop-blur-md";

  return (
    <div
      className={`w-[${MAX_WIDTH}px] h-[${MAX_WIDTH}px] rounded-lg border-md ${glassmorphic2}`}
    >
      <div className="absolute top-0 left-0 m-2 p-1.5 px-2.5 rounded-lg flex items-center gap-2 bg-gray-200">
        <Image
          src="https://media.licdn.com/dms/image/v2/D5603AQEuW4OFn35Elg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1718167245956?e=2147483647&v=beta&t=QnWhC0QGKLPqx4sglJ0pi6EuEkxlVebNOSyTOji9_CE"
          alt={selectedArtifact?.name || "Name"}
          className="rounded-full"
          width={PFP_DIMENSIONS}
          height={PFP_DIMENSIONS}
        />
        <div className="flex flex-col">
          <p className="text-md font-medium">
            {selectedArtifact?.name || "Unknown"}
          </p>
          <p className="text-sm text-gray-600">
            {selectedArtifact?.date
              ? formatDate(selectedArtifact.date)
              : "Unknown date"}
          </p>
        </div>
      </div>

      {selectedArtifact && (
        <Canvas camera={{ position: [4, 2, 14], fov: 20 }}>
          <Suspense fallback={null}>
            <Center>
              <Model
                url={selectedArtifact.model_url}
                position={[0, 0, 0]}
                variant="modal"
              />
            </Center>
            <Environment preset="studio" />
            <OrbitControls />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}

function ModalWithPanels({
  onClose,
  selectedArtifact,
}: {
  onClose: () => void;
  selectedArtifact: ModelArtifact | null;
}) {
  const MAX_WIDTH = 600;
  const open = !!selectedArtifact;

  const animateOpenDown = { y: 0, opacity: 1 };
  const animateClosedDown = { y: -50, opacity: 0 };

  const glassmorphic2 = "bg-white/50 backdrop-blur-md";

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex flex-col gap-4 items-stretch relative"
    >
      {/* Main Content */}
      <ModalMainContent
        selectedArtifact={selectedArtifact}
        MAX_WIDTH={MAX_WIDTH}
      />

      {/* Bottom Panel */}
      <motion.div
        initial={animateClosedDown}
        animate={open ? animateOpenDown : animateClosedDown}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`rounded-lg border-md flex flex-col justify-center p-3 gap-1 w-fit m-auto ${glassmorphic2} max-w-[${MAX_WIDTH}px]`}
      >
        <p className="text-sm -mt-1 text-gray-600">Prompt</p>
        <p className="text-md">
          {selectedArtifact?.prompt || "No prompt available"}
        </p>
      </motion.div>
    </Modal>
  );
}

export default function ModelViewer({
  artifacts,
}: {
  artifacts: ModelArtifact[];
}) {
  const columns = 7;
  const spacing = 6;
  const [selectedArtifact, setSelectedArtifact] =
    useState<ModelArtifact | null>(null);

  // Calculate the center of the grid to position camera optimally
  const gridCenter = React.useMemo(() => {
    if (artifacts.length === 0) return [0, 0, 0];

    const totalRows = Math.ceil(artifacts.length / columns);

    // Calculate center X position (accounting for the zigzag offset)
    const centerX = ((columns - 1) * spacing) / 2;

    // Calculate center Z position
    const centerZ = ((totalRows - 1) * spacing) / 2;

    return [centerX, 0, centerZ];
  }, [artifacts.length, columns, spacing]);

  return (
    <div className="w-full h-screen">
      <Canvas
        orthographic
        camera={{
          position: [gridCenter[0] + 10, 10, gridCenter[2] + 10],
          zoom: 55,
        }}
      >
        <Suspense fallback={null}>
          {artifacts.map((artifact, i) => {
            const row = Math.floor(i / columns);
            const col = i % columns;
            const position: [number, number, number] = [
              col * spacing,
              0, // Y will be adjusted by yOffset in Model component
              row * spacing,
            ];
            return (
              <Model
                key={artifact.id}
                url={artifact.model_url}
                position={position}
                onClick={() => setSelectedArtifact(artifact)}
              />
            );
          })}
          x
          <Environment preset="studio" />
          <OrbitControls
            target={gridCenter as [number, number, number]}
            mouseButtons={{
              LEFT: THREE.MOUSE.PAN,
              RIGHT: THREE.MOUSE.ROTATE,
            }}
          />
        </Suspense>
      </Canvas>

      {/* Modal for the selected model */}
      <ModalWithPanels
        selectedArtifact={selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
      />
    </div>
  );
}
