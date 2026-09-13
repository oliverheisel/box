import type { ExportFormat, ExportPart } from "./export";
import type { ModelMetrics, SerializedShape } from "../model/model";
import type { ModelParameters } from "../model/parameters";

export type WorkerRequest =
  | { id: number; type: "generate"; parameters: ModelParameters }
  | {
      id: number;
      type: "export";
      parameters: ModelParameters;
      part: ExportPart;
      format: ExportFormat;
    };

export type GeneratedPayload = {
  box: SerializedShape;
  lid: SerializedShape;
  metrics: ModelMetrics;
};

export type WorkerResponse =
  | { id: number; type: "progress"; message: string }
  | { id: number; type: "generated"; payload: GeneratedPayload }
  | {
      id: number;
      type: "exported";
      payload: { buffer: ArrayBuffer; mimeType: string };
    }
  | { id: number; type: "error"; message: string };
