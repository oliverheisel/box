import {
  AlertCircle,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  RotateCcw,
  Sun,
  createIcons,
} from "lucide";
import "./styles.css";
import { CadClient } from "./cad/client";
import type { ExportFormat, ExportPart } from "./cad/export";
import {
  DEFAULT_MODEL_PARAMETERS,
  INNER_SPACE_LIMITS,
  MODEL_LIMITS,
  MODEL_INFO,
  downloadDimensionToken,
  getInnerSpaceDimensions,
  withInnerSpaceDimension,
  type InnerSpaceKey,
  type ModelParameters,
} from "./model/parameters";
import { hasValidationErrors, validateModelParameters } from "./model/validation";
import { DEFAULT_LID_CLOSED_FRACTION, ModelViewer } from "./viewer/viewer";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("App container is missing.");
const defaultInnerSpace = getInnerSpaceDimensions(DEFAULT_MODEL_PARAMETERS);
const defaultLidClosedPercent = DEFAULT_LID_CLOSED_FRACTION * 100;
type DimensionMode = "inner" | "outer";
let dimensionMode: DimensionMode = "inner";

app.innerHTML = `
  <div class="app-shell">
    <header class="mobile-brand" aria-label="Parametric Box Generator">
      <div>
        <p class="eyebrow">CAD Tool</p>
        <h1>Box Generator</h1>
      </div>
      <div class="brand-logos" aria-hidden="true">
        <img class="brand-logo brand-logo-light" src="./assets/oliver-heisel-wordmark-on-light.png" alt="" />
        <img class="brand-logo brand-logo-dark" src="./assets/oliver-heisel-wordmark-yellow.png" alt="" />
      </div>
    </header>

    <aside class="sidebar" aria-label="Generator settings">
      <header class="brand-block">
        <div class="brand-logos">
          <img class="brand-logo brand-logo-light" src="./assets/oliver-heisel-wordmark-on-light.png" alt="Heisel Oliver" />
          <img class="brand-logo brand-logo-dark" src="./assets/oliver-heisel-wordmark-yellow.png" alt="Heisel Oliver" />
        </div>
        <div>
          <p class="eyebrow">CAD Tool</p>
          <h1 id="config-title">Box Generator</h1>
        </div>
      </header>

      <details class="settings-details" open>
        <summary>
          <span class="settings-summary-copy">
            <strong>Settings</strong>
            <small>Dimensions, export and appearance</small>
          </span>
          <i data-lucide="chevron-down" aria-hidden="true"></i>
        </summary>
        <div class="settings-content">
          <form id="parameter-form" novalidate>
        <div class="section-heading">
          <div>
            <h2>Dimensions</h2>
            <p id="dimension-description">Required usable interior space.</p>
          </div>
          <button class="icon-button" id="reset-parameters" type="button" aria-label="Restore default dimensions" title="Restore default dimensions">
            <i data-lucide="rotate-ccw" aria-hidden="true"></i>
          </button>
        </div>
        <label class="dimension-mode-row" for="dimension-mode-toggle">
          <span class="group-label">Dimension input</span>
          <span class="dimension-mode-control">
            <span>Inner</span>
            <span class="switch">
              <input id="dimension-mode-toggle" type="checkbox" role="switch" aria-label="Use outer dimensions" />
              <span class="switch-track" aria-hidden="true"></span>
            </span>
            <span>Outer</span>
          </span>
        </label>
        <div class="field-list">
          ${dimensionSlider("innerLength", "Length")}
          ${dimensionSlider("innerWidth", "Width")}
          ${dimensionSlider("innerHeight", "Height")}
        </div>
        <div class="derived-dimensions" aria-live="polite">
          <span id="derived-dimensions-label">Resulting outer dimensions</span>
          <strong id="derived-dimensions">200 × 100 × 80 mm</strong>
        </div>
        <label class="option-row" for="floor-logo-enabled">
          <span class="option-copy">
            <strong>Heisel Logo</strong>
            <small>0.20 mm deep on the inner floor.</small>
          </span>
          <input id="floor-logo-enabled" type="checkbox" ${DEFAULT_MODEL_PARAMETERS.floorLogoEnabled ? "checked" : ""} />
        </label>
        <p class="form-error" id="model-error" role="alert"></p>
          </form>

          <section class="export-section" aria-labelledby="export-title">
        <div class="section-heading">
          <div>
            <h2 id="export-title">Export</h2>
            <p>STEP for CAD, STL for 3D printing.</p>
          </div>
        </div>
        <div class="export-group">
          <p class="group-label">STEP · BRep-Solid</p>
          <button class="button button-primary" data-export-part="box" data-export-format="step" type="button"><i data-lucide="download" aria-hidden="true"></i><span>BOX STEP</span></button>
          <button class="button button-primary" data-export-part="lid" data-export-format="step" type="button"><i data-lucide="download" aria-hidden="true"></i><span>LID STEP</span></button>
          <button class="button button-outline button-wide" data-export-part="set" data-export-format="step" type="button"><i data-lucide="download" aria-hidden="true"></i><span>Complete set STEP</span></button>
        </div>
        <div class="export-group export-group-secondary">
          <p class="group-label">STL · Print mesh</p>
          <button class="button button-secondary" data-export-part="box" data-export-format="stl" type="button"><i data-lucide="download" aria-hidden="true"></i><span>BOX STL</span></button>
          <button class="button button-secondary" data-export-part="lid" data-export-format="stl" type="button"><i data-lucide="download" aria-hidden="true"></i><span>LID STL</span></button>
        </div>
        <p class="export-note">All files are generated locally in this browser.</p>
          </section>

          <div class="sidebar-footer">
            <label class="theme-row" for="theme-toggle">
              <span><i data-lucide="sun" aria-hidden="true"></i> Appearance</span>
              <span class="switch">
                <input id="theme-toggle" type="checkbox" role="switch" aria-label="Dark color scheme" />
                <span class="switch-track" aria-hidden="true"></span>
              </span>
            </label>
            <p>Model ${MODEL_INFO.modelVersion} · Reference ${MODEL_INFO.referenceCadVersion}</p>
          </div>
        </div>
      </details>
    </aside>

    <main class="workspace">
      <header class="workspace-header">
        <div>
          <p class="eyebrow">Parametric OpenCascade model</p>
          <div class="workspace-title-row">
            <h2>3D Preview</h2>
            <span class="status-badge is-loading" id="model-status" role="status" aria-live="polite">
              <span class="spinner" aria-hidden="true"></span>
              <span>Loading CAD kernel</span>
            </span>
          </div>
        </div>
        <div class="header-actions">
          <a class="button button-outline" id="print-guide" href="./info.html"><i data-lucide="book-open" aria-hidden="true"></i><span>Print guide</span></a>
          <button class="button button-outline" id="reset-camera" type="button"><i data-lucide="rotate-ccw" aria-hidden="true"></i><span>Reset view</span></button>
          <div class="lid-position-control">
            <div class="lid-position-heading">
              <label for="lid-position">Lid position</label>
              <output id="lid-position-value" for="lid-position">${lidPositionLabel(defaultLidClosedPercent)}</output>
            </div>
            <input id="lid-position" class="lid-position-slider" type="range" min="0" max="100" step="1" value="${defaultLidClosedPercent}" aria-valuetext="${lidPositionLabel(defaultLidClosedPercent)}" disabled />
          </div>
        </div>
      </header>

      <section class="viewer-panel" aria-label="Model preview">
        <div id="viewer" class="viewer"></div>
        <div class="viewer-loading" id="viewer-loading" aria-hidden="true">
          <div class="loading-cube"><i data-lucide="box" aria-hidden="true"></i></div>
          <p>Generating solid geometry …</p>
        </div>
        <div class="viewer-error" id="viewer-error" hidden>
          <i data-lucide="alert-circle" aria-hidden="true"></i>
          <strong>Preview could not be generated</strong>
          <p id="viewer-error-message"></p>
          <button class="button button-outline" id="retry-generation" type="button">Try again</button>
        </div>
        <div class="viewer-hint">Drag to rotate · Scroll to zoom · Right-click to pan</div>
        <div class="part-legend" aria-label="Legend">
          <span><i class="legend-dot legend-box"></i> BOX</span>
          <span><i class="legend-dot legend-lid"></i> LID</span>
        </div>
      </section>

      <section class="metrics" aria-labelledby="metrics-title">
        <div class="metrics-heading">
          <div>
            <h2 id="metrics-title">Model validation</h2>
            <p>Measured directly from the generated solid geometry.</p>
          </div>
          <span class="solid-indicator" id="solid-indicator"><i data-lucide="check-circle-2" aria-hidden="true"></i> Two valid solids</span>
        </div>
        <dl class="metric-grid">
          <div><dt>BOX outer dimensions</dt><dd id="metric-outer">200 × 100 × 80 mm</dd></div>
          <div><dt>Interior space</dt><dd id="metric-inner">195 × 95 × 73 mm</dd></div>
          <div><dt>Wall / base</dt><dd>2.5 / 3 mm</dd></div>
          <div><dt>Lid clearance</dt><dd>0.15 mm</dd></div>
        </dl>
      </section>
    </main>
  </div>
`;

function dimensionSlider(key: InnerSpaceKey, label: string): string {
  const limit = INNER_SPACE_LIMITS[key];
  const value = defaultInnerSpace[key];
  return `
    <div class="field slider-field" data-field="${key}">
      <div class="field-label-row">
        <label for="${key}">${label}</label>
        <span class="dimension-number">
          <input id="${key}-value" class="dimension-value-input" type="number" value="${value}" min="${limit.min}" max="${limit.max}" step="${limit.step}" inputmode="decimal" aria-label="${label} in millimeters" aria-describedby="${key}-range ${key}-error" />
          <span aria-hidden="true">mm</span>
        </span>
      </div>
      <input class="dimension-slider" id="${key}" name="${key}" type="range" value="${value}" min="${limit.min}" max="${limit.max}" step="${limit.step}" aria-describedby="${key}-range ${key}-error" />
      <div class="range-scale" id="${key}-range"><span>${formatMm(limit.min)}</span><span>${formatMm(limit.max)} mm</span></div>
      <p class="field-error" id="${key}-error"></p>
    </div>`;
}

const ICONS = {
  AlertCircle,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  Download,
  RotateCcw,
  Sun,
};
createIcons({ icons: ICONS });

const settingsDetails = document.querySelector<HTMLDetailsElement>(".settings-details");
const mobileLayout = window.matchMedia("(max-width: 640px)");
const syncSettingsDisclosure = (): void => {
  if (settingsDetails) settingsDetails.open = !mobileLayout.matches;
};
syncSettingsDisclosure();
mobileLayout.addEventListener("change", syncSettingsDisclosure);

const cad = new CadClient();
const viewerElement = document.querySelector<HTMLElement>("#viewer");
if (!viewerElement) throw new Error("Viewer container is missing.");
const viewer = new ModelViewer(viewerElement);
let parameters: ModelParameters = { ...DEFAULT_MODEL_PARAMETERS };
let generationSequence = 0;
let debounceTimer = 0;
let generating = false;

const status = requiredElement("model-status");
const loadingOverlay = requiredElement("viewer-loading");
const errorOverlay = requiredElement("viewer-error");
const errorMessage = requiredElement("viewer-error-message");
const lidPositionSlider = requiredElement("lid-position") as HTMLInputElement;
const lidPositionOutput = requiredElement("lid-position-value") as HTMLOutputElement;
const floorLogoInput = requiredElement("floor-logo-enabled") as HTMLInputElement;
const dimensionModeToggle = requiredElement("dimension-mode-toggle") as HTMLInputElement;
const dimensionDescription = requiredElement("dimension-description");
const exportButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-export-part]"));

function requiredElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Element #${id} is missing.`);
  return element;
}

function setStatus(kind: "loading" | "ready" | "error", message: string): void {
  status.className = `status-badge is-${kind}`;
  status.innerHTML = kind === "loading"
    ? `<span class="spinner" aria-hidden="true"></span><span>${message}</span>`
    : `<i data-lucide="${kind === "ready" ? "check-circle-2" : "alert-circle"}" aria-hidden="true"></i><span>${message}</span>`;
  createIcons({ icons: { AlertCircle, CheckCircle2 }, root: status });
}

function setBusy(isBusy: boolean): void {
  generating = isBusy;
  loadingOverlay.classList.toggle("is-hidden", !isBusy);
  exportButtons.forEach((button) => {
    button.disabled = isBusy || hasValidationErrors(validateModelParameters(parameters));
  });
  lidPositionSlider.disabled = isBusy;
}

async function generate(): Promise<void> {
  const errors = renderValidation();
  if (hasValidationErrors(errors)) return;
  const sequence = ++generationSequence;
  setBusy(true);
  errorOverlay.hidden = true;
  setStatus("loading", "Generating solid geometry");
  try {
    const result = await cad.generate(parameters);
    if (sequence !== generationSequence) return;
    viewer.update(result, parameters);
    updateMetrics(result.metrics.innerDimensions);
    const valid = result.metrics.boxValid && result.metrics.lidValid;
    const solidIndicator = requiredElement("solid-indicator");
    solidIndicator.classList.toggle("is-invalid", !valid);
    solidIndicator.innerHTML = valid
      ? `<i data-lucide="check-circle-2" aria-hidden="true"></i> Two valid solids`
      : `<i data-lucide="alert-circle" aria-hidden="true"></i> Solid validation failed`;
    createIcons({ icons: { AlertCircle, CheckCircle2 }, root: solidIndicator });
    setStatus(valid ? "ready" : "error", valid ? "Model is ready" : "Model is invalid");
  } catch (error) {
    if (sequence !== generationSequence) return;
    const message = error instanceof Error ? error.message : "Unknown error";
    errorMessage.textContent = message;
    errorOverlay.hidden = false;
    setStatus("error", "CAD generation failed");
  } finally {
    if (sequence === generationSequence) setBusy(false);
  }
}

function updateMetrics(innerDimensions: [number, number, number]): void {
  const outerDimensions = `${formatMm(parameters.boxLength)} × ${formatMm(parameters.boxWidth)} × ${formatMm(parameters.boxHeight)} mm`;
  const interiorDimensions = `${innerDimensions.map(formatMm).join(" × ")} mm`;
  requiredElement("metric-outer").textContent = outerDimensions;
  requiredElement("metric-inner").textContent = interiorDimensions;
  requiredElement("derived-dimensions-label").textContent = dimensionMode === "inner"
    ? "Resulting outer dimensions"
    : "Resulting interior space";
  requiredElement("derived-dimensions").textContent = dimensionMode === "inner"
    ? outerDimensions
    : interiorDimensions;
}

function formatMm(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

function displayedDimensionValue(key: InnerSpaceKey): number {
  if (dimensionMode === "inner") return getInnerSpaceDimensions(parameters)[key];
  if (key === "innerLength") return parameters.boxLength;
  if (key === "innerWidth") return parameters.boxWidth;
  return parameters.boxHeight;
}

function displayedDimensionLimit(key: InnerSpaceKey): { min: number; max: number; step: number } {
  if (dimensionMode === "inner") return INNER_SPACE_LIMITS[key];
  if (key === "innerLength") return MODEL_LIMITS.boxLength;
  if (key === "innerWidth") return MODEL_LIMITS.boxWidth;
  return MODEL_LIMITS.boxHeight;
}

function withDisplayedDimension(key: InnerSpaceKey, value: number): ModelParameters {
  if (dimensionMode === "inner") return withInnerSpaceDimension(parameters, key, value);
  if (key === "innerLength") return { ...parameters, boxLength: value };
  if (key === "innerWidth") return { ...parameters, boxWidth: value };
  return { ...parameters, boxHeight: value };
}

function renderValidation(): ReturnType<typeof validateModelParameters> {
  const errors = validateModelParameters(parameters);
  const errorKey = {
    innerLength: "boxLength",
    innerWidth: "boxWidth",
    innerHeight: "boxHeight",
  } as const;
  (Object.keys(INNER_SPACE_LIMITS) as InnerSpaceKey[]).forEach((key) => {
    const input = document.querySelector<HTMLInputElement>(`#${key}`);
    const field = document.querySelector<HTMLElement>(`[data-field="${key}"]`);
    const message = document.querySelector<HTMLElement>(`#${key}-error`);
    const error = errors[errorKey[key]] ?? "";
    input?.setAttribute("aria-invalid", String(Boolean(error)));
    document.querySelector<HTMLInputElement>(`#${key}-value`)
      ?.setAttribute("aria-invalid", String(Boolean(error)));
    field?.classList.toggle("has-error", Boolean(error));
    if (message) message.textContent = error;
  });
  requiredElement("model-error").textContent = errors.model ?? "";
  if (hasValidationErrors(errors)) {
    generationSequence++;
    setBusy(false);
    setStatus("error", "Please check the dimensions");
  }
  return errors;
}

function scheduleGeneration(): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => void generate(), 320);
}

function updateDimensionControls(): void {
  const innerSpace = getInnerSpaceDimensions(parameters);
  (Object.keys(INNER_SPACE_LIMITS) as InnerSpaceKey[]).forEach((key) => {
    const input = document.querySelector<HTMLInputElement>(`#${key}`);
    const valueInput = document.querySelector<HTMLInputElement>(`#${key}-value`);
    const scale = document.querySelector<HTMLElement>(`#${key}-range`);
    const value = displayedDimensionValue(key);
    const limit = displayedDimensionLimit(key);
    if (input) {
      input.value = String(value);
      input.min = String(limit.min);
      input.max = String(limit.max);
      input.step = String(limit.step);
    }
    if (valueInput) {
      valueInput.value = String(value);
      valueInput.min = String(limit.min);
      valueInput.max = String(limit.max);
      valueInput.step = String(limit.step);
    }
    if (scale) {
      scale.innerHTML = `<span>${formatMm(limit.min)}</span><span>${formatMm(limit.max)} mm</span>`;
    }
  });
  dimensionModeToggle.checked = dimensionMode === "outer";
  dimensionDescription.textContent = dimensionMode === "inner"
    ? "Required usable interior space."
    : "Overall exterior dimensions.";
  updateMetrics([innerSpace.innerLength, innerSpace.innerWidth, innerSpace.innerHeight]);
}

(Object.keys(INNER_SPACE_LIMITS) as InnerSpaceKey[]).forEach((key) => {
  document.querySelector<HTMLInputElement>(`#${key}`)?.addEventListener("input", (event) => {
    parameters = withDisplayedDimension(key, Number((event.target as HTMLInputElement).value));
    updateDimensionControls();
    renderValidation();
    scheduleGeneration();
  });
  const valueInput = document.querySelector<HTMLInputElement>(`#${key}-value`);
  valueInput?.addEventListener("change", () => {
    parameters = withDisplayedDimension(key, Number(valueInput.value));
    updateDimensionControls();
    renderValidation();
    scheduleGeneration();
  });
  valueInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") valueInput.blur();
  });
});

dimensionModeToggle.addEventListener("change", () => {
  dimensionMode = dimensionModeToggle.checked ? "outer" : "inner";
  updateDimensionControls();
  renderValidation();
});

floorLogoInput.addEventListener("change", () => {
  parameters = { ...parameters, floorLogoEnabled: floorLogoInput.checked };
  renderValidation();
  scheduleGeneration();
});

requiredElement("reset-parameters").addEventListener("click", () => {
  parameters = { ...DEFAULT_MODEL_PARAMETERS };
  floorLogoInput.checked = parameters.floorLogoEnabled;
  updateDimensionControls();
  void generate();
});

requiredElement("reset-camera").addEventListener("click", () => viewer.resetCamera());
requiredElement("retry-generation").addEventListener("click", () => void generate());
lidPositionSlider.addEventListener("input", () => {
  const percentClosed = Number(lidPositionSlider.value);
  const label = lidPositionLabel(percentClosed);
  viewer.setLidPosition(percentClosed / 100);
  lidPositionOutput.value = label;
  lidPositionSlider.setAttribute("aria-valuetext", label);
});

function lidPositionLabel(percentClosed: number): string {
  if (percentClosed <= 0) return "Fully open";
  if (percentClosed >= 100) return "Closed";
  return `${Math.round(percentClosed)}% closed`;
}

exportButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (generating) return;
    const part = button.dataset.exportPart as ExportPart;
    const format = button.dataset.exportFormat as ExportFormat;
    const original = button.innerHTML;
    button.disabled = true;
    button.classList.add("is-loading");
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>Generating …</span>`;
    try {
      const result = await cad.export(parameters, part, format);
      const blob = new Blob([result.buffer], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const prefix = part === "set" ? "box-set" : part;
      link.href = url;
      link.download = `${prefix}_${downloadDimensionToken(parameters)}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("ready", `${format.toUpperCase()} generated`);
    } catch (error) {
      setStatus("error", error instanceof Error ? error.message : "Export failed");
    } finally {
      button.innerHTML = original;
      button.classList.remove("is-loading");
      button.disabled = false;
      createIcons({ icons: { Download }, root: button });
    }
  });
});

const themeToggle = document.querySelector<HTMLInputElement>("#theme-toggle");
const storedTheme = localStorage.getItem("box-generator-theme");
const initialTheme = storedTheme === "light" || storedTheme === "dark"
  ? storedTheme
  : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
document.documentElement.dataset.theme = initialTheme;
if (themeToggle) {
  themeToggle.checked = initialTheme === "dark";
  themeToggle.addEventListener("change", () => {
    const next = themeToggle.checked ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("box-generator-theme", next);
    viewer.applyTheme();
  });
}
viewer.applyTheme();
updateDimensionControls();
void generate();
