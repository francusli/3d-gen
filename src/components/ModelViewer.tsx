"use client";

import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Center, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import Modal from "@/components/shared/Modal";
import { motion } from "framer-motion";
import placeholderPfp from "../../public/gradient.jpg";
import Image from "next/image";
import { ModelArtifact } from "@/lib/supabase/queries";
import { formatDate } from "@/utils/format";
import { glassmorphic2 } from "./shared/sharedStyles";
import { Model } from "./shared/Model";
import { getRandomizedGridPositions, getGridCenter } from "@/utils/positions";

// Extracted main content for the modal
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

  // Calculate grid positions with randomized order
  const gridPositions = React.useMemo(
    () => getRandomizedGridPositions(artifacts, columns, spacing),
    [artifacts, columns, spacing]
  );

  // Calculate the center of the grid to position camera optimally
  const gridCenter = React.useMemo(
    () => getGridCenter(artifacts.length, columns, spacing),
    [artifacts.length, columns, spacing]
  );

  return (
    <div className="w-full h-screen">
      <Canvas
        orthographic
        camera={{
          position: [gridCenter[0] + 10, 10, gridCenter[2] + 10],
          zoom: 55,
        }}
      >
        {gridPositions.map((gridPos, animationIndex) => {
          const artifact = artifacts[gridPos.index];
          return (
            <Model
              key={artifact.id}
              url={artifact.model_url}
              position={gridPos.position}
              onClick={() => setSelectedArtifact(artifact)}
              index={animationIndex}
            />
          );
        })}
        <Environment preset="studio" />
        <OrbitControls
          target={gridCenter as [number, number, number]}
          mouseButtons={{
            LEFT: THREE.MOUSE.PAN,
            RIGHT: THREE.MOUSE.ROTATE,
          }}
        />
      </Canvas>

      {/* Modal for the selected model */}
      <ModalWithPanels
        selectedArtifact={selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
      />
    </div>
  );
}
