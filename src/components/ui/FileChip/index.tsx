import React from 'react'
import styles from './FileChip.module.css'

const TYPE_COLORS: Record<string, string> = {
  xlsx: 'var(--type-xls)',
  xls: 'var(--type-xls)',
  docx: 'var(--type-doc)',
  doc: 'var(--type-doc)',
  pptx: 'var(--type-ppt)',
  ppt: 'var(--type-ppt)',
}

function getExt(filename?: string): string {
  return filename?.split('.').pop()?.toLowerCase() ?? ''
}

interface FileChipProps {
  filename?: string
  onClick?: React.MouseEventHandler<HTMLSpanElement>
}

export function FileChip({ filename, onClick }: FileChipProps): JSX.Element {
  const ext = getExt(filename)
  const dotColor = TYPE_COLORS[ext] ?? 'var(--text-muted)'

  return (
    <span
      className={styles.chip}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <span className={styles.dot} style={{ background: dotColor }} />
      <span className={styles.name}>{filename}</span>
    </span>
  )
}
