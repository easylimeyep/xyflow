import { Suspense } from "react"

import { ExamplesPage } from "@/app/components/workflow-examples/examples-page"

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh bg-gray-100 p-6">
          <div className="text-sm text-gray-600">Loading examples...</div>
        </div>
      }
    >
      <ExamplesPage />
    </Suspense>
  )
}
