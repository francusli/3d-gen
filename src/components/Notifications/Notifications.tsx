import { useRef, useState } from "react";
import { Loader2, Palette } from "lucide-react";
import { glassmorphic1 } from "@/components/shared/sharedStyles";
import { NotiDrawer } from "./NotiDrawer";
import { usePollingStore } from "@/stores/pollingStore";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isGenerating = usePollingStore((state) => state.isGenerating);

  return (
    <div className="relative z-10">
      <div
        ref={buttonRef}
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

      <NotiDrawer
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={buttonRef as React.RefObject<HTMLDivElement>}
      />
    </div>
  );
}
