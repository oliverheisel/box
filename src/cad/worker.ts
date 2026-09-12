/// <reference lib="webworker" />

import { exportModel } from "./export";
import { initializeReplicad } from "./replicad";
import type { WorkerRequest, WorkerResponse } from "./messages";
import {
  createModel,
  disposeModel,
  getModelMetrics,
  serializeShape,
  type CadModel,
} from "../model/model";
import { parameterKey } from "../model/parameters";

let currentModel: CadModel | null = null;
let currentKey = "";

async function ensureModel(parameters: WorkerRequest["parameters"]): Promise<CadModel> {
  await initializeReplicad();
  const nextKey = parameterKey(parameters);
  if (!currentModel || currentKey !== nextKey) {
    disposeModel(currentModel);
    currentModel = createModel(parameters);
    currentKey = nextKey;
  }
  return currentModel;
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  try {
    const model = await ensureModel(request.parameters);
    if (request.type === "generate") {
      const payload = {
        box: serializeShape(model.box),
        lid: serializeShape(model.lid),
        metrics: getModelMetrics(model, request.parameters),
      };
      const response: WorkerResponse = { id: request.id, type: "generated", payload };
      self.postMessage(response);
      return;
    }

    const blob = exportModel(model, request.part, request.format);
    const buffer = await blob.arrayBuffer();
    const response: WorkerResponse = {
      id: request.id,
      type: "exported",
      payload: { buffer, mimeType: blob.type },
    };
    self.postMessage(response, { transfer: [buffer] });
  } catch (error) {
    const response: WorkerResponse = {
      id: request.id,
      type: "error",
      message: error instanceof Error ? error.message : "Unknown CAD error",
    };
    self.postMessage(response);
  }
});

export {};
