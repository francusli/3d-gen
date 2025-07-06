import { setBrightness } from "@/utils";
import { useGLTF, Clone } from "@react-three/drei";
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

export function Model({
  url,
  position,
  onClick,
  variant = "grid",
  index = 0,
}: {
  url: string;
  position: [number, number, number];
  onClick?: () => void;
  variant?: "grid" | "modal" | "thumbnail";
  index?: number;
}) {
  const { scene } = useGLTF(url);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const enableBrightness = variant === "grid";
  const [isLoaded, setIsLoaded] = useState(false);

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

  // Spring animation when model loads (only for grid variant)
  useEffect(() => {
    const DELAY_DURATION = 0.03;
    const SCALE_DURATION = 0.3;

    if (scene && groupRef.current && variant === "grid" && !isLoaded) {
      setIsLoaded(true);

      gsap.set(groupRef.current.scale, {
        x: 0,
        y: 0,
        z: 0,
      });

      // Animate to final position with spring effect
      const delay = index * DELAY_DURATION;

      // Scale animation
      gsap.to(groupRef.current.scale, {
        x: modelScale,
        y: modelScale,
        z: modelScale,
        duration: SCALE_DURATION,
        delay: delay,
        ease: "back.out(1.7)",
      });
    }
  }, [scene, position, yOffset, modelScale, variant, index, isLoaded]);

  // Update brightness on hover state change for grid view
  useEffect(() => {
    if (groupRef.current && groupRef.current.children[0]) {
      if (!enableBrightness) return;
      setBrightness(groupRef.current.children[0], hovered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, hovered]);

  // Don't render anything if scene hasn't loaded yet
  if (!scene) return null;

  return (
    <group
      ref={groupRef}
      position={[position[0], position[1] + yOffset, position[2]]}
      scale={
        variant === "grid" ? [0, 0, 0] : [modelScale, modelScale, modelScale]
      }
      rotation={[0, Math.PI, 0]} // Rotate 180 degrees around Y-axis to face forward
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
