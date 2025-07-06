import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { glassmorphic1 } from "@/components/shared/sharedStyles";
import { Canvas } from "@react-three/fiber";
import { Center, OrbitControls } from "@react-three/drei";
import { createProxiedUrl } from "@/utils/threejs";
import { Model } from "@/components/shared/Model";
import { usePollingStore } from "@/stores/pollingStore";
import {
  modelHistory,
  type ModelHistoryItem as ModelHistoryItemType,
} from "@/utils/modelHistory";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useAnimatedRoundedValue } from "@/hooks/useAnims";
import { formatDate } from "@/utils/format";
import { ModalWithPanels } from "@/components/ModelViewer";
import { ModelArtifact } from "@/lib/supabase/queries";

function ModelHistoryItem({
  item,
  onDelete,
  onClick,
}: {
  item: ModelHistoryItemType;
  onDelete: (id: string) => void;
  onClick: (item: ModelHistoryItemType) => void;
}) {
  const modelUrl = item.modelUrl || item.previewUrl;
  const formattedDate = formatDate(item.date);

  return (
    <div className="relative group">
      <div
        onClick={() => onClick(item)}
        className="flex border-1 border-gray-200 justify-between cursor-pointer hover:shadow-sm items-center mb-2 gap-3 bg-white/80 py-2 px-2 rounded-lg transition-all duration-200 ease-in-out"
      >
        <div className="w-16 h-16">
          {modelUrl ? (
            <div className="bg-gray-100 rounded-lg overflow-hidden w-full h-full">
              <Canvas camera={{ position: [0, 0, 2] }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[5, 5, 5]} />
                <Center>
                  <Model
                    url={createProxiedUrl(modelUrl)}
                    variant="thumbnail"
                    position={[0, 0, 0]}
                  />
                </Center>
                <OrbitControls enableZoom={false} />
              </Canvas>
            </div>
          ) : (
            <div className="bg-gray-200 rounded-lg w-full h-full relative overflow-hidden animate-shimmer" />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight">
            {item.prompt}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{formattedDate}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-colors z-10 bg-white cursor-pointer group/button"
              aria-label="Delete item"
            >
              <Trash2
                size={14}
                className="text-gray-500 group-hover/button:text-red-500 transition-colors"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: { preview: number; refine: number };
  isGenerating: boolean;
}

const COMPLETED_DISPLAY_DURATION = 1500; // 1.5 seconds

function ProgressBar({ progress, isGenerating }: ProgressBarProps) {
  const [showProgress, setShowProgress] = useState(false);
  const [completed, setCompleted] = useState(false);
  const completedTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (completedTimeout.current) {
      clearTimeout(completedTimeout.current);
      completedTimeout.current = null;
    }
    if (isGenerating) {
      setShowProgress(true);
      if (progress.preview === 100 && progress.refine === 100) {
        setCompleted(true);
        completedTimeout.current = setTimeout(() => {
          setShowProgress(false);
          setCompleted(false);
        }, COMPLETED_DISPLAY_DURATION);
      } else setCompleted(false);
    } else {
      setShowProgress(false);
      setCompleted(false);
    }
    return () => {
      if (completedTimeout.current) {
        clearTimeout(completedTimeout.current);
        completedTimeout.current = null;
      }
    };
  }, [isGenerating, progress.preview, progress.refine]);

  let progressValue = 0;
  if (progress.refine > 0) {
    progressValue = 50 + progress.refine / 2;
  } else {
    progressValue = progress.preview / 2;
  }

  let statusText = "Preparing model...";
  if (completed) {
    statusText = "Completed!";
  } else if (progress.refine > 0 && progress.refine < 100) {
    statusText = "Refining model...";
  } else if (progress.preview > 0 && progress.preview < 100) {
    statusText = "Creating preview...";
  }

  const rounded = useAnimatedRoundedValue(progressValue);

  if (!showProgress || !isGenerating) return null;
  return (
    <motion.div className="mb-3 flex flex-col items-center bg-white p-2 rounded-t-xl shadow-sm rounded-b-sm">
      <AnimatePresence mode="wait" initial={false}>
        <div className="flex items-center justify-between gap-2 mb-2 px-2 w-full">
          <motion.p
            className="text-base font-medium text-gray-700"
            animate={{ opacity: statusText ? 1 : 0, y: 0 }}
            initial={{ opacity: 0, y: 4 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {statusText || "Creating..."}
          </motion.p>
          <motion.p className="text-base font-medium text-gray-700">
            <motion.span>{rounded}</motion.span>%
          </motion.p>
        </div>
      </AnimatePresence>
      <div
        className="w-full h-4 rounded-full relative overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.18)",
          boxShadow: "0 2px 8px 0 rgba(31, 38, 135, 0.15)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressValue}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="h-full rounded-full "
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(200,200,255,0.6) 100%)",
            boxShadow: "0 1px 6px 0 rgba(31, 38, 135, 0.10)",
          }}
        />
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background:
              "linear-gradient(120deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.10) 100%)",
          }}
        />
      </div>
    </motion.div>
  );
}

const MAX_HEIGHT_NOTIFICATIONS = "600px";

interface NotiDrawerProps {
  open: boolean;
  anchorRef?: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

export function NotiDrawer({ open, anchorRef, onClose }: NotiDrawerProps) {
  const [selectedArtifact, setSelectedArtifact] =
    useState<ModelArtifact | null>(null);
  const [history, setHistory] = useState<ModelHistoryItemType[]>([]);
  const progress = usePollingStore((state) => state.progress);
  const isGenerating = usePollingStore((state) => state.isGenerating);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setHistory(modelHistory.getAll());
  }, [open]);

  useEffect(() => {
    if (isGenerating && open) {
      const interval = setInterval(() => {
        setHistory(modelHistory.getAll());
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGenerating, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        drawerRef.current &&
        !drawerRef.current.contains(target) &&
        (!anchorRef ||
          !anchorRef.current ||
          !anchorRef.current.contains(target))
      ) {
        onClose();
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose, anchorRef]);

  const handleDelete = (id: string) => {
    modelHistory.delete(id);
    setHistory(modelHistory.getAll());
  };

  const convertToModelArtifact = (
    item: ModelHistoryItemType
  ): ModelArtifact => {
    return {
      id: item.id,
      name: "Generated Model", // Default name since ModelHistoryItem doesn't have one
      date: new Date(item.date).toISOString(),
      model_url: item.modelUrl || item.previewUrl || "",
      prompt: item.prompt,
    };
  };

  const handleItemClick = (item: ModelHistoryItemType) => {
    if (item.modelUrl) setSelectedArtifact(convertToModelArtifact(item));
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {open && (
          <motion.div
            ref={drawerRef}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 40 }}
            className={`${glassmorphic1} absolute right-0 mt-16 mr-6 w-80 rounded-2xl shadow-lg p-2 flex flex-col z-50`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ maxHeight: MAX_HEIGHT_NOTIFICATIONS }}
          >
            <ProgressBar progress={progress} isGenerating={isGenerating} />

            {history.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                You have not created anything yet.
              </p>
            ) : (
              history.map((item) => (
                <ModelHistoryItem
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onClick={handleItemClick}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for the selected model */}
      <ModalWithPanels
        selectedArtifact={selectedArtifact}
        onClose={() => setSelectedArtifact(null)}
      />
    </>
  );
}
