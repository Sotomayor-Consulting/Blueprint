import type { ReportAnswers } from "./normalize";

export interface FederalFilingRequirements {
  forms: string[];
  rationale: string;
}

export const deriveFederalFilingRequirements = (
  answers: ReportAnswers,
): FederalFilingRequirements => {
  if (answers.taxTreatment === "Corporación") {
    return {
      forms: [
        "Formulario 1120 — U.S. Corporation Income Tax Return",
        "Formulario 5472 — Information Return",
      ],
      rationale:
        "Obligaciones previstas para una LLC que selecciona tratamiento tributario de corporación.",
    };
  }

  if (
    answers.taxTreatment === "Entidad de paso" &&
    answers.structureType === "Partnership"
  ) {
    if (answers.hasUsSourceIncome) {
      return {
        forms: [
          "Formulario 1065",
          "Schedule K-1 por socio",
          "Formulario 1040 Individual para socios estadounidenses",
          "Formulario 1040-NR para socios extranjeros",
        ],
        rationale:
          "Obligaciones previstas para una Partnership con ingresos de fuente estadounidense.",
      };
    }

    return {
      forms: ["Formulario 1065", "Schedule K-1 por socio"],
      rationale:
        "Obligaciones previstas para una Partnership sin ingresos de fuente estadounidense declarados.",
    };
  }

  if (
    answers.taxTreatment === "Entidad de paso" &&
    answers.structureType === "Single Member"
  ) {
    const isAmericanResident = answers.americanResident === true;

    if (isAmericanResident && answers.hasUsSourceIncome) {
      return {
        forms: ["ITIN", "Formulario 1040-NR"],
        rationale:
          "Obligaciones previstas para una Single Member cuyo propietario declara residencia estadounidense e ingresos de fuente estadounidense.",
      };
    }

    if (isAmericanResident) {
      return {
        forms: ["Formulario 1040 Individual"],
        rationale:
          "Obligación prevista para una Single Member cuyo propietario declara residencia estadounidense.",
      };
    }

    return {
      forms: [
        "Formulario 1120 informativo",
        "Formulario 5472 — Information Return",
      ],
      rationale:
        "Obligaciones informativas previstas para una Single Member cuyo propietario no declara residencia estadounidense.",
    };
  }

  return {
    forms: ["Revisión profesional requerida"],
    rationale:
      "La combinación registrada requiere confirmar su clasificación y obligaciones antes de presentar formularios.",
  };
};
