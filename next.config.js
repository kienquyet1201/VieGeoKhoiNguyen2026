/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/login',             destination: '/loginout',          permanent: false },
      { source: '/user-dashboard',    destination: '/map',               permanent: false },
      { source: '/map-dashboard',     destination: '/map',               permanent: false },
      { source: '/admin-dashboard',   destination: '/admin',             permanent: false },
      { source: '/parent-dashboard',  destination: '/parent',            permanent: false },
    ];
  },
};

module.exports = nextConfig;
