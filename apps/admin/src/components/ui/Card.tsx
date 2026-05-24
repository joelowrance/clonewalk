import type { ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps {
  header?: { title: string; meta?: string; actions?: ReactNode }
  flush?: boolean
  children: ReactNode
}

export function Card({ header, flush, children }: CardProps) {
  return (
    <div className={styles.card}>
      {header && (
        <div className={styles.cardHd}>
          <h3>{header.title}</h3>
          {header.meta && <span className={styles.meta}>{header.meta}</span>}
          {header.actions && <div className={styles.hdActions}>{header.actions}</div>}
        </div>
      )}
      <div className={flush ? `${styles.cardBody} ${styles.flush}` : styles.cardBody}>
        {children}
      </div>
    </div>
  )
}
