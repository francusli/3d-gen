/**
 * Returns stable grid positions for artifacts based on their IDs.
 * Maintains consistent positioning when new artifacts are added.
 * @template T - The type of artifact with an 'id' property.
 * @param {T[]} artifacts - The array of artifacts to position.
 * @param {number} columns - Number of columns in the grid.
 * @param {number} spacing - Distance between grid items.
 * @param {Map<string, { position: [number, number, number]; index: number }>} positionMap - Map to store artifact positions.
 * @param {{ current: number }} nextIndexRef - Reference to the next available index.
 * @returns {{ position: [number, number, number]; index: number; artifactId: string }[]} Array of stable positions.
 */
export function getStableGridPositions<T extends { id: string }>(
  artifacts: T[],
  columns: number,
  spacing: number,
  positionMap: Map<
    string,
    { position: [number, number, number]; index: number }
  >,
  nextIndexRef: { current: number }
): Array<{
  position: [number, number, number];
  index: number;
  artifactId: string;
}> {
  const positions: Array<{
    position: [number, number, number];
    index: number;
    artifactId: string;
  }> = [];

  artifacts.forEach((artifact) => {
    let positionData = positionMap.get(artifact.id);

    // If this is a new artifact, assign it a position
    if (!positionData) {
      const index = nextIndexRef.current++;
      const row = Math.floor(index / columns);
      const col = index % columns;
      positionData = {
        position: [col * spacing, 0, row * spacing],
        index: index,
      };
      positionMap.set(artifact.id, positionData);
    }

    positions.push({
      ...positionData,
      artifactId: artifact.id,
    });
  });

  return positions;
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
