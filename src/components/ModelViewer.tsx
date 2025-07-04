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

// Fallback model URL - using a reliable local model or a known working URL
const FALLBACK_MODEL_URL = "/assets/3d/refined-model.glb";

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
      position={position}
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

// ModalWithPanels component: Modal with animated left/right panels and main content
function ModalWithPanels({
  onClose,
  selectedArtifact,
}: {
  onClose: () => void;
  selectedArtifact: ModelArtifact | null;
}) {
  const PFP_DIMENSIONS = 32;
  const open = !!selectedArtifact;

  const animateOpenDown = { y: 0, opacity: 1 };
  const animateClosedDown = { y: -50, opacity: 0 };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex flex-col gap-4 items-stretch relative"
    >
      {/* Main Content */}
      <div className="w-[600px] h-[600px] bg-gray-50 rounded-lg border-md">
        <div className="absolute top-0 left-0 m-2 p-1.5 bg-gray-100 rounded-lg flex items-center gap-2">
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

      {/* Bottom Panel */}
      <motion.div
        initial={animateClosedDown}
        animate={open ? animateOpenDown : animateClosedDown}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/80 backdrop-blur-lg rounded-lg border-md flex flex-col justify-center p-3 gap-1 w-fit m-auto"
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
  const spacing = 5;
  const [selectedArtifact, setSelectedArtifact] =
    useState<ModelArtifact | null>(null);

  return (
    <div className="w-full h-screen">
      <Canvas orthographic camera={{ position: [10, 10, 10], zoom: 50 }}>
        <Suspense fallback={null}>
          <Center>
            {artifacts.map((artifact, i) => {
              const row = Math.floor(i / columns);
              const col = i % columns;
              const xOffset = row % 2 === 0 ? 0 : spacing / 2;
              const position: [number, number, number] = [
                col * spacing + xOffset,
                0,
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
          </Center>
          <Environment preset="studio" />
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
