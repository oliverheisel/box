import type { Shape3D } from "replicad";
import { CAD_TOLERANCES, deriveModelDimensions, type ModelParameters } from "./parameters";
import {
  chamferRoundedRectangleEdge,
  roundedRectangleSolid,
} from "./features/roundedCorners";
import { createLidRail } from "./features/lidInterface";
import { addBoxScrewBoss } from "./features/screwHoles";
import { engraveFloorLogo } from "./features/floorLogo";

export function createBox(parameters: ModelParameters): Shape3D {
  const derived = deriveModelDimensions(parameters);
  const shellOuter = chamferRoundedRectangleEdge(
    roundedRectangleSolid(
      parameters.boxLength,
      parameters.boxWidth,
      parameters.cornerRadius,
      derived.lidBaseZ,
    ),
    parameters.boxLength,
    parameters.boxWidth,
    parameters.cornerRadius,
    0,
    parameters.boxEdgeChamfer,
  );
  const cavity = roundedRectangleSolid(
    derived.innerLength,
    derived.innerWidth,
    derived.innerCornerRadius,
    derived.lidBaseZ - parameters.bottomThickness + CAD_TOLERANCES.booleanOverlap,
    parameters.bottomThickness,
  );
  const shell = chamferRoundedRectangleEdge(
    shellOuter.cut(cavity),
    derived.innerLength,
    derived.innerWidth,
    derived.innerCornerRadius,
    derived.lidBaseZ,
    parameters.boxEdgeChamfer,
  );
  const withBoss = addBoxScrewBoss(shell, parameters);
  const lidRail = createLidRail(parameters);
  const assembled = withBoss.fuse(lidRail).simplify();

  const finishedBox = chamferRoundedRectangleEdge(
    assembled,
    parameters.boxLength,
    parameters.boxWidth,
    parameters.cornerRadius,
    parameters.boxHeight,
    parameters.boxEdgeChamfer,
  ).simplify();

  return engraveFloorLogo(finishedBox, parameters);
}
