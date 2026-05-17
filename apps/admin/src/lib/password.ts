import bcrypt from 'bcrypt'

const COST_FACTOR = 12

export const hashPassword   = (plain: string) => bcrypt.hash(plain, COST_FACTOR)
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash)
