import * as React from "react";

import { useIsomorphicLayoutEffect } from "@workspace/ui/hooks/use-isomorphic-layout-effect";

export function useEventCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R;

export function useEventCallback<Args extends unknown[], R>(
  fn: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined;

export function useEventCallback<Args extends unknown[], R>(
  fn: ((...args: Args) => R) | undefined,
): ((...args: Args) => R) | undefined {
  const ref = React.useRef<
    ((...args: Args) => R) | undefined | typeof uninitialized
  >(uninitialized);

  useIsomorphicLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);

  return React.useCallback((...args: Args) => {
    const latest = ref.current;
    if (latest === uninitialized) {
      throw new Error("Cannot call an event handler while rendering.");
    }
    return latest?.(...args) as R;
  }, []);
}

const uninitialized = Symbol("useEventCallback");
