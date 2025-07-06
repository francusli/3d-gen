"use client";

import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

export function CameraController({
  targetPosition,
  shouldMove,
  initialTarget,
}: {
  targetPosition: [number, number, number] | null;
  shouldMove: boolean;
  initialTarget: [number, number, number];
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    if (shouldMove && targetPosition && controlsRef.current) {
      // Calculate how much to pan the camera
      const [targetX, , targetZ] = targetPosition;

      // Get current target position
      const currentTarget = controlsRef.current.target.clone();

      // Calculate the offset needed to center on the new model
      const offsetX = targetX - currentTarget.x;
      const offsetZ = targetZ - currentTarget.z;

      // Store initial positions
      const startCameraPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
      };

      const startTargetPosition = {
        x: currentTarget.x,
        y: currentTarget.y,
        z: currentTarget.z,
      };

      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Pan both camera and target by the same amount
        camera.position.x = startCameraPosition.x + offsetX * easeProgress;
        camera.position.y = startCameraPosition.y; // Keep Y constant
        camera.position.z = startCameraPosition.z + offsetZ * easeProgress;

        // Move target by the same amount to maintain viewing angle
        if (controlsRef.current) {
          controlsRef.current.target.set(
            startTargetPosition.x + offsetX * easeProgress,
            startTargetPosition.y,
            startTargetPosition.z + offsetZ * easeProgress
          );
          controlsRef.current.update();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }, [camera, targetPosition, shouldMove]);

  return (
    <OrbitControls
      ref={controlsRef}
      target={initialTarget}
      mouseButtons={{
        LEFT: THREE.MOUSE.PAN,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
    />
  );
}
