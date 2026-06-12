/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
          ignoreBuildErrors: true,
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
