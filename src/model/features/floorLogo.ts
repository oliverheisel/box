import { drawRectangle, type Shape3D } from "replicad";
import { CAD_TOLERANCES, deriveModelDimensions, type ModelParameters } from "../parameters";

const FAVICON_MARK = {
  sourceWidth: 36,
  sourceHeight: 41,
  maxWidth: 32,
  floorMargin: 4,
} as const;

function rectangleSolid(
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  baseZ: number,
  depth: number,
): Shape3D {
  return drawRectangle(width, height)
    .translate(centerX, centerY)
    .sketchOnPlane("XY", baseZ)
    .extrude(depth)
    .asShape3D();
}

export function engraveFloorLogo(shape: Shape3D, parameters: ModelParameters): Shape3D {
  if (!parameters.floorLogoEnabled) return shape;

  const derived = deriveModelDimensions(parameters);
  const availableWidth = derived.innerLength - 2 * FAVICON_MARK.floorMargin;
  const availableHeight = derived.innerWidth - 2 * FAVICON_MARK.floorMargin;
  const markWidth = Math.min(
    FAVICON_MARK.maxWidth,
    availableWidth,
    availableHeight * FAVICON_MARK.sourceWidth / FAVICON_MARK.sourceHeight,
  );
  const scale = markWidth / FAVICON_MARK.sourceWidth;
  const overlap = CAD_TOLERANCES.booleanOverlap;
  const baseZ = parameters.bottomThickness - parameters.floorLogoDepth;
  const cutDepth = parameters.floorLogoDepth + overlap;

  const leftStem = rectangleSolid(13 * scale, 34 * scale, -11.5 * scale, -3.5 * scale, baseZ, cutDepth);
  const rightStem = rectangleSolid(13 * scale, 34 * scale, 11.5 * scale, -3.5 * scale, baseZ, cutDepth);
  const crossbar = rectangleSolid(
    10 * scale + 2 * overlap,
    9 * scale,
    0,
    -3 * scale,
    baseZ,
    cutDepth,
  );
  const underline = rectangleSolid(36 * scale, 5 * scale, 0, 18 * scale, baseZ, cutDepth);
  const hMark = leftStem.fuse(rightStem).fuse(crossbar).simplify();

  return shape.cut(hMark).cut(underline).simplify();
}
