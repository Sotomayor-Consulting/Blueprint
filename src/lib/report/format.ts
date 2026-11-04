const operationalIndicatorLabels: Record<string, string> = {
  "oficina-local-bodega": "Oficina, local o bodega",
  "Inventario-en-EEUU": "Inventario en EE. UU.",
  "Servicios-ejecutados-en-EEUU": "Servicios ejecutados en EE. UU.",
  "Empleados-en-EEUU": "Empleados en EE. UU.",
  "Bien-inmueble-en-EEUU": "Bien inmueble en EE. UU.",
  "Amazon-FBA": "Amazon FBA",
};

export const formatOperationalIndicator = (value: string) =>
  operationalIndicatorLabels[value] ?? value.replaceAll("-", " ");

export const formatGeneratedAt = (date: Date) =>
  new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);

export const formatBooleanAnswer = (value: boolean | null) =>
  value === null ? "No informado" : value ? "Sí" : "No";

export const stateKey = (state: string) =>
  state
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
