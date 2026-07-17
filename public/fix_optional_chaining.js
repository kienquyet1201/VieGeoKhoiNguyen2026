const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public';

function fixOptionalChaining(filePath) {
    if (!fs.existsSync(filePath)) return false;
    
    let js = fs.readFileSync(filePath, 'utf8');
    let original = js;

    // 1. Add Guard Clause to renderProfile
    // Look for function renderProfile(user) or similar
    js = js.replace(/function\s+renderProfile\s*\(([^)]+)\)\s*\{/, (match, p1) => {
        // extract the first parameter name, usually the user object or data
        const paramName = p1.split(',')[0].trim();
        return `${match}\n    if (!${paramName}) return;`;
    });

    // 2. Safe Optional Chaining for .map()
    // Find patterns like variable.map( or object.property.map(
    // We can't trivially regex all JS logic without AST, but we can do common patterns.
    // E.g. `user.badges.map` -> `(user?.badges || []).map`
    // We will find `.map(` and `.forEach(` where the caller is a property access.
    
    // Replace: foo.bar.map(  => (foo?.bar || []).map(
    // It's safer to use a regex that matches `someVar.map(` or `someVar.forEach(`
    // But since the user explicitly gave examples like `user.badges.map`, `user.achievements.map`, `data.history.map`
    const commonArrays = ['badges', 'achievements', 'history', 'completedNodes', 'provinces', 'lessons', 'questions', 'options', 'weaknessTags', 'studyHabits'];
    
    for (const arr of commonArrays) {
        // Fix `.map(`
        const mapRegex = new RegExp(`([a-zA-Z0-9_]+)\\.${arr}\\.map\\(`, 'g');
        js = js.replace(mapRegex, `($1?.${arr} || []).map(`);
        
        // Fix `.forEach(`
        const forEachRegex = new RegExp(`([a-zA-Z0-9_]+)\\.${arr}\\.forEach\\(`, 'g');
        js = js.replace(forEachRegex, `($1?.${arr} || []).forEach(`);
    }
    
    // Some general fallback for any `.map` that we might have missed if we just want to be greedy, 
    // but greedy JS regex is dangerous. The above covers the common domains.
    // Let's also do a pass on `state.completedNodes` or `prov.lessons`
    js = js.replace(/([a-zA-Z0-9_]+)\.map\(/g, (match, p1) => {
        if (p1 === 'Array' || p1 === 'Object') return match;
        return `(${p1} || []).map(`;
    });

    js = js.replace(/([a-zA-Z0-9_]+)\.forEach\(/g, (match, p1) => {
        if (p1 === 'Array' || p1 === 'Object' || p1 === 'document' || p1 === 'window') return match;
        return `(${p1} || []).forEach(`;
    });
    
    // Specifically handle the ones requested: user.badges, user.achievements, data.history
    js = js.replace(/([a-zA-Z0-9_]+)\.badges\.map/g, `($1?.badges || []).map`);
    js = js.replace(/([a-zA-Z0-9_]+)\.achievements\.map/g, `($1?.achievements || []).map`);
    js = js.replace(/([a-zA-Z0-9_]+)\.history\.map/g, `($1?.history || []).map`);

    if (js !== original) {
        fs.writeFileSync(filePath, js, 'utf8');
        console.log(`Fixed optional chaining in ${path.basename(filePath)}`);
        return true;
    }
    return false;
}

fixOptionalChaining(path.join(rootDir, 'app-core.js'));
fixOptionalChaining(path.join(rootDir, 'profile.js'));
fixOptionalChaining(path.join(rootDir, 'map.js'));
fixOptionalChaining(path.join(rootDir, 'lesson.js'));

console.log("Safe map/forEach logic applied.");
