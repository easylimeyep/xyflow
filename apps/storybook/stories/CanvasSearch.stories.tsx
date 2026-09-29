import type { Meta, StoryObj } from "@storybook/react-vite"

import { CanvasSearchExample } from "./workflow-examples/canvas-search-example"

const meta = {
  title: "Workflow Examples/With Canvas Search",
  component: CanvasSearchExample,
  argTypes: {
    initialQuery: { control: "text" },
    showResults: { control: "boolean" },
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

export const Closed: Story = {
  args: { initialQuery: "" },
}
