const path = require("path");
const cspHeader = `frame-ancestors 'self' https://127.0.0.1 https://oauth.telegram.org`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader.replace(/\n/g, ""),
          },
          {
            key: "X-Frame-Options",
            value: "ALLOW-FROM oauth.telegram.org",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "static.ailov3.com",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "d1u4kea1ocd3vj.cloudfront.net",
        port: "",
        pathname: "**",
      },
    ],
  },
  webpack: (config) => {
    // 设置别名
    config.resolve.alias["@"] = path.join(__dirname, "src");
    config.resolve.alias["@@"] = path.join(__dirname, "public");
    config.resolve.alias["&"] = path.join(__dirname, "src/server");

    // 重要: 返回修改后的配置
    return config;
  },
};

module.exports = nextConfig;
