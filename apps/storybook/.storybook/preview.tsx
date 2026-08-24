import type { Preview } from "@storybook/react-vite"

import "./tailwind.css"
import "@flow/expression-editor/style.css"
import "@flow/flow/style.css"
import "./preview.css"

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="min-h-svh bg-gray-100 p-6">
        <Story />
      </div>
    ),
  ],
}

export default preview
