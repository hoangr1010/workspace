import React from 'react'

/* All 25 icons from the AI Workspace design system.
   Drawn on a 16-unit grid, 1.4 stroke, round caps & joins.
   Usage: <Icon name="IFiles" size={16} color="currentColor" /> */

const PATHS: Record<string, string> = {
  IFiles:
    '<path d="M2.5 4.5a1 1 0 0 1 1-1h3l1.5 1.5h4.5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5Z"/>',
  ISearch: '<circle cx="7" cy="7" r="4.25"/><path d="M10.5 10.5 13.5 13.5"/>',
  IChat:
    '<path d="M13 7a4.5 4.5 0 0 1-4.5 4.5H6l-3 2.5v-2.8a4.5 4.5 0 1 1 10-4.2Z"/>',
  IHistory:
    '<path d="M2.5 8a5.5 5.5 0 1 0 1.7-3.95M2.5 2.5V5h2.5"/><path d="M8 5v3l2 1.5"/>',
  ISettings:
    '<circle cx="8" cy="8" r="2"/><path d="M8 1.5v1.6M8 12.9v1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M1.5 8h1.6M12.9 8h1.6M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>',
  ICommand:
    '<path d="M5 5h6v6H5z"/><circle cx="3.5" cy="3.5" r="1.5"/><circle cx="12.5" cy="3.5" r="1.5"/><circle cx="3.5" cy="12.5" r="1.5"/><circle cx="12.5" cy="12.5" r="1.5"/>',
  IChevron: '<path d="M6 4l4 4-4 4"/>',
  IFolder:
    '<path d="M2.5 4.5a1 1 0 0 1 1-1h2.8l1.2 1.4h5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1V4.5Z"/>',
  IFile:
    '<path d="M4 2.5h5L12 5.5V13a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V2.5Z"/><path d="M9 2.5V5.5h3"/>',
  IGrip:
    '<circle cx="6" cy="4" r=".6" fill="currentColor"/><circle cx="10" cy="4" r=".6" fill="currentColor"/><circle cx="6" cy="8" r=".6" fill="currentColor"/><circle cx="10" cy="8" r=".6" fill="currentColor"/><circle cx="6" cy="12" r=".6" fill="currentColor"/><circle cx="10" cy="12" r=".6" fill="currentColor"/>',
  IPaperclip:
    '<path d="M10.5 5.5 6 10a2 2 0 0 1-2.8-2.8l5-5a3 3 0 0 1 4.2 4.2L7.5 11a1.5 1.5 0 0 1-2.1-2.1l4-4"/>',
  IClose: '<path d="M4 4l8 8M12 4l-8 8"/>',
  IPlus: '<path d="M8 3.5v9M3.5 8h9"/>',
  ICheck: '<path d="M3.5 8.5 7 11.5l5.5-7"/>',
  ISend: '<path d="M13.5 2.5 2 7l5 1.5L8.5 14l5-11.5Z"/>',
  IPeople:
    '<circle cx="6" cy="5.5" r="2"/><circle cx="11" cy="6" r="1.6"/><path d="M2.5 13c0-2 1.6-3.3 3.5-3.3s3.5 1.3 3.5 3.3"/><path d="M10 10c1.6 0 3 1.1 3.5 2.7"/>',
  ISparkle: '<path d="M8 2.5 9 7l4.5 1L9 9l-1 4.5L7 9 2.5 8 7 7l1-4.5Z"/>',
  IStar:
    '<path d="M8 2.5 9.7 6l3.8.6-2.8 2.7.7 3.8L8 11.3 4.6 13l.7-3.8L2.5 6.6 6.3 6 8 2.5Z"/>',
  IDot: '<circle cx="8" cy="8" r="1.5" fill="currentColor"/>',
  IDiff:
    '<path d="M5 2v12M3 4l2-2 2 2M11 14V2M13 12l-2 2-2-2"/>',
  IUndo:
    '<path d="M3 6h6.5a3.5 3.5 0 0 1 0 7H6"/><path d="M5.5 3.5 3 6l2.5 2.5"/>',
  IXls:
    '<path d="M4 2.5h5L12 5.5V13a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V2.5Z"/><path d="M9 2.5V5.5h3"/><path d="M6 8.5l2 3M8 8.5l-2 3" stroke-width="1.2"/>',
  IDoc:
    '<path d="M4 2.5h5L12 5.5V13a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V2.5Z"/><path d="M9 2.5V5.5h3"/><path d="M5.8 8h4.4M5.8 10h4.4M5.8 12h2.5" stroke-width="1.2"/>',
  IPpt:
    '<path d="M4 2.5h5L12 5.5V13a.5.5 0 0 1-.5.5h-7A.5.5 0 0 1 4 13V2.5Z"/><path d="M9 2.5V5.5h3"/><rect x="5.8" y="8" width="4.4" height="3" rx=".5" stroke-width="1.2"/>',
}

export const ICON_NAMES = Object.keys(PATHS)

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export function Icon({
  name,
  size = 16,
  color = 'currentColor',
  className = '',
}: IconProps): JSX.Element | null {
  const paths = PATHS[name]
  if (!paths) return null

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', flexShrink: 0 }}
      className={className}
      dangerouslySetInnerHTML={{ __html: paths }}
    />
  )
}
