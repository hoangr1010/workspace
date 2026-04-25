import styles from './ChatPanel.module.css'

export function ChatPanel(): JSX.Element {
  return (
    <aside className={styles.root}>
      <section className={styles.chat} />
      <section className={styles.changes} />
    </aside>
  )
}
