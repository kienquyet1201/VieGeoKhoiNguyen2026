/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/map',      destination: '/map.html',      permanent: false },
      { source: '/login',    destination: '/loginout.html', permanent: false },
      { source: '/loginout', destination: '/loginout.html', permanent: false },
      { source: '/admin',    destination: '/admin.html',    permanent: false },
      { source: '/cs',       destination: '/cs.html',       permanent: false },
      { source: '/lesson',   destination: '/lesson.html',   permanent: false },
      { source: '/profile',  destination: '/profile.html',  permanent: false },
      { source: '/parent',   destination: '/parent.html',   permanent: false },
    ];
  },
};

module.exports = nextConfig;
