import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { createStore, type StateCreator, type StoreApi } from "zustand/vanilla"

import { createContextStore } from "./create-context-store"

interface CounterState {
  count: number
  inc: () => void
}

interface CounterInitialProps {
  initialCount: number
}

function createCounterStore(
  initialProps: CounterInitialProps
): StoreApi<CounterState> {
  return createStore<CounterState>()((set) => ({
    count: initialProps.initialCount,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }))
}

describe("createContextStore", () => {
  afterEach(() => {
    cleanup()
  })

  it("initializes store from provider props", () => {
    const counter = createContextStore<CounterState, CounterInitialProps>(
      createCounterStore
    )

    function Value() {
      const value = counter.useStore((state) => state.count)
      return <span>{value}</span>
    }

    render(
      <counter.Provider initialCount={3}>
        <Value />
      </counter.Provider>
    )

    expect(screen.getByText("3").textContent).toBe("3")
  })

  it("creates store only once and ignores provider prop changes", () => {
    let factoryCalls = 0
    const counter = createContextStore<CounterState, CounterInitialProps>(
      (initialProps) => {
        factoryCalls += 1
        return createCounterStore(initialProps)
      }
    )

    function Value() {
      const value = counter.useStore((state) => state.count)
      return <span>{value}</span>
    }

    const view = render(
      <counter.Provider initialCount={1}>
        <Value />
      </counter.Provider>
    )
    expect(screen.getByText("1").textContent).toBe("1")

    view.rerender(
      <counter.Provider initialCount={10}>
        <Value />
      </counter.Provider>
    )

    expect(screen.getByText("1").textContent).toBe("1")
    expect(factoryCalls).toBe(1)
  })

  it("selects values and updates through actions", () => {
    const counter = createContextStore<CounterState, CounterInitialProps>(
      createCounterStore
    )

    function CounterView() {
      const value = counter.useStore((state) => state.count)
      const inc = counter.useStore((state) => state.inc)

      return (
        <>
          <span data-testid="count">{value}</span>
          <button onClick={inc} type="button">
            inc
          </button>
        </>
      )
    }

    render(
      <counter.Provider initialCount={5}>
        <CounterView />
      </counter.Provider>
    )

    expect(screen.getByTestId("count").textContent).toBe("5")
    act(() => {
      screen.getByRole("button", { name: "inc" }).click()
    })
    expect(screen.getByTestId("count").textContent).toBe("6")
  })

  it("supports custom equalityFn", () => {
    let renders = 0
    let capturedStore: StoreApi<CounterState> | null = null

    const counter = createContextStore<CounterState, CounterInitialProps>(
      (initialProps) => {
        const store = createCounterStore(initialProps)
        capturedStore = store
        return store
      }
    )

    function Value() {
      renders += 1
      const selected = counter.useStore(
        (state) => ({ parity: state.count % 2 }),
        (left, right) => left.parity === right.parity
      )

      return <span>{selected.parity}</span>
    }

    render(
      <counter.Provider initialCount={0}>
        <Value />
      </counter.Provider>
    )

    expect(renders).toBe(1)
    expect(capturedStore).not.toBeNull()

    act(() => {
      capturedStore!.setState({ count: 2 })
    })

    expect(renders).toBe(1)
    expect(screen.getByText("0").textContent).toBe("0")
  })

  it("supports useShallowStore for shallow comparison", () => {
    let renders = 0
    let capturedStore: StoreApi<CounterState> | null = null

    const counter = createContextStore<CounterState, CounterInitialProps>(
      (initialProps) => {
        const store = createCounterStore(initialProps)
        capturedStore = store
        return store
      }
    )

    function Value() {
      renders += 1
      const selected = counter.useShallowStore((state) => ({
        parity: state.count % 2,
      }))

      return <span>{selected.parity}</span>
    }

    render(
      <counter.Provider initialCount={0}>
        <Value />
      </counter.Provider>
    )

    expect(renders).toBe(1)
    expect(capturedStore).not.toBeNull()

    act(() => {
      capturedStore!.setState({ count: 2 })
    })

    expect(renders).toBe(1)
    expect(screen.getByText("0").textContent).toBe("0")
  })

  it("renders selected value via Item render prop", () => {
    const counter = createContextStore<CounterState, CounterInitialProps>(
      createCounterStore
    )

    render(
      <counter.Provider initialCount={8}>
        <counter.Item selector={(state) => state.count}>
          {(count) => <span>{count}</span>}
        </counter.Item>
      </counter.Provider>
    )

    expect(screen.getByText("8").textContent).toBe("8")
  })

  it("throws for useStore outside provider", () => {
    const counter = createContextStore<CounterState, CounterInitialProps>(
      createCounterStore
    )

    function BrokenConsumer() {
      counter.useStore((state) => state.count)
      return null
    }

    expect(() => render(<BrokenConsumer />)).toThrowError(
      /Missing createContextStore\.Provider/
    )
  })

  it("throws for Item outside provider", () => {
    const counter = createContextStore<CounterState, CounterInitialProps>(
      createCounterStore
    )

    expect(() =>
      render(
        <counter.Item selector={(state) => state.count}>
          {(count) => <span>{count}</span>}
        </counter.Item>
      )
    ).toThrowError(/Missing createContextStore\.Provider/)
  })

  it("accepts middleware-wrapped state creators", () => {
    let middlewareCalls = 0

    const withSpyMiddleware = <T extends object,>(
      creator: StateCreator<T, [], []>
    ): StateCreator<T, [], []> => {
      return (set, get, api) => {
        middlewareCalls += 1
        return creator(set, get, api)
      }
    }

    const counter = createContextStore<CounterState, CounterInitialProps>(
      (initialProps) =>
        createStore<CounterState>()(
          withSpyMiddleware((set) => ({
            count: initialProps.initialCount,
            inc: () => set((state) => ({ count: state.count + 1 })),
          }))
        )
    )

    render(
      <counter.Provider initialCount={2}>
        <counter.Item selector={(state) => state.count}>
          {(count) => <span>{count}</span>}
        </counter.Item>
      </counter.Provider>
    )

    expect(middlewareCalls).toBe(1)
    expect(screen.getByText("2").textContent).toBe("2")
  })
})
