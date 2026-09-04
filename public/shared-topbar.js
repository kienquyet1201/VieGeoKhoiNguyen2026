var sharedHeart=document.getElementById('sharedHeart');
var sharedStreak=document.getElementById('sharedStreak');
var sharedGem=document.getElementById('sharedGem');
var sharedXp=document.getElementById('sharedXp');
var sharedUserProfile=document.getElementById('sharedUserProfile');
var sharedUserAvatar=document.getElementById('sharedUserAvatar');
var sharedAvatarProgress=document.getElementById('sharedAvatarProgress');
var sharedLevelBadge=document.getElementById('sharedLevelBadge');
var sharedThemeButton=document.getElementById('sharedThemeButton');
var sharedLogoutButton=document.getElementById('sharedLogoutButton');
var sharedDifficulty=document.getElementById('sharedDifficulty');
var sharedRole=document.getElementById('sharedRole');
var sharedLinks=document.querySelectorAll('.shared-link');
var supportButton=document.getElementById('supportButton');

function getSharedSession(){ return window.VieGeoUserStore?.get?.()||window.VieGeoCurrentUser||{}; }
function getSharedState(){ return getSharedSession(); }
function getSharedRoles(user){ return Array.isArray(user?.roles)?user.roles:[]; }
function getSharedInitials(value){
    var parts=String(value||'Học viên').trim().split(/\s+/).filter(Boolean);
    return parts.slice(-2).map(function(part){return part.charAt(0);}).join('').toUpperCase()||'HV';
}

function updateSharedRoleControl(){
    try{
        if(!sharedRole){return;}
        var user=getSharedSession();
        var roles=getSharedRoles(user);
        var labels={user:'Học sinh',parent:'Phụ huynh',cs:'CSKH',admin:'Quản trị viên'};
        var active=window.VieGeoUserStore?.getActiveRole?.()||user.role||roles[0]||'';
        sharedRole.replaceChildren();
        roles.forEach(function(role){
            var option=document.createElement('option'); option.value=role; option.textContent=labels[role]||role; option.selected=role===active; sharedRole.appendChild(option);
        });
        sharedRole.disabled=roles.length<2;
        var wrapper=sharedRole.closest('.shared-role-control');
        if(wrapper){wrapper.hidden=roles.length<2;}
    }catch(error){console.warn('[VieGeo] Không thể hiển thị vai trò:',error);}
}

function updateSharedUserProfile(){
    try{
        if(!sharedUserProfile||!sharedUserAvatar||!sharedAvatarProgress||!sharedLevelBadge){return;}
        var user=getSharedSession();
        var name=String(user.display_name||'Học viên').trim();
        var xp=Math.max(0,Number(user.xp)||0);
        var level=Math.floor(xp/100)+1;
        var progress=Math.min(100,Math.round(xp%100));
        sharedAvatarProgress.style.setProperty('--xp-progress',String(progress)+'%');
        sharedLevelBadge.textContent='Lv.'+String(level);
        sharedUserProfile.setAttribute('aria-label','Mở hồ sơ của '+name+', cấp '+level);
        sharedUserAvatar.textContent=getSharedInitials(name);
    }catch(error){console.warn('[VieGeo] Không thể cập nhật hồ sơ trên thanh menu:',error);}
}

function updateSharedStats(){
    var user=getSharedSession();
    if(sharedHeart){sharedHeart.textContent=user.is_premium?'∞':String(user.hearts??3);}
    if(sharedStreak){sharedStreak.textContent=String(user.streak??0);}
    if(sharedGem){sharedGem.textContent=String(user.gems??0);}
    if(sharedXp){sharedXp.textContent=String(user.xp??0)+' XP';}
    if(sharedDifficulty){sharedDifficulty.value=sessionStorage.getItem('viegeo_difficulty')||'easy';}
    updateSharedRoleControl();
    updateSharedUserProfile();
}

function setSharedTheme(theme){
    if(typeof applyGlobalTheme==='function'){applyGlobalTheme(theme);}
    if(sharedThemeButton){sharedThemeButton.textContent=theme==='light'?'Chế độ tối':'Chế độ sáng';}
}
function toggleSharedTheme(){ if(typeof toggleGlobalTheme==='function'){toggleGlobalTheme();} setSharedTheme(typeof getGlobalTheme==='function'?getGlobalTheme():'dark'); }
function markSharedActive(){
    var current=String(location.pathname).split('/').pop().replace(/\.html$/i,'')||'student-dashboard';
    sharedLinks.forEach(function(link){link.classList.toggle('active',String(link.getAttribute('href')||'').split('?')[0].replace(/\.html$/i,'')===current);});
}
function changeSharedDifficulty(){ try{sessionStorage.setItem('viegeo_difficulty',sharedDifficulty.value);}catch(_){} }
function changeSharedRole(){
    try{
        var role=sharedRole.value;
        window.VieGeoUserStore.setActiveRole(role);
        var route={user:'student-dashboard.html',parent:'parent.html',cs:'cs-dashboard.html',admin:'admin-dashboard.html'}[role];
        if(route){location.href=route;}
    }catch(error){updateSharedRoleControl();window.showToast?.('Vai trò này chưa được cấp cho tài khoản của bạn.','warning');}
}
function sharedLogout(){ if(typeof window.VieGeoLogout==='function'){window.VieGeoLogout('loginout.html');} }
function initializeSharedNavbar(){
    try{
        setSharedTheme(typeof getGlobalTheme==='function'?getGlobalTheme():'dark'); updateSharedStats(); markSharedActive();
        sharedThemeButton?.addEventListener('click',toggleSharedTheme);
        sharedLogoutButton?.addEventListener('click',sharedLogout);
        sharedUserProfile?.addEventListener('click',function(){location.href='profile.html';});
        sharedDifficulty?.addEventListener('change',changeSharedDifficulty);
        sharedRole?.addEventListener('change',changeSharedRole);
        supportButton?.addEventListener('click',function(){location.href='support-user.html';});
    }catch(error){console.warn('[VieGeo] Không thể khởi tạo thanh menu:',error);}
}
document.addEventListener('DOMContentLoaded',initializeSharedNavbar);
window.addEventListener('viegeo:user-hydrated',updateSharedStats);
