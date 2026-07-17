const fs = require('fs');
let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

const s1 = html.match(/class="stats-header"/g) || [];
const s2 = html.match(/id="taskbarContainer"/g) || [];
console.log('stats-header count:', s1.length);
console.log('taskbarContainer count:', s2.length);
