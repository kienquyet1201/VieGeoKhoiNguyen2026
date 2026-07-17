const fs = require('fs');
const path = require('path');

const rootDir = 'C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen';
const publicDir = path.join(rootDir, 'public');

function executeOverhaul() {
    console.log("Starting Final Overhaul...");

    // 1. Fix Overlap Layout & Move PvP Button (map.html)
    const mapHtmlPath = path.join(publicDir, 'map.html');
    if (fs.existsSync(mapHtmlPath)) {
        let html = fs.readFileSync(mapHtmlPath, 'utf8');

        // Ensure main is flex col
        html = html.replace(/<main class="bento-main"[^>]*>/, '<main class="bento-main flex flex-col w-full h-screen overflow-y-auto p-8">');
        html = html.replace(/<main class="bento-main">/, '<main class="bento-main flex flex-col w-full h-screen overflow-y-auto p-8">');

        // Extract PvP button
        const pvpRegex = /<div style="position: fixed; bottom: 20px; right: 20px; z-index: 100;">\s*<button onclick="[^"]*" class="[^"]*">\s*⚔️ Thách đấu 1vs1 \(PvP\)\s*<\/button>\s*<\/div>/;
        const pvpMatch = html.match(pvpRegex);
        if (pvpMatch) {
            html = html.replace(pvpRegex, ''); // Remove from old location
            
            // Insert into Stats Header
            // Find the closing div of stats-header's first inner container (the pills) to append it there
            html = html.replace(/<div class="flex gap-4">([\s\S]*?)<\/div>\s*<\/div>\s*<!-- PARENT PIN MODAL -->/, 
            `<div class="flex gap-4 items-center">\n                        $1\n                        <button onclick="if(typeof showToastNotification === 'function') { showToastNotification('Đang tìm đối thủ...'); } else { alert('Đang tìm đối thủ...'); }" class="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-purple-700 transition transform hover:scale-105 ml-auto whitespace-nowrap">\n                            ⚔️ Thách đấu 1vs1\n                        </button>\n                    </div>\n                </div>\n            <!-- PARENT PIN MODAL -->`);
        } else {
            // Fallback insertion into stats header
            html = html.replace(/<div class="flex gap-4">/, `<div class="flex gap-4 items-center">`);
            html = html.replace(/<span id="hdrBadge">0<\/span><\/div>\s*<\/div>/, `<span id="hdrBadge">0</span></div>\n                        <button onclick="if(typeof showToastNotification === 'function') { showToastNotification('Đang tìm đối thủ...'); } else { alert('Đang tìm đối thủ...'); }" class="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-purple-700 transition transform hover:scale-105 ml-4 whitespace-nowrap">\n                            ⚔️ Thách đấu 1vs1\n                        </button>\n                    </div>`);
            // Clean up any remaining fixed pvp button just in case
            html = html.replace(/<div style="position: fixed; bottom: 20px; right: 20px; z-index: 100;">[\s\S]*?<\/div>/, '');
        }

        // Make sure stats header has static flow and mb-8
        html = html.replace(/<div class="stats-header z-50 relative w-full flex items-center justify-start gap-6 py-4 px-8 bg-white\/50 dark:bg-transparent border-b border-slate-200 dark:border-slate-800 backdrop-blur-md rounded-2xl mb-8 border border-slate-200 dark:border-slate-700 shadow-sm">/, 
            '<div class="stats-header w-full flex items-center justify-start gap-6 py-4 px-8 bg-white/10 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl mb-8 border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">');
        // Catch the old version if it wasn't replaced exactly
        html = html.replace(/class="stats-header[^"]*"/, 'class="stats-header w-full flex items-center justify-between gap-6 py-4 px-8 bg-white/10 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl mb-8 border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0"');

        // Update Routing Logic in Role Switcher script
        html = html.replace(/if \(selectedRole === 'admin' \|\| selectedRole === 'cs'\) \{[\s\S]*?\}/, 
`if (selectedRole === 'admin') {
        window.location.href = '/admin-dashboard';
    } else if (selectedRole === 'cs') {
        window.location.href = '/cs-dashboard';
    }`);
        
        fs.writeFileSync(mapHtmlPath, html, 'utf8');
        console.log("Updated map.html layout and routing.");
    }

    // 2. Fix parent.html
    const parentPath = path.join(publicDir, 'parent.html');
    if (fs.existsSync(parentPath)) {
        let parentHtml = fs.readFileSync(parentPath, 'utf8');
        parentHtml = parentHtml.replace(/href="[^"]*"/, 'href="/map"'); // Make the first link (usually "back to home") point to /map
        fs.writeFileSync(parentPath, parentHtml, 'utf8');
        console.log("Updated parent.html routing.");
    }

    // 3. Create admin & cs dashboard stubs
    const adminStub = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Admin Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center h-screen">
    <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p>Giao diện Quản trị viên đang được xây dựng.</p>
        <a href="/map" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded">Quay lại Map</a>
    </div>
</body>
</html>`;
    fs.writeFileSync(path.join(publicDir, 'admin-dashboard.html'), adminStub, 'utf8');

    const csStub = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>CS Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center h-screen">
    <div class="text-center">
        <h1 class="text-4xl font-bold mb-4">CS Dashboard</h1>
        <p>Giao diện Chăm sóc Khách hàng đang được xây dựng.</p>
        <a href="/map" class="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded">Quay lại Map</a>
    </div>
</body>
</html>`;
    fs.writeFileSync(path.join(publicDir, 'cs-dashboard.html'), csStub, 'utf8');
    console.log("Created admin & cs dashboard stubs.");

    // 4. Overhaul teacher-dashboard.html
    const teacherPath = path.join(publicDir, 'teacher-dashboard.html');
    const teacherHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Cổng Giáo viên - VieGeo B2B</title>
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="/bento.css">
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-8 font-sans">
    <div class="max-w-6xl mx-auto">
        <header class="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
            <h1 class="text-3xl font-bold text-sky-700 dark:text-sky-400"><i class="fa-solid fa-chalkboard-user mr-3"></i>Teacher Portal</h1>
            <div class="flex gap-4">
                <button class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-sm"><i class="fa-solid fa-plus mr-2"></i> Tạo mã lớp học</button>
                <a href="/map" class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white px-6 py-3 rounded-xl font-bold transition shadow-sm hover:bg-slate-300 dark:hover:bg-slate-600">Quay lại</a>
            </div>
        </header>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Quản lý lớp học -->
            <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-6">
                <h2 class="font-bold text-2xl border-b border-slate-200 dark:border-slate-700 pb-4">Quản lý Lớp học (Control Panel)</h2>
                
                <div class="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-xl font-bold">Lớp 12A1 <span class="text-sm font-normal text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full ml-2 border border-slate-200 dark:border-slate-600">Sĩ số: 40</span></span>
                        <button class="text-sky-600 dark:text-sky-400 font-bold hover:underline">Chi tiết <i class="fa-solid fa-chevron-right text-sm ml-1"></i></button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <button class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-user-plus"></i> Thêm HS</button>
                        <button class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-book-open"></i> Bài tập</button>
                        <button class="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-gift"></i> Thưởng</button>
                        <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-trash"></i> Xóa lớp</button>
                    </div>
                </div>

                <div class="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-xl font-bold">Lớp 12A2 <span class="text-sm font-normal text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-full ml-2 border border-slate-200 dark:border-slate-600">Sĩ số: 38</span></span>
                        <button class="text-sky-600 dark:text-sky-400 font-bold hover:underline">Chi tiết <i class="fa-solid fa-chevron-right text-sm ml-1"></i></button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                        <button class="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-user-plus"></i> Thêm HS</button>
                        <button class="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-book-open"></i> Bài tập</button>
                        <button class="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-gift"></i> Thưởng</button>
                        <button class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-semibold transition flex flex-col items-center gap-1 shadow-sm"><i class="fa-solid fa-trash"></i> Xóa lớp</button>
                    </div>
                </div>
            </div>
            
            <!-- Thống kê -->
            <div class="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                <h2 class="font-bold text-2xl border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">Thống kê phổ điểm & Điểm yếu</h2>
                
                <div class="flex-1 min-h-[200px] flex items-end justify-center gap-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 border border-dashed border-slate-300 dark:border-slate-600 mb-6 relative">
                    <!-- Placeholder Bar Chart -->
                    <div class="w-12 bg-sky-300 dark:bg-sky-600 rounded-t-md relative group" style="height: 30%;"><span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition">5.0</span></div>
                    <div class="w-12 bg-sky-400 dark:bg-sky-500 rounded-t-md relative group" style="height: 50%;"><span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition">6.0</span></div>
                    <div class="w-12 bg-sky-500 dark:bg-sky-400 rounded-t-md relative group" style="height: 80%;"><span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition">7.0</span></div>
                    <div class="w-12 bg-sky-600 dark:bg-sky-300 rounded-t-md relative group" style="height: 100%;"><span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition">8.0</span></div>
                    <div class="w-12 bg-sky-700 dark:bg-sky-200 rounded-t-md relative group" style="height: 60%;"><span class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition">9.0</span></div>
                    <span class="absolute top-4 left-4 text-slate-400 text-sm font-semibold"><i class="fa-solid fa-chart-simple mr-2"></i>Biểu đồ Phổ điểm</span>
                </div>

                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                    <strong class="text-red-700 dark:text-red-400 flex items-center gap-2 mb-3"><i class="fa-solid fa-triangle-exclamation"></i> Điểm yếu chung cần lưu ý:</strong> 
                    <div class="flex flex-wrap gap-2">
                        <span class="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 dark:border-red-700">Kỹ năng Atlat (65% sai)</span> 
                        <span class="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-200 dark:border-red-700">Vùng Kinh tế trọng điểm (40% sai)</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
    fs.writeFileSync(teacherPath, teacherHTML, 'utf8');
    console.log("Overhauled teacher-dashboard.html");
}

executeOverhaul();
