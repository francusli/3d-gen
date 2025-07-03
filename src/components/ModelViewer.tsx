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

// Utility function to create proxied URLs to avoid CORS issues
export function createProxiedUrl(originalUrl: string): string {
  return `/api/generate-3d?modelUrl=${encodeURIComponent(originalUrl)}`;
}

function Model({
  url,
  position,
  onClick,
}: {
  url: string;
  position: [number, number, number];
  onClick?: () => void;
}) {
  const { scene } = useGLTF(url);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

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

  // Helper to set material brightness
  const setBrightness = (object: THREE.Object3D, bright: boolean) => {
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
        const mesh = child as THREE.Mesh;
        const material = mesh.material;
        const materials = Array.isArray(material) ? material : [material];

        materials.forEach((mat) => {
          const isMaterial =
            mat instanceof THREE.MeshStandardMaterial ||
            mat instanceof THREE.MeshPhysicalMaterial ||
            mat instanceof THREE.MeshLambertMaterial ||
            mat instanceof THREE.MeshPhongMaterial;

          if (isMaterial) {
            if (Object.prototype.hasOwnProperty.call(mat, "emissive"))
              mat.emissive.set(bright ? 0x222222 : 0x000000);

            if (mat.color) mat.color.set(bright ? 0xffffff : 0x444444);

            mat.needsUpdate = true;
          }
        });
      }
    });
  };

  // Update brightness on hover state change
  useEffect(() => {
    if (groupRef.current && groupRef.current.children[0])
      setBrightness(groupRef.current.children[0], hovered);
  }, [hovered, localScene]);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
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

export default function ModelViewer({ modelUrls }: { modelUrls: string[] }) {
  const columns = 7;
  const spacing = 5;
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  return (
    <div className="w-full h-screen">
      <Canvas orthographic camera={{ position: [10, 10, 10], zoom: 50 }}>
        {/* <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} /> */}
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
      <Modal
        open={!!selectedModel}
        onClose={() => setSelectedModel(null)}
        className="w-[400px] h-[400px]"
      >
        {selectedModel && (
          <Canvas camera={{ position: [10, 10, 10], fov: 20 }}>
            <Suspense fallback={null}>
              <Center>
                <Model url={selectedModel} position={[0, 0, 0]} />
              </Center>
              <Environment preset="studio" />
              <OrbitControls />
            </Suspense>
          </Canvas>
        )}
      </Modal>
    </div>
  );
}
