import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@compliance/shared', '@compliance/db'],
}

export default nextConfig
