const securityHeaders = [
    {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
    },
    {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
    },
    {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
    },
    {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
    },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    },
    {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
    },
    { key: 'Access-Control-Allow-Credentials', value: 'true' }, { key: 'Access-Control-Allow-Origin', value: '*' },  { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
    {
        key: 'Access-Control-Allow-Headers',
        value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    }
    // {
    //   key: 'Content-Security-Policy',
    //   value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
    // }
]

/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ]
    },
    reactStrictMode: true,
    productionBrowserSourceMaps: true,
    useFileSystemPublicRoutes: true,
    poweredByHeader: false,
    images: {
        // domains: ['flowbite.com', 'images.unsplash.com', 'media.istockphoto.com', 'images.pexels.com', 'dummyimage.com', 'images.unsplash.com', "localhost"],
        remotePatterns: [ { protocol: 'https', hostname: 'res.cloudinary.com' }, { protocol: 'https', hostname: 'dummyimage.com' }, { protocol: 'https', hostname: 'images.unsplash.com' }, { protocol: 'https', hostname: "localhost" }, ]
    },
    devIndicators: {
        position: 'bottom-left',
    },
    generateBuildId: async () => {
        // You can, for example, get the latest git commit hash here
        return '0.0.2'
    },
    // experimental: {
    //     serverActions: true,
    // },
};

export default nextConfig;
