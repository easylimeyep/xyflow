export interface ClipboardAdapter {
  writeText: (text: string) => Promise<boolean>
  readText: () => Promise<string | null>
}

export const navigatorClipboardAdapter: ClipboardAdapter = {
  writeText: async (text) => {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      return false
    }
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  },
  readText: async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.readText !== "function"
    ) {
      return null
    }
    try {
      const text = await navigator.clipboard.readText()
      return typeof text === "string" ? text : null
    } catch {
      return null
    }
  },
}

let activeClipboardAdapter: ClipboardAdapter = navigatorClipboardAdapter

export function setClipboardAdapter(adapter: ClipboardAdapter): void {
  activeClipboardAdapter = adapter
}

export function getClipboardAdapter(): ClipboardAdapter {
  return activeClipboardAdapter
}

export async function writeTextToClipboard(text: string): Promise<boolean> {
  return activeClipboardAdapter.writeText(text)
}

export async function readTextFromClipboard(): Promise<string | null> {
  return activeClipboardAdapter.readText()
}
