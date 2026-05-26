'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import styles from './AppLayout.module.css'

const WORKSPACE_NAV = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="2" width="5.5" height="5.5" rx="1"/><rect x="2" y="8.5" width="5.5" height="5.5" rx="1"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/></svg>,
    match: (p: string) => p === '/',
  },
  {
    href: '/locations',
    label: 'Locations',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 14.5s5-4.5 5-8.5a5 5 0 1 0-10 0c0 4 5 8.5 5 8.5Z"/><circle cx="8" cy="6" r="2"/></svg>,
    match: (p: string) => p.startsWith('/locations'),
  },
  {
    href: '/users',
    label: 'Users',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="6" r="2.5"/><path d="M1.5 13.5c0-2.2 2-4 4.5-4s4.5 1.8 4.5 4"/><circle cx="11.5" cy="5" r="2"/><path d="M10 13.5c0-1.5.6-2.8 1.6-3.5 2 .2 3.4 1.7 3.4 3.5"/></svg>,
    match: (p: string) => p.startsWith('/users'),
  },
]

const PROGRAMS_NAV = [
  {
    href: '/roles',
    label: 'Roles',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 1.5 13 4v4c0 3-2.2 5.5-5 6.5-2.8-1-5-3.5-5-6.5V4l5-2.5Z"/><path d="m5.8 8 1.6 1.6L10.5 6.5"/></svg>,
    match: (p: string) => p.startsWith('/roles'),
  },
  {
    href: '/industries',
    label: 'Industries',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1.5" y="8.5" width="3" height="5.5"/><rect x="6.5" y="5.5" width="3" height="8.5"/><rect x="11.5" y="2.5" width="3" height="11.5"/><path d="M1.5 8.5 6.5 5.5 11.5 2.5" strokeLinecap="round"/></svg>,
    match: (p: string) => p.startsWith('/industries'),
  },
  {
    href: '/surveys',
    label: 'Surveys',
    icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="12" height="12" rx="1.5"/><path d="M5 5.5h6M5 8h6M5 10.5h4" strokeLinecap="round"/></svg>,
    match: (p: string) => p.startsWith('/surveys'),
  },
]

function emailInitials(email: string): string {
  const local = email.split('@')[0] ?? email
  const parts = local.split('.')
  if (parts.length >= 2) {
    return ((parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase()
}

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.user?.email) setEmail(d.user.email) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
    router.push('/login')
  }

  return (
    <>
      <div className={styles.sbSection}>Workspace</div>
      {WORKSPACE_NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={item.match(pathname) ? `${styles.sbItem} ${styles.sbItemActive}` : styles.sbItem}
        >
          {item.icon}
          <span className={styles.sbLabel}>{item.label}</span>
        </Link>
      ))}
      <div className={styles.sbSection}>Programs</div>
      {PROGRAMS_NAV.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={item.match(pathname) ? `${styles.sbItem} ${styles.sbItemActive}` : styles.sbItem}
        >
          {item.icon}
          <span className={styles.sbLabel}>{item.label}</span>
        </Link>
      ))}
      <div className={styles.sbFoot}>
        <div className={styles.sbAvatar}>{email ? emailInitials(email) : '…'}</div>
        <div className={styles.sbWho}>
          <b>{email || '…'}</b>
          <span>Admin</span>
        </div>
        <button className={styles.sbLogout} onClick={handleLogout} title="Log out">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>
            <path d="M10 11l3-3-3-3M13 8H6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </>
  )
}
