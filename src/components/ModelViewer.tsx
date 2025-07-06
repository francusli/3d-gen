"use client";

import React, { Suspense, useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls } from "@react-three/drei";
import Modal from "@/components/shared/Modal";
import { motion } from "framer-motion";
import placeholderPfp from "../../public/gradient.jpg";
import Image from "next/image";
import { ModelArtifact } from "@/lib/supabase/queries";
import { formatDate } from "@/utils/format";
import { glassmorphic2 } from "./shared/sharedStyles";
import { Model } from "./shared/Model";
import { getGridCenter, getStableGridPositions } from "@/utils/positions";
import { CameraController } from "./shared/CameraController";

function ModelScene({
  cameraProps,
  children,
  controls,
  orthographic = false,
}: {
  cameraProps: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  children: React.ReactNode;
  controls?: React.ReactNode;
  environmentIntensity?: number;
  orthographic?: boolean;
}) {
  return (
    <Canvas camera={cameraProps} orthographic={orthographic}>
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <ambientLight intensity={0.2} />
      {children}
      <Environment preset="studio" environmentIntensity={0.3} />
      {controls}
    </Canvas>
  );
}

export function ModalMainContent({
  selectedArtifact,
}: {
  selectedArtifact: ModelArtifact | null;
}) {
  const PFP_DIMENSIONS = 32;

  const photoOfMe =
    "https://media.licdn.com/dms/image/v2/D5603AQEuW4OFn35Elg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1718167245956?e=2147483647&v=beta&t=QnWhC0QGKLPqx4sglJ0pi6EuEkxlVebNOSyTOji9_CE";

  return (
    <div
      className={`w-[600px] h-[600px] rounded-lg border-md ${glassmorphic2}`}
    >
      <div className="absolute top-0 left-0 m-2 p-1.5 px-2.5 rounded-lg flex items-center gap-2 bg-gray-200">
        <Image
          src={
            selectedArtifact?.name === "Frankie Li" ? photoOfMe : placeholderPfp
          }
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
        <ModelScene
          cameraProps={{ position: [4, 2, 14], fov: 20 }}
          orthographic={false}
        >
          <Center>
            <Model
              url={selectedArtifact.model_url}
              position={[0, 0, 0]}
              variant="modal"
            />
          </Center>
          <OrbitControls />
        </ModelScene>
      )}
    </div>
  );
}

export function ModalWithPanels({
  onClose,
  selectedArtifact,
}: {
  onClose: () => void;
  selectedArtifact: ModelArtifact | null;
}) {
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
      <ModalMainContent selectedArtifact={selectedArtifact} />

      {/* Bottom Panel */}
      <motion.div
        initial={animateClosedDown}
        animate={open ? animateOpenDown : animateClosedDown}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`rounded-lg border-md flex flex-col justify-center p-3 gap-1 w-fit m-auto ${glassmorphic2} max-w-[600px]`}
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

  // Store artifact positions based on their IDs to maintain stability
  const positionMapRef = useRef<
    Map<string, { position: [number, number, number]; index: number }>
  >(new Map());
  const nextIndexRef = useRef(0);

  // Track if this is the initial load
  const isInitialLoadRef = useRef(true);
  const previousArtifactCountRef = useRef(0);

  // State for camera movement
  const [cameraTarget, setCameraTarget] = useState<{
    position: [number, number, number] | null;
    shouldMove: boolean;
  }>({ position: null, shouldMove: false });

  // Calculate stable grid positions using the utility function
  const gridPositions = React.useMemo(() => {
    return getStableGridPositions(
      artifacts,
      columns,
      spacing,
      positionMapRef.current,
      nextIndexRef
    );
  }, [artifacts, columns, spacing]);

  // Calculate the center of the grid to position camera optimally
  const gridCenter = React.useMemo(
    () => getGridCenter(artifacts.length, columns, spacing),
    [artifacts.length, columns, spacing]
  );

  // Detect when a new model is added and move camera to it
  useEffect(() => {
    // Skip camera movement on initial load
    if (isInitialLoadRef.current && artifacts.length > 0) {
      isInitialLoadRef.current = false;
      previousArtifactCountRef.current = artifacts.length;
      return;
    }

    // Check if a new artifact was added
    if (artifacts.length > previousArtifactCountRef.current) {
      // Find the newly added artifact (first one in the array since they're ordered by date desc)
      const newArtifact = artifacts[0];
      const newPosition = positionMapRef.current.get(newArtifact.id);

      if (newPosition) {
        setCameraTarget({
          position: newPosition.position,
          shouldMove: true,
        });

        // Reset the flag after a short delay
        setTimeout(() => {
          setCameraTarget((prev) => ({ ...prev, shouldMove: false }));
        }, 100);
      }
    }

    previousArtifactCountRef.current = artifacts.length;
  }, [artifacts]);

  return (
    <div className="w-full h-screen">
      <ModelScene
        cameraProps={{
          position: [gridCenter[0] + 10, 10, gridCenter[2] + 10],
          zoom: 55,
          near: 0.1,
          far: 1000,
        }}
        orthographic
      >
        {gridPositions.map((gridPos) => {
          const artifact = artifacts.find((a) => a.id === gridPos.artifactId);
          if (!artifact) return null;

          return (
            <Model
              key={artifact.id}
              url={artifact.model_url}
              position={gridPos.position}
              onClick={() => setSelectedArtifact(artifact)}
              index={gridPos.index}
            />
          );
        })}
        <CameraController
          targetPosition={cameraTarget.position}
          shouldMove={cameraTarget.shouldMove}
          initialTarget={gridCenter as [number, number, number]}
        />
      </ModelScene>

      {/* Modal for the selected model */}
      <ModalWithPanels
        selectedArtifact={selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
      />
    </div>
  );
}
