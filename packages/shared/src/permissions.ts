export const PERMISSIONS = [
  'manage:users',
  'manage:locations',
  'manage:industries',
  'manage:surveys',
  'manage:inspections',
  'finalize:inspections',
  'manage:incidents',
  'conduct:walkthroughs',
] as const

export type Permission = (typeof PERMISSIONS)[number]
