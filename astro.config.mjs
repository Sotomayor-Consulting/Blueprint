import tailwindcss from "@tailwindcss/vite";
// @ts-check
import { defineConfig } from "astro/config";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://sotomayor-consulting.github.io",
  base: "/Blueprint",
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [icon({
    iconDir: "src/assets/icons",
  })],
});
