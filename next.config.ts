import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' *.psx.ng http://localhost:*",
          },
          // NextAuth sometimes sets X-Frame-Options to SAMEORIGIN. 
          // By specifying it here with an empty string, Next.js can sometimes omit it, 
          // or we can set it to a less restrictive policy if needed. 
          // Note: frame-ancestors replaces X-Frame-Options in modern browsers.
        ],
      },
    ];
  },
  devIndicators: {
    position: "bottom-right",
  },
};

export default nextConfig;
