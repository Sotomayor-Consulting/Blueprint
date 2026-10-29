# Blueprint — Planificador de LLC

Aplicación web de **Sotomayor Consulting International** para recopilar y validar la información necesaria para diseñar la estructura operativa, societaria y tributaria de una LLC en Estados Unidos.

[Ver aplicación en GitHub Pages](https://sotomayor-consulting.github.io/Blueprint/)

## Estado del proyecto

Blueprint funciona actualmente como una aplicación frontend estática. El formulario, sus validaciones y las ramas condicionales se ejecutan en el navegador.

- El evento `llc-form:submit` todavía no está conectado a una API.
- No existe persistencia definitiva de las solicitudes en un servidor.
- Supabase, Coolify y la generación condicional de PDF forman parte del roadmap y aún no están implementados.

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
- Interacción mediante teclado y atributos de accesibilidad.
- Despliegue automático en GitHub Pages.

## Flujo del formulario

| Paso | Contenido |
| --- | --- |
| Inicio | Correo electrónico del cliente |
| Modelo de negocio | Actividad o modelo principal de la LLC |
| Confirmación | Operación, ingresos proyectados y mercados |
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
│   └── starwind/
├── layouts/
│   └── Layout.astro
├── pages/
│   └── index.astro
└── styles/
```

### Archivos principales

- `src/pages/index.astro`: controla la navegación, validación, envío y reset del formulario.
- `src/components/blocks/stepper.astro`: presenta los pasos, paneles y controles de navegación responsive.
- `src/components/forms/Step*.astro`: contiene las preguntas y el comportamiento de cada etapa.
- `src/components/forms/form-draft.ts`: valida, migra y almacena el borrador completo.
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
- Generación de PDF condicional mediante Gotenberg.
- Descarga privada de documentos mediante enlaces temporales.
- Integración con Odoo o una API administrativa.
- Pruebas automatizadas, monitoreo y política de retención de datos.

## Limitaciones actuales

- El envío solo genera un evento en el navegador.
- No existe autenticación de usuarios.
- No existe almacenamiento de solicitudes en servidor.
- No se genera ningún PDF todavía.
- El borrador se almacena únicamente en el navegador actual.
