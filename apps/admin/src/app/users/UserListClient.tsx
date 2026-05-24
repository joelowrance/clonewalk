'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PageHead } from '@/components/ui/PageHead'
import { Pill } from '@/components/ui/Pill'
import styles from './page.module.css'

interface UserRow {
  id:     string
  email:  string
  status: 'active' | 'pending'
  roles:  Array<{ id: string; name: string }>
}

const AVATAR_HUES = [210, 280, 340, 20, 160, 50, 190]

function emailInitials(email: string): string {
  const local = email.split('@')[0] ?? ''
  return (local[0] ?? '?').toUpperCase()
}

function emailHue(email: string): number {
  let h = 0
  for (let i = 0; i < email.length; i++) h = (h * 31 + email.charCodeAt(i)) & 0xffff
  return AVATAR_HUES[h % AVATAR_HUES.length] ?? 210
}

export function UserListClient() {
  const [users, setUsers]     = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [q, setQ]             = useState('')
  const router = useRouter()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/users')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json() as { users: UserRow[] }
      setUsers(data.users)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = users.filter(u =>
    !q || u.email.toLowerCase().includes(q.toLowerCase())
  )

  const active  = users.filter(u => u.status === 'active').length
  const pending = users.filter(u => u.status === 'pending').length

  if (loading) return <p className={styles.empty}>Loading…</p>
  if (error)   return <p className={styles.empty}>{error}</p>

  return (
    <div>
      <PageHead
        title="Users"
        sub={`${users.length} account${users.length === 1 ? '' : 's'} · ${active} active · ${pending} invited`}
        actions={
          <Link href="/users/invite" className={styles.btnPrimary}>
            + Invite user
          </Link>
        }
      />

      <div className={styles.card}>
        <div className={styles.toolsRow}>
          <div className={styles.search}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
              <circle cx="7" cy="7" r="4.5"/><path d="m13.5 13.5-3-3"/>
            </svg>
            <input
              placeholder="Search by email…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          <span className={styles.count}>
            {filtered.length} of {users.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {q ? 'No users match your search.' : 'No users yet.'}
          </div>
        ) : (
          <table className={styles.tbl}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const hue = emailHue(user.email)
                return (
                  <tr key={user.id} onClick={() => router.push(`/users/${user.id}`)}>
                    <td>
                      <div className={styles.userCell}>
                        <span
                          className={styles.avatar}
                          style={{ '--hue': hue } as React.CSSProperties}
                        >
                          {emailInitials(user.email)}
                        </span>
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      {user.roles.length === 0
                        ? <span className={styles.noRoles}>No roles</span>
                        : user.roles[0]!.name}
                    </td>
                    <td>
                      <Pill kind={user.status === 'active' ? 'good' : 'info'}>
                        {user.status === 'active' ? 'Active' : 'Invited'}
                      </Pill>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
