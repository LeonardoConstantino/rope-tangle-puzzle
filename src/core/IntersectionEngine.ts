import { Hole, IntersectionPoint, Point, Rope, HintAction } from '../types';

/**
 * Checks if two 2D line segments AB and CD intersect, and returns intersection point if true.
 */
export function getLineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  // If segments share a common vertex, they do not cross
  const EPSILON = 1e-4;
  const isSame = (a: Point, b: Point) =>
    Math.hypot(a.x - b.x, a.y - b.y) < 1.0;

  if (isSame(p1, p3) || isSame(p1, p4) || isSame(p2, p3) || isSame(p2, p4)) {
    return null;
  }

  // Quick bounding box rejection test
  if (
    Math.max(p1.x, p2.x) < Math.min(p3.x, p4.x) - EPSILON ||
    Math.min(p1.x, p2.x) > Math.max(p3.x, p4.x) + EPSILON ||
    Math.max(p1.y, p2.y) < Math.min(p3.y, p4.y) - EPSILON ||
    Math.min(p1.y, p2.y) > Math.max(p3.y, p4.y) + EPSILON
  ) {
    return null;
  }

  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) {
    return null; // Parallel or collinear
  }

  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;

  // Strict interior intersection with small boundary tolerance
  const MARGIN = 0.02;
  if (u > MARGIN && u < 1 - MARGIN && v > MARGIN && v < 1 - MARGIN) {
    return {
      x: p1.x + u * (p2.x - p1.x),
      y: p1.y + u * (p2.y - p1.y),
    };
  }

  return null;
}

/**
 * Computes all intersections among active ropes based on their hole positions.
 */
export function computeIntersections(
  ropes: Rope[],
  holes: Hole[],
  prevIntersections: IntersectionPoint[] = []
): {
  intersections: IntersectionPoint[];
  ropeIntersectionCounts: Map<string, number>;
  freeRopeIds: string[];
} {
  const holesMap = new Map<number, Hole>();
  holes.forEach((h) => holesMap.set(h.id, h));

  const activeRopes = ropes.filter((r) => !r.isUntangled);
  const intersections: IntersectionPoint[] = [];
  const counts = new Map<string, number>();

  activeRopes.forEach((r) => counts.set(r.id, 0));

  for (let i = 0; i < activeRopes.length; i++) {
    const ropeA = activeRopes[i];
    const hA1 = holesMap.get(ropeA.startHoleId);
    const hA2 = holesMap.get(ropeA.endHoleId);
    if (!hA1 || !hA2) continue;

    const pA1 = { x: hA1.x, y: hA1.y };
    const pA2 = { x: hA2.x, y: hA2.y };

    for (let j = i + 1; j < activeRopes.length; j++) {
      const ropeB = activeRopes[j];
      const hB1 = holesMap.get(ropeB.startHoleId);
      const hB2 = holesMap.get(ropeB.endHoleId);
      if (!hB1 || !hB2) continue;

      const pB1 = { x: hB1.x, y: hB1.y };
      const pB2 = { x: hB2.x, y: hB2.y };

      const interPt = getLineIntersection(pA1, pA2, pB1, pB2);
      if (interPt) {
        const id = `${ropeA.id}_${ropeB.id}`;
        const prev = prevIntersections.find((p) => p.id === id);

        intersections.push({
          id,
          ropeAId: ropeA.id,
          ropeBId: ropeB.id,
          x: interPt.x,
          y: interPt.y,
          segA: 0,
          segB: 0,
          pulsePhase: prev ? prev.pulsePhase : 0,
          age: prev ? prev.age + 1 : 0,
        });

        counts.set(ropeA.id, (counts.get(ropeA.id) || 0) + 1);
        counts.set(ropeB.id, (counts.get(ropeB.id) || 0) + 1);
      }
    }
  }

  const freeRopeIds = activeRopes
    .filter((r) => (counts.get(r.id) || 0) === 0)
    .map((r) => r.id);

  return {
    intersections,
    ropeIntersectionCounts: counts,
    freeRopeIds,
  };
}

/**
 * Calculates a smart hint: finds a move for any rope endpoint to an empty hole
 * that maximizes intersection reduction or directly untangles a rope.
 */
export function calculateBestHint(
  ropes: Rope[],
  holes: Hole[]
): HintAction | null {
  const activeRopes = ropes.filter((r) => !r.isUntangled);
  if (activeRopes.length === 0) return null;

  const currentStatus = computeIntersections(ropes, holes);
  const currentTotalCrossings = currentStatus.intersections.length;

  const emptyHoles = holes.filter((h) => !h.isOccupied);
  if (emptyHoles.length === 0) return null;

  let bestMove: HintAction | null = null;
  let maxImprovement = -999;

  for (const rope of activeRopes) {
    const startHole = holes.find((h) => h.id === rope.startHoleId);
    const endHole = holes.find((h) => h.id === rope.endHoleId);
    if (!startHole || !endHole) continue;

    // Test moving start endpoint to each empty hole
    for (const emptyHole of emptyHoles) {
      if (emptyHole.id === rope.endHoleId) continue; // Can't connect hole to itself

      // Simulate board
      const simRopes = activeRopes.map((r) =>
        r.id === rope.id ? { ...r, startHoleId: emptyHole.id } : r
      );
      const simHoles = holes.map((h) => {
        if (h.id === rope.startHoleId) return { ...h, isOccupied: false };
        if (h.id === emptyHole.id) return { ...h, isOccupied: true };
        return h;
      });

      const simResult = computeIntersections(simRopes, simHoles);
      const reduction = currentTotalCrossings - simResult.intersections.length;
      const freedRopesBonus = simResult.freeRopeIds.length * 10;
      const score = reduction + freedRopesBonus;

      if (score > maxImprovement && (reduction > 0 || simResult.freeRopeIds.length > currentStatus.freeRopeIds.length)) {
        maxImprovement = score;
        bestMove = {
          ropeId: rope.id,
          endToMove: 'start',
          fromHoleId: rope.startHoleId,
          toHoleId: emptyHole.id,
          crossingsReduced: reduction,
        };
      }
    }

    // Test moving end endpoint to each empty hole
    for (const emptyHole of emptyHoles) {
      if (emptyHole.id === rope.startHoleId) continue;

      const simRopes = activeRopes.map((r) =>
        r.id === rope.id ? { ...r, endHoleId: emptyHole.id } : r
      );
      const simHoles = holes.map((h) => {
        if (h.id === rope.endHoleId) return { ...h, isOccupied: false };
        if (h.id === emptyHole.id) return { ...h, isOccupied: true };
        return h;
      });

      const simResult = computeIntersections(simRopes, simHoles);
      const reduction = currentTotalCrossings - simResult.intersections.length;
      const freedRopesBonus = simResult.freeRopeIds.length * 10;
      const score = reduction + freedRopesBonus;

      if (score > maxImprovement && (reduction > 0 || simResult.freeRopeIds.length > currentStatus.freeRopeIds.length)) {
        maxImprovement = score;
        bestMove = {
          ropeId: rope.id,
          endToMove: 'end',
          fromHoleId: rope.endHoleId,
          toHoleId: emptyHole.id,
          crossingsReduced: reduction,
        };
      }
    }
  }

  // Fallback: if no single move directly reduces crossings, pick a move that changes the configuration towards solving
  if (!bestMove && emptyHoles.length > 0 && activeRopes.length > 0) {
    const rope = activeRopes[0];
    const emptyHole = emptyHoles[0];
    bestMove = {
      ropeId: rope.id,
      endToMove: 'start',
      fromHoleId: rope.startHoleId,
      toHoleId: emptyHole.id,
      crossingsReduced: 0,
    };
  }

  return bestMove;
}
