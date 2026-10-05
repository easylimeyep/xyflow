import type { Meta, StoryObj } from "@storybook/react-vite"

import { NodeGroupsExample } from "./workflow-examples/node-groups-example"

const meta = {
  title: "Workflow Examples/Node Groups",
  component: NodeGroupsExample,
  argTypes: {
    mode: { control: "inline-radio", options: ["edit", "observe"] },
  },
} satisfies Meta<typeof NodeGroupsExample>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Three groups: "Parse order" and "Decision" expanded, "Pricing" collapsed
 * into a card. Select nodes and press Mod+G to group them, double-click a
 * header to rename, drag a header to move a group with its nodes.
 */
export const NodeGroups: Story = {
  args: { mode: "edit" },
}

/**
 * Read-only: groups keep their labels and colors, the collapsed card shows
 * the running status of its hidden members, and expanding is local to the
 * viewer.
 */
export const ObserveMode: Story = {
  args: { mode: "observe" },
}
