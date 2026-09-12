import CadWorker from "./worker?worker";
import type { ExportFormat, ExportPart } from "./export";
import type { GeneratedPayload, WorkerRequest, WorkerResponse } from "./messages";
import type { ModelParameters } from "../model/parameters";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
};

type WorkerRequestPayload =
  | { type: "generate"; parameters: ModelParameters }
  | {
      type: "export";
      parameters: ModelParameters;
      part: ExportPart;
      format: ExportFormat;
    };

export class CadClient {
  private readonly worker = new CadWorker();
  private readonly pending = new Map<number, PendingRequest>();
  private nextId = 1;

  constructor() {
    this.worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      if (response.type === "error") pending.reject(new Error(response.message));
      else pending.resolve(response.payload);
    });
    this.worker.addEventListener("error", (event: ErrorEvent) => {
      const error = new Error(event.message || "The CAD worker stopped unexpectedly.");
      this.pending.forEach(({ reject }) => reject(error));
      this.pending.clear();
    });
  }

  generate(parameters: ModelParameters): Promise<GeneratedPayload> {
    return this.request<GeneratedPayload>({ type: "generate", parameters });
  }

  export(
    parameters: ModelParameters,
    part: ExportPart,
    format: ExportFormat,
  ): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
    return this.request({ type: "export", parameters, part, format });
  }

  private request<T>(request: WorkerRequestPayload): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
      });
      this.worker.postMessage({ ...request, id } as WorkerRequest);
    });
  }
}
