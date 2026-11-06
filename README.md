# Blueprint — Planificador de LLC

Aplicación web de **Sotomayor Consulting International** para recopilar y validar la información necesaria para diseñar la estructura operativa, societaria y tributaria de una LLC en Estados Unidos.

[Ver aplicación en GitHub Pages](https://sotomayor-consulting.github.io/Blueprint/)

## Estado del proyecto

Blueprint funciona actualmente como una aplicación frontend estática. El formulario, sus validaciones y las ramas condicionales se ejecutan en el navegador.

- El evento `llc-form:submit` todavía no está conectado a una API.
- No existe persistencia definitiva de las solicitudes en un servidor.
- El informe condicional y su PDF se generan actualmente en el navegador como prototipo; la persistencia definitiva en servidor sigue en el roadmap.

## Características

- Stepper responsive de 11 pasos.
- Navegación secuencial con pasos futuros bloqueados.
- Posibilidad de regresar a cualquier paso previamente desbloqueado.
- Un único formulario Starwind para todo el flujo.
- Validación específica antes de avanzar en cada paso.
- Validación standalone para RadioGroups y CheckboxGroups.
- Preguntas y secciones condicionales según las respuestas.
- Controles ocultos deshabilitados y excluidos de `FormData`.
- Catálogos de países, estados y actividades económicas.
- Persistencia completa del borrador y del progreso mediante `localStorage`.
- Vista previa HTML condicional del informe en `/informe`.
- Vista previa paginada y descarga cliente en formato A4.
- Tipografía Blinker servida localmente en el informe y el PDF.
- Interacción mediante teclado y atributos de accesibilidad.
- Despliegue automático en GitHub Pages.

## Flujo del formulario

| Paso | Contenido |
| --- | --- |
| Inicio | Nombre y correo electrónico del cliente |
| Modelo de negocio | Actividad o modelo principal de la LLC |
| Confirmación | Operación y mercados |
| Confidencialidad | Nivel de privacidad requerido |
| Estado | Estado de formación y presencia operativa |
| Tributación | País de operación, ingresos estadounidenses y tratamiento fiscal |
| Estructura | Single Member o Partnership |
| Administración | Member-Managed o Manager-Managed |
| Método contable | Cash Basis o Accrual Basis |
| Actividad económica | Código de actividad económica NAICS |
| Final | Confirmación y aceptación de condiciones |

## Stack tecnológico

- [Astro 7](https://astro.build/)
- [TypeScript 7](https://www.typescriptlang.org/)
- [Starwind UI](https://starwind.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Astro Icon](https://www.astroicon.dev/)
- [Tabler Icons](https://tabler.io/icons)
- [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Blinker](https://fonts.google.com/specimen/Blinker) mediante Fontsource
- Node.js 22
- pnpm 12

## Requisitos

- Node.js `>= 22.12.0`
- pnpm `12.11.2`

## Instalación

```bash
git clone https://github.com/Sotomayor-Consulting/Blueprint.git
cd Blueprint
pnpm install
pnpm dev
```

La aplicación estará disponible en:

```text
http://localhost:4321/Blueprint/
```

El prefijo `/Blueprint` corresponde a la configuración actual para GitHub Pages.

## Comandos

Todos los comandos se ejecutan desde la raíz del proyecto.

| Comando | Descripción |
| --- | --- |
| `pnpm install` | Instala las dependencias |
| `pnpm dev` | Inicia el servidor de desarrollo |
| `pnpm build` | Genera el sitio estático en `dist/` |
| `pnpm preview` | Previsualiza el build de producción |
| `pnpm astro ...` | Ejecuta comandos de Astro |

> [!NOTE]
> `astro check` no funciona actualmente con TypeScript 7.0 en esta configuración. Esta limitación no afecta a `pnpm build`.

## Estructura del proyecto

```text
src/
├── assets/
│   ├── content/
│   │   ├── countries.json
│   │   └── Codigo-de-actividad.json
│   ├── icons/
│   └── images/
├── components/
│   ├── blocks/
│   │   └── stepper.astro
│   ├── forms/
│   ├── report/
│   └── starwind/
├── lib/
│   └── report/
├── layouts/
│   └── Layout.astro
├── pages/
│   ├── index.astro
│   └── informe.astro
└── styles/
```

### Archivos principales

- `src/pages/index.astro`: controla la navegación, validación, envío y reset del formulario.
- `src/components/blocks/stepper.astro`: presenta los pasos, paneles y controles de navegación responsive.
- `src/components/forms/Step*.astro`: contiene las preguntas y el comportamiento de cada etapa.
- `src/components/forms/form-draft.ts`: valida, migra y almacena el borrador completo.
- `src/lib/report/`: normaliza respuestas, deriva condiciones y construye el modelo del informe.
- `src/pages/informe.astro`: presenta el informe y gestiona su descarga como PDF.
- `src/styles/report.css`: define las hojas A4, la tipografía Blinker y sus reglas de paginación.
- `src/components/starwind/`: contiene los componentes UI utilizados por el formulario.
- `src/assets/content/`: contiene los catálogos utilizados por los Combobox.

## Arquitectura del formulario

El flujo completo utiliza exactamente un `<Form>` y una llamada explícita a `createForm()` en `src/pages/index.astro`.

`index.astro` centraliza:

- Campos que deben validarse en cada paso.
- RadioGroups y CheckboxGroups con validación standalone.
- Bloqueo y desbloqueo secuencial de pasos.
- Estado completado de cada paso.
- Envío y reset del formulario.

Las ramas condicionales se mantienen renderizadas y se controlan mediante `hidden` y controles deshabilitados. De esta forma, solo los campos de la rama visible participan en `FormData`.

> [!IMPORTANT]
> En la versión actual de Starwind, envolver los RadioGroups o CheckboxGroups standalone en `<Field name="...">` puede bloquear el navegador. Estos grupos deben permanecer fuera de esa composición y registrarse en `standaloneGroups`.

Las tarjetas Radio utilizan `nativeButton` para que cualquier zona de la tarjeta pueda seleccionarse con un solo clic.

## Contrato de envío

Al finalizar correctamente, el formulario emite el evento `llc-form:submit`:

```ts
form.addEventListener("llc-form:submit", (event) => {
  const { formData, values } = event.detail;
});
```

El detalle contiene:

- `formData`: controles exitosos del formulario, incluyendo campos repetidos.
- `values`: valores procesados por Starwind.

Los campos condicionales ocultos están deshabilitados y no aparecen en `formData`.

El evento `llc-form:reset` permite que los componentes condicionales sincronicen su interfaz después de restablecer el formulario.

Después de emitir `llc-form:submit`, el prototipo navega a `/informe/` respetando `import.meta.env.BASE_URL`.

## Persistencia local

El borrador utiliza la clave:

```text
llc-plan-draft-v2
```

Conserva:

- Todos los campos del formulario, incluidos los valores múltiples.
- Paso actual del Stepper.
- Paso máximo desbloqueado.
- Pasos completados.

La aceptación final de términos no se guarda y debe confirmarse nuevamente. Los campos de ramas condicionales ocultas tampoco se conservan porque permanecen deshabilitados y no participan en `FormData`.

La lectura y escritura se realiza de forma segura cuando `localStorage` no está disponible o contiene información inválida. Los borradores anteriores bajo `llc-plan-draft-v1` se migran automáticamente. Al restablecer el formulario se eliminan ambas versiones.

> [!WARNING]
> El borrador puede contener correo electrónico e información comercial. En equipos compartidos se recomienda restablecer el formulario al terminar.

## Informe y PDF del prototipo

La ruta `/informe/` lee el borrador local y ejecuta este flujo:

```text
FormDraftAnswers
  → normalizeAnswers()
  → deriveReportFacts()
  → buildReportModel()
  → vista previa HTML
  → html2pdf.js
```

El modelo omite las ramas que no aplican, por ejemplo los indicadores operativos cuando no existen ingresos de fuente estadounidense, el número de miembros en una Single Member LLC o el tipo de propietario único en una Partnership.

La vista previa se construye mediante nodos DOM y `textContent`; las respuestas del usuario no se insertan como HTML. El contenido se distribuye en hojas HTML A4 después de cargar Blinker, manteniendo juntas las unidades que no deben cortarse. Cada hoja se captura individualmente y se incorpora como una página A4 al PDF, completamente en el navegador y sin enviar respuestas a un servicio externo.

> [!IMPORTANT]
> El PDF es un prototipo informativo. `html2pdf.js` rasteriza el contenido principalmente mediante `html2canvas`, por lo que el texto puede no ser seleccionable, el archivo puede ser más pesado y el resultado puede variar entre dispositivos. No es un documento legal, fiscal o contable autoritativo.

## Despliegue actual

El proyecto se publica como sitio estático mediante GitHub Actions y GitHub Pages.

- Workflow: `.github/workflows/astro.yml`
- Rama de despliegue: `main`
- Node.js: 22
- pnpm: 12.11.2
- Source de GitHub Pages: **GitHub Actions**

Configuración actual de Astro:

```js
site: "https://sotomayor-consulting.github.io",
base: "/Blueprint",
```

## Añadir o modificar un paso

Al incorporar una nueva etapa se deben revisar los siguientes puntos:

1. Crear o actualizar el componente dentro de `src/components/forms/`.
2. Registrar el paso en el arreglo `steps` de `src/pages/index.astro`.
3. Añadir el componente al slot correspondiente del Stepper.
4. Registrar sus campos en `stepFields`.
5. Registrar RadioGroups o CheckboxGroups en `standaloneGroups`, si aplica.
6. Deshabilitar todos los controles de las ramas condicionales ocultas.
7. Verificar navegación, reset y contenido de `FormData`.
8. Ejecutar `pnpm build` antes de publicar.

## Roadmap

- Migración a Astro SSR con adapter de Node.js.
- Despliegue de la aplicación mediante Coolify.
- Persistencia de solicitudes en Supabase Postgres.
- Almacenamiento privado de documentos en Supabase Storage.
- Sustitución de la generación cliente por PDF condicional mediante Gotenberg.
- Descarga privada de documentos mediante enlaces temporales.
- Integración con Odoo o una API administrativa.
- Pruebas automatizadas, monitoreo y política de retención de datos.

## Limitaciones actuales

- El envío solo genera un evento en el navegador.
- No existe autenticación de usuarios.
- No existe almacenamiento de solicitudes en servidor.
- El PDF cliente no tiene trazabilidad, firma, almacenamiento ni garantía de reproducción idéntica.
- El borrador se almacena únicamente en el navegador actual.
