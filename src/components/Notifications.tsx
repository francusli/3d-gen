import { useState, useEffect, useRef } from "react";
import { Loader2, Palette } from "lucide-react";
import { glassmorphic1 } from "@/components/shared/sharedStyles";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { createProxiedUrl } from "@/utils/threejs";
import { usePollingStore } from "@/stores/pollingStore";

interface NotificationsProps {
  previewUrl?: string | null;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

export default function Notifications({ previewUrl }: NotificationsProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const progress = usePollingStore((state) => state.progress);
  const isGenerating = usePollingStore((state) => state.isGenerating);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target))
        setOpen(false);
    };

    if (open) document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative z-10" ref={dropdownRef}>
      <div
        className={`${glassmorphic1} rounded-full absolute top-0 right-0 mt-4 mr-6 p-2 cursor-pointer flex items-center justify-center`}
        onClick={() => setOpen((o) => !o)}
        tabIndex={0}
        role="button"
        aria-label="Show notifications"
      >
        {isGenerating ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <Palette size={24} />
        )}
      </div>
      {open && (
        <motion.div
          className={`${glassmorphic1} absolute right-0 mt-16 mr-6 w-72 rounded-2xl shadow-lg p-4 flex flex-col items-center`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          {progress.preview > 0 && (
            <div className="mb-2 text-sm text-gray-700 w-full">
              <p>{`Preview Generation ${progress.preview}%`}</p>
              <p>{`Refine Generation ${progress.refine}%`}</p>
            </div>
          )}
          {previewUrl ? (
            <div className="w-full h-48 mb-2">
              <Canvas camera={{ position: [0, 0, 2.5] }}>
                <ambientLight />
                <Model url={createProxiedUrl(previewUrl)} />
                <OrbitControls />
              </Canvas>
            </div>
          ) : (
            <span className="text-gray-700 text-center">
              You have not created anything yet.
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
}
