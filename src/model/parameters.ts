export type ModelParameters = {
  boxLength: number;
  boxWidth: number;
  boxHeight: number;
  wallThickness: number;
  bottomThickness: number;
  cornerRadius: number;
  boxEdgeChamfer: number;
  lidWallHeight: number;
  lidWallTopHeight: number;
  lidTongueStraightHeight: number;
  lidCutout: number;
  lidWallThickness: number;
  lidOffset: number;
  lidRetentionLipWidth: number;
  lidOuterChamfer: number;
  holeThread: number;
  minSideWithHole: number;
  threadDepth: number;
  screwDiameter: number;
  screwCenterInset: number;
  screwBossNarrowHalfWidth: number;
  screwBossWallHalfWidth: number;
  screwBossSupportDepth: number;
  lidCounterboreDepth: number;
  floorLogoEnabled: boolean;
  floorLogoDepth: number;
};

export type EditableParameter = "boxLength" | "boxWidth" | "boxHeight";
export type InnerSpaceKey = "innerLength" | "innerWidth" | "innerHeight";

export type InnerSpaceDimensions = Record<InnerSpaceKey, number>;

export const MODEL_INFO = {
  name: "Parametric Box Generator",
  modelVersion: "1.6.0",
  referenceCadVersion: "Box v2 v1",
} as const;

export const DEFAULT_MODEL_PARAMETERS: Readonly<ModelParameters> = {
  boxLength: 200,
  boxWidth: 100,
  boxHeight: 80,
  wallThickness: 2.5,
  bottomThickness: 3,
  cornerRadius: 5,
  boxEdgeChamfer: 0.2,
  lidWallHeight: 2.5,
  lidWallTopHeight: 1.5,
  lidTongueStraightHeight: 1,
  lidCutout: 7,
  lidWallThickness: 1.5,
  lidOffset: 0.15,
  lidRetentionLipWidth: 1,
  lidOuterChamfer: 0.2,
  holeThread: 4,
  minSideWithHole: 1.6,
  threadDepth: 6.7,
  screwDiameter: 3,
  screwCenterInset: 8.88,
  screwBossNarrowHalfWidth: 4.4,
  screwBossWallHalfWidth: 14.7,
  screwBossSupportDepth: 25.4,
  lidCounterboreDepth: 2,
  floorLogoEnabled: true,
  floorLogoDepth: 0.2,
};

export const MODEL_LIMITS = {
  boxLength: { min: 40, max: 400, step: 1 },
  boxWidth: { min: 30, max: 300, step: 1 },
  boxHeight: { min: 20, max: 250, step: 1 },
} as const satisfies Record<EditableParameter, { min: number; max: number; step: number }>;

export const CAD_TOLERANCES = {
  booleanOverlap: 0.05,
  meshLinear: 0.12,
  meshAngular: 0.12,
  stlLinear: 0.08,
  stlAngular: 0.1,
} as const;

export const INNER_SPACE_LIMITS = {
  innerLength: {
    min: MODEL_LIMITS.boxLength.min - 2 * DEFAULT_MODEL_PARAMETERS.wallThickness,
    max: MODEL_LIMITS.boxLength.max - 2 * DEFAULT_MODEL_PARAMETERS.wallThickness,
    step: MODEL_LIMITS.boxLength.step,
  },
  innerWidth: {
    min: MODEL_LIMITS.boxWidth.min - 2 * DEFAULT_MODEL_PARAMETERS.wallThickness,
    max: MODEL_LIMITS.boxWidth.max - 2 * DEFAULT_MODEL_PARAMETERS.wallThickness,
    step: MODEL_LIMITS.boxWidth.step,
  },
  innerHeight: {
    min: MODEL_LIMITS.boxHeight.min
      - DEFAULT_MODEL_PARAMETERS.bottomThickness
      - DEFAULT_MODEL_PARAMETERS.lidWallHeight
      - DEFAULT_MODEL_PARAMETERS.lidWallTopHeight,
    max: MODEL_LIMITS.boxHeight.max
      - DEFAULT_MODEL_PARAMETERS.bottomThickness
      - DEFAULT_MODEL_PARAMETERS.lidWallHeight
      - DEFAULT_MODEL_PARAMETERS.lidWallTopHeight,
    step: MODEL_LIMITS.boxHeight.step,
  },
} as const satisfies Record<InnerSpaceKey, { min: number; max: number; step: number }>;

export type DerivedModelDimensions = {
  innerLength: number;
  innerWidth: number;
  innerCornerRadius: number;
  lidLength: number;
  lidTongueLength: number;
  lidWidth: number;
  lidHeight: number;
  lidCenterX: number;
  lidTopLength: number;
  lidTopWidth: number;
  lidTopCenterX: number;
  lidEndTabLength: number;
  lidEndTabCenterX: number;
  lidTongueRadius: number;
  lidTopRadius: number;
  lidBaseZ: number;
  railInnerLength: number;
  railInnerWidth: number;
  railInnerRadius: number;
  retentionInnerLength: number;
  retentionInnerWidth: number;
  retentionInnerRadius: number;
  screwCenterX: number;
  screwBossBottomZ: number;
  screwBossWallBottomZ: number;
  lidHoleRadius: number;
  lidCounterboreRadius: number;
};

export function deriveModelDimensions(parameters: ModelParameters): DerivedModelDimensions {
  const lidHeight = parameters.lidWallHeight + parameters.lidWallTopHeight;
  const railInnerWidth = parameters.boxWidth - 2 * parameters.lidWallThickness;
  const railInnerRadius = parameters.cornerRadius - parameters.lidWallThickness;
  const retentionThickness = parameters.lidWallThickness + parameters.lidRetentionLipWidth;
  const retentionInnerLength = parameters.boxLength - 2 * retentionThickness;
  const retentionInnerWidth = parameters.boxWidth - 2 * retentionThickness;
  const retentionInnerRadius = parameters.cornerRadius - retentionThickness;
  const lidLength = parameters.boxLength - parameters.lidWallThickness - parameters.lidOffset;
  const lidEndTabLength = parameters.lidCutout - parameters.lidOffset;

  return {
    innerLength: parameters.boxLength - 2 * parameters.wallThickness,
    innerWidth: parameters.boxWidth - 2 * parameters.wallThickness,
    innerCornerRadius: parameters.cornerRadius - parameters.wallThickness,
    lidLength,
    lidTongueLength: parameters.boxLength - 2 * parameters.lidWallThickness - 2 * parameters.lidOffset,
    lidWidth: railInnerWidth - 2 * parameters.lidOffset,
    lidHeight,
    lidCenterX: 0,
    lidTopLength: retentionInnerLength - 2 * parameters.lidOffset,
    lidTopWidth: retentionInnerWidth - 2 * parameters.lidOffset,
    lidTopCenterX: 0,
    lidEndTabLength,
    lidEndTabCenterX: -parameters.boxLength / 2 + lidEndTabLength / 2,
    lidTongueRadius: railInnerRadius - parameters.lidOffset,
    lidTopRadius: retentionInnerRadius - parameters.lidOffset,
    lidBaseZ: parameters.boxHeight - lidHeight,
    railInnerLength: parameters.boxLength - 2 * parameters.lidWallThickness,
    railInnerWidth,
    railInnerRadius,
    retentionInnerLength,
    retentionInnerWidth,
    retentionInnerRadius,
    screwCenterX: -parameters.boxLength / 2 + parameters.screwCenterInset,
    screwBossBottomZ: parameters.boxHeight - lidHeight - parameters.threadDepth,
    screwBossWallBottomZ: Math.max(
      parameters.bottomThickness,
      parameters.boxHeight - lidHeight - parameters.screwBossSupportDepth,
    ),
    lidHoleRadius: parameters.minSideWithHole,
    lidCounterboreRadius: parameters.minSideWithHole + parameters.lidCounterboreDepth,
  };
}

export function getInnerSpaceDimensions(parameters: ModelParameters): InnerSpaceDimensions {
  const derived = deriveModelDimensions(parameters);
  return {
    innerLength: derived.innerLength,
    innerWidth: derived.innerWidth,
    innerHeight: derived.lidBaseZ - parameters.bottomThickness,
  };
}

export function withInnerSpaceDimension(
  parameters: ModelParameters,
  key: InnerSpaceKey,
  value: number,
): ModelParameters {
  if (key === "innerLength") {
    return { ...parameters, boxLength: value + 2 * parameters.wallThickness };
  }
  if (key === "innerWidth") {
    return { ...parameters, boxWidth: value + 2 * parameters.wallThickness };
  }
  return {
    ...parameters,
    boxHeight:
      value
      + parameters.bottomThickness
      + parameters.lidWallHeight
      + parameters.lidWallTopHeight,
  };
}

export function parameterKey(parameters: ModelParameters): string {
  return Object.values(parameters).join(":");
}

export function downloadDimensionToken(parameters: ModelParameters): string {
  const clean = (value: number) => String(value).replace(".", "-");
  return `${clean(parameters.boxLength)}x${clean(parameters.boxWidth)}x${clean(parameters.boxHeight)}`;
}
