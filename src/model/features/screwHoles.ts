import { draw, makeCylinder, Plane, sketchCircle, type Shape3D } from "replicad";
import { CAD_TOLERANCES, deriveModelDimensions, type ModelParameters } from "../parameters";

export function addBoxScrewBoss(shape: Shape3D, parameters: ModelParameters): Shape3D {
  const derived = deriveModelDimensions(parameters);
  const wallX = -parameters.boxLength / 2 + parameters.wallThickness;
  const narrowX = derived.screwCenterX + parameters.screwBossNarrowHalfWidth;
  const bossBlank = draw([wallX, -parameters.screwBossWallHalfWidth])
    .lineTo([wallX, parameters.screwBossWallHalfWidth])
    .lineTo([narrowX, parameters.screwBossNarrowHalfWidth])
    .lineTo([narrowX, -parameters.screwBossNarrowHalfWidth])
    .close()
    .sketchOnPlane("XY", derived.screwBossWallBottomZ)
    .extrude(derived.lidBaseZ - derived.screwBossWallBottomZ)
    .asShape3D();
  const slopeRise = derived.screwBossBottomZ - derived.screwBossWallBottomZ;
  const slopeRun = narrowX - wallX;
  const supportPlane = new Plane(
    [wallX, 0, derived.screwBossWallBottomZ],
    [0, 1, 0],
    [-slopeRise, 0, slopeRun],
  );
  const boss = bossBlank.cutPlane(supportPlane, 0, "positive");
  supportPlane.delete();
  if (!boss) throw new Error("The sloped screw-boss support could not be generated.");
  const withBoss = shape.fuse(boss);
  const threadHole = makeCylinder(
    parameters.holeThread / 2,
    parameters.threadDepth + CAD_TOLERANCES.booleanOverlap,
    [derived.screwCenterX, 0, derived.screwBossBottomZ],
  );

  return withBoss.cut(threadHole);
}

export function addLidScrewHole(shape: Shape3D, parameters: ModelParameters): Shape3D {
  const derived = deriveModelDimensions(parameters);
  const margin = CAD_TOLERANCES.booleanOverlap;
  const throughHole = makeCylinder(
    derived.lidHoleRadius,
    derived.lidHeight + 2 * margin,
    [derived.screwCenterX, 0, derived.lidBaseZ - margin],
  );
  const countersink = sketchCircle(derived.lidHoleRadius, {
    plane: "XY",
    origin: [
      derived.screwCenterX,
      0,
      parameters.boxHeight - parameters.lidCounterboreDepth,
    ],
  })
    .loftWith(
      sketchCircle(derived.lidCounterboreRadius + margin, {
        plane: "XY",
        origin: [derived.screwCenterX, 0, parameters.boxHeight + margin],
      }),
      { ruled: true },
    );

  return shape.cut(throughHole).cut(countersink);
}
