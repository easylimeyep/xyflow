/**
 * An object ref to a DOM element that both React 18 and React 19 types accept
 * as a `ref` prop and as the result of `useRef<T>(null)`.
 *
 * `RefObject<T | null>` is what React 19 hands back, but React 18 compares it
 * to its `RefObject<T>` by type argument and rejects the extra `null`. This
 * structural shape sidesteps that comparison.
 */
export interface ElementRefObject<T extends Element> {
  readonly current: T | null
}
