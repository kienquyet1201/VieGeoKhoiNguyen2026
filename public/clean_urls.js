const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen';
const publicDir = path.join(rootDir, 'public');

// 1. Create vercel.json in the root directory
const vercelConfig = {
  "cleanUrls": true,
  "trailingSlash": false
};
fs.writeFileSync(path.join(rootDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2), 'utf8');
console.log("Created vercel.json");

// 2. Scan and clean URLs in .html and .js files
function cleanUrlsInDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            cleanUrlsInDir(fullPath);
        } else if (file.endsWith('.html') || file.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Replace href="/something"
            content = content.replace(/href=["']([^"']+)\.html["']/g, (match, p1) => {
                if (p1.startsWith('http')) return match;
                return `href="/${p1.replace(/^\/+/, '')}"`; // Ensure leading slash for root paths
            });

            // Replace window.location.href = '/something'
            content = content.replace(/window\.location\.href\s*=\s*["']([^"']+)\.html["']/g, (match, p1) => {
                if (p1.startsWith('http')) return match;
                return `window.location.href = '/${p1.replace(/^\/+/, '')}'`;
            });
            
            // Replaces string literals like '/exam-arena'
            content = content.replace(/['"]\/?([a-zA-Z0-9_-]+)\.html['"]/g, (match, p1) => {
                return `\'/${p1}\'`;
            });

            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Cleaned URLs in ${file}`);
            }
        }
    }
}

cleanUrlsInDir(publicDir);
console.log("Clean URLs setup complete.");
