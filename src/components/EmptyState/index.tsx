import { useEffect, useState } from 'react'
import { useWorkspaceStore } from '../../store/workspaceStore'
import styles from './EmptyState.module.css'

function homeRelative(p: string): string {
  // Best-effort tilde collapse for display; full path stays in title=.
  const home = '/Users/'
  if (!p.startsWith(home)) return p
  const rest = p.slice(home.length)
  const slash = rest.indexOf('/')
  if (slash === -1) return p
  return '~/' + rest.slice(slash + 1)
}

function basename(p: string): string {
  return p.split('/').pop() ?? p
}

function dirnameDisplay(p: string): string {
  const parts = p.split('/')
  parts.pop()
  return homeRelative(parts.join('/'))
}

export function EmptyState(): JSX.Element {
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace)
  const [recents, setRecents] = useState<readonly string[]>([])

  useEffect(() => {
    void window.api.getRecentWorkspaces().then(setRecents)
  }, [])

  const onPick = async (): Promise<void> => {
    const path = await window.api.pickWorkspace()
    if (path) await setWorkspace(path)
  }

  const onPickRecent = async (path: string): Promise<void> => {
    await setWorkspace(path)
  }

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>C</div>
          <div className={styles.name}>Claude Code GUI</div>
          <div className={styles.sub}>Open a folder to get started</div>
        </div>
        <button type="button" className={styles.card} onClick={onPick}>
          <svg
            className={styles.icon}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          <span className={styles.label}>Open workspace</span>
        </button>
        {recents.length > 0 && (
          <div className={styles.recent}>
            <div className={styles.recentHeader}>Recent</div>
            <ul className={styles.recentList}>
              {recents.map((p) => (
                <li key={p}>
                  <button
                    type="button"
                    className={styles.recentItem}
                    title={p}
                    onClick={() => {
                      void onPickRecent(p)
                    }}
                  >
                    <span className={styles.recentName}>{basename(p)}</span>
                    <span className={styles.recentPath}>{dirnameDisplay(p)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
