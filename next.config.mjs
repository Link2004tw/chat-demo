/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://192.168.1.10:3000",
    "192.168.1.*"
  ], // or your dev IP and port
};

export default nextConfig;
