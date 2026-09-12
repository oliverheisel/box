import { drawRoundedRectangle, type Edge, type Shape3D } from "replicad";

const EDGE_SAMPLE_POSITIONS = [0, 0.5, 1] as const;
const EDGE_MATCH_TOLERANCE = 1e-4;

function roundedRectangleDistance(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): number {
  const qx = Math.abs(x) - (width / 2 - radius);
  const qy = Math.abs(y) - (height / 2 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
    + Math.min(Math.max(qx, qy), 0)
    - radius;
}

function isRoundedRectangleEdge(
  edge: Edge,
  width: number,
  height: number,
  radius: number,
  z: number,
): boolean {
  return EDGE_SAMPLE_POSITIONS.every((position) => {
    const point = edge.pointAt(position);
    const matches = Math.abs(point.z - z) <= EDGE_MATCH_TOLERANCE
      && Math.abs(roundedRectangleDistance(point.x, point.y, width, height, radius))
        <= EDGE_MATCH_TOLERANCE;
    point.delete();
    return matches;
  });
}

export function chamferRoundedRectangleEdge(
  shape: Shape3D,
  width: number,
  height: number,
  radius: number,
  z: number,
  chamfer: number,
): Shape3D {
  return shape.chamfer(
    chamfer,
    (finder) => finder.when(({ element }) => (
      isRoundedRectangleEdge(element, width, height, radius, z)
    )),
  );
}

export function roundedRectangleSolid(
  width: number,
  height: number,
  radius: number,
  depth: number,
  z = 0,
  centerX = 0,
): Shape3D {
  return drawRoundedRectangle(width, height, radius)
    .translate(centerX, 0)
    .sketchOnPlane("XY", z)
    .extrude(depth)
    .asShape3D();
}

export function roundedRectangleRing(
  width: number,
  height: number,
  radius: number,
  thickness: number,
  depth: number,
  z = 0,
): Shape3D {
  const outer = drawRoundedRectangle(width, height, radius);
  const inner = drawRoundedRectangle(
    width - 2 * thickness,
    height - 2 * thickness,
    radius - thickness,
  );

  return outer.cut(inner).sketchOnPlane("XY", z).extrude(depth).asShape3D();
}
