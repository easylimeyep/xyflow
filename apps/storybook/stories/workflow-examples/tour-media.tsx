import type { WorkflowTourMedia } from "@flow/flow"

type TourMediaProps = {
  media: WorkflowTourMedia
  baseUrl: string
}

function resolveTourMediaUrl(baseUrl: string, path: string) {
  return baseUrl.endsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`
}

export function TourMedia({ media, baseUrl }: TourMediaProps) {
  return (
    <video
      src={resolveTourMediaUrl(baseUrl, media.src)}
      poster={resolveTourMediaUrl(baseUrl, media.poster)}
      width={media.width}
      height={media.height}
      // Reserve the clip's box before the poster loads; tall clips are capped
      // and letterboxed so the panel stays a predictable size.
      style={{ aspectRatio: `${media.width} / ${media.height}` }}
      className="block h-auto max-h-[min(18rem,40vh)] w-full rounded-md border border-gray-200 bg-gray-50 object-contain"
      aria-label={media.alt}
      autoPlay
      loop
      muted
      playsInline
    />
  )
}
