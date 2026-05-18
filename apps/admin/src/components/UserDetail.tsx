'use client'

import { useState, useEffect, useCallback } from 'react'
import { PERMISSIONS } from '@compliance/shared'
import type { Permission } from '@compliance/shared'
import styles from './UserDetail.module.css'

interface Role {
  id:   string
  name: string
}

interface Override {
  permission: Permission
  granted:    boolean
}

interface UserData {
  id:                   string
  email:                string
  status:               'active' | 'pending'
  roles:                Role[]
  overrides:            Override[]
  effectivePermissions: Permission[]
}

interface UserDetailProps {
  userId: string
}

type OverrideState = 'none' | 'grant' | 'deny'

export function UserDetail({ userId }: UserDetailProps) {
  const [user, setUser]               = useState<UserData | null>(null)
  const [allRoles, setAllRoles]       = useState<Role[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  const [selectedRoles, setSelectedRoles]     = useState<Set<string>>(new Set())
  const [overrideState, setOverrideState]     = useState<Map<Permission, OverrideState>>(new Map())
  const [savingRoles, setSavingRoles]         = useState(false)
  const [savingOverrides, setSavingOverrides] = useState(false)
  const [rolesError, setRolesError]           = useState<string | null>(null)
  const [overridesError, setOverridesError]   = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [userRes, rolesRes] = await Promise.all([
        fetch(`/api/users/${userId}`),
        fetch('/api/roles'),
      ])
      if (!userRes.ok || !rolesRes.ok) throw new Error('Failed to load')

      const userData  = await userRes.json()  as { user: UserData }
      const rolesData = await rolesRes.json() as { roles: Role[] }

      setUser(userData.user)
      setAllRoles(rolesData.roles)
      setSelectedRoles(new Set(userData.user.roles.map((r) => r.id)))

      const overMap = new Map<Permission, OverrideState>()
      for (const o of userData.user.overrides) {
        overMap.set(o.permission, o.granted ? 'grant' : 'deny')
      }
      setOverrideState(overMap)
    } catch {
      setError('Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { void load() }, [load])

  function toggleRole(id: string) {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function setOverride(p: Permission, state: OverrideState) {
    setOverrideState((prev) => {
      const next = new Map(prev)
      if (state === 'none') next.delete(p)
      else next.set(p, state)
      return next
    })
  }

  async function saveRoles() {
    setRolesError(null)
    setSavingRoles(true)
    try {
      const res = await fetch(`/api/users/${userId}/roles`, {
        method:  'PUT',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ roleIds: [...selectedRoles] }),
      })
      if (res.ok) {
        const data = await res.json() as { user: UserData }
        setUser(data.user)
        setSelectedRoles(new Set(data.user.roles.map((r) => r.id)))
      } else if (res.status === 403) {
        setRolesError('Cannot remove your own manage:users permission')
      } else {
        setRolesError('Failed to save roles')
      }
    } catch {
      setRolesError('Failed to save roles')
    } finally {
      setSavingRoles(false)
    }
  }

  async function saveOverrides() {
    setOverridesError(null)
    setSavingOverrides(true)
    const overrides = [...overrideState.entries()].map(([permission, state]) => ({
      permission,
      granted: state === 'grant',
    }))
    try {
      const res = await fetch(`/api/users/${userId}/overrides`, {
        method:  'PUT',
        headers: { 'content-type': 'application/json' },
        body:    JSON.stringify({ overrides }),
      })
      if (res.ok) {
        const data = await res.json() as { user: UserData }
        setUser(data.user)
        const overMap = new Map<Permission, OverrideState>()
        for (const o of data.user.overrides) overMap.set(o.permission, o.granted ? 'grant' : 'deny')
        setOverrideState(overMap)
      } else if (res.status === 403) {
        setOverridesError('Cannot remove your own manage:users permission')
      } else {
        setOverridesError('Failed to save overrides')
      }
    } catch {
      setOverridesError('Failed to save overrides')
    } finally {
      setSavingOverrides(false)
    }
  }

  if (loading) return <p className={styles.loading}>Loading…</p>
  if (error || !user) return <p className={styles.loading}>{error ?? 'User not found'}</p>

  return (
    <div className={styles.page}>
      <div className={styles.userHeader}>
        <h1 className={styles.email}>{user.email}</h1>
        <span className={styles.status} data-status={user.status}>{user.status}</span>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Roles</h2>
        <div className={styles.checkList}>
          {allRoles.map((role) => (
            <label key={role.id} className={styles.checkItem}>
              <input
                type="checkbox"
                checked={selectedRoles.has(role.id)}
                onChange={() => toggleRole(role.id)}
                disabled={savingRoles}
              />
              <span>{role.name}</span>
            </label>
          ))}
          {allRoles.length === 0 && <p className={styles.hint}>No roles exist yet.</p>}
        </div>
        {rolesError && <p className={styles.fieldError} role="alert">{rolesError}</p>}
        <button className={styles.saveBtn} onClick={saveRoles} disabled={savingRoles}>
          {savingRoles ? 'Saving…' : 'Save roles'}
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Permission overrides</h2>
        <p className={styles.hint}>Override individual permissions above or below what the user&apos;s roles grant.</p>
        <div className={styles.overrideTable}>
          {PERMISSIONS.map((p) => {
            const state = overrideState.get(p) ?? 'none'
            return (
              <div key={p} className={styles.overrideRow}>
                <span className={styles.permName}>{p}</span>
                <select
                  value={state}
                  onChange={(e) => setOverride(p, e.target.value as OverrideState)}
                  className={styles.overrideSelect}
                  disabled={savingOverrides}
                >
                  <option value="none">No override</option>
                  <option value="grant">Grant</option>
                  <option value="deny">Deny</option>
                </select>
              </div>
            )
          })}
        </div>
        {overridesError && <p className={styles.fieldError} role="alert">{overridesError}</p>}
        <button className={styles.saveBtn} onClick={saveOverrides} disabled={savingOverrides}>
          {savingOverrides ? 'Saving…' : 'Save overrides'}
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Effective permissions</h2>
        <p className={styles.hint}>Resolved permissions this user currently has (roles + overrides).</p>
        {user.effectivePermissions.length === 0 ? (
          <p className={styles.hint}>None.</p>
        ) : (
          <ul className={styles.permList}>
            {user.effectivePermissions.map((p) => (
              <li key={p} className={styles.permItem}>{p}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
