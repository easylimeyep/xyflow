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

export interface WorkflowTourStep {
  id: string
  anchor: WorkflowTourAnchor
  title: string
  body: string
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
