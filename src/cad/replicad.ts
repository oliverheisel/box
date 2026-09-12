import initOpenCascade, { type OpenCascadeInstance } from "replicad-opencascadejs";
import openCascadeWasmUrl from "replicad-opencascadejs/wasm?url";
import { setOC } from "replicad";

let openCascadePromise: Promise<OpenCascadeInstance> | null = null;

export function initializeReplicad(): Promise<OpenCascadeInstance> {
  if (!openCascadePromise) {
    openCascadePromise = initOpenCascade({
      locateFile: () => openCascadeWasmUrl,
      print: () => undefined,
      printErr: (message: string) => console.error(message),
    }).then((OC) => {
      setOC(OC);
      return OC;
    });
  }

  return openCascadePromise;
}
