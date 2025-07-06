import { setBrightness } from "@/utils";
import { useGLTF, Clone } from "@react-three/drei";
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";

export function Model({
  url,
  position,
  onClick,
  variant = "grid",
}: {
  url: string;
  position: [number, number, number];
  onClick?: () => void;
  variant?: "grid" | "modal" | "thumbnail";
}) {
  const { scene } = useGLTF(url);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const enableBrightness = variant === "grid";

  // Dynamic target size based on variant
  const targetSize = React.useMemo(() => {
    switch (variant) {
      case "thumbnail":
        return 1.0;
      default:
        return 2.5;
    }
  }, [variant]);

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
      <Clone object={scene} />
    </group>
  );
}
