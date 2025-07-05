import * as THREE from "three";
import gsap from "gsap";

const TRANSITION_DURATION = 0.15;

/**
 * Sets the brightness of a Three.js object by modifying its materials with a smooth GSAP transition.
 * @param object - The Three.js object to modify
 * @param bright - Whether to make the object bright (true) or dim (false)
 */
export const setBrightness = (object: THREE.Object3D, bright: boolean) => {
  // Helper to convert hex to normalized {r,g,b}
  const hexToRgb = (hex: number) => {
    const color = new THREE.Color(hex);
    return { r: color.r, g: color.g, b: color.b };
  };

  const targetEmissive = bright ? hexToRgb(0x111111) : hexToRgb(0x000000);
  const targetColor = bright ? hexToRgb(0xcccccc) : hexToRgb(0x888888);

  object.traverse((child) => {
    if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material) {
      const mesh = child as THREE.Mesh;
      const material = mesh.material;
      const materials = Array.isArray(material) ? material : [material];

      materials.forEach((mat) => {
        const isMaterial =
          mat instanceof THREE.MeshStandardMaterial ||
          mat instanceof THREE.MeshPhysicalMaterial ||
          mat instanceof THREE.MeshLambertMaterial ||
          mat instanceof THREE.MeshPhongMaterial;

        if (isMaterial) {
          if (
            Object.prototype.hasOwnProperty.call(mat, "emissive") &&
            mat.emissive
          ) {
            gsap.to(mat.emissive, {
              ...targetEmissive,
              duration: TRANSITION_DURATION,
              onUpdate: () => {
                mat.needsUpdate = true;
              },
            });
          }

          if (mat.color) {
            gsap.to(mat.color, {
              ...targetColor,
              duration: TRANSITION_DURATION,
              onUpdate: () => {
                mat.needsUpdate = true;
              },
            });
          }
        }
      });
    }
  });
};

/**
 * Creates a proxied URL to avoid CORS issues when loading 3D models.
 * @param originalUrl - The original URL of the 3D model
 * @returns A proxied URL that can be used to load the 3D model
 */
export function createProxiedUrl(originalUrl: string): string {
  return `/api/generate-3d?modelUrl=${encodeURIComponent(originalUrl)}`;
}
