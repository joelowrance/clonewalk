'use client'

import { PERMISSIONS } from '@compliance/shared'
import type { Permission } from '@compliance/shared'
import styles from './PermissionCheckboxGroup.module.css'

const PERMISSION_LABELS: Record<Permission, string> = {
  'manage:users':          'Manage users',
  'manage:locations':      'Manage locations',
  'manage:industries':     'Manage industries',
  'manage:surveys':        'Manage surveys',
  'manage:inspections':    'Manage inspections',
  'finalize:inspections':  'Finalize inspections',
  'manage:incidents':      'Manage incidents',
  'conduct:walkthroughs':  'Conduct walkthroughs',
}

interface PermissionCheckboxGroupProps {
  value:     Permission[]
  onChange:  (permissions: Permission[]) => void
  disabled?: boolean
}

export function PermissionCheckboxGroup({ value, onChange, disabled }: PermissionCheckboxGroupProps) {
  const selected = new Set(value)

  function toggle(p: Permission) {
    if (selected.has(p)) {
      onChange(value.filter((v) => v !== p))
    } else {
      onChange([...value, p])
    }
  }

  return (
    <fieldset className={styles.group} disabled={disabled}>
      <legend className={styles.legend}>Permissions</legend>
      {PERMISSIONS.map((p) => (
        <label key={p} className={styles.item}>
          <input
            type="checkbox"
            checked={selected.has(p)}
            onChange={() => toggle(p)}
            disabled={disabled}
          />
          <span className={styles.label}>{PERMISSION_LABELS[p]}</span>
        </label>
      ))}
    </fieldset>
  )
}
