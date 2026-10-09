import { execFile } from "node:child_process"
import { mkdir, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { promisify } from "node:util"

import type { Browser, CDPSession, Locator, Page } from "@playwright/test"

import { installRecordingCursor } from "./cursor"
import { installKeycast } from "./keycast"

const run = promisify(execFile)

export const RECORDING_VIEWPORT = { width: 1280, height: 800 }
// Rendered at 2x; the frames come out at 2x where the screencast allows it.
const DEVICE_SCALE = 2
const OUTPUT_FPS = 30
const OUTPUT_MAX_WIDTH = 1200
const FRAME_JPEG_QUALITY = 92
// Distance from the caption's top edge to the bottom of the crop.
const KEYCAST_BOTTOM_OFFSET = 60
const MP4_QUALITY_CRF = "24"
const OUTPUT_DIR = path.resolve(import.meta.dirname, "../../public/tour")
const FRAMES_DIR = path.resolve(
  import.meta.dirname,
  "../../test-results/tour-frames"
)

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

declare global {
  interface Window {
    __tourKeycast?: {
      show(labels: readonly string[], x: number, y: number): void
      hide(): void
    }
  }
}

interface Point {
  x: number
  y: number
}

export interface Recorder {
  page: Page
  /**
   * Starts capturing. Page load and setup before this call are not recorded,
   * and the first captured frame becomes the poster.
   */
  markStart(): Promise<void>
  /** Crops the clip and poster to this region of the viewport (CSS px). */
  setCrop(box: Box): void
  /**
   * Shows a key-combination caption, e.g. ["⇧ Shift", "Drag"], centred near
   * the bottom of the crop.
   */
  showKeys(labels: string[]): Promise<void>
  hideKeys(): Promise<void>
}

interface Frame {
  data: Buffer
  /** Seconds, on the browser's frame clock. */
  timestamp: number
}

/**
 * Records one tour step into public/tour/<stepId>.mp4 and <stepId>.jpg.
 *
 * Frames come from the CDP screencast rather than Playwright's built-in
 * video, whose low-bitrate VP8 stream occasionally renders a washed-out
 * frame. The scenario drives the page; the recorder crops and encodes.
 */
export async function recordTourStep(
  browser: Browser,
  stepId: string,
  scenario: (recorder: Recorder) => Promise<void>
): Promise<void> {
  const context = await browser.newContext({
    viewport: RECORDING_VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    // Copy and paste go through the system clipboard.
    permissions: ["clipboard-read", "clipboard-write"],
  })
  await context.addInitScript(installRecordingCursor)
  await context.addInitScript(installKeycast)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)

  const frames: Frame[] = []
  let crop: Box | null = null
  let isCapturing = false

  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    frames.push({
      data: Buffer.from(data, "base64"),
      timestamp: metadata.timestamp ?? Date.now() / 1000,
    })
    void cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {})
  })

  try {
    await scenario({
      page,
      markStart: async () => {
        await startScreencast(cdp)
        isCapturing = true
      },
      setCrop: (box) => {
        crop = toEvenBox(box)
      },
      showKeys: async (labels) => {
        const frame = crop ?? { x: 0, y: 0, ...RECORDING_VIEWPORT }
        await page.evaluate(
          ([keys, x, y]) => window.__tourKeycast?.show(keys, x, y),
          [
            labels,
            frame.x + frame.width / 2,
            frame.y + frame.height - KEYCAST_BOTTOM_OFFSET,
          ] as const
        )
      },
      hideKeys: async () => {
        await page.evaluate(() => window.__tourKeycast?.hide())
      },
    })
    if (!isCapturing) {
      throw new Error(`Scenario "${stepId}" never called markStart()`)
    }
    // Hold the last frame for as long as the scenario's final pause ran.
    frames.push({ data: Buffer.alloc(0), timestamp: Date.now() / 1000 })
    await cdp.send("Page.stopScreencast")
  } finally {
    await context.close()
  }

  await encodeClip(stepId, toConstantRate(frames), crop)
}

async function startScreencast(cdp: CDPSession): Promise<void> {
  await cdp.send("Page.startScreencast", {
    format: "jpeg",
    quality: FRAME_JPEG_QUALITY,
    maxWidth: RECORDING_VIEWPORT.width * DEVICE_SCALE,
    maxHeight: RECORDING_VIEWPORT.height * DEVICE_SCALE,
    everyNthFrame: 1,
  })
}

/**
 * The screencast only emits a frame when the page repaints, at irregular
 * intervals. This resamples it onto a constant frame rate: each output tick
 * shows the latest frame captured by then. The trailing marker frame carries
 * only the end time.
 */
function toConstantRate(frames: Frame[]): Buffer[] {
  const shown = frames.slice(0, -1)
  const first = shown[0]
  const end = frames.at(-1)
  if (!first || !end) {
    throw new Error("The screencast produced no frames")
  }

  const tickCount = Math.max(
    1,
    Math.round((end.timestamp - first.timestamp) * OUTPUT_FPS)
  )
  const ticks: Buffer[] = []
  let current = first
  let nextIndex = 1
  for (let tick = 0; tick < tickCount; tick += 1) {
    const time = first.timestamp + tick / OUTPUT_FPS
    let next = shown[nextIndex]
    while (next && next.timestamp <= time) {
      current = next
      nextIndex += 1
      next = shown[nextIndex]
    }
    ticks.push(current.data)
  }
  return ticks
}

async function encodeClip(
  stepId: string,
  ticks: Buffer[],
  crop: Box | null
): Promise<void> {
  const framesDir = path.join(FRAMES_DIR, stepId)
  await rm(framesDir, { recursive: true, force: true })
  await mkdir(framesDir, { recursive: true })
  await mkdir(OUTPUT_DIR, { recursive: true })

  const framePattern = path.join(framesDir, "tick-%05d.jpg")
  const firstFrame = path.join(framesDir, "tick-00000.jpg")
  await Promise.all(
    ticks.map((data, index) =>
      writeFile(
        path.join(framesDir, `tick-${String(index).padStart(5, "0")}.jpg`),
        data
      )
    )
  )

  // Headless Chromium may send screencast frames at CSS size rather than at
  // the device scale, so the crop is scaled to whatever the frames really are.
  const scale = (await frameWidth(firstFrame)) / RECORDING_VIEWPORT.width
  const filters = [
    crop ? toCropFilter(crop, scale) : null,
    `scale='min(${OUTPUT_MAX_WIDTH},iw)':-2:flags=lanczos`,
  ]
    .filter(Boolean)
    .join(",")

  await run("ffmpeg", [
    "-y",
    "-framerate",
    String(OUTPUT_FPS),
    "-i",
    framePattern,
    "-vf",
    // The JPEG frames are full range, and ffmpeg keeps that in the mp4 flags.
    // Chrome ignores the flag and decodes the clip as limited range, so the
    // light canvas clips to white. Convert to limited range BT.709 and tag it.
    `${filters},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`,
    "-color_range",
    "tv",
    "-colorspace",
    "bt709",
    "-color_primaries",
    "bt709",
    "-color_trc",
    "bt709",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    MP4_QUALITY_CRF,
    "-movflags",
    "+faststart",
    "-an",
    path.join(OUTPUT_DIR, `${stepId}.mp4`),
  ])

  await run("ffmpeg", [
    "-y",
    "-i",
    firstFrame,
    "-vf",
    filters,
    "-q:v",
    "3",
    path.join(OUTPUT_DIR, `${stepId}.jpg`),
  ])
}

async function frameWidth(file: string): Promise<number> {
  const { stdout } = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width",
    "-of",
    "csv=p=0",
    file,
  ])
  const width = Number.parseInt(stdout, 10)
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error(`Could not read the frame width of ${file}`)
  }
  return width
}

function toCropFilter(crop: Box, scale: number): string {
  const even = (value: number) => Math.floor((value * scale) / 2) * 2
  return `crop=${even(crop.width)}:${even(crop.height)}:${even(crop.x)}:${even(crop.y)}`
}

// yuv420p needs even dimensions, and a crop must stay inside the frame.
function toEvenBox(box: Box): Box {
  const even = (value: number) => Math.floor(value / 2) * 2
  const x = even(Math.max(0, box.x))
  const y = even(Math.max(0, box.y))
  return {
    x,
    y,
    width: even(Math.min(box.width, RECORDING_VIEWPORT.width - x)),
    height: even(Math.min(box.height, RECORDING_VIEWPORT.height - y)),
  }
}

export async function centerOf(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error("Element has no bounding box; is it visible?")
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

const FRAME_MS = 16
const lastPointer = new WeakMap<Page, Point>()

/**
 * A human-paced pointer move. `mouse.move({ steps })` dispatches every step
 * at once, which reads as a teleport on video; this waits a frame between
 * steps and eases in and out.
 */
export async function glide(
  page: Page,
  to: Point,
  durationMs = 600
): Promise<void> {
  const from = lastPointer.get(page) ?? to
  const steps = Math.max(1, Math.round(durationMs / FRAME_MS))

  for (let step = 1; step <= steps; step += 1) {
    const t = easeInOut(step / steps)
    await page.mouse.move(
      from.x + (to.x - from.x) * t,
      from.y + (to.y - from.y) * t
    )
    await page.waitForTimeout(FRAME_MS)
  }
  lastPointer.set(page, to)
}

/** Moves the pointer without animation, e.g. to its spot before recording. */
export async function placePointer(page: Page, at: Point): Promise<void> {
  await page.mouse.move(at.x, at.y)
  lastPointer.set(page, at)
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2
}

export function pause(page: Page, ms: number): Promise<void> {
  return page.waitForTimeout(ms)
}
