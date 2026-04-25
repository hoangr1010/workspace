import React from 'react'
import styles from './Button.module.css'

interface ButtonProps {
  variant?: 'ghost' | 'primary' | 'secondary' | 'approve' | 'reject'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  children?: React.ReactNode
  className?: string
}

export function Button({
  variant = 'ghost',
  size,
  disabled,
  onClick,
  children,
  className = '',
}: ButtonProps): JSX.Element {
  const cls = [
    styles.btn,
    styles[variant],
    size === 'md' ? styles.md : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  )
}
