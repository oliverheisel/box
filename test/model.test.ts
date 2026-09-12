import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import initOpenCascade from "replicad-opencascadejs";
import { measureVolume, setOC } from "replicad";
import { createModel, disposeModel, getModelMetrics, serializeShape } from "../src/model/model";
import {
  DEFAULT_MODEL_PARAMETERS,
  deriveModelDimensions,
  getInnerSpaceDimensions,
  withInnerSpaceDimension,
  type ModelParameters,
} from "../src/model/parameters";
import { validateModelParameters } from "../src/model/validation";
import { exportModel } from "../src/cad/export";

const CASES: Array<{ name: string; dimensions: [number, number, number] }> = [
  { name: "Standard", dimensions: [200, 100, 80] },
  { name: "Klein", dimensions: [80, 60, 30] },
  { name: "Groß", dimensions: [300, 150, 120] },
];

before(async () => {
  setOC(await initOpenCascade({ print: () => undefined, printErr: () => undefined }));
});

function parametersFor(dimensions: [number, number, number]): ModelParameters {
  return {
    ...DEFAULT_MODEL_PARAMETERS,
    boxLength: dimensions[0],
    boxWidth: dimensions[1],
    boxHeight: dimensions[2],
  };
}

function assertBounds(
  bounds: [[number, number, number], [number, number, number]],
  expected: [number, number, number],
): void {
  const actual = bounds[1].map((value, index) => value - bounds[0][index]);
  expected.forEach((value, index) => assert.ok(Math.abs(actual[index] - value) < 1e-5));
}

function assertFiniteMesh(values: number[]): void {
  assert.ok(values.length > 0);
  assert.ok(values.every(Number.isFinite));
}

function assertWatertightByPosition(vertices: number[], triangles: number[]): void {
  const pointKey = (index: number) => [0, 1, 2]
    .map((axis) => Math.round(vertices[index * 3 + axis] * 1e5))
    .join(",");
  const counts = new Map<string, number>();
  for (let index = 0; index < triangles.length; index += 3) {
    const triangle = triangles.slice(index, index + 3);
    for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
      const edge = [pointKey(triangle[a]), pointKey(triangle[b])].sort().join("|");
      counts.set(edge, (counts.get(edge) ?? 0) + 1);
    }
  }
  const invalidEdges = [...counts].filter(([, count]) => count !== 2);
  assert.equal(
    invalidEdges.length,
    0,
    `Offene oder nicht-mannigfaltige Meshkanten: ${JSON.stringify(invalidEdges.slice(0, 6))}`,
  );
}

describe("parametrisches CAD-Modell", () => {
  for (const modelCase of CASES) {
    test(`${modelCase.name}: erzeugt gültige BOX- und LID-Solids`, () => {
      const parameters = parametersFor(modelCase.dimensions);
      assert.deepEqual(validateModelParameters(parameters), {});
      const model = createModel(parameters);
      try {
        const metrics = getModelMetrics(model, parameters);
        const derived = deriveModelDimensions(parameters);
        assert.equal(metrics.boxValid, true);
        assert.equal(metrics.lidValid, true);
        assert.ok(metrics.boxVolume > 0);
        assert.ok(metrics.lidVolume > 0);
        assertBounds(metrics.boxBounds, modelCase.dimensions);
        assertBounds(metrics.lidBounds, [derived.lidLength, parameters.boxWidth, derived.lidHeight]);
        assert.ok(Math.abs(metrics.lidBounds[0][2] - derived.lidBaseZ) < 1e-5);
        assert.ok(
          Math.abs(metrics.lidBounds[1][2] - parameters.boxHeight) < 1e-5,
        );
        assert.deepEqual(metrics.innerDimensions, [
          parameters.boxLength - 2 * parameters.wallThickness,
          parameters.boxWidth - 2 * parameters.wallThickness,
          parameters.boxHeight
            - derived.lidHeight
            - parameters.bottomThickness,
        ]);
        assert.equal(derived.innerLength, parameters.boxLength - 2 * parameters.wallThickness);
        assert.equal(derived.innerWidth, parameters.boxWidth - 2 * parameters.wallThickness);
        assert.equal(
          (modelCase.dimensions[0] - derived.innerLength) / 2,
          parameters.wallThickness,
        );
        assert.equal(
          (modelCase.dimensions[1] - derived.innerWidth) / 2,
          parameters.wallThickness,
        );
        assert.ok(derived.lidWidth < derived.railInnerWidth);
        assert.ok(derived.lidWidth > derived.retentionInnerWidth);
        assert.ok(derived.lidTopWidth < derived.retentionInnerWidth);

        const boxMesh = serializeShape(model.box).faces;
        const lidMesh = serializeShape(model.lid).faces;
        assertFiniteMesh(boxMesh.vertices);
        assertFiniteMesh(boxMesh.triangles);
        assertFiniteMesh(lidMesh.vertices);
        assertFiniteMesh(lidMesh.triangles);
        assertWatertightByPosition(boxMesh.vertices, boxMesh.triangles);
        assertWatertightByPosition(lidMesh.vertices, lidMesh.triangles);
      } finally {
        disposeModel(model);
      }
    });
  }

  test("Standardmodell exportiert native STEP-Solids und binäres STL", async () => {
    const parameters = parametersFor([200, 100, 80]);
    const model = createModel(parameters);
    try {
      const overlap = model.box.intersect(model.lid);
      try {
        const overlapVolume = measureVolume(overlap);
        assert.ok(
          overlapVolume < 1e-6,
          `BOX und LID dürfen sich nicht überlappen: ${overlapVolume} mm³`,
        );
      } finally {
        overlap.delete();
      }

      const boxStep = exportModel(model, "box", "step");
      const lidStep = exportModel(model, "lid", "step");
      const setStep = exportModel(model, "set", "step");
      for (const blob of [boxStep, lidStep, setStep]) {
        const text = await blob.text();
        assert.match(text, /^ISO-10303-21;/);
        assert.match(text, /MANIFOLD_SOLID_BREP|ADVANCED_BREP_SHAPE_REPRESENTATION/);
      }

      for (const part of ["box", "lid"] as const) {
        const buffer = await exportModel(model, part, "stl").arrayBuffer();
        const view = new DataView(buffer);
        const triangleCount = view.getUint32(80, true);
        assert.ok(triangleCount > 0);
        assert.equal(buffer.byteLength, 84 + triangleCount * 50);
      }
    } finally {
      disposeModel(model);
    }
  });
});

describe("Parametervalidierung", () => {
  test("Innenmaße werden verlustfrei in Außenmaße übersetzt", () => {
    const inner = getInnerSpaceDimensions(DEFAULT_MODEL_PARAMETERS);
    assert.deepEqual(inner, { innerLength: 195, innerWidth: 95, innerHeight: 73 });

    const resized = withInnerSpaceDimension(
      withInnerSpaceDimension(
        withInnerSpaceDimension(DEFAULT_MODEL_PARAMETERS, "innerLength", 240),
        "innerWidth",
        110,
      ),
      "innerHeight",
      60,
    );
    assert.deepEqual(getInnerSpaceDimensions(resized), {
      innerLength: 240,
      innerWidth: 110,
      innerHeight: 60,
    });
    assert.deepEqual(
      [resized.boxLength, resized.boxWidth, resized.boxHeight],
      [245, 115, 67],
    );
  });

  test("weist Nullwerte und geometrisch zu kleine Maße zurück", () => {
    const invalid = { ...DEFAULT_MODEL_PARAMETERS, boxLength: 0, boxWidth: 10, boxHeight: 2 };
    const errors = validateModelParameters(invalid);
    assert.ok(errors.boxLength);
    assert.ok(errors.boxWidth);
    assert.ok(errors.boxHeight);
  });
});
