const fs = require('fs');
let content = fs.readFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.js', 'utf8');

// Fix renderRegions
content = content.replace(/function renderRegions\(\) \{[\s\S]*?mapContainer\.appendChild\(card\);\s*\}\);\s*\}/, `function renderRegions() {
    mapContainer.style.display = 'grid';
    mapContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(250px, 1fr))';
    mapContainer.style.gap = '20px';
    
    LEARNING_REGIONS.forEach(region => {
        const card = document.createElement('div');
        card.className = 'bento-card';
        card.style.cursor = 'pointer';
        card.style.border = '2px solid ' + region.color;
        card.style.background = '#ffffff';
        card.style.color = '#0c4a6e';
        card.style.position = 'relative';
        card.style.zIndex = '50';
        card.style.borderRadius = '20px';
        card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        card.innerHTML = \`
            <div style="font-size: 3rem; color: \${region.color};"><i class="fa-solid fa-map"></i></div>
            <h3 style="font-size: 1.5rem; margin-top: 10px;">\${region.name}</h3>
            <p style="color: var(--text-dim); margin-top: 5px;">\${region.provinces.length} Tỉnh/Thành phố</p>
        \`;
        card.onclick = () => {
            selectedRegion = region;
            currentView = 'provinces';
            renderMap();
        };
        mapContainer.appendChild(card);
    });
}`);

// Fix renderProvinces inline styles if broken
content = content.replace(/if \(prov\.isBoss\) \{[\s\S]*?card\.innerHTML = /, `
        if (prov.isBoss) {
            card.style.border = '2px solid #ff4b4b';
            card.style.background = 'rgba(255, 75, 75, 0.1)';
            card.style.boxShadow = '0 0 15px rgba(255, 75, 75, 0.4)';
        } else {
            card.style.border = '2px solid ' + prov.color;
            card.style.background = '#ffffff';
            card.style.color = '#0c4a6e';
            card.style.position = 'relative';
            card.style.zIndex = '50';
            card.style.borderRadius = '15px';
            card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
        }
        card.innerHTML = `);

// Ensure there are backticks for renderProvinces innerHTML
if (!content.includes('card.innerHTML = `')) {
    content = content.replace('card.innerHTML = \\n', 'card.innerHTML = `\\n');
    content = content.replace('</p>\\n        ;', '</p>\\n        `;');
}

fs.writeFileSync('C:/Users/PC/Downloads/VieGeoKhoiNguyen-main/VieGeoKhoiNguyen/public/map.js', content, 'utf8');
