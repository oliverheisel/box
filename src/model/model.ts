import {
  getOC,
  measureVolume,
  type Shape3D,
  type ShapeMesh,
  type ShapeEdgeMesh,
} from "replicad";
import { createBox } from "./box";
import { createLid } from "./lid";
import { CAD_TOLERANCES, deriveModelDimensions, type ModelParameters } from "./parameters";

export type CadModel = {
  box: Shape3D;
  lid: Shape3D;
};

export type ModelMetrics = {
  boxBounds: [[number, number, number], [number, number, number]];
  lidBounds: [[number, number, number], [number, number, number]];
  innerDimensions: [number, number, number];
  boxVolume: number;
  lidVolume: number;
  boxValid: boolean;
  lidValid: boolean;
};

export type SerializedShape = {
  faces: ShapeMesh;
  edges: ShapeEdgeMesh;
};

export function createModel(parameters: ModelParameters): CadModel {
  return { box: createBox(parameters), lid: createLid(parameters) };
}

function isValidSolid(shape: Shape3D): boolean {
  const OC = getOC();
  const analyzer = new OC.BRepCheck_Analyzer(shape.wrapped, true, false, false);
  try {
    return analyzer.IsValid(shape.wrapped);
  } finally {
    analyzer.delete();
  }
}

export function getModelMetrics(model: CadModel, parameters: ModelParameters): ModelMetrics {
  const derived = deriveModelDimensions(parameters);
  return {
    boxBounds: model.box.boundingBox.bounds,
    lidBounds: model.lid.boundingBox.bounds,
    innerDimensions: [
      derived.innerLength,
      derived.innerWidth,
      derived.lidBaseZ - parameters.bottomThickness,
    ],
    boxVolume: measureVolume(model.box),
    lidVolume: measureVolume(model.lid),
    boxValid: isValidSolid(model.box),
    lidValid: isValidSolid(model.lid),
  };
}

export function serializeShape(shape: Shape3D): SerializedShape {
  return {
    faces: shape.mesh({
      tolerance: CAD_TOLERANCES.meshLinear,
      angularTolerance: CAD_TOLERANCES.meshAngular,
    }),
    edges: shape.meshEdges({
      tolerance: CAD_TOLERANCES.meshLinear,
      angularTolerance: CAD_TOLERANCES.meshAngular,
    }),
  };
}

export function disposeModel(model: CadModel | null): void {
  if (!model) return;
  model.box.delete();
  model.lid.delete();
}
