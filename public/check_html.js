const fs = require('fs');
let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// Just write the top 150 lines to a scratch file to read
const topHtml = html.split('\n').slice(0, 150).join('\n');
fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/scratch.txt', topHtml, 'utf8');
