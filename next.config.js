/** @type {import('next').NextConfig} */

// Security headers applied to every response.
//
// - X-Frame-Options: DENY            -> the app cannot be embedded in a frame
//                                       (clickjacking protection).
// - X-Content-Type-Options: nosniff  -> browsers must not guess content types.
// - Referrer-Policy                  -> do not leak full URLs to third parties.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
