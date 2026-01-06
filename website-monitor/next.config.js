/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  env: {
    DATABASE_HOST: process.env.DATABASE_HOST || 'localhost',
    DATABASE_PORT: process.env.DATABASE_PORT || '3306',
    DATABASE_NAME: process.env.DATABASE_NAME || 't_monitor',
    DATABASE_USER: process.env.DATABASE_USER || 't_monitor',
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || '',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  },
}

module.exports = nextConfig
