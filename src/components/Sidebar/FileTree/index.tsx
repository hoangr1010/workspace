import { useMemo, useState } from 'react'
import { useWorkspaceStore } from '../../../store/workspaceStore'
import { TreeRow } from '../../ui/TreeRow'
import { buildTree, type FileTreeNode } from './buildTree'
import styles from './FileTree.module.css'

export function FileTree(): JSX.Element | null {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  const files = useWorkspaceStore((s) => s.files)
  const activeFile = useWorkspaceStore((s) => s.activeFile)
  const openFile = useWorkspaceStore((s) => s.openFile)

  const tree = useMemo(
    () => (workspacePath ? buildTree(workspacePath, files) : []),
    [workspacePath, files],
  )

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())

  if (!workspacePath) return null

  if (files.length === 0) {
    return (
      <div className={styles.root}>
        <div className={styles.empty}>No Excel or Word files in this workspace.</div>
      </div>
    )
  }

  function toggle(folderPath: string): void {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(folderPath)) next.delete(folderPath)
      else next.add(folderPath)
      return next
    })
  }

  function renderNode(node: FileTreeNode): JSX.Element {
    if (node.kind === 'folder') {
      const isOpen = !collapsed.has(node.path)
      return (
        <div key={`folder:${node.path}`}>
          <TreeRow
            name={node.name}
            isFolder
            isOpen={isOpen}
            onClick={() => toggle(node.path)}
          />
          {isOpen && (
            <div className={styles.children}>
              {node.children.map((child) => renderNode(child))}
            </div>
          )}
        </div>
      )
    }
    return (
      <TreeRow
        key={`file:${node.file.filePath}`}
        name={node.name}
        isActive={activeFile === node.file.filePath}
        onClick={() => {
          void openFile(node.file.filePath)
        }}
      />
    )
  }

  return <div className={styles.root}>{tree.map((node) => renderNode(node))}</div>
}
