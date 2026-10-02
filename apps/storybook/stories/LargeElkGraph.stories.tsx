import type { Meta, StoryObj } from "@storybook/react-vite"

import { HugeElkGraphExample } from "./workflow-examples/huge-elk-graph-example"
import { LargeElkGraphExample } from "./workflow-examples/large-elk-graph-example"

const meta = {
  title: "Workflow Examples/With Large ELK Graph",
  component: LargeElkGraphExample,
} satisfies Meta<typeof LargeElkGraphExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithLargeElkGraph: Story = {}

export const WithHugeElkGraph: Story = {
  name: "With Huge ELK Graph (~500 nodes)",
  render: () => <HugeElkGraphExample />,
}
