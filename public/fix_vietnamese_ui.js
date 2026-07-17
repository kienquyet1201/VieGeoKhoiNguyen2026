const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen';

function fixVietnameseAndUI() {
    console.log("Starting UTF-8 and UI fixes...");

    // 1. Fix gamedata.js 63 Provinces array
    const gamedataPath = path.join(rootDir, 'public', 'gamedata.js');
    if (fs.existsSync(gamedataPath)) {
        let gamedata = fs.readFileSync(gamedataPath, 'utf8');
        
        // Re-inject the correct arrays with UTF-8
        gamedata = gamedata.replace(/const N_PROVINCES = \[[^\]]*\];/, `const N_PROVINCES = [
    "Hà Nội", "Hải Phòng", "Quảng Ninh", "Hà Giang", "Lào Cai", "Lai Châu", "Điện Biên", "Sơn La", "Yên Bái", "Hòa Bình", 
    "Phú Thọ", "Tuyên Quang", "Cao Bằng", "Bắc Kạn", "Thái Nguyên", "Lạng Sơn", "Bắc Giang", "Bắc Ninh", "Hải Dương", 
    "Hưng Yên", "Vĩnh Phúc", "Hà Nam", "Nam Định", "Ninh Bình", "Thái Bình"
];`);
        gamedata = gamedata.replace(/const C_PROVINCES = \[[^\]]*\];/, `const C_PROVINCES = [
    "Thanh Hóa", "Nghệ An", "Hà Tĩnh", "Quảng Bình", "Quảng Trị", "Thừa Thiên Huế", "Đà Nẵng", "Quảng Nam", "Quảng Ngãi", 
    "Bình Định", "Phú Yên", "Khánh Hòa", "Ninh Thuận", "Bình Thuận", "Kon Tum", "Gia Lai", "Đắk Lắk", "Đắk Nông", "Lâm Đồng"
];`);
        gamedata = gamedata.replace(/const S_PROVINCES = \[[^\]]*\];/, `const S_PROVINCES = [
    "Hồ Chí Minh", "Cần Thơ", "Bình Phước", "Tây Ninh", "Bình Dương", "Đồng Nai", "Bà Rịa - Vũng Tàu", "Long An", 
    "Tiền Giang", "Bến Tre", "Trà Vinh", "Vĩnh Long", "Đồng Tháp", "An Giang", "Kiên Giang", "Hậu Giang", "Sóc Trăng", 
    "Bạc Liêu", "Cà Mau"
];`);

        // Also fix any other stray corrupted text
        gamedata = gamedata.replace(/V\? tr/g, 'Vị trí');
        gamedata = gamedata.replace(/i\?u ki\?n t\? nhi/g, 'Điều kiện tự nhiên');
        gamedata = gamedata.replace(/Dn c/g, 'Dân cư');
        gamedata = gamedata.replace(/Vn ha/g, 'Văn hóa');
        gamedata = gamedata.replace(/Kinh t\?/g, 'Kinh tế');
        gamedata = gamedata.replace(/Du l\?ch/g, 'Du lịch');
        gamedata = gamedata.replace(/l\? thuy\?t/g, 'lý thuyết');
        gamedata = gamedata.replace(/o\?n \?c/g, 'đoạn đọc');

        fs.writeFileSync(gamedataPath, gamedata, 'utf8');
        console.log("Fixed gamedata.js UTF-8 arrays");
    }

    // 2. Sync Dark Mode for Province Cards in map.js
    const mapJsPath = path.join(rootDir, 'public', 'map.js');
    if (fs.existsSync(mapJsPath)) {
        let js = fs.readFileSync(mapJsPath, 'utf8');
        
        // Ensure province cards have dark mode classes
        if (!js.includes('bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700')) {
            js = js.replace(/let isBossClass = prov\.isBoss \? 'border-red-500 bg-red-50 dark:bg-red-900\/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800';/, 
                `let isBossClass = prov.isBoss ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white';`);
            
            js = js.replace(/<div class="bento-card province-card \$\{isBossClass\} text-slate-900 dark:text-white border shadow-sm hover:shadow-md transition transform hover:-translate-y-1 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center w-full"/, 
                `<div class="bento-card province-card \${isBossClass} text-slate-900 dark:text-white dark:border-slate-700 border shadow-sm hover:shadow-md transition transform hover:-translate-y-1 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center w-full"`);
        }
        
        // Provide a robust fallback replacement if the exact string matching failed
        js = js.replace(/<div class="bento-card province-card \$\{isBossClass\}(?: text-slate-900)?(?: dark:text-white)?(?: dark:border-slate-700)?(?: border)? shadow-sm hover:shadow-md transition transform hover:-translate-y-1 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center w-full"/g, 
                `<div class="bento-card province-card \${isBossClass} bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition transform hover:-translate-y-1 rounded-xl p-5 cursor-pointer flex flex-col items-center text-center w-full"`);

        fs.writeFileSync(mapJsPath, js, 'utf8');
        console.log("Fixed map.js Dark Mode");
    }

    // 3. Replace alert() with Toast in map.html
    const mapHtmlPath = path.join(rootDir, 'public', '/map');
    if (fs.existsSync(mapHtmlPath)) {
        let html = fs.readFileSync(mapHtmlPath, 'utf8');
        
        // Inject Toast UI Container if not exists
        if (!html.includes('id="toast-container"')) {
            html = html.replace('</body>', `
<!-- Custom Toast Notification -->
<div id="toast-container" class="fixed top-5 right-5 z-50 flex flex-col gap-2"></div>
<script>
    function showToastNotification(message, duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 transform transition-all duration-300 opacity-0 translate-y-2';
        toast.innerHTML = \`<span class="text-xl">⚔️</span> <span class="font-bold">\${message}</span>\`;
        container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.remove('opacity-0', 'translate-y-2');
            toast.classList.add('opacity-100', 'translate-y-0');
        });
        
        // Animate out
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
</script>
</body>`);
        }

        // Replace alert in PvP button
        html = html.replace(/onclick="alert\('Đang tìm đối thủ\.\.\.'\)"/g, `onclick="if(typeof showToastNotification === 'function') { showToastNotification('Đang tìm đối thủ...'); } else { alert('Đang tìm đối thủ...'); }"`);

        fs.writeFileSync(mapHtmlPath, html, 'utf8');
        console.log("Fixed map.html Alert -> Toast");
    }

    console.log("Fixes complete.");
}

fixVietnameseAndUI();
