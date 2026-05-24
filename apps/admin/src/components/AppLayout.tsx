import type { ReactNode } from 'react'
import styles from './AppLayout.module.css'
import { SidebarNav } from './SidebarNav'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.app}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          Compliance Tracker
        </div>
        <div className={styles.tbSearch}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4.5"/><path d="m13.5 13.5-3-3"/>
          </svg>
          <span>Search locations, users, findings, policies…</span>
          <span className={styles.tbKbd}>⌘K</span>
        </div>
        <div className={styles.tbRight}>
          <div className={styles.tbEnv}>
            <span className={styles.tbEnvDot} />
            production
          </div>
        </div>
      </header>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <SidebarNav />
        </aside>
        <main className={styles.main}>{children}</main>
      </div>
    </div>
  )
}
