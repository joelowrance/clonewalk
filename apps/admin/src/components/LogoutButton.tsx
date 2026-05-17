'use client'

import { useRouter } from 'next/navigation'
import styles from './LogoutButton.module.css'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
    router.push('/login')
  }

  return (
    <button onClick={handleLogout} className={styles.button}>
      Log out
    </button>
  )
}
