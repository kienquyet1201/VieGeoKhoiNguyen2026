const fs = require('fs');
let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// Extract Sidebar and Header
const sidebarMatch = html.match(/<aside[^>]*>[\s\S]*?<\/aside>/);
const headerMatch = html.match(/<div class="stats-header[^>]*>[\s\S]*?<\/div>\s*<\/div>/);

let dump = "=== SIDEBAR ===\n" + (sidebarMatch ? sidebarMatch[0] : "Not found") + "\n\n=== HEADER ===\n" + (headerMatch ? headerMatch[0] : "Not found");
fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/dump.txt', dump, 'utf8');
