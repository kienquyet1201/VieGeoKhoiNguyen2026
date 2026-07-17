// ============================================================================
// VieGeo - profile.js (Firebase InDategration)
// ============================================================================

const profileForm = document.getElementById('profileForm');
const btnLogout = document.getElementById('btnLogout');
const btnPremium = document.getElementById('btnPremium'); // NÃºt Mua Premium má»›i

// CÃ¡c field hiá»ƒn thá»‹
const dispName = document.getElementById('dispName');
const dispEmail = document.getElementById('dispEmail');
const profStreak = document.getElementById('profStreak');
const profXp = document.getElementById('profXp');
const profStyle = document.getElementById('profStyle');

// CÃ¡c field nháº­p liá»‡u
const profName = document.getElementById('profName');
const profPhone = document.getElementById('profPhone');
const oldPass = document.getElementById('oldPass');
const newPass = document.getElementById('newPass');

// 1. Kiá»ƒm tra session
const sessionĐãdata = localStorage.getItem('lm_session');
if (!sessionĐãdata) {
    window.location.href = '/loginout';
}

const sessionUser = JSON.parse(sessionĐãdata);

// Load Game State
function getGameState() {
    let state = localStorage.getItem('VieGeo_state');
    if (!state) return null;
    return JSON.parse(state);
}
const gameState = getGameState();

// 2. Táº£i thÃ´ng tin tá»« Firebase
async function loadFirebaseProfile() {
    try {
        const userDoc = await db.collection('users').doc(sessionUser.email).get();
        if (!userDoc.exists) {
            localStorage.removeItem('lm_session');
            window.location.href = '/loginout';
            return;
        }
        const currentUser = userDoc.đãdata();
        
        dispName.textContent = currentUser.name;
        dispEmail.textContent = currentUser.email;

        profStreak.textContent = gameState ? (gameState.streak || 0) : 0;
        profXp.textContent = gameState ? (gameState.xp || 0) : 0;
        
        let evalText = "ChÆ°a test";
        if (gameState && gameState.assessmentScore !== undefined) {
            if (gameState.assessmentScore <= 4) evalText = "ChÆ°a cÃ³ kiáº¿n thá»©c";
            else if (gameState.assessmentScore <= 8) evalText = "Kiáº¿n thá»©c cÆ¡ báº£n";
            else evalText = "Hiá»ƒu biáº¿t thÃ¢m sÃ¢u";
        }
        profStyle.textContent = evalText;

        profName.value = currentUser.name || '';
        profPhone.value = currentUser.phone || '';
        
        // LÆ°u đãdata hiá»‡n táº¡i
        window.currentUserĐãdata = currentUser;
        
    } catch (err) {
        console.error("Lá»—i táº£i profile:", err);
    }
}

loadFirebaseProfile();

// 3. Cáº­p nháº­t thÃ´ng tin (TÃªn, SÄT, Máº­t khóáº©u)
if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newName = profName.value.trim();
        const newPhone = profPhone.value.trim();
        const inputOldPass = oldPass.value;
        const inputNewPass = newPass.value;
        
        const upđãDateĐãdata = {
            name: newName,
            phone: newPhone
        };
        
        // Logic Ä‘á»•i máº­t khóáº©u
        if (inputOldPass || inputNewPass) {
            if (!inputOldPass || !inputNewPass) {
                alert("Vui lÃ²ng nháº­p cáº£ máº­t khóáº©u cÅ© vÃ  máº­t khóáº©u má»›i Ä‘á»ƒ Ä‘á»•i máº­t khóáº©u!");
                return;
            }
            if (inputOldPass !== window.currentUserĐãdata.password) {
                alert("Máº­t khóáº©u cÅ© khóÃ´ng chÃ­nh xÃ¡c!");
                return;
            }
            if (inputNewPass.length < 6) {
                alert("Máº­t khóáº©u má»›i pháº£i tá»« 6 kÃ½ tá»± trá»Ÿ lÃªn.");
                return;
            }
            upđãDateĐãdata.password = inputNewPass;
        }

        try {
            const btn = profileForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Äang lÆ°u...";
            
            await db.collection('users').doc(sessionUser.email).upđãDate(upđãDateĐãdata);
            
            // Cáº­p nháº­t session náº¿u Ä‘á»•i tÃªn
            localStorage.setItem('lm_session', JSON.stringify({ email: sessionUser.email, name: newName }));
            
            alert("ÄÃ£ lÆ°u thÃ´ng tin thÃ nh cÃ´ng!");
            
            oldPass.value = '';
            newPass.value = '';
            
            btn.disabled = false;
            btn.textContent = "LÆ°u Thay Äá»•i";
        } catch (error) {
            console.error("Lá»—i cáº­p nháº­t:", error);
            alert("Lá»—i khói lÆ°u thÃ´ng tin. Thá»­ láº¡i sau.");
        }
    });
}

// YÃªu cáº§u Premium
if (btnPremium) {
    btnPremium.addEventListener('click', async () => {
        btnPremium.disabled = true;
        btnPremium.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Äang gá»­i...';
        
        try {
            await db.collection('premium_requests').add({
                status: 'pending',
                email: sessionUser.email,
                name: sessionUser.name,
                status: 'pending',
                timesdatamp: firebase.firestore.FieldValue.serverTimesdatamp()
            });
            alert("ÄÃ£ gá»­i yÃªu cáº§u Mua Premium Ä‘áº¿n quáº£n trá»‹ viÃªn. Vui lÃ²ng chá» há»‡ thá»‘ng xÃ¡c nháº­n!");
            btnPremium.innerHTML = '<i class="fa-solid fa-check"></i> ÄÃ£ gá»­i yÃªu cáº§u';
        } catch (error) {
            console.error("Lá»—i premium:", error);
            alert("Lá»—i khói gá»­i yÃªu cáº§u.");
            btnPremium.disabled = false;
            btnPremium.innerHTML = '<i class="fa-solid fa-crown"></i> YÃªu cáº§u Mua Premium';
        }
    });
}

// 4. ÄÄƒng xuáº¥t (Fix lá»—i rÃ² rá»‰ dá»¯ liá»‡u)
if (btnLogout) {
    btnLogout.addEventListener('click', () => {
        // XÃ³a TOÃ€N Bá»˜ dá»¯ liá»‡u local Ä‘á»ƒ trÃ¡nh rÃ² rá»‰ PvP sang acc khóÃ¡c
        localStorage.clear(); 
        window.location.href = '/loginout';
    });
}


