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

const isConfidentialityLevel = (
  value: unknown,
): value is ConfidentialityLevel =>
  value === "Nula" || value === "Parcial" || value === "Total";

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

    const confidentialityLevel = parsed.answers.confidentialityLevel;
    const formationState = parsed.answers.formationState;

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date(0).toISOString(),
      answers: {
        confidentialityLevel: isConfidentialityLevel(confidentialityLevel)
          ? confidentialityLevel
          : undefined,
        formationState:
          typeof formationState === "string" && formationState.trim()
            ? formationState
            : undefined,
      },
    };
  } catch {
    return emptyDraft();
  }
};

export const updateFormDraft = (answers: Partial<FormDraftAnswers>) => {
  const current = readFormDraft();
  const nextAnswers = { ...current.answers, ...answers };

  Object.entries(nextAnswers).forEach(([key, value]) => {
    if (value === undefined) delete nextAnswers[key as keyof FormDraftAnswers];
  });

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        updatedAt: new Date().toISOString(),
        answers: nextAnswers,
      } satisfies FormDraft),
    );
  } catch {
    // Storage can be unavailable in private browsing or constrained contexts.
  }
};
