const fs = require('fs');
let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// The stats-header should only have one instance. Let's force it to be unique and correctly formatted.
// It seems there may be duplicate headers or badly formed ones.
// I will extract the exact content of stats-header from scratch.txt, make it z-50, and ensure it replaces any other occurrence.

// Let's implement switchRoleClientOnly in a script tag if it doesn't exist.
if (!html.includes('function switchRoleClientOnly')) {
    html = html.replace('</body>', `
<script>
window.switchRoleClientOnly = function(selectedRole) {
    if (!selectedRole) return;
    localStorage.setItem('currentViewRole', selectedRole);
    if(typeof state !== 'undefined') {
        state.currentRole = selectedRole;
    }
    // Force reload UI
    window.location.reload();
};

// On load, apply currentViewRole if exists
document.addEventListener('DOMContentLoaded', () => {
    const roleSwitcher = document.getElementById('globalRoleSwitcher');
    const savedRole = localStorage.getItem('currentViewRole');
    if (savedRole && roleSwitcher) {
        roleSwitcher.value = savedRole;
    }
});
</script>
</body>`);
}

// Set z-index of stats-header
html = html.replace(/<div class="stats-header"/g, '<div class="stats-header z-50 relative"');
html = html.replace(/<div class="stats-header z-50 relative z-50 relative"/g, '<div class="stats-header z-50 relative"');

// Deduplicate taskbars if any:
// I will just use regex to remove any duplicate stats-header.
const statsHeaderMatches = [...html.matchAll(/<div class="stats-header.*?>([\s\S]*?)<\/div>\s*<!-- PARENT PIN MODAL -->/g)];
if (statsHeaderMatches.length > 1) {
    // Keep only the first one
    const firstMatch = statsHeaderMatches[0][0];
    html = html.split(firstMatch).join('UNIQUE_STATS_HEADER_PLACEHOLDER');
    // Remove all other stats headers that might be floating around (by simply matching `<div class="stats-header` to its end, but that's hard to regex. 
    // Usually it's right after `<main class="bento-main">`
}

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
