import React from 'react'
import styles from './TreeRow.module.css'

const TYPE_COLORS: Record<string, string> = {
  xlsx: 'var(--type-xls)',
  xls: 'var(--type-xls)',
  docx: 'var(--type-doc)',
  doc: 'var(--type-doc)',
  pptx: 'var(--type-ppt)',
  ppt: 'var(--type-ppt)',
}

const TYPE_LETTERS: Record<string, string> = {
  xlsx: 'X',
  xls: 'X',
  docx: 'D',
  doc: 'D',
  pptx: 'P',
  ppt: 'P',
}

function getExt(name = ''): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

interface TreeRowProps {
  name: string
  isFolder?: boolean
  isOpen?: boolean
  isActive?: boolean
  hasPending?: boolean
  depth?: number
  onClick?: React.MouseEventHandler<HTMLDivElement>
}

export function TreeRow({
  name,
  isFolder,
  isOpen,
  isActive,
  hasPending,
  depth = 0,
  onClick,
}: TreeRowProps): JSX.Element {
  const ext = getExt(name)
  const typeColor = TYPE_COLORS[ext]
  const typeLetter = TYPE_LETTERS[ext]

  const cls = [styles.row, isActive ? styles.active : ''].filter(Boolean).join(' ')

  return (
    <div
      className={cls}
      style={{ paddingLeft: `${10 + depth * 14}px` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>
        {isFolder ? '›' : ''}
      </span>
      {typeColor && (
        <span className={styles.typeLabel} style={{ color: typeColor }}>
          {typeLetter}
        </span>
      )}
      <span className={styles.name}>{name}</span>
      {hasPending && <span className={styles.dirty} />}
    </div>
  )
}
