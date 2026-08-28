/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/login',             destination: '/loginout',          permanent: false },
      { source: '/user-dashboard',    destination: '/map',               permanent: false },
      { source: '/map-dashboard',     destination: '/map',               permanent: false },
      { source: '/admin-dashboard',   destination: '/admin',             permanent: false },
      { source: '/parent-dashboard',  destination: '/parent',            permanent: false },
      { source: '/cs-dashboard',      destination: '/cs',                permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: '/loginout', destination: '/loginout.html' },
      { source: '/cs', destination: '/cs-dashboard.html' },
    ];
  },
};

module.exports = nextConfig;
