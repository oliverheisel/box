import { exportSTEP, type Shape3D } from "replicad";
import type { CadModel } from "../model/model";
import { CAD_TOLERANCES } from "../model/parameters";

export type ExportPart = "box" | "lid" | "set";
export type ExportFormat = "step" | "stl";

export function exportModel(
  model: CadModel,
  part: ExportPart,
  format: ExportFormat,
): Blob {
  if (format === "step" && part === "set") {
    return exportSTEP(
      [
        { shape: model.box, name: "BOX", color: "#30302e" },
        { shape: model.lid, name: "LID", color: "#247ba0" },
      ],
      { unit: "MM", modelUnit: "MM" },
    );
  }

  const shape: Shape3D = part === "lid" ? model.lid : model.box;
  return format === "step"
    ? shape.blobSTEP()
    : shape.blobSTL({
        binary: true,
        tolerance: CAD_TOLERANCES.stlLinear,
        angularTolerance: CAD_TOLERANCES.stlAngular,
      });
}
