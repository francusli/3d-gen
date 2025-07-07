"use client";

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { usePollingStore } from "@/stores/pollingStore";
import { AnimatePresence, motion } from "framer-motion";

const CONFETTI_DURATION = 2500;
const CONFETTI_FALL_DURATION = 1500;
const confettiConfig = {
  width: typeof window !== "undefined" ? window.innerWidth : 300,
  height: typeof window !== "undefined" ? window.innerHeight : 300,
  numberOfPieces: 200,
  recycle: false,
  gravity: 1.2,
  initialVelocityY: -8,
  initialVelocityX: 0,
  wind: 0.1,
};

export default function SuccessMessage() {
  const successMessage = usePollingStore((state) => state.successMessage);
  const setSuccessMessage = usePollingStore((state) => state.setSuccessMessage);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (successMessage) {
      setShowConfetti(true);
      setConfettiActive(true);
      setShowSuccessMessage(true);

      const stopConfettiTimer = setTimeout(() => {
        setConfettiActive(false);
        setShowSuccessMessage(false);

        setTimeout(() => {
          setShowConfetti(false);
          setSuccessMessage(null);
        }, CONFETTI_FALL_DURATION);
      }, CONFETTI_DURATION);
      return () => clearTimeout(stopConfettiTimer);
    }
  }, [successMessage, setSuccessMessage]);

  return (
    <>
      {showConfetti && (
        <Confetti
          {...confettiConfig}
          numberOfPieces={confettiActive ? confettiConfig.numberOfPieces : 0}
          run={showConfetti}
        />
      )}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            className="z-10 absolute top-16 left-1/2 transform -translate-x-1/2 pointer-events-none bg-white p-3 px-4 rounded-lg flex items-center gap-3"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <p className="text-2xl font-medium text-gray-800">
              Your 3D model has been created!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
