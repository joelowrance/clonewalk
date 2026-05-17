import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../lib/password'

describe('hashPassword', () => {
  it('produces a bcrypt hash', async () => {
    const hash = await hashPassword('secret')
    expect(hash).toMatch(/^\$2b\$/)
  })

  it('salts each hash differently', async () => {
    const [a, b] = await Promise.all([hashPassword('secret'), hashPassword('secret')])
    expect(a).not.toBe(b)
  })
})

describe('verifyPassword', () => {
  it('returns true for the correct plaintext', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('correct', hash)).toBe(true)
  })

  it('returns false for an incorrect plaintext', async () => {
    const hash = await hashPassword('correct')
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('returns false for a tampered hash', async () => {
    const hash = await hashPassword('correct')
    const tampered = hash.slice(0, -4) + 'XXXX'
    expect(await verifyPassword('correct', tampered)).toBe(false)
  })
})
