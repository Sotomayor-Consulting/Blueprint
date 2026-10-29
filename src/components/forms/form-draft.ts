export type ConfidentialityLevel = "Nula" | "Parcial" | "Total";

export const persistedFieldNames = [
  "email",
  "businessModel",
  "operationDescription",
  "projectedAnnualRevenue",
  "clientMarkets",
  "confidentialityLevel",
  "formationState",
  "operaciones",
  "primaryOperatingCountry",
  "hasUsSourceIncome",
  "llcTaxTreatment",
  "operationalIndicators",
  "EstructureClassLevel",
  "singleMemberOwnerType",
  "numberOfMembers",
  "sistemModel",
  "cashModel",
  "primaryEconomicActivity",
] as const;

export type PersistedFieldName = (typeof persistedFieldNames)[number];
export type FormDraftValue = string | string[];
export type FormDraftAnswers = Partial<
  Record<PersistedFieldName, FormDraftValue>
>;

export interface FormDraftProgress {
  currentStep: string;
  highestUnlockedStep: string;
  completedSteps: string[];
}

export interface FormDraft {
  version: 2;
  updatedAt: string;
  answers: FormDraftAnswers;
  progress: FormDraftProgress;
}

const STORAGE_KEY = "llc-plan-draft-v2";
const LEGACY_STORAGE_KEY = "llc-plan-draft-v1";
const MULTIPLE_FIELDS = new Set<PersistedFieldName>([
  "clientMarkets",
  "operationalIndicators",
]);
const FIELD_NAMES = new Set<string>(persistedFieldNames);
const MAX_STRING_LENGTH = 2_000;
const MAX_ARRAY_LENGTH = 20;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const sanitizeString = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return value.slice(0, MAX_STRING_LENGTH);
};

const sanitizeAnswers = (value: unknown): FormDraftAnswers => {
  if (!isRecord(value)) return {};

  const answers: FormDraftAnswers = {};

  Object.entries(value).forEach(([name, rawValue]) => {
    if (!FIELD_NAMES.has(name)) return;
    const fieldName = name as PersistedFieldName;

    if (MULTIPLE_FIELDS.has(fieldName)) {
      if (!Array.isArray(rawValue)) return;
      const values = Array.from(
        new Set(
          rawValue
            .slice(0, MAX_ARRAY_LENGTH)
            .map(sanitizeString)
            .filter((item): item is string => Boolean(item)),
        ),
      );
      if (values.length > 0) answers[fieldName] = values;
      return;
    }

    const stringValue = sanitizeString(rawValue);
    if (stringValue) answers[fieldName] = stringValue;
  });

  return answers;
};

const sanitizeProgress = (value: unknown): FormDraftProgress => {
  const progress = isRecord(value) ? value : {};
  const currentStep = sanitizeString(progress.currentStep) ?? "Correo";
  const highestUnlockedStep =
    sanitizeString(progress.highestUnlockedStep) ?? "Correo";
  const completedSteps = Array.isArray(progress.completedSteps)
    ? Array.from(
        new Set(
          progress.completedSteps
            .map(sanitizeString)
            .filter((item): item is string => Boolean(item)),
        ),
      )
    : [];

  return { currentStep, highestUnlockedStep, completedSteps };
};

const parseCurrentDraft = (stored: string): FormDraft | null => {
  const parsed = JSON.parse(stored) as unknown;
  if (!isRecord(parsed) || parsed.version !== 2) return null;

  return {
    version: 2,
    updatedAt:
      typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : new Date(0).toISOString(),
    answers: sanitizeAnswers(parsed.answers),
    progress: sanitizeProgress(parsed.progress),
  };
};

const parseLegacyDraft = (stored: string): FormDraft | null => {
  const parsed = JSON.parse(stored) as unknown;
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.answers)) {
    return null;
  }

  const answers = sanitizeAnswers({
    confidentialityLevel: parsed.answers.confidentialityLevel,
    formationState: parsed.answers.formationState,
  });

  return {
    version: 2,
    updatedAt:
      typeof parsed.updatedAt === "string"
        ? parsed.updatedAt
        : new Date(0).toISOString(),
    answers,
    progress: sanitizeProgress(undefined),
  };
};

export const readFormDraft = (): FormDraft | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return parseCurrentDraft(stored);

    const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY);
    return legacyStored ? parseLegacyDraft(legacyStored) : null;
  } catch {
    return null;
  }
};

export const writeFormDraft = (
  answers: FormDraftAnswers,
  progress: FormDraftProgress,
) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        updatedAt: new Date().toISOString(),
        answers: sanitizeAnswers(answers),
        progress: sanitizeProgress(progress),
      } satisfies FormDraft),
    );
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing or constrained contexts.
  }
};

export const clearFormDraft = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private browsing or constrained contexts.
  }
};
