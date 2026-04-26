import { TabBar } from './TabBar'
import styles from './ViewerArea.module.css'

export function ViewerArea(): JSX.Element {
  return (
    <main className={styles.root}>
      <TabBar />
      <div className={styles.content} />
    </main>
  )
}
