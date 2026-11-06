import stateInfoData from "@/components/forms/state-info.json";
import { deriveFederalFilingRequirements } from "./compliance";
import type { ReportFacts } from "./facts";
import {
  formatBooleanAnswer,
  formatGeneratedAt,
  stateKey,
} from "./format";
import type { ReportAnswers } from "./normalize";

export interface ReportTableListCell {
  kind: "list";
  items: string[];
}

export type ReportTableCell = string | ReportTableListCell;

export interface ReportTable {
  headers: string[];
  rows: ReportTableCell[][];
}

export type ReportBlock =
  | { kind: "paragraph"; text: string; label?: string }
  | { kind: "table"; table: ReportTable }
  | { kind: "list"; items: string[] }
  | { kind: "selected"; label: string; value: string }
  | { kind: "note"; text: string; title?: string };

export interface ReportSubsection {
  id: string;
  title: string;
  blocks: ReportBlock[];
}

export interface ReportSection {
  id: string;
  title: string;
  introduction?: string;
  subsections?: ReportSubsection[];
  blocks?: ReportBlock[];
}

export interface ReportModel {
  title: string;
  subtitle: string;
  generatedAt: string;
  clientName: string;
  clientEmail: string;
  version: string;
  introduction: string[];
  outline: string[];
  sections: ReportSection[];
  disclaimer: string;
}

type StateInfo = {
  Franchise_mantenimiento: string;
  Impuesto_estatal: string;
  Ventaja: string;
};

const stateInfo = stateInfoData as Record<string, StateInfo>;

const taxExplanation = (answers: ReportAnswers, facts: ReportFacts) => {
  if (facts.taxesAsCorporation) {
    return "La LLC tributará como una corporación y será considerada un contribuyente independiente de sus socios. Sus utilidades estarán sujetas a las reglas del impuesto corporativo estadounidense y las distribuciones a los propietarios podrán generar consecuencias tributarias adicionales.";
  }

  if (facts.taxesAsPassThrough) {
    return "Bajo el tratamiento de entidad de paso, los resultados fiscales de la LLC se atribuyen a sus propietarios, quienes cumplen las obligaciones tributarias correspondientes según su situación particular. Generalmente, la LLC no paga impuesto federal sobre la renta como una corporación separada.";
  }

  return `El tratamiento registrado es ${answers.taxTreatment}. Su alcance debe confirmarse antes de realizar elecciones o presentaciones fiscales.`;
};

const structureExplanation = (answers: ReportAnswers, facts: ReportFacts) => {
  if (facts.isPartnership) {
    return "La LLC tendrá dos o más miembros que compartirán propiedad, control y utilidades. El Operating Agreement deberá definir participaciones, aportes, distribuciones, decisiones y mecanismos de salida.";
  }

  if (facts.isSingleMember) {
    return "La LLC tendrá un solo miembro directo y la propiedad se concentrará en un único titular. Para ciertos fines tributarios federales, los resultados de la compañía podrán atribuirse directamente a su propietario.";
  }

  return `La estructura registrada es ${answers.structureType} y deberá confirmarse antes de la incorporación.`;
};

const managementExplanation = (
  answers: ReportAnswers,
  facts: ReportFacts,
) => {
  if (facts.isManagerManaged) {
    return "En una LLC Manager-Managed, la administración se delega a uno o varios Managers, quienes pueden ser socios o personas externas. Los propietarios conservan sus derechos societarios, pero delegan la gestión conforme al Operating Agreement.";
  }

  if (answers.managementModel === "Member-Managed") {
    return "En una LLC Member-Managed, los socios son responsables de administrar la compañía y pueden ejercer facultades de representación conforme al Operating Agreement y la legislación aplicable.";
  }

  return "El modelo administrativo deberá confirmarse y documentarse en el Operating Agreement.";
};

const accountingExplanation = (answers: ReportAnswers) => {
  if (answers.accountingMethod === "Método Devengado / Accrual-Basis") {
    return {
      explanation:
        "En este método, la LLC reconoce los ingresos cuando se obtienen y los gastos cuando se incurren, independientemente del momento en que se reciba o entregue el dinero.",
      example:
        "Si la LLC presta un servicio y factura USD 1.000 en marzo, pero recibe el pago en abril, el ingreso se registra en marzo.",
      advantage:
        "Permite reflejar con mayor precisión los resultados económicos de la empresa, incluyendo sus cuentas por cobrar y por pagar.",
    };
  }

  if (answers.accountingMethod === "Método de Efectivo / Cash Basis") {
    return {
      explanation:
        "En este método, la LLC registra los ingresos cuando recibe el dinero y los gastos cuando realiza los pagos, en lugar de reconocerlos cuando se emite una factura o se contrae una obligación.",
      example:
        "Si la LLC factura USD 1.000 en marzo, pero recibe el pago en abril, el ingreso se registra en abril.",
      advantage:
        "Es un método sencillo que facilita el control del dinero recibido y pagado.",
    };
  }

  return {
    explanation:
      "El método contable no fue informado y deberá definirse antes de configurar los registros de la LLC.",
    example: "No disponible hasta seleccionar un método contable.",
    advantage: "La selección deberá confirmarse con el especialista contable.",
  };
};

export const buildReportModel = (
  answers: ReportAnswers,
  facts: ReportFacts,
  generatedAt = new Date(),
): ReportModel => {
  const selectedState = stateInfo[stateKey(answers.formationState)];
  const stateMaintenance =
    selectedState?.Franchise_mantenimiento ?? "No informado";
  const federalFiling = deriveFederalFilingRequirements(answers);
  const accounting = accountingExplanation(answers);

  const ownershipRows = [
    ["Estructura de propiedad", answers.structureType],
    ...(facts.isSingleMember
      ? [["Tipo de propietario único", answers.singleMemberOwnerType]]
      : []),
    ...(facts.isPartnership
      ? [["Cantidad de miembros", answers.numberOfMembers]]
      : []),
  ];

  const sections: ReportSection[] = [
    {
      id: "decisions",
      title: "1. Decisiones adoptadas durante la planificación",
      introduction:
        "La siguiente configuración se ha definido a partir de la información proporcionada sobre la actividad, los objetivos y la forma de operación del negocio.",
      subsections: [
        {
          id: "business-profile",
          title: "1.1 Perfil del negocio",
          blocks: [
            {
              kind: "paragraph",
              text: "Descripción de la actividad que desarrollará la LLC y sus mercados de clientes.",
            },
            {
              kind: "table",
              table: {
                headers: ["Concepto", "Información registrada"],
                rows: [
                  ["Modelo de negocio", answers.businessModel],
                  ["Descripción de la operación", answers.operationDescription],
                  [
                    "Mercados de clientes",
                    answers.clientMarkets.join(", ") || "No informado",
                  ],
                ],
              },
            },
          ],
        },
        {
          id: "jurisdiction",
          title: "1.2 Jurisdicción y confidencialidad",
          blocks: [
            {
              kind: "paragraph",
              text: "Se presenta el estado seleccionado para constituir la LLC, su nivel de confidencialidad registral y sus principales características de operación y mantenimiento.",
            },
            {
              kind: "table",
              table: {
                headers: ["Concepto", "Configuración seleccionada"],
                rows: [
                  ["Estado de constitución", answers.formationState],
                  [
                    "Confidencialidad registral",
                    answers.confidentialityLevel,
                  ],
                  [
                    "Presencia operativa en Estados Unidos",
                    answers.operationsPresence,
                  ],
                  ["Mantenimiento estatal", stateMaintenance],
                ],
              },
            },
            {
              kind: "paragraph",
              text: "La confidencialidad registral se refiere a la información disponible en los registros públicos estatales. No elimina los requerimientos de identificación ante autoridades y entidades financieras.",
            },
          ],
        },
        {
          id: "tax-treatment",
          title: "1.3 Tratamiento tributario",
          blocks: [
            {
              kind: "paragraph",
              text: "El tratamiento seleccionado define cómo se atribuirán los resultados fiscales de la LLC y orienta sus obligaciones tributarias.",
            },
            {
              kind: "table",
              table: {
                headers: ["Concepto", "Información registrada"],
                rows: [
                  [
                    "País principal de operación",
                    answers.primaryOperatingCountry,
                  ],
                  [
                    "Ingresos de fuente estadounidense declarados",
                    formatBooleanAnswer(answers.hasUsSourceIncome),
                  ],
                  ["Sistema tributario", answers.taxTreatment],
                ],
              },
            },
            { kind: "paragraph", text: taxExplanation(answers, facts) },
          ],
        },
        {
          id: "ownership",
          title: "1.4 Estructura de propiedad",
          blocks: [
            {
              kind: "paragraph",
              text: "La estructura seleccionada establece si la LLC tendrá un único propietario o varios miembros.",
            },
            {
              kind: "table",
              table: {
                headers: ["Concepto", "Configuración seleccionada"],
                rows: ownershipRows,
              },
            },
            { kind: "paragraph", text: structureExplanation(answers, facts) },
          ],
        },
        {
          id: "management",
          title: "1.5 Administración y representación",
          blocks: [
            {
              kind: "paragraph",
              text: "El sistema administrativo define quién dirigirá la compañía y ejercerá su representación conforme al Operating Agreement.",
            },
            {
              kind: "selected",
              label: "Sistema seleccionado",
              value: answers.managementModel,
            },
            {
              kind: "paragraph",
              text: managementExplanation(answers, facts),
            },
          ],
        },
        {
          id: "accounting-method",
          title: "1.6 Método contable",
          blocks: [
            {
              kind: "paragraph",
              text: "El método seleccionado determina cuándo se reconocerán los ingresos y gastos de la empresa.",
            },
            {
              kind: "selected",
              label: "Método seleccionado",
              value: answers.accountingMethod,
            },
            { kind: "paragraph", text: accounting.explanation },
            {
              kind: "paragraph",
              label: "Ejemplo práctico",
              text: accounting.example,
            },
            {
              kind: "paragraph",
              label: "Ventaja principal",
              text: accounting.advantage,
            },
          ],
        },
        {
          id: "economic-activity",
          title: "1.7 Actividad económica",
          blocks: [
            {
              kind: "paragraph",
              text: "La actividad principal de la LLC se identificará mediante el siguiente código:",
            },
            {
              kind: "selected",
              label: "Código y descripción",
              value: answers.primaryEconomicActivity,
            },
          ],
        },
      ],
    },
    {
      id: "annual-compliance",
      title: "2. Obligaciones Anuales de Cumplimiento",
      introduction:
        "Para mantener la LLC activa y en cumplimiento en Estados Unidos, la compañía deberá atender anualmente las obligaciones estatales y federales descritas a continuación.",
      subsections: [
        {
          id: "federal-compliance",
          title: "2.1 Cumplimiento Tributario Federal",
          blocks: [
            {
              kind: "paragraph",
              text: "Deberá presentar anualmente los siguientes reportes informativos ante el IRS:",
            },
            {
              kind: "table",
              table: {
                headers: ["Concepto", "Obligación prevista"],
                rows: [
                  ["Estructura", answers.structureType],
                  ["Tratamiento tributario", answers.taxTreatment],
                  [
                    "Formularios aplicables",
                    { kind: "list", items: federalFiling.forms },
                  ],
                ],
              },
            },
            { kind: "paragraph", text: federalFiling.rationale },
            {
              kind: "note",
              title: "Nota",
              text: "Los formularios indicados corresponden a las obligaciones previstas según la estructura diseñada. Dependiendo de las operaciones realizadas durante el ejercicio fiscal, podrían generarse requerimientos adicionales de cumplimiento tributario.",
            },
          ],
        },
        {
          id: "annual-maintenance",
          title: "2.2 Mantenimiento Corporativo Anual",
          blocks: [
            {
              kind: "paragraph",
              text: `La LLC deberá mantener vigente su registro ante el Estado de ${answers.formationState} mediante el cumplimiento de las obligaciones corporativas correspondientes.`,
            },
            {
              kind: "paragraph",
              text: "Nuestro servicio de Mantenimiento Anual Estatal incluye:",
            },
            {
              kind: "list",
              items: [
                "Agente Residente por un año",
                "Consultas ilimitadas por un año",
                "Acceso al Aplicativo Web por un año",
                "Presentación del Annual Report ante el Estado",
              ],
            },
          ],
        },
        {
          id: "state-fee",
          title: "2.3 Fee Estatal",
          blocks: [
            {
              kind: "paragraph",
              text: `La LLC deberá realizar anualmente el pago del Fee Estatal obligatorio. Para ${answers.formationState}, el valor estimado informado es de ${stateMaintenance}, sujeto a cambios por parte de la autoridad estatal. El cumplimiento oportuno de esta obligación es indispensable para mantener la compañía activa y en buen estado corporativo.`,
            },
            {
              kind: "paragraph",
              text: "En caso de contratar nuestro servicio de Mantenimiento Anual Estatal, nuestra firma asistirá en la gestión de dicho pago sin costo adicional de servicio, siempre que el cliente proporcione previamente los fondos correspondientes.",
            },
          ],
        },
      ],
    },
    {
      id: "final-conditions",
      title: "3. Condiciones finales",
      blocks: [
        {
          kind: "paragraph",
          text: "El presente diseño se basa en la información proporcionada y en las decisiones adoptadas durante la reunión de planificación estratégica y diseño legal y tributario. Cualquier modificación de esta información o de las decisiones acordadas deberá comunicarse oportunamente a Sotomayor Consulting International (SCI), para evaluar su impacto en la estructura de la compañía, sus obligaciones y el alcance de los servicios contratados.",
        },
        {
          kind: "paragraph",
          text: "La aprobación de este informe confirma la conformidad del cliente con el diseño descrito. A partir de dicha aprobación, el Departamento de Operaciones de SCI utilizará esta información como guía para iniciar el proceso de incorporación de la compañía y coordinar con el cliente la recopilación y preparación de los documentos necesarios. El avance del proceso estará sujeto a la entrega completa y oportuna de la documentación requerida y al cumplimiento de las condiciones del servicio contratado.",
        },
      ],
    },
  ];

  return {
    title:
      "Informe de planificación estratégica y diseño legal y tributario de la LLC",
    subtitle: "Resumen de las decisiones registradas en el formulario",
    generatedAt: formatGeneratedAt(generatedAt),
    clientName: answers.clientName,
    clientEmail: answers.email,
    version: "Prototipo · Plantilla 1.0",
    introduction: [
      `El presente informe tiene por objeto documentar los principales criterios, definiciones y lineamientos acordados durante la sesión de planificación legal y tributaria para la incorporación de la LLC en Estados Unidos de ${answers.clientName}. Su finalidad es servir como guía para la adecuada implementación y gestión de la estructura societaria.`,
      "Para efectos de claridad y organización, el contenido se encuentra estructurado en tres secciones principales:",
    ],
    outline: [
      "Decisiones adoptadas durante la planificación",
      "Obligaciones Anuales de Cumplimiento",
      "Condiciones finales",
    ],
    sections,
    disclaimer:
      "Este informe es un prototipo informativo generado a partir de las respuestas proporcionadas. No constituye asesoría legal, fiscal o contable definitiva ni sustituye la revisión de un profesional habilitado.",
  };
};
