import type { ReactNode } from 'react'
import styles from './PageHead.module.css'

interface PageHeadProps {
  title: string
  sub?: string
  crumbs?: ReactNode
  actions?: ReactNode
}

export function PageHead({ title, sub, crumbs, actions }: PageHeadProps) {
  return (
    <div className={styles.pageHead}>
      <div>
        {crumbs && <div className={styles.crumbs}>{crumbs}</div>}
        <h1>{title}</h1>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </div>
  )
}
