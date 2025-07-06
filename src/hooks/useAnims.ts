// This file contains reusable animation hooks for Framer Motion and other animation utilities.
import { useEffect } from "react";
import { useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * Returns a rounded, animated value that smoothly transitions to the target value.
 * @param value The target value to animate to.
 * @param springConfig Optional spring configuration for the animation.
 * @returns A Framer Motion MotionValue<number> that is always rounded.
 */
export function useAnimatedRoundedValue(
  value: number,
  springConfig = { stiffness: 100, damping: 20 }
) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, springConfig);
  const rounded = useTransform(spring, (latest) => Math.round(latest));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  return rounded;
}
