import type { ReportAnswers } from "./normalize";

export interface ReportFacts {
  isSingleMember: boolean;
  isPartnership: boolean;
  isManagerManaged: boolean;
  hasUsSourceIncome: boolean;
  hasOperationalIndicators: boolean;
  taxesAsCorporation: boolean;
  taxesAsPassThrough: boolean;
}

export const deriveReportFacts = (answers: ReportAnswers): ReportFacts => ({
  isSingleMember: answers.structureType === "Single Member",
  isPartnership: answers.structureType === "Partnership",
  isManagerManaged: answers.managementModel === "Manager-Managed",
  hasUsSourceIncome: answers.hasUsSourceIncome === true,
  hasOperationalIndicators:
    answers.hasUsSourceIncome === true &&
    answers.operationalIndicators.length > 0,
  taxesAsCorporation: answers.taxTreatment === "Corporación",
  taxesAsPassThrough: answers.taxTreatment === "Entidad de paso",
});
