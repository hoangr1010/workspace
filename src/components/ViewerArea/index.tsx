// PLAN 1.6 / 1.7 / 4.3 — Routes the active tab to its Viewer component via fileRegistry.

import { useWorkspaceStore } from '../../store/workspaceStore'
import { fileRegistry } from '../../lib/fileRegistry'
import { getFileExt } from '../../lib/fileExt'
import { TabBar } from './TabBar'
import styles from './ViewerArea.module.css'

export function ViewerArea(): JSX.Element {
  const activeFile = useWorkspaceStore((s) => s.activeFile)
  const fileData = useWorkspaceStore((s) => s.fileData)

  const ext = activeFile ? getFileExt(activeFile) : null
  const handler = ext ? fileRegistry[ext] : undefined
  const data = activeFile ? fileData.get(activeFile) : undefined

  return (
    <main className={styles.root}>
      <TabBar />
      <div className={styles.content}>
        {handler && data
          // key={activeFile} ensures Univer fully unmounts/remounts on file switch (no stale state)
          ? <handler.Viewer key={activeFile} data={data} filePath={activeFile!} />
          : activeFile
            ? <div className={styles.placeholder}>Loading…</div>
            : null}
      </div>
    </main>
  )
}
