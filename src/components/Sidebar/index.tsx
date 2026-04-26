import styles from './Sidebar.module.css'
import { WorkspaceLabel } from './WorkspaceLabel'

export function Sidebar(): JSX.Element {
  return (
    <aside className={styles.root}>
      <WorkspaceLabel />
    </aside>
  )
}
