import type { Meta, StoryObj } from "@storybook/react-vite"

import { MixedNodesExample } from "./workflow-examples/mixed-nodes-example"

const meta = {
  title: "Workflow Examples/With Builtins + Custom Nodes",
  component: MixedNodesExample,
} satisfies Meta<typeof MixedNodesExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithBuiltinsAndCustomNodes: Story = {}
