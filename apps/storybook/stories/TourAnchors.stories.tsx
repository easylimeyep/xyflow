import type { Meta, StoryObj } from "@storybook/react-vite"

import { TourAnchorsExample } from "./workflow-examples/tour-anchors-example"

const meta = {
  title: "Workflow Examples/With Tour Anchors",
  component: TourAnchorsExample,
} satisfies Meta<typeof TourAnchorsExample>

export default meta
type Story = StoryObj<typeof meta>

export const WithTourAnchors: Story = {}
