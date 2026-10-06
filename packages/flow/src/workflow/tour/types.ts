import type { NodeKind } from "../node-registry"

export type WorkflowEditorAnchor =
  | "root"
  | "toolbar"
  | "palette"
  | "paletteToggle"
  | "canvas"
  | "controls"
  | "zoomIn"
  | "zoomOut"
  | "fitView"
  | "autoLayout"
  | "configPanel"

export interface WorkflowEditorAnchorElementMap {
  root: HTMLDivElement
  toolbar: HTMLDivElement
  palette: HTMLElement
  paletteToggle: HTMLButtonElement
  canvas: HTMLDivElement
  controls: HTMLDivElement
  zoomIn: HTMLButtonElement
  zoomOut: HTMLButtonElement
  fitView: HTMLButtonElement
  autoLayout: HTMLButtonElement
  configPanel: HTMLElement
}

export type WorkflowEditorAnchorElements =
  Partial<WorkflowEditorAnchorElementMap> & {
    paletteItems?: Partial<Record<NodeKind, HTMLElement>>
  }

export interface WorkflowEditorAnchorRefs {
  current: WorkflowEditorAnchorElements
}

export type WorkflowTourAnchor =
  | { type: "editor"; id: WorkflowEditorAnchor }
  | { type: "paletteItem"; kind: NodeKind }

/**
 * A short muted loop that demonstrates the step. Paths are relative; the host
 * resolves them against wherever it serves the recorded tour assets.
 * `width` and `height` are the clip's pixel size, so hosts can reserve its
 * aspect ratio before the poster loads; keep them in sync after re-recording.
 */
export interface WorkflowTourMedia {
  src: string
  poster: string
  alt: string
  width: number
  height: number
}

export interface WorkflowTourStep {
  id: string
  anchor: WorkflowTourAnchor
  title: string
  body: string
  media?: WorkflowTourMedia
  placement?:
    | "left"
    | "leftTop"
    | "leftBottom"
    | "right"
    | "rightTop"
    | "rightBottom"
    | "top"
    | "topLeft"
    | "topRight"
    | "bottom"
    | "bottomLeft"
    | "bottomRight"
    | "center"
}
