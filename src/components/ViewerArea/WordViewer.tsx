// PLAN 1.7 — Word viewer (SuperDoc)
// Mounts SuperDocEditor with the .docx ArrayBuffer received from main.
// See docs/architecture.md → "File type handling / Word".

import { useEffect, useMemo, useRef, useState } from 'react'
import { SuperDocEditor } from '@superdoc-dev/react'
import type {
  SuperDocReadyEvent,
  SuperDocContentErrorEvent,
  SuperDocExceptionEvent,
} from '@superdoc-dev/react'
import '@superdoc-dev/react/style.css'
import type { FileData } from '../../types/file'
import { useWorkspaceStore } from '../../store/workspaceStore'
import styles from './WordViewer.module.css'

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

// SuperDoc's toolbar dropdown values; we choose from these so the picked zoom
// is always one of the recognised stops.
const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200] as const
// Conservative target page width (px) at 100% zoom — accounts for Letter/A4
// page width plus SuperDoc's internal page chrome and margins.
const PAGE_WIDTH_AT_100 = 850

/** Pick the largest discrete zoom that keeps a 100%-page inside `containerWidth`. */
function pickZoomToFit(containerWidth: number): number {
  if (containerWidth <= 0) return 100
  const ratio = containerWidth / PAGE_WIDTH_AT_100
  const fitting = ZOOM_LEVELS.filter((z) => z / 100 <= ratio)
  return fitting.length > 0 ? (fitting[fitting.length - 1] ?? 50) : 50
}

type ValidationResult = { ok: true } | { ok: false; reason: string }

/** Pre-flight structural check before handing bytes to SuperDoc. */
function validateDocxBuffer(buffer: ArrayBuffer): ValidationResult {
  if (buffer.byteLength === 0) {
    return { ok: false, reason: 'This file is empty.' }
  }
  // DOCX is a ZIP archive; ZIP local-file headers start with PK\x03\x04.
  const header = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength))
  const isZip =
    header[0] === 0x50 &&
    header[1] === 0x4b &&
    header[2] === 0x03 &&
    header[3] === 0x04
  if (!isZip) {
    return { ok: false, reason: 'This file is not a valid Word document.' }
  }
  return { ok: true }
}

interface Props {
  data: FileData
  filePath: string
}

interface ErrorViewProps {
  fileName: string
  reason: string
}

function WordViewerError({ fileName, reason }: ErrorViewProps): JSX.Element {
  return (
    <div className={styles.error}>
      <div className={styles.errorIcon} aria-hidden>
        ⚠
      </div>
      <div className={styles.errorTitle}>Cannot display {fileName}</div>
      <div className={styles.errorReason}>{reason}</div>
    </div>
  )
}

export function WordViewer({ data, filePath }: Props): JSX.Element | null {
  const markDirty = useWorkspaceStore((s) => s.markDirty)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)

  // Hooks must run unconditionally — derive nullable buffer first, narrow after.
  const buffer = data.kind === 'word' ? data.buffer : null

  // Pre-flight validation runs once per buffer reference.
  const validation = useMemo<ValidationResult | null>(
    () => (buffer ? validateDocxBuffer(buffer) : null),
    [buffer],
  )

  // SuperDoc accepts File | Blob | string | object; pass a File so it has a name.
  const file = useMemo(() => {
    if (!buffer || validation?.ok !== true) return null
    const fileName = filePath.split('/').pop() ?? 'document.docx'
    return new File([buffer], fileName, { type: DOCX_MIME })
  }, [buffer, filePath, validation])

  // Clear any prior runtime error when we get a fresh buffer.
  useEffect(() => {
    setRuntimeError(null)
  }, [buffer])

  if (!buffer) return null

  // Pre-flight failure → render error block, do not mount SuperDoc.
  if (validation && !validation.ok) {
    const fileName = filePath.split('/').pop() ?? 'document.docx'
    return (
      <div ref={containerRef} className={styles.root}>
        <WordViewerError fileName={fileName} reason={validation.reason} />
      </div>
    )
  }

  // Runtime parse error after mount → swap in the error block.
  if (runtimeError) {
    const fileName = filePath.split('/').pop() ?? 'document.docx'
    return (
      <div ref={containerRef} className={styles.root}>
        <WordViewerError fileName={fileName} reason={runtimeError} />
      </div>
    )
  }

  if (!file) return null

  return (
    <div ref={containerRef} className={styles.root}>
      <SuperDocEditor
        document={file}
        documentMode="editing"
        contained
        onReady={(event: SuperDocReadyEvent) => {
          // Auto-fit zoom to viewer width on first mount.
          const width = containerRef.current?.clientWidth ?? 0
          const zoom = pickZoomToFit(width)
          // The instance API exposes setZoom; guard for older builds.
          const sd = event.superdoc as unknown as {
            setZoom?: (percent: number) => void
          }
          sd.setZoom?.(zoom)
        }}
        onEditorUpdate={() => markDirty(filePath)}
        onContentError={(event: SuperDocContentErrorEvent) => {
          setRuntimeError(
            event.error?.message ?? 'This file could not be parsed as Word document.',
          )
        }}
        onException={(event: SuperDocExceptionEvent) => {
          setRuntimeError(
            event.error?.message ?? 'An unexpected error occurred while loading this document.',
          )
        }}
      />
    </div>
  )
}
