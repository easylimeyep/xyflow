import type { Meta, StoryObj } from "@storybook/react-vite"

import { ElkGraphExample } from "./workflow-examples/elk-graph-example"

const meta = {
  title: "Workflow Examples/With ELK Graph",
  component: ElkGraphExample,
} satisfies Meta<typeof ElkGraphExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithElkGraph: Story = {}
