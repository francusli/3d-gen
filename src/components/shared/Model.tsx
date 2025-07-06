import { useGLTF, Clone } from "@react-three/drei";
import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { gsap } from "gsap";

// Cache for bounding box calculations to avoid expensive recalculations
const boundingBoxCache = new Map<
  string,
  {
    maxDimension: number;
    minY: number;
    baseScale: number;
  }
>();

// Secondary cache for final calculated values (url + targetSize combination)
const finalScaleCache = new Map<
  string,
  { modelScale: number; yOffset: number }
>();

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
  const groupRef = useRef<THREE.Group>(null);
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

  // Optimized bounding box calculation with dual-level caching
  const { modelScale, yOffset } = React.useMemo(() => {
    if (!scene) return { modelScale: 1, yOffset: 0 };

    // Check final scale cache first (url + targetSize combination)
    const finalCacheKey = `${url}_${targetSize}`;
    const cachedFinal = finalScaleCache.get(finalCacheKey);
    if (cachedFinal) {
      return cachedFinal;
    }

    // Check bounding box cache
    const cacheKey = url;
    let cachedBounds = boundingBoxCache.get(cacheKey);

    if (!cachedBounds) {
      // Calculate the bounding box and cache - this is the expensive operation
      const boundingBox = new THREE.Box3().setFromObject(scene);
      const size = boundingBox.getSize(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z);

      if (maxDimension === 0) return { modelScale: 1, yOffset: 0 };

      cachedBounds = {
        maxDimension,
        minY: boundingBox.min.y,
        baseScale: 2.5 / maxDimension, // Store base scale for 2.5 size
      };

      boundingBoxCache.set(cacheKey, cachedBounds);
    }

    // Calculate final scale based on target size (very fast)
    const scaleFactor = targetSize / cachedBounds.maxDimension;
    const yOffset = -cachedBounds.minY * scaleFactor;

    const result = { modelScale: scaleFactor, yOffset };

    // Cache the final result for this url + targetSize combination
    finalScaleCache.set(finalCacheKey, result);

    return result;
  }, [scene, targetSize, url]);

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
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
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
