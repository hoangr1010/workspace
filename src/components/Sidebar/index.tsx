import styles from './Sidebar.module.css'
import { WorkspaceLabel } from './WorkspaceLabel'
import { FileTree } from './FileTree'

export function Sidebar(): JSX.Element {
  return (
    <aside className={styles.root}>
      <WorkspaceLabel />
      <FileTree />
    </aside>
  )
}
