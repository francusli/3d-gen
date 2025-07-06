/**
 * Creates a proxied URL to avoid CORS issues when loading 3D models.
 * @param originalUrl - The original URL of the 3D model
 * @returns A proxied URL that can be used to load the 3D model
 */
export function createProxiedUrl(originalUrl: string): string {
  return `/api/generate-3d?modelUrl=${encodeURIComponent(originalUrl)}`;
}
