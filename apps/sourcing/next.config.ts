import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@nev/auth', '@nev/db'],
}

export default nextConfig
