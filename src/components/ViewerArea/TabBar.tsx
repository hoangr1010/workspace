// PLAN 1.4 — Tab bar
// Shows one tab per openFiles entry. Click to activate, close button to close,
// dirty indicator (•) replaces close icon while file is dirty (CSS hover swap).

import React from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import { Icon, type IconName } from '../ui/Icon'
import styles from './TabBar.module.css'

const TYPE_COLORS: Record<string, string> = {
  xlsx: 'var(--type-xls)',
  docx: 'var(--type-doc)',
  pptx: 'var(--type-ppt)',
}

const TYPE_ICONS: Record<string, IconName> = {
  xlsx: 'IXls',
  docx: 'IDoc',
  pptx: 'IPpt',
}

function basename(filePath: string): string {
  const slash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
  return slash >= 0 ? filePath.slice(slash + 1) : filePath
}

function ext(filePath: string): string {
  const dot = filePath.lastIndexOf('.')
  return dot >= 0 ? filePath.slice(dot + 1).toLowerCase() : ''
}

export function TabBar(): JSX.Element | null {
  const openFiles = useWorkspaceStore((s) => s.openFiles)
  const activeFile = useWorkspaceStore((s) => s.activeFile)
  const dirtyFiles = useWorkspaceStore((s) => s.dirtyFiles)
  const setActiveFile = useWorkspaceStore((s) => s.setActiveFile)
  const closeFile = useWorkspaceStore((s) => s.closeFile)

  if (openFiles.length === 0) return <div className={styles.bar} />

  return (
    <div className={styles.bar} role="tablist">
      {openFiles.map((filePath) => {
        const isActive = filePath === activeFile
        const isDirty = dirtyFiles.has(filePath)
        const fileExt = ext(filePath)
        const iconColor = TYPE_COLORS[fileExt] ?? 'var(--text-muted)'
        const iconName = TYPE_ICONS[fileExt] ?? null

        const onClose = (e: React.MouseEvent): void => {
          e.stopPropagation()
          closeFile(filePath)
        }

        return (
          <button
            key={filePath}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''} ${isDirty ? styles.isDirty : ''}`}
            onClick={() => setActiveFile(filePath)}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault()
                closeFile(filePath)
              }
            }}
          >
            <span className={styles.typeIcon} aria-hidden>
              {iconName ? (
                <Icon name={iconName} size={14} color={iconColor} />
              ) : (
                <span className={styles.typeDotFallback} style={{ background: iconColor }} />
              )}
            </span>
            <span className={styles.label}>{basename(filePath)}</span>
            <span
              className={styles.trailing}
              onClick={onClose}
              role="button"
              aria-label={`Close ${basename(filePath)}`}
            >
              <span className={styles.dirty} aria-hidden />
              <span className={styles.close} aria-hidden>
                <Icon name="IClose" size={10} />
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
