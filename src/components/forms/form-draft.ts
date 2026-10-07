export type ConfidentialityLevel = "Nula" | "Parcial" | "Total";

interface FormDraftAnswers {
  confidentialityLevel?: ConfidentialityLevel;
  formationState?: string;
}

interface FormDraft {
  version: 1;
  updatedAt: string;
  answers: FormDraftAnswers;
}

const STORAGE_KEY = "llc-plan-draft-v1";

const emptyDraft = (): FormDraft => ({
  version: 1,
  updatedAt: new Date(0).toISOString(),
  answers: {},
});

export const readFormDraft = (): FormDraft => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyDraft();

    const parsed = JSON.parse(stored) as Partial<FormDraft>;
    if (parsed.version !== 1 || typeof parsed.answers !== "object" || !parsed.answers) {
      return emptyDraft();
    }

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      answers: parsed.answers,
    };
  } catch {
    return emptyDraft();
  }
};

export const updateFormDraft = (answers: Partial<FormDraftAnswers>) => {
  const current = readFormDraft();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      answers: { ...current.answers, ...answers },
    } satisfies FormDraft),
  );
};
