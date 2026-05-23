process.loadEnvFile?.()
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
  useRouter: vi.fn(),
}))
