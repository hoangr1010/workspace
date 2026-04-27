import React from 'react'
import { Icon, type IconName } from '../Icon'
import styles from './TreeRow.module.css'

const TYPE_COLORS: Record<string, string> = {
  xlsx: 'var(--type-xls)',
  xls: 'var(--type-xls)',
  docx: 'var(--type-doc)',
  doc: 'var(--type-doc)',
  pptx: 'var(--type-ppt)',
  ppt: 'var(--type-ppt)',
}

const TYPE_ICONS: Record<string, IconName> = {
  xlsx: 'IXls',
  xls: 'IXls',
  docx: 'IDoc',
  doc: 'IDoc',
  pptx: 'IPpt',
  ppt: 'IPpt',
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
  const typeIcon = TYPE_ICONS[ext]

  const cls = [styles.row, isActive ? styles.active : ''].filter(Boolean).join(' ')

  return (
    <div
      className={cls}
      style={depth > 0 ? { paddingLeft: `${depth * 14 + 10}px` } : undefined}
      onClick={onClick}
      role="button"
      tabIndex={0}
    >
      <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>
        {isFolder ? '›' : ''}
      </span>
      {typeIcon && (
        <span className={styles.typeIcon} aria-hidden>
          <Icon name={typeIcon} size={14} color={typeColor ?? 'var(--text-muted)'} />
        </span>
      )}
      <span className={styles.name}>{name}</span>
      {hasPending && <span className={styles.dirty} />}
    </div>
  )
}
