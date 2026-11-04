import stateInfoData from "@/components/forms/state-info.json";
import type { ReportFacts } from "./facts";
import {
  formatBooleanAnswer,
  formatGeneratedAt,
  formatOperationalIndicator,
  stateKey,
} from "./format";
import type { ReportAnswers } from "./normalize";

export interface ReportItem {
  label: string;
  value: string;
}

export interface ReportSection {
  id: string;
  eyebrow: string;
  title: string;
  introduction?: string;
  items: ReportItem[];
  bullets?: string[];
  note?: string;
}

export interface ReportModel {
  title: string;
  subtitle: string;
  generatedAt: string;
  clientEmail: string;
  version: string;
  highlights: ReportItem[];
  sections: ReportSection[];
  disclaimer: string;
}

type StateInfo = {
  Franchise_mantenimiento: string;
  Impuesto_estatal: string;
  Ventaja: string;
};

const stateInfo = stateInfoData as Record<string, StateInfo>;

const taxIntroduction = (
  answers: ReportAnswers,
  facts: ReportFacts,
) => {
  if (facts.taxesAsCorporation) {
    return "La selección plantea que la LLC sea tratada como un contribuyente corporativo separado. La elección y sus efectos deben confirmarse con un especialista tributario.";
  }
  if (facts.taxesAsPassThrough) {
    return "La selección plantea atribuir los resultados fiscales a los propietarios, sujeto a su situación particular y a las reglas aplicables.";
  }
  return `Tratamiento registrado: ${answers.taxTreatment}. Debe confirmarse antes de realizar elecciones o presentaciones fiscales.`;
};

export const buildReportModel = (
  answers: ReportAnswers,
  facts: ReportFacts,
  generatedAt = new Date(),
): ReportModel => {
  const selectedState = stateInfo[stateKey(answers.formationState)];
  const sections: ReportSection[] = [
    {
      id: "business",
      eyebrow: "01 · Perfil",
      title: "Modelo y operación del negocio",
      introduction:
        "Resumen de la actividad proyectada y del alcance comercial declarado en el formulario.",
      items: [
        { label: "Modelo de negocio", value: answers.businessModel },
        {
          label: "Descripción de la operación",
          value: answers.operationDescription,
        },
        {
          label: "Mercados de clientes",
          value: answers.clientMarkets.join(", ") || "No informado",
        },
      ],
    },
    {
      id: "state",
      eyebrow: "02 · Jurisdicción",
      title: `Formación en ${answers.formationState}`,
      introduction:
        "La conveniencia del estado depende de la operación real, la clasificación fiscal y las obligaciones de registro en otras jurisdicciones.",
      items: [
        { label: "Estado seleccionado", value: answers.formationState },
        {
          label: "Nivel de confidencialidad",
          value: answers.confidentialityLevel,
        },
        {
          label: "Presencia operativa declarada",
          value: answers.operationsPresence,
        },
        ...(selectedState
          ? [
              {
                label: "Mantenimiento referencial",
                value: selectedState.Franchise_mantenimiento,
              },
              {
                label: "Impuesto estatal referencial",
                value: selectedState.Impuesto_estatal,
              },
              {
                label: "Característica destacada",
                value: selectedState.Ventaja,
              },
            ]
          : []),
      ],
      note:
        "Los importes y reglas estatales son referenciales y pueden cambiar. Deben verificarse antes de constituir o registrar la compañía.",
    },
    {
      id: "tax",
      eyebrow: "03 · Tributación",
      title: "Escenario tributario declarado",
      introduction: taxIntroduction(answers, facts),
      items: [
        {
          label: "País principal de operación",
          value: answers.primaryOperatingCountry,
        },
        {
          label: "Ingresos de fuente estadounidense",
          value: formatBooleanAnswer(answers.hasUsSourceIncome),
        },
        { label: "Tratamiento seleccionado", value: answers.taxTreatment },
      ],
      ...(facts.hasOperationalIndicators
        ? {
            bullets: answers.operationalIndicators.map(
              formatOperationalIndicator,
            ),
            note:
              "Los indicadores operativos seleccionados requieren revisión para determinar su efecto fiscal, registral y de cumplimiento.",
          }
        : facts.hasUsSourceIncome
          ? {
              note:
                "Se declararon ingresos de fuente estadounidense sin indicadores operativos adicionales seleccionados.",
            }
          : {}),
    },
    {
      id: "structure",
      eyebrow: "04 · Propiedad",
      title: "Estructura societaria",
      introduction: facts.isPartnership
        ? "La LLC se plantea con dos o más miembros. El Operating Agreement deberá definir propiedad, decisiones, distribuciones y mecanismos de salida."
        : "La LLC se plantea con un único miembro y propiedad concentrada en un solo titular.",
      items: [
        { label: "Tipo de estructura", value: answers.structureType },
        ...(facts.isSingleMember
          ? [
              {
                label: "Tipo de miembro único",
                value: answers.singleMemberOwnerType,
              },
            ]
          : []),
        ...(facts.isPartnership
          ? [
              {
                label: "Cantidad de miembros",
                value: answers.numberOfMembers,
              },
            ]
          : []),
      ],
    },
    {
      id: "management",
      eyebrow: "05 · Gobierno",
      title: "Administración y representación",
      introduction: facts.isManagerManaged
        ? "La gestión se delegará a uno o varios Managers. El Operating Agreement deberá delimitar su autoridad y las decisiones reservadas a los miembros."
        : "Los miembros administrarán directamente la compañía. El Operating Agreement deberá establecer facultades, votaciones y límites de representación.",
      items: [
        {
          label: "Modelo administrativo",
          value: answers.managementModel,
        },
      ],
    },
    {
      id: "accounting",
      eyebrow: "06 · Registros",
      title: "Método contable y actividad económica",
      introduction:
        "Estas selecciones orientan la configuración inicial de registros y deben armonizarse con la clasificación fiscal definitiva.",
      items: [
        { label: "Método contable", value: answers.accountingMethod },
        {
          label: "Actividad económica principal",
          value: answers.primaryEconomicActivity,
        },
      ],
    },
    {
      id: "review",
      eyebrow: "07 · Próximos pasos",
      title: "Puntos para revisión profesional",
      items: [],
      bullets: [
        "Confirmar la relación entre el estado de formación y el lugar de operación real.",
        "Validar la clasificación tributaria y los formularios federales y estatales aplicables.",
        facts.isPartnership
          ? "Definir porcentajes, aportes, distribuciones y reglas de decisión entre los miembros."
          : "Confirmar la identidad y clasificación fiscal del miembro único.",
        facts.isManagerManaged
          ? "Documentar el nombramiento, las facultades y los límites del Manager."
          : "Documentar las facultades de administración y representación de los miembros.",
        "Verificar obligaciones contables, bancarias, de licencias y de beneficiarios finales vigentes.",
      ],
    },
  ];

  return {
    title: "Informe de planificación estratégica y diseño legal y tributario de la LLC",
    subtitle:
      "Resumen de las decisiones registradas en el formulario",
    generatedAt: formatGeneratedAt(generatedAt),
    clientEmail: answers.email,
    version: "Prototipo · Plantilla 1.0",
    highlights: [
      { label: "Estado", value: answers.formationState },
      { label: "Estructura", value: answers.structureType },
      { label: "Tributación", value: answers.taxTreatment },
      { label: "Administración", value: answers.managementModel },
    ],
    sections,
    disclaimer:
      "Este informe es un prototipo informativo generado a partir de respuestas proporcionadas por el usuario. No constituye asesoría legal, fiscal o contable, ni sustituye la revisión de un profesional habilitado. La información, los costos y las obligaciones deben verificarse antes de actuar.",
  };
};
