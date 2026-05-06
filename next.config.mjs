/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "vvmsftyyijeyshikshsi.supabase.co" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;
