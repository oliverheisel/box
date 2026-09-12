import {
  deriveModelDimensions,
  MODEL_LIMITS,
  type EditableParameter,
  type ModelParameters,
} from "./parameters";

export type ValidationErrors = Partial<Record<EditableParameter | "model", string>>;

export function validateModelParameters(parameters: ModelParameters): ValidationErrors {
  const errors: ValidationErrors = {};

  (Object.keys(MODEL_LIMITS) as EditableParameter[]).forEach((key) => {
    const value = parameters[key];
    const limit = MODEL_LIMITS[key];
    if (!Number.isFinite(value)) {
      errors[key] = "Please enter a valid number.";
    } else if (value < limit.min || value > limit.max) {
      errors[key] = `Allowed range: ${limit.min} to ${limit.max} mm.`;
    }
  });

  if (Object.keys(errors).length > 0) return errors;

  const derived = deriveModelDimensions(parameters);
  if (
    derived.innerLength <= 0 ||
    derived.innerWidth <= 0 ||
    derived.innerCornerRadius <= 0 ||
    derived.retentionInnerLength <= 0 ||
    derived.retentionInnerWidth <= 0 ||
    derived.retentionInnerRadius <= 0 ||
    derived.lidTopLength <= 0 ||
    derived.lidTopWidth <= 0 ||
    derived.lidTopRadius <= 0
  ) {
    errors.model = "The outer dimensions do not allow a valid interior space.";
  } else if (
    parameters.cornerRadius >= parameters.boxLength / 2 ||
    parameters.cornerRadius >= parameters.boxWidth / 2
  ) {
    errors.model = "The corner radius is too large for these outer dimensions.";
  } else if (derived.lidBaseZ <= parameters.bottomThickness) {
    errors.model = "The height is insufficient for the interior space and lid guide.";
  } else if (
    parameters.lidTongueStraightHeight <= 0
    || parameters.lidTongueStraightHeight >= parameters.lidWallHeight
  ) {
    errors.model = "The straight and sloped lid-guide heights are invalid.";
  } else if (parameters.lidCutout + parameters.screwCenterInset >= parameters.boxLength / 2) {
    errors.model = "The length is insufficient for the lid opening and screw boss.";
  } else if (parameters.screwBossWallHalfWidth >= derived.innerWidth / 2) {
    errors.model = "The width is insufficient for the screw boss.";
  }

  return errors;
}

export function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}
