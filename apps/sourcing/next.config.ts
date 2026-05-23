import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@nev/auth', '@nev/db', '@nev/ingestion'],
}

export default nextConfig
