const fs = require('fs');

// 1. FIX APP-CORE.JS SYNTAX ERROR
let js = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/app-core.js', 'utf8');

// Fix the exact regex accident
js = js.replace(/\.\(interests \|\| \[\]\)\.map/g, '.interests || []).map');
js = js.replace(/gameState\.learningProfile\.interests \|\| \[\]\)\.map/g, '(gameState.learningProfile.interests || []).map');

// Additionally, if any other properties got messed up like `foo.(bar || []).map` 
js = js.replace(/\.\(([a-zA-Z0-9_]+) \|\| \[\]\)\.map/g, '.$1 || []).map');
// Then wrap the caller in parens if it wasn't
js = js.replace(/([a-zA-Z0-9_]+\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+) \|\| \[\]\)\.map/g, '($1 || []).map');

// But let's just make it absolutely safe by reverting to the safe pattern explicitly requested:
// I'll leave the ones that are valid `(foo?.bar || []).map`, and fix the broken ones.
js = js.replace(/gameState\.learningProfile\.\(interests \|\| \[\]\)\.map/g, '(gameState.learningProfile.interests || []).map');
js = js.replace(/gameState\.learningProfile\.\(strengths \|\| \[\]\)\.map/g, '(gameState.learningProfile.strengths || []).map');
js = js.replace(/gameState\.learningProfile\.\(weaknesses \|\| \[\]\)\.map/g, '(gameState.learningProfile.weaknesses || []).map');

// To be safe, just fix the exact line if it matches
js = js.replace(/let interestsText = gameState\.learningProfile\.\(interests \|\| \[\]\)\.map\(i => regionMap\[i\]\)\.join\(\', \'\) \|\| \'Chưa rõ\';/, 
    `const safeInterests = (gameState && gameState.learningProfile && gameState.learningProfile.interests) ? gameState.learningProfile.interests : [];
        let interestsText = safeInterests.map(i => regionMap[i] || i).join(', ') || 'Chưa rõ';`);

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/app-core.js', js, 'utf8');
console.log("Fixed app-core.js syntax error.");

// 2. RESTRUCTURE STATS BAR IN MAP.HTML
let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// Replace the stats-header class with the specific Tailwind classes
html = html.replace(/<div class="stats-header[^>]*>/, '<div class="stats-header w-full flex items-center justify-start gap-6 py-4 px-8 bg-white/10 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl mb-8 border border-slate-200 dark:border-slate-700 shadow-sm">');

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
console.log("Refactored Stats Bar in map.html.");
