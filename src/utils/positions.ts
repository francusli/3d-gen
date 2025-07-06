/**
 * Returns an array of grid positions for artifacts, randomized within concentric rings from the grid center.
 * @template T - The type of artifact.
 * @param {T[]} artifacts - The array of artifacts to position.
 * @param {number} columns - Number of columns in the grid.
 * @param {number} spacing - Distance between grid items.
 * @returns {{ position: [number, number, number]; index: number }[]} Array of positions and their original indices.
 */
export function getRandomizedGridPositions<T = unknown>(
  artifacts: T[],
  columns: number,
  spacing: number
) {
  if (artifacts.length === 0) return [];

  // Generate all possible grid positions
  const positions: Array<{
    position: [number, number, number];
    index: number;
  }> = [];
  artifacts.forEach((_, i) => {
    const row = Math.floor(i / columns);
    const col = i % columns;
    positions.push({
      position: [col * spacing, 0, row * spacing],
      index: i,
    });
  });

  // Calculate grid center
  const totalRows = Math.ceil(artifacts.length / columns);
  const centerX = ((columns - 1) * spacing) / 2;
  const centerZ = ((totalRows - 1) * spacing) / 2;

  // Sort positions by distance from center
  const sortedPositions = [...positions].sort((a, b) => {
    const distA = Math.sqrt(
      Math.pow(a.position[0] - centerX, 2) +
        Math.pow(a.position[2] - centerZ, 2)
    );
    const distB = Math.sqrt(
      Math.pow(b.position[0] - centerX, 2) +
        Math.pow(b.position[2] - centerZ, 2)
    );
    return distA - distB;
  });

  // Create groups by distance (rings around center)
  const rings: Array<Array<(typeof positions)[0]>> = [];
  let currentRing: Array<(typeof positions)[0]> = [];
  let lastDistance = -1;

  sortedPositions.forEach((pos) => {
    const dist = Math.sqrt(
      Math.pow(pos.position[0] - centerX, 2) +
        Math.pow(pos.position[2] - centerZ, 2)
    );

    // If distance changed significantly, start new ring
    if (lastDistance !== -1 && Math.abs(dist - lastDistance) > spacing * 0.5) {
      if (currentRing.length > 0) {
        rings.push(currentRing);
        currentRing = [];
      }
    }

    currentRing.push(pos);
    lastDistance = dist;
  });

  if (currentRing.length > 0) {
    rings.push(currentRing);
  }

  // Randomize within each ring
  const randomizedPositions: Array<(typeof positions)[0]> = [];
  rings.forEach((ring) => {
    const shuffledRing = [...ring].sort(() => Math.random() - 0.5);
    randomizedPositions.push(...shuffledRing);
  });

  return randomizedPositions;
}

/**
 * Calculates the center position of a grid layout.
 * @param {number} artifactCount - Total number of artifacts.
 * @param {number} columns - Number of columns in the grid.
 * @param {number} spacing - Distance between grid items.
 * @returns {[number, number, number]} The [x, y, z] coordinates of the grid center.
 */
export function getGridCenter(
  artifactCount: number,
  columns: number,
  spacing: number
): [number, number, number] {
  if (artifactCount === 0) return [0, 0, 0];
  const totalRows = Math.ceil(artifactCount / columns);
  const centerX = ((columns - 1) * spacing) / 2;
  const centerZ = ((totalRows - 1) * spacing) / 2;
  return [centerX, 0, centerZ];
}
