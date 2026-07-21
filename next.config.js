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
      { source: '/exam-arena', destination: '/exam-arena.html', permanent: false },
      { source: '/profile',  destination: '/profile.html',  permanent: false },
      { source: '/parent',   destination: '/parent.html',   permanent: false },
      { source: '/user-dashboard',    destination: '/map.html',               permanent: false },
      { source: '/map-dashboard',     destination: '/map.html',               permanent: false },
      { source: '/admin-dashboard',   destination: '/admin.html',             permanent: false },
      { source: '/cs-dashboard',      destination: '/cs-dashboard.html',      permanent: false },
      { source: '/teacher-dashboard', destination: '/teacher-dashboard.html', permanent: false },
      { source: '/parent-dashboard',  destination: '/parent.html',            permanent: false },
    ];
  },
};

module.exports = nextConfig;
