import type { ReactNode } from 'react'
import styles from './Pill.module.css'

interface PillProps {
  kind?: 'good' | 'warn' | 'bad' | 'info'
  dot?: boolean
  children: ReactNode
}

export function Pill({ kind, dot = true, children }: PillProps) {
  const cls = [styles.pill, kind ? styles[kind] : ''].filter(Boolean).join(' ')
  return (
    <span className={cls}>
      {dot && <span className={styles.dot} />}
      {children}
    </span>
  )
}
