const fs = require('fs');

let html = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', 'utf8');

// The goal is to find "Khám Phá Việt Nam", remove it from its current location, 
// and place it right before the 3 regions.
// Since the title was inside:
// <div id="tabMap" class="tab-pane active">
//     <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
//         <h2 style="font-size: 2rem;" id="mapTitle">Khám Phá Việt Nam</h2>
//         <button id="btnMapBack" class="bento-btn" ...>Quay lại</button>
//     </div>
//     <div id="mapViewContainer" class="island-container">

// First, we remove any existing "Khám Phá Việt Nam" text elements entirely.
html = html.replace(/<h2[^>]*id="mapTitle"[^>]*>Khám Phá Việt Nam<\/h2>/, '');
// Also replace it if it doesn't have id="mapTitle"
html = html.replace(/<h[1-6][^>]*>Khám Phá Việt Nam<\/h[1-6]>/, '');
html = html.replace(/<div[^>]*>Khám Phá Việt Nam<\/div>/, '');

// Now we inject it right above mapViewContainer
const newTitleElement = `
<div class="flex justify-between items-center w-full max-w-5xl mx-auto px-4">
    <h2 id="mapTitle" class="text-3xl font-bold text-slate-900 dark:text-white mt-12 mb-8 ml-4 block">Khám Phá Việt Nam</h2>
    <button id="btnMapBack" class="bento-btn mt-12 mb-8 px-4 py-2 hidden bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg shadow"><i class="fa-solid fa-arrow-left"></i> Quay lại</button>
</div>
`;

// Insert it right before mapViewContainer
html = html.replace(/<div id="mapViewContainer"/, newTitleElement + '\n                <div id="mapViewContainer"');

// Wait, the previous layout had:
// <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
//     <button id="btnMapBack" ...
// </div>
// Let's also remove the old wrapper if it's left empty or just contains the old back button.
html = html.replace(/<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">\s*<button id="btnMapBack"[^>]*>.*?<\/button>\s*<\/div>/g, '');

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.html', html, 'utf8');
console.log("Moved Title");
