import type { Meta, StoryObj } from "@storybook/react-vite"

import { CustomNodesExample } from "./workflow-examples/custom-nodes-example"

const meta = {
  title: "Workflow Examples/With Custom Nodes",
  component: CustomNodesExample,
} satisfies Meta<typeof CustomNodesExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithCustomNodes: Story = {}
