import type { Meta, StoryObj } from "@storybook/react-vite"

import { JsonNodesExample } from "./workflow-examples/json-nodes-example"

const meta = {
  title: "Workflow Examples/With JSON Nodes",
  component: JsonNodesExample,
} satisfies Meta<typeof JsonNodesExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithJsonNodes: Story = {}
