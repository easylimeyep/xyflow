import type { Meta, StoryObj } from "@storybook/react-vite"

import { CustomNodeOptionsExample } from "./workflow-examples/custom-node-options-example"

const meta = {
  title: "Workflow Examples/With Custom Node Options",
  component: CustomNodeOptionsExample,
} satisfies Meta<typeof CustomNodeOptionsExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithCustomNodeOptions: Story = {}
