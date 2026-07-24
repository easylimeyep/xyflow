import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

// The React plugin is provided by @storybook/react-vite; we only add Tailwind v4 here.
export default defineConfig({
  plugins: [tailwindcss()],
})
