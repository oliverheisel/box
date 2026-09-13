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

function reportProgress(id: number, message: string): void {
  const response: WorkerResponse = { id, type: "progress", message };
  self.postMessage(response);
}

async function ensureModel(request: WorkerRequest): Promise<CadModel> {
  reportProgress(request.id, "Loading CAD engine");
  await initializeReplicad();
  const nextKey = parameterKey(request.parameters);
  if (!currentModel || currentKey !== nextKey) {
    const previousModel = currentModel;
    currentModel = null;
    currentKey = "";
    disposeModel(previousModel);
    currentModel = createModel(
      request.parameters,
      (message) => reportProgress(request.id, message),
    );
    currentKey = nextKey;
  }
  return currentModel;
}

async function handleRequest(request: WorkerRequest): Promise<void> {
  try {
    const model = await ensureModel(request);
    if (request.type === "generate") {
      reportProgress(request.id, "Preparing 3D preview");
      const payload = {
        box: serializeShape(model.box),
        lid: serializeShape(model.lid),
        metrics: getModelMetrics(model, request.parameters),
      };
      const response: WorkerResponse = { id: request.id, type: "generated", payload };
      self.postMessage(response);
      return;
    }

    reportProgress(request.id, `Exporting ${request.format.toUpperCase()}`);
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
}

let requestQueue = Promise.resolve();

self.addEventListener("message", (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  requestQueue = requestQueue.then(() => handleRequest(request));
});

export {};
