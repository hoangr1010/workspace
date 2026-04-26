import { useWorkspaceStore } from '../../../store/workspaceStore'
import styles from './WorkspaceLabel.module.css'

export function WorkspaceLabel(): JSX.Element | null {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)
  if (!workspacePath) return null

  const name = workspacePath.split('/').pop() ?? workspacePath
  return (
    <div className={styles.root} title={workspacePath}>
      {name}
    </div>
  )
}
