import React from 'react'
import styles from './ChatMessage.module.css'

interface ChatMessageProps {
  role?: 'user' | 'assistant'
  name?: string
  children?: React.ReactNode
}

export function ChatMessage({
  role = 'user',
  name,
  children,
}: ChatMessageProps): JSX.Element {
  const isClaude = role === 'assistant'
  const displayName = name ?? (isClaude ? 'Claude' : 'You')
  const initials = displayName[0]?.toUpperCase() ?? '?'

  return (
    <div className={styles.message}>
      <div className={`${styles.avatar} ${isClaude ? styles.avatarClaude : styles.avatarUser}`}>
        {isClaude ? 'C' : initials}
      </div>
      <div className={styles.body}>
        <div className={styles.name}>{displayName}</div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
