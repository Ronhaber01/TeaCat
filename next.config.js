/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
          ignoreBuildErrors: true,
    },
    env: {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eWFqb2Nhd3B1d3l0c2JndnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTA5NzYsImV4cCI6MjA5Njc4Njk3Nn0.TydtXxfpjMfp7pQm30QS0h62VQW6Ldvd74VAg346TGw',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktyajocawpuwytsbgvvj.supabase.co',
    },
    images: {
          remotePatterns: [
            { protocol: 'https', hostname: 'ktyajocawpuwytsbgvvj.supabase.co' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'picsum.photos' },
                ],
    },
}

module.exports = nextConfig/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
          ignoreBuildErrors: true,
    },
    env: {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0eWFqb2Nhd3B1d3l0c2JndnZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMTA5NzYsImV4cCI6MjA5Njc4Njk3Nn0.TydtXxfpjMfp7pQm30QS0h62VQW6Ldvd74VAg346TGw',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ktyajocawpuwytsbgvvj.supabase.co',
    },
    images: {
          remotePatterns: [
            { protocol: 'https', hostname: 'ktyajocawpuwytsbgvvj.supabase.co' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'picsum.photos' },
                ],
    },
}

module.exports = nextConfig
