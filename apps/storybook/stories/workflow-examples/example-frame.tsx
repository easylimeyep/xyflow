import type { ReactNode } from "react"

type ExampleFrameProps = {
  children: ReactNode
}

export function ExampleFrame({ children }: ExampleFrameProps) {
  return (
    <section className="flex h-svh min-h-0 flex-col overflow-hidden bg-white">
      {children}
    </section>
  )
}
