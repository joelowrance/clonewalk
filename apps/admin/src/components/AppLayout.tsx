import type { ReactNode } from 'react'
import Link from 'next/link'
import styles from './AppLayout.module.css'
import { LogoutButton } from './LogoutButton'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={styles.shell}>
      <nav className={styles.topNav}>
        <span className={styles.appName}>Compliance Tracker</span>
        <LogoutButton />
      </nav>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <nav>
            <Link href="/roles" className={styles.navLink}>Roles</Link>
            <Link href="/users" className={styles.navLink}>Users</Link>
          </nav>
        </aside>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  )
}
