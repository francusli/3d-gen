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

  // Update brightness on hover state change
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

// ModalWithSidePanels component: Modal with animated left/right panels and main content
function ModalWithSidePanels({
  onClose,
  selectedModel,
}: {
  onClose: () => void;
  selectedModel: string | null;
}) {
  const open = !!selectedModel;

  const animateOpenLeft = { x: 0, opacity: 1 };
  const animateClosedLeft = { x: 50, opacity: 0 };
  const animateOpenRight = { x: 0, opacity: 1 };
  const animateClosedRight = { x: -50, opacity: 0 };

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex gap-4 items-stretch relative"
    >
      {/* Left Panel */}
      <motion.div
        initial={animateClosedLeft}
        animate={open ? animateOpenLeft : animateClosedLeft}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white border-r border-gray-200 rounded-lg border-md flex flex-col justify-center items-center"
      >
        <h1 className="font-mono text-lg">Generations</h1>
      </motion.div>

      {/* Main Content */}
      <div className="w-[600px] h-[600px] bg-white rounded-lg border-md">
        {selectedModel && (
          <Canvas camera={{ position: [4, 2, 14], fov: 20 }}>
            <Suspense fallback={null}>
              <Center>
                <Model
                  url={selectedModel}
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

      {/* Right Panel */}
      <motion.div
        initial={animateClosedRight}
        animate={open ? animateOpenRight : animateClosedRight}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white border-l border-gray-200 rounded-lg border-md flex flex-col justify-center items-center"
      >
        <div className="mt-4 text-gray-400">Tools, Download, Delete</div>
        <p>Prompt</p>
      </motion.div>
    </Modal>
  );
}

export default function ModelViewer({ modelUrls }: { modelUrls: string[] }) {
  const columns = 7;
  const spacing = 5;
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  return (
    <div className="w-full h-screen">
      <Canvas orthographic camera={{ position: [10, 10, 10], zoom: 50 }}>
        <Suspense fallback={null}>
          <Center>
            {modelUrls.map((url, i) => {
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
                  key={i}
                  url={url}
                  position={position}
                  onClick={() => setSelectedModel(url)}
                />
              );
            })}
          </Center>
          <Environment preset="studio" />
        </Suspense>
      </Canvas>

      {/* Modal for the selected model */}
      <ModalWithSidePanels
        selectedModel={selectedModel}
        onClose={() => setSelectedModel(null)}
      />
    </div>
  );
}
