/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["http://192.168.1.13:3000"], // or your dev IP and port

  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://chat-react-project-dade0.firebaseapp.com/__/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
