import styles from './TitleBar.module.css'

interface TitleBarProps {
  readonly workspaceName?: string
}

export function TitleBar({ workspaceName }: TitleBarProps): JSX.Element {
  return (
    <header className={styles.root}>
      <span className={styles.workspace}>{workspaceName ?? ''}</span>
      <div className={styles.actions} />
    </header>
  )
}
