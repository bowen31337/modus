import type { NextConfig } from 'next';

// Validate environment variables at build/startup time
// This runs both at build time and when the dev server starts
const validateEnv = () => {
  if (typeof window !== 'undefined') return; // Skip in browser

  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      '\n\n' +
      '═'.repeat(60) + '\n' +
      '❌ Environment Variable Validation Failed\n' +
      '═'.repeat(60) + '\n\n' +
      'The following required environment variables are missing:\n' +
      missing.map(key => `  - ${key}`).join('\n') + '\n\n' +
      'Please update your .env.local file.\n' +
      'Refer to .env.example for all required variables.\n\n' +
      '═'.repeat(60) + '\n'
    );
  }

  console.log('✅ Environment variables validated successfully');
};

// Run validation
validateEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@modus/ui', '@modus/logic'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;
