import type { Meta, StoryObj } from "@storybook/react-vite"

import { ObservationExample } from "./workflow-examples/observation-example"

const meta = {
  title: "Workflow Examples/Runtime Observation",
  component: ObservationExample,
} satisfies Meta<typeof ObservationExample>

export default meta
type Story = StoryObj<typeof meta>

export const RuntimeObservation: Story = {}
