/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   appDir: true,
  // },
  images: {
    domains: ["images.unsplash.com"],
  },
  allowedOrigins: ["http://192.168.7.118:3000"],

};

module.exports = nextConfig;
