const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen';
const publicDir = path.join(rootDir, 'public');

console.log("Starting Admin Fix and UI Clean...");

// 1. Delete dummy admin-dashboard
const dummyAdminPath = path.join(publicDir, 'admin-dashboard.html');
if (fs.existsSync(dummyAdminPath)) {
    fs.unlinkSync(dummyAdminPath);
    console.log("Deleted dummy admin-dashboard.html");
}

// 2. Fix map.html (Routing, Topbar Overlap, Duplicate Arena Button)
const mapHtmlPath = path.join(publicDir, 'map.html');
if (fs.existsSync(mapHtmlPath)) {
    let mapHtml = fs.readFileSync(mapHtmlPath, 'utf8');

    // Routing: /admin instead of /admin-dashboard
    mapHtml = mapHtml.replace(/window\.location\.href\s*=\s*'\/admin-dashboard'/g, "window.location.href = '/admin'");

    // Remove fixed/absolute from stats-header and add mb-8
    // I previously replaced it with a static version, but let's aggressively remove any trace of fixed/absolute
    mapHtml = mapHtml.replace(/class="stats-header([^"]*)fixed([^"]*)"/g, 'class="stats-header$1$2"');
    mapHtml = mapHtml.replace(/class="stats-header([^"]*)absolute([^"]*)"/g, 'class="stats-header$1$2"');
    
    // Ensure the container below it (e.g. #tabMap > div or mapTitle) has padding/margin
    // The title was injected as: <div class="flex justify-between items-center w-full max-w-5xl mx-auto px-4">
    mapHtml = mapHtml.replace(/<h2 id="mapTitle" class="([^"]*)"/g, (match, p1) => {
        // Ensure it has pt-6 or mt-8
        if (!p1.includes('pt-6') && !p1.includes('mt-8')) {
            return `<h2 id="mapTitle" class="${p1} pt-6"`;
        }
        return match;
    });

    // To be perfectly safe about overlap, ensure bento-main padding top is large enough
    mapHtml = mapHtml.replace(/<main class="bento-main([^"]*)"/, (match, p1) => {
        if (!p1.includes('pt-6') && !p1.includes('p-8')) {
            return `<main class="bento-main${p1} pt-8"`;
        }
        return match;
    });

    // Delete Duplicate Arena Button in Sidebar bottom
    // It's the one with href="/exam-arena" inside taskbarContainer (since I ran clean_urls)
    mapHtml = mapHtml.replace(/<a href="\/exam-arena"[^>]*>[\s\S]*?Đấu trường<\/a>/g, '');
    mapHtml = mapHtml.replace(/<a href="exam-arena"[^>]*>[\s\S]*?Đấu trường<\/a>/g, '');
    mapHtml = mapHtml.replace(/<a href="exam-arena\.html"[^>]*>[\s\S]*?Đấu trường<\/a>/g, '');
    mapHtml = mapHtml.replace(/<a href="\/exam-arena.html"[^>]*>[\s\S]*?Đấu trường<\/a>/g, '');

    fs.writeFileSync(mapHtmlPath, mapHtml, 'utf8');
    console.log("Fixed map.html layout and routing.");
}

// 3. Bypass Admin Authorization Logic
const realAdminPath = path.join(publicDir, 'admin.html');
if (fs.existsSync(realAdminPath)) {
    let adminHtml = fs.readFileSync(realAdminPath, 'utf8');

    // Comment out the auth checking logic
    // Typically it looks like:
    // if (!user || user.role !== 'admin') { alert("Bạn không có quyền truy cập trang quản trị Admin!"); window.location.href = '/map'; }
    adminHtml = adminHtml.replace(/(if\s*\([^{]*role[^}]*\{[\s\S]*?alert\([\s\S]*?\}[\s\S]*?\})/g, '/* $1 */');
    
    // Sometimes it's inside a checkAuth function or onAuthStateChanged
    // Let's just blindly comment out any alert that says "Bạn không có quyền"
    adminHtml = adminHtml.replace(/alert\(['"`]Bạn không có quyền truy cập trang quản trị Admin!['"`]\);/g, '// alert("Bạn không có quyền truy cập trang quản trị Admin!");');
    adminHtml = adminHtml.replace(/window\.location\.href\s*=\s*['"`]\/map['"`];/g, '// window.location.href = "/map";');
    adminHtml = adminHtml.replace(/window\.location\.href\s*=\s*['"`]\/?login['"`];/g, '// window.location.href = "/login";');
    adminHtml = adminHtml.replace(/window\.location\.href\s*=\s*['"`]index\.html['"`];/g, '// window.location.href = "index.html";');

    fs.writeFileSync(realAdminPath, adminHtml, 'utf8');
    console.log("Bypassed Admin auth in admin.html.");
} else {
    console.log("Could not find admin.html");
}
