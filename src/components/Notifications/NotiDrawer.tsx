import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { glassmorphic1 } from "@/components/shared/sharedStyles";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { createProxiedUrl } from "@/utils/threejs";
import { usePollingStore } from "@/stores/pollingStore";
import {
  modelHistory,
  type ModelHistoryItem as ModelHistoryItemType,
} from "@/utils/modelHistory";
import { Trash2, Clock } from "lucide-react";
import { useState } from "react";

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function ModelHistoryItem({
  item,
  onDelete,
}: {
  item: ModelHistoryItemType;
  onDelete: (id: string) => void;
}) {
  const modelUrl = item.modelUrl || item.previewUrl;
  const formattedDate = new Date(item.date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="border-b border-gray-200 pb-3 mb-3 last:border-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 line-clamp-2">
            {item.prompt}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Clock size={12} className="text-gray-500" />
            <span className="text-xs text-gray-500">{formattedDate}</span>
            {item.status === "generating" && (
              <span className="text-xs font-medium">Generating...</span>
            )}
            {item.status === "preview" && (
              <span className="text-xs font-medium">Preview</span>
            )}
            {item.status === "completed" && (
              <span className="text-xs font-medium">Completed</span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
          aria-label="Delete item"
        >
          <Trash2 size={14} className="text-gray-500" />
        </button>
      </div>

      {modelUrl && (
        <div className="w-full h-32 bg-gray-50 rounded-lg overflow-hidden">
          <Canvas camera={{ position: [0, 0, 2] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} />
            <Model url={createProxiedUrl(modelUrl)} />
            <OrbitControls enableZoom={false} />
          </Canvas>
        </div>
      )}
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
  } else if (progress.preview > 0) {
    progressValue = progress.preview / 2;
  }

  let statusText = "";
  if (completed) {
    statusText = "Completed!";
  } else if (progress.refine > 0 && progress.refine < 100) {
    statusText = "Refining model...";
  } else if (progress.preview > 0 && progress.preview < 100) {
    statusText = "Creating preview...";
  }

  if (!showProgress || !isGenerating) return null;

  return (
    <motion.div className="mb-3 flex flex-col items-center bg-white p-2 rounded-t-xl shadow-sm rounded-b-sm">
      <AnimatePresence mode="wait" initial={false}>
        {statusText && (
          <motion.p
            key={statusText}
            className="mb-2 text-base font-medium text-gray-700 mr-auto px-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {statusText}
          </motion.p>
        )}
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      {open && (
        <motion.div
          ref={drawerRef}
          className={`${glassmorphic1} absolute right-0 mt-16 mr-6 w-80 rounded-2xl shadow-lg p-2 flex flex-col z-50`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
          style={{ maxHeight: MAX_HEIGHT_NOTIFICATIONS }}
        >
          <ProgressBar progress={progress} isGenerating={isGenerating} />
          <div className="overflow-y-auto flex-1">
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
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
