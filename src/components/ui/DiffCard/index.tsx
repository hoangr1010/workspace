import React from 'react'
import styles from './DiffCard.module.css'
import { Button } from '../Button'

interface DiffCardProps {
  title?: string
  oldValue?: React.ReactNode
  newValue?: React.ReactNode
  reason?: string
  onApprove?: React.MouseEventHandler<HTMLButtonElement>
  onReject?: React.MouseEventHandler<HTMLButtonElement>
}

export function DiffCard({
  title,
  oldValue,
  newValue,
  reason,
  onApprove,
  onReject,
}: DiffCardProps): JSX.Element {
  return (
    <div className={styles.card}>
      {title && <div className={styles.title}>{title}</div>}
      {oldValue != null && (
        <div className={`${styles.line} ${styles.lineRemove}`}>{oldValue}</div>
      )}
      {newValue != null && (
        <div className={`${styles.line} ${styles.lineAdd}`}>{newValue}</div>
      )}
      {reason && <div className={styles.reason}>{reason}</div>}
      {(onApprove || onReject) && (
        <div className={styles.actions}>
          {onApprove && (
            <Button variant="approve" onClick={onApprove}>
              Approve
            </Button>
          )}
          {onReject && (
            <Button variant="reject" onClick={onReject}>
              Reject
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
