/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "vvmsftyyijeyshikshsi.supabase.co" },
    ],
  },
};

export default nextConfig;
