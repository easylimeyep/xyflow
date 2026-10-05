/** What assistive technology announces for a group header or card. */
export function describeGroup(
  label: string,
  memberCount: number,
  options: { collapsed?: boolean } = {}
): string {
  const members = memberCount === 1 ? "1 node" : `${memberCount} nodes`
  return options.collapsed
    ? `Group ${label}, ${members}, collapsed`
    : `Group ${label}, ${members}`
}
