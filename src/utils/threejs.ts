import * as THREE from "three";

/**
 * Sets the brightness of a Three.js object by modifying its materials.
 * @param object - The Three.js object to modify
 * @param bright - Whether to make the object bright (true) or dim (false)
 */
export const setBrightness = (object: THREE.Object3D, bright: boolean) => {
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
          if (Object.prototype.hasOwnProperty.call(mat, "emissive"))
            mat.emissive.set(bright ? 0x111111 : 0x000000);

          if (mat.color) mat.color.set(bright ? 0xcccccc : 0x888888);

          mat.needsUpdate = true;
        }
      });
    }
  });
};
