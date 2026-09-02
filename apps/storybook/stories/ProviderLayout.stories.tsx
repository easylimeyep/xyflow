import type { Meta, StoryObj } from "@storybook/react-vite"

import { ProviderLayoutExample } from "./workflow-examples/provider-layout-example"

const meta = {
  title: "Workflow Examples/Host-Owned Layout",
  component: ProviderLayoutExample,
} satisfies Meta<typeof ProviderLayoutExample>

export default meta
type Story = StoryObj<typeof meta>

export const HostOwnedLayout: Story = {}
