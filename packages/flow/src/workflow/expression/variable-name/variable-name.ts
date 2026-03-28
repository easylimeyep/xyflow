export function isValidJsIdentifier(name: string): boolean {
  return /^[$A-Z_a-z][$\w]*$/.test(name)
}
