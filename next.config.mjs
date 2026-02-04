/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/((?!_next|api|maintenance|favicon.ico).*)",
        destination: "/proxy",
      },
    ];
  },
}

export default nextConfig
