import CadWorker from "./worker?worker";
import type { ExportFormat, ExportPart } from "./export";
import type { GeneratedPayload, WorkerRequest, WorkerResponse } from "./messages";
import type { ModelParameters } from "../model/parameters";

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  onProgress?: (message: string) => void;
  timer?: ReturnType<typeof setTimeout>;
  timeoutMs: number;
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
  private worker: Worker;
  private readonly pending = new Map<number, PendingRequest>();
  private nextId = 1;

  constructor() {
    this.worker = this.createWorker();
  }

  private createWorker(): Worker {
    const worker = new CadWorker();
    worker.addEventListener("message", this.handleMessage);
    worker.addEventListener("error", this.handleWorkerError);
    worker.addEventListener("messageerror", this.handleMessageError);
    return worker;
  }

  private readonly handleMessage = (event: MessageEvent<WorkerResponse>): void => {
    const response = event.data;
    const pending = this.pending.get(response.id);
    if (!pending) return;
    if (response.type === "progress") {
      pending.onProgress?.(response.message);
      this.armTimeout(response.id, pending);
      return;
    }
    if (pending.timer !== undefined) clearTimeout(pending.timer);
    this.pending.delete(response.id);
    if (response.type === "error") pending.reject(new Error(response.message));
    else pending.resolve(response.payload);
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    event.preventDefault();
    this.restartWorker(new Error(event.message || "The CAD worker stopped unexpectedly."));
  };

  private readonly handleMessageError = (): void => {
    this.restartWorker(new Error("The CAD worker returned an unreadable response."));
  };

  private restartWorker(error: Error): void {
    this.worker.terminate();
    this.pending.forEach(({ reject, timer }) => {
      if (timer !== undefined) clearTimeout(timer);
      reject(error);
    });
    this.pending.clear();
    this.worker = this.createWorker();
  }

  private armTimeout(id: number, pending: PendingRequest): void {
    if (pending.timer !== undefined) clearTimeout(pending.timer);
    pending.timer = setTimeout(() => {
      if (!this.pending.has(id)) return;
      const timeoutSeconds = Math.round(pending.timeoutMs / 1000);
      this.restartWorker(new Error(
        `The CAD engine did not respond within ${timeoutSeconds} seconds. Check the connection and try again.`,
      ));
    }, pending.timeoutMs);
  }

  generate(
    parameters: ModelParameters,
    onProgress?: (message: string) => void,
  ): Promise<GeneratedPayload> {
    return this.request<GeneratedPayload>(
      { type: "generate", parameters },
      45_000,
      onProgress,
    );
  }

  export(
    parameters: ModelParameters,
    part: ExportPart,
    format: ExportFormat,
  ): Promise<{ buffer: ArrayBuffer; mimeType: string }> {
    return this.request({ type: "export", parameters, part, format }, 90_000);
  }

  private request<T>(
    request: WorkerRequestPayload,
    timeoutMs: number,
    onProgress?: (message: string) => void,
  ): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      const pending: PendingRequest = {
        resolve: (value) => resolve(value as T),
        reject,
        onProgress,
        timeoutMs,
      };
      this.pending.set(id, pending);
      this.armTimeout(id, pending);
      try {
        this.worker.postMessage({ ...request, id } as WorkerRequest);
      } catch (error) {
        if (pending.timer !== undefined) clearTimeout(pending.timer);
        this.pending.delete(id);
        reject(error instanceof Error ? error : new Error("The CAD request could not be started."));
      }
    });
  }
}
