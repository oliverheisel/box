import {
  drawRectangle,
  drawRoundedRectangle,
  sketchRoundedRectangle,
  type Shape3D,
} from "replicad";
import { CAD_TOLERANCES, deriveModelDimensions, type ModelParameters } from "../parameters";

export function createLidRail(parameters: ModelParameters): Shape3D {
  const derived = deriveModelDimensions(parameters);
  const margin = CAD_TOLERANCES.booleanOverlap;
  const transitionHeight = parameters.lidWallHeight - parameters.lidTongueStraightHeight;
  const openLeft = drawRectangle(
    parameters.lidCutout + 2 * margin,
    parameters.boxWidth + 2 * margin,
  )
    .translate(-parameters.boxLength / 2 + parameters.lidCutout / 2 - margin, 0)
    .sketchOnPlane("XY", derived.lidBaseZ - margin)
    .extrude(derived.lidHeight + 2 * margin)
    .asShape3D();

  const lowerGuide = drawRoundedRectangle(
    parameters.boxLength,
    parameters.boxWidth,
    parameters.cornerRadius,
  )
    .cut(drawRoundedRectangle(
      derived.railInnerLength,
      derived.railInnerWidth,
      derived.railInnerRadius,
    ))
    .sketchOnPlane("XY", derived.lidBaseZ - margin)
    .extrude(parameters.lidTongueStraightHeight + margin)
    .asShape3D();

  const transitionOuter = drawRoundedRectangle(
    parameters.boxLength,
    parameters.boxWidth,
    parameters.cornerRadius,
  )
    .sketchOnPlane("XY", derived.lidBaseZ + parameters.lidTongueStraightHeight)
    .extrude(transitionHeight)
    .asShape3D();
  const transitionOpening = sketchRoundedRectangle(
    derived.railInnerLength,
    derived.railInnerWidth,
    derived.railInnerRadius,
    {
      plane: "XY",
      origin: [0, 0, derived.lidBaseZ + parameters.lidTongueStraightHeight],
    },
  )
    .loftWith(
      sketchRoundedRectangle(
        derived.retentionInnerLength,
        derived.retentionInnerWidth,
        derived.retentionInnerRadius,
        {
          plane: "XY",
          origin: [0, 0, derived.lidBaseZ + parameters.lidWallHeight],
        },
      ),
      { ruled: true },
    );
  const slopedRetention = transitionOuter.cut(transitionOpening);

  const upperRetentionLip = drawRoundedRectangle(
    parameters.boxLength,
    parameters.boxWidth,
    parameters.cornerRadius,
  )
    .cut(drawRoundedRectangle(
      derived.retentionInnerLength,
      derived.retentionInnerWidth,
      derived.retentionInnerRadius,
    ))
    .sketchOnPlane("XY", derived.lidBaseZ + parameters.lidWallHeight)
    .extrude(parameters.lidWallTopHeight)
    .asShape3D();

  return lowerGuide
    .fuse(slopedRetention)
    .fuse(upperRetentionLip)
    .cut(openLeft)
    .simplify();
}
