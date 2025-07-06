import * as THREE from "three";
import gsap from "gsap";

const TRANSITION_DURATION = 0.15;

/**
 * Sets the brightness of a Three.js object by multiplying current colors by a factor.
 * @param object - The Three.js object to modify
 * @param bright - Whether to make the object bright (true) or dim (false)
 */
export const setBrightness = (object: THREE.Object3D, bright: boolean) => {
  const factor = bright ? 1.5 : 0.67; // Brighten by 1.5x or darken to 67%

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
          if (mat.color) {
            gsap.to(mat.color, {
              r: mat.color.r * factor,
              g: mat.color.g * factor,
              b: mat.color.b * factor,
              duration: TRANSITION_DURATION,
              onUpdate: () => {
                mat.needsUpdate = true;
              },
            });
          }

          if (mat.emissive) {
            gsap.to(mat.emissive, {
              r: mat.emissive.r * factor,
              g: mat.emissive.g * factor,
              b: mat.emissive.b * factor,
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
