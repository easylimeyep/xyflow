import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react"
import { shallow } from "zustand/shallow"
import { useStoreWithEqualityFn } from "zustand/traditional"
import type { StoreApi } from "zustand/vanilla"

export type ContextStoreSelector<TState, TSelected> = (state: TState) => TSelected
export type ContextStoreEqualityFn<TSelected> = (
  left: TSelected,
  right: TSelected
) => boolean

export type ContextStoreFactory<TState, TInitialProps extends object> = (
  initialProps: TInitialProps
) => StoreApi<TState>

export interface ContextStoreItemProps<TState, TSelected> {
  selector: ContextStoreSelector<TState, TSelected>
  equalityFn?: ContextStoreEqualityFn<TSelected>
  children: (selected: TSelected) => ReactNode
}

export interface ContextStore<TState, TInitialProps extends object> {
  Provider: (props: PropsWithChildren<TInitialProps>) => ReactElement
  useStore: <TSelected>(
    selector: ContextStoreSelector<TState, TSelected>,
    equalityFn?: ContextStoreEqualityFn<TSelected>
  ) => TSelected
  useShallowStore: <TSelected>(
    selector: ContextStoreSelector<TState, TSelected>
  ) => TSelected
  Item: <TSelected>(props: ContextStoreItemProps<TState, TSelected>) => ReactElement
}

export function createContextStore<TState, TInitialProps extends object>(
  factory: ContextStoreFactory<TState, TInitialProps>
): ContextStore<TState, TInitialProps> {
  const StoreContext = createContext<StoreApi<TState> | null>(null)

  function useContextStoreApi(): StoreApi<TState> {
    const store = useContext(StoreContext)
    if (store === null) {
      throw new Error(
        "Missing createContextStore.Provider in the component tree."
      )
    }

    return store
  }

  function Provider({ children, ...initialProps }: PropsWithChildren<TInitialProps>) {
    const [store] = useState(() => factory(initialProps as TInitialProps))

    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  }

  function useBoundStore<TSelected>(
    selector: ContextStoreSelector<TState, TSelected>,
    equalityFn?: ContextStoreEqualityFn<TSelected>
  ): TSelected {
    const store = useContextStoreApi()
    return useStoreWithEqualityFn(store, selector, equalityFn)
  }

  function Item<TSelected>({
    selector,
    equalityFn,
    children,
  }: ContextStoreItemProps<TState, TSelected>): ReactElement {
    const selected = useBoundStore(selector, equalityFn)
    return <>{children(selected)}</>
  }

  return {
    Provider,
    useStore: useBoundStore,
    useShallowStore: (selector) => useBoundStore(selector, shallow),
    Item,
  }
}
