import type { ReactNode } from 'react'
import styles from './AppLayout.module.css'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.shell}>
      <nav className={styles.topNav}>
        <span className={styles.appName}>Compliance Tracker</span>
      </nav>
      <div className={styles.body}>
        <aside className={styles.sidebar}>{/* nav links added in #04 */}</aside>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
