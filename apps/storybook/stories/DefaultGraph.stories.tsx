import type { Meta, StoryObj } from "@storybook/react-vite"

import { DefaultGraphExample } from "./workflow-examples/default-graph-example"

const meta = {
  title: "Workflow Examples/With Default Graph",
  component: DefaultGraphExample,
} satisfies Meta<typeof DefaultGraphExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithDefaultGraph: Story = {}
