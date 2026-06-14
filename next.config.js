/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sql.js'],
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      'sql.js',
    ];
    return config;
  },
};

module.exports = nextConfig;
