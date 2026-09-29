import type { Meta, StoryObj } from "@storybook/react-vite"

import { CanvasSearchExample } from "./workflow-examples/canvas-search-example"

const meta = {
  title: "Workflow Examples/With Canvas Search",
  component: CanvasSearchExample,
  argTypes: {
    initialQuery: { control: "text" },
    showResults: { control: "boolean" },
    position: {
      control: "select",
      options: [
        "top-left",
        "top-center",
        "top-right",
        "center-left",
        "center-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ],
    },
  },
} satisfies Meta<typeof CanvasSearchExample>

export default meta
type Story = StoryObj<typeof meta>

export const SearchingAVariable: Story = {
  args: { initialQuery: "price" },
}

export const ResultsPanel: Story = {
  args: { initialQuery: "price", showResults: true },
}

export const ResultsPanelAtBottom: Story = {
  args: { initialQuery: "price", showResults: true, position: "bottom-center" },
}

export const Closed: Story = {
  args: { initialQuery: "" },
}
