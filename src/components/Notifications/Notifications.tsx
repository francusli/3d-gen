import { useRef } from "react";
import { Loader2, Palette } from "lucide-react";
import { glassmorphic1 } from "@/components/shared/sharedStyles";
import { NotiDrawer } from "./NotiDrawer";
import { usePollingStore } from "@/stores";
import { useNotiStore } from "@/stores";
import { motion, AnimatePresence } from "framer-motion";

export default function Notifications() {
  const openNotis = useNotiStore((state) => state.openNotis);
  const setOpenNotis = useNotiStore((state) => state.setOpenNotis);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isGenerating = usePollingStore((state) => state.isGenerating);

  return (
    <div className="relative z-10">
      <div
        ref={buttonRef}
        className={`${glassmorphic1} rounded-full absolute top-0 right-0 mt-4 mr-6 p-2 cursor-pointer flex items-center justify-center`}
        onClick={() => setOpenNotis(!openNotis)}
        tabIndex={0}
        role="button"
        aria-label="Show notifications"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isGenerating ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, scale: 0.7, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 30 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex" }}
            >
              <Loader2 size={20} className="animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="palette"
              initial={{ opacity: 0, scale: 0.7, rotate: 30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.7, rotate: -30 }}
              transition={{ duration: 0.25 }}
              style={{ display: "flex" }}
            >
              <Palette size={24} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <NotiDrawer
        open={openNotis}
        onClose={() => setOpenNotis(false)}
        anchorRef={buttonRef as React.RefObject<HTMLDivElement>}
      />
    </div>
  );
}
