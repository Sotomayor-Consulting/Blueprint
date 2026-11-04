import type { FormDraftAnswers } from "@/components/forms/form-draft";

export type StructureType = "Single Member" | "Partnership" | "No informado";
export type ManagementModel =
  | "Member-Managed"
  | "Manager-Managed"
  | "No informado";

export interface ReportAnswers {
  email: string;
  businessModel: string;
  operationDescription: string;
  clientMarkets: string[];
  confidentialityLevel: string;
  formationState: string;
  operationsPresence: string;
  primaryOperatingCountry: string;
  hasUsSourceIncome: boolean | null;
  taxTreatment: string;
  operationalIndicators: string[];
  structureType: StructureType;
  singleMemberOwnerType: string;
  numberOfMembers: string;
  managementModel: ManagementModel;
  accountingMethod: string;
  primaryEconomicActivity: string;
}

const fallback = "No informado";

const asString = (answers: FormDraftAnswers, name: keyof FormDraftAnswers) => {
  const value = answers[name];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const asStrings = (answers: FormDraftAnswers, name: keyof FormDraftAnswers) => {
  const value = answers[name];
  return Array.isArray(value)
    ? value.map((item) => item.trim()).filter(Boolean)
    : [];
};

export const normalizeAnswers = (
  answers: FormDraftAnswers,
): ReportAnswers => {
  const sourceIncome = asString(answers, "hasUsSourceIncome");
  const structure = asString(answers, "EstructureClassLevel");

  return {
    email: asString(answers, "email"),
    businessModel: asString(answers, "businessModel"),
    operationDescription: asString(answers, "operationDescription"),
    clientMarkets: asStrings(answers, "clientMarkets"),
    confidentialityLevel: asString(answers, "confidentialityLevel"),
    formationState: asString(answers, "formationState"),
    operationsPresence: asString(answers, "operaciones"),
    primaryOperatingCountry: asString(answers, "primaryOperatingCountry"),
    hasUsSourceIncome:
      sourceIncome === "true" ? true : sourceIncome === "false" ? false : null,
    taxTreatment: asString(answers, "llcTaxTreatment"),
    operationalIndicators:
      sourceIncome === "true"
        ? asStrings(answers, "operationalIndicators")
        : [],
    structureType:
      structure === "Single Member" || structure === "Partnership"
        ? structure
        : fallback,
    singleMemberOwnerType:
      structure === "Single Member"
        ? asString(answers, "singleMemberOwnerType")
        : fallback,
    numberOfMembers:
      structure === "Partnership"
        ? asString(answers, "numberOfMembers")
        : fallback,
    managementModel: (() => {
      const value = asString(answers, "sistemModel");
      return value === "Member-Managed" || value === "Manager-Managed"
        ? value
        : fallback;
    })(),
    accountingMethod: asString(answers, "cashModel"),
    primaryEconomicActivity: asString(
      answers,
      "primaryEconomicActivity",
    ),
  };
};
