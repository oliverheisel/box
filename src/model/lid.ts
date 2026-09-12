import {
  drawRectangle,
  drawRoundedRectangle,
  sketchRoundedRectangle,
  type Shape3D,
} from "replicad";
import { CAD_TOLERANCES, deriveModelDimensions, type ModelParameters } from "./parameters";
import { roundedRectangleSolid } from "./features/roundedCorners";
import { addLidScrewHole } from "./features/screwHoles";

export function createLid(parameters: ModelParameters): Shape3D {
  const derived = deriveModelDimensions(parameters);
  const transitionHeight = parameters.lidWallHeight - parameters.lidTongueStraightHeight;
  const slidingTongue = roundedRectangleSolid(
    derived.lidTongueLength,
    derived.lidWidth,
    derived.lidTongueRadius,
    parameters.lidTongueStraightHeight,
    derived.lidBaseZ,
    derived.lidCenterX,
  );
  const slopedShoulder = sketchRoundedRectangle(
    derived.lidTongueLength,
    derived.lidWidth,
    derived.lidTongueRadius,
    {
      plane: "XY",
      origin: [
        derived.lidCenterX,
        0,
        derived.lidBaseZ + parameters.lidTongueStraightHeight,
      ],
    },
  )
    .loftWith(
      sketchRoundedRectangle(
        derived.lidTopLength,
        derived.lidTopWidth,
        derived.lidTopRadius,
        {
          plane: "XY",
          origin: [
            derived.lidTopCenterX,
            0,
            derived.lidBaseZ
              + parameters.lidTongueStraightHeight
              + transitionHeight,
          ],
        },
      ),
      { ruled: true },
    );
  const topPanel = roundedRectangleSolid(
    derived.lidTopLength,
    derived.lidTopWidth,
    derived.lidTopRadius,
    parameters.lidWallTopHeight,
    derived.lidBaseZ + parameters.lidWallHeight,
    derived.lidTopCenterX,
  );
  const tabClip = drawRectangle(
    derived.lidEndTabLength + 2 * CAD_TOLERANCES.booleanOverlap,
    parameters.boxWidth + 2 * CAD_TOLERANCES.booleanOverlap,
  ).translate(derived.lidEndTabCenterX - CAD_TOLERANCES.booleanOverlap, 0);
  const endTabBlank = drawRoundedRectangle(
    parameters.boxLength,
    parameters.boxWidth,
    parameters.cornerRadius,
  )
    .intersect(tabClip)
    .sketchOnPlane("XY", derived.lidBaseZ)
    .extrude(derived.lidHeight)
    .asShape3D();
  const endTab = endTabBlank.chamfer(
    parameters.lidOuterChamfer,
    (finder) => finder.inPlane("XY", parameters.boxHeight),
  );
  const lidBlank = slidingTongue
    .fuse(slopedShoulder)
    .fuse(topPanel)
    .fuse(endTab)
    .simplify();

  return addLidScrewHole(lidBlank, parameters).simplify();
}
