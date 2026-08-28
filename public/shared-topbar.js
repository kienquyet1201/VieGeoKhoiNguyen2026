var sharedHeart=document.getElementById("sharedHeart");
var sharedStreak=document.getElementById("sharedStreak");
var sharedGem=document.getElementById("sharedGem");
var sharedUserProfile=document.getElementById("sharedUserProfile");
var sharedUserAvatar=document.getElementById("sharedUserAvatar");
var sharedAvatarProgress=document.getElementById("sharedAvatarProgress");
var sharedLevelBadge=document.getElementById("sharedLevelBadge");
var sharedThemeButton=document.getElementById("sharedThemeButton");
var sharedLogoutButton=document.getElementById("sharedLogoutButton");
var sharedDifficulty=document.getElementById("sharedDifficulty");
var sharedRole=document.getElementById("sharedRole");
var sharedLinks=document.querySelectorAll(".shared-link");
var supportButton=document.getElementById("supportButton");

function getSharedRoles(session){
    var aliases={student:"user",map:"user",cskh:"cs",support:"cs",premium:"user"};
    var source=[];
    var append=function(value){
        if(Array.isArray(value)){value.forEach(append);return;}
        if(typeof value==="string"){
            var trimmed=value.trim();
            if(!trimmed){return;}
            if((trimmed.startsWith("[")&&trimmed.endsWith("]"))||trimmed.indexOf(",")>=0){
                try{var parsed=JSON.parse(trimmed);if(Array.isArray(parsed)){parsed.forEach(append);return;}}catch(error){}
                trimmed.split(",").forEach(append);
                return;
            }
        }
        if(value){source.push(value);}
    };
    var hasExplicitRoles=Boolean(session&&Object.prototype.hasOwnProperty.call(session,"roles"));
    append(session&&session.roles);
    if(!hasExplicitRoles){
        append(session&&session.activeRole);
        append(session&&session.role);
    }
    var roles=[];
    source.forEach(function(value){
        var role=aliases[String(value||"").trim().toLowerCase()]||String(value||"").trim().toLowerCase();
        if(["user","parent","cs","admin"].indexOf(role)>=0&&roles.indexOf(role)<0){roles.push(role);}
    });
    return roles;
}

function updateSharedRoleControl(){
    if(!sharedRole){return;}
    var session=getSharedSession();
    var roles=getSharedRoles(session);
    var labels={user:"Học sinh",parent:"Phụ huynh",cs:"CSKH",admin:"Quản trị viên"};
    var current=session.activeRole||session.role||roles[0];
    current=({student:"user",cskh:"cs",support:"cs",premium:"user"})[String(current).toLowerCase()]||String(current).toLowerCase();
    sharedRole.replaceChildren();
    roles.forEach(function(role){
        var option=document.createElement("option");
        option.value=role;
        option.textContent=labels[role];
        sharedRole.appendChild(option);
    });
    sharedRole.value=roles.indexOf(current)>=0?current:roles[0];
    sharedRole.disabled=roles.length<2;
    var wrapper=sharedRole.closest(".shared-role-control");
    if(wrapper){wrapper.hidden=roles.length<2;}
}

function getSharedState(){
    var raw=localStorage.getItem("VieGeo_state");
    if(!raw){
        return {};
    }
    try{
        return JSON.parse(raw);
    }catch(error){
        return {};
    }
}

function getSharedSession(){
    var raw=localStorage.getItem("lm_session");
    if(!raw){
        return {};
    }
    try{
        return JSON.parse(raw);
    }catch(error){
        return {};
    }
}

function updateSharedStats(){
    var state=getSharedState();

    if(sharedHeart){
        sharedHeart.textContent=state.hearts===undefined?3:state.hearts;
    }
    if(sharedStreak){
        sharedStreak.textContent=state.streak||0;
    }
    if(sharedGem){
        sharedGem.textContent=state.gems===undefined?500:state.gems;
    }
    if(sharedDifficulty){
        sharedDifficulty.value=state.selectedDifficulty||"easy";
    }
    updateSharedUserProfile();
}

function getSharedInitials(value){
    var parts=String(value||"Học viên").trim().split(/\s+/).filter(Boolean);
    var initials=parts.slice(-2).map(function(part){return part.charAt(0);}).join("").toUpperCase();
    return initials||"HV";
}

function updateSharedUserProfile(){
    try{
        if(!sharedUserProfile||!sharedUserAvatar||!sharedAvatarProgress||!sharedLevelBadge){return;}
        var state=getSharedState();
        var session=getSharedSession();
        var user=window.VieGeoCurrentUser||{};
        var name=String(user.user_name||user.name||user.full_name||session.name||session.displayName||"Học viên").trim();
        var xp=Number(user.score??user.xp??state.xp??0);
        if(!Number.isFinite(xp)||xp<0){xp=0;}
        var level=Math.floor(xp/100)+1;
        var progress=Math.min(100,Math.round((xp%100)/100*100));
        var avatar=String(user.avatar_url||user.avatarUrl||user.avatar||session.avatar_url||session.avatarUrl||"").trim();

        sharedAvatarProgress.style.setProperty("--xp-progress",String(progress)+"%");
        sharedLevelBadge.textContent="Lv."+String(level);
        sharedUserProfile.setAttribute("aria-label","Mở hồ sơ của "+name+", cấp "+String(level)+", tiến độ XP "+String(progress)+"%");
        sharedUserAvatar.replaceChildren();
        if(/^(https?:|data:image\/)/i.test(avatar)){
            var image=document.createElement("img");
            image.src=avatar;
            image.alt="Ảnh đại diện của "+name;
            image.addEventListener("error",function(){sharedUserAvatar.textContent=getSharedInitials(name);},{once:true});
            sharedUserAvatar.appendChild(image);
        }else{
            sharedUserAvatar.textContent=getSharedInitials(name);
        }
    }catch(error){
        console.warn("[VieGeo] Không thể cập nhật hồ sơ trên thanh menu:",error);
    }
}

function setSharedTheme(theme){
    applyGlobalTheme(theme);
    if(sharedThemeButton){
        sharedThemeButton.textContent=theme==="light"?"Chế độ tối":"Chế độ sáng";
    }
}

function toggleSharedTheme(){
    toggleGlobalTheme();
    setSharedTheme(getGlobalTheme());
}

function markSharedActive(){
    var normalizePage=function(value){return String(value||"").split("?")[0].replace(/\.html$/i,"");};
    var file=normalizePage(window.location.pathname.substring(window.location.pathname.lastIndexOf("/")+1)||"student-dashboard");
    var index;
    var linkFile;

    for(index=0;index<sharedLinks.length;index+=1){
        linkFile=normalizePage(sharedLinks[index].getAttribute("href"));
        sharedLinks[index].classList.remove("active");
        if(linkFile===file){
            sharedLinks[index].classList.add("active");
        }
    }
}

function changeSharedDifficulty(){
    var state=getSharedState();
    state.selectedDifficulty=sharedDifficulty.value;
    localStorage.setItem("VieGeo_state",JSON.stringify(state));
}

function changeSharedRole(){
    var session=getSharedSession();
    var role=sharedRole.value;
    var routeMap={
        user:"student-dashboard.html",
        parent:"parent.html",
        cs:"cs-dashboard.html",
        admin:"admin-dashboard.html"
    };

    if(getSharedRoles(session).indexOf(role)<0){updateSharedRoleControl();return;}
    session.role=role;
    session.activeRole=role;
    localStorage.setItem("lm_session",JSON.stringify(session));
    window.location.href=routeMap[role];
}

function sharedLogout(){
    if(typeof window.VieGeoLogout==="function"){window.VieGeoLogout("loginout.html");return;}
    localStorage.removeItem("lm_session");
    window.location.href="loginout.html";
}

function openSharedSupport(){
    window.location.href="support-user.html";
}

function initializeSharedNavbar(){
    setSharedTheme(getGlobalTheme());
    updateSharedStats();
    markSharedActive();

    if(sharedThemeButton){
        sharedThemeButton.addEventListener("click",toggleSharedTheme);
    }
    if(sharedLogoutButton){
        sharedLogoutButton.addEventListener("click",sharedLogout);
    }
    if(sharedUserProfile){
        sharedUserProfile.addEventListener("click",function(){window.location.href="profile.html";});
    }
    if(sharedDifficulty){
        sharedDifficulty.addEventListener("change",changeSharedDifficulty);
    }
    if(sharedRole){
        sharedRole.addEventListener("change",changeSharedRole);
    }
    if(supportButton){
        supportButton.addEventListener("click",openSharedSupport);
    }
}

if(sharedRole&&sharedRole.closest(".shared-role-control")){
    sharedRole.closest(".shared-role-control").hidden=true;
}

document.addEventListener("DOMContentLoaded",initializeSharedNavbar);
window.addEventListener("viegeo:user-hydrated",function(){
    updateSharedRoleControl();
    updateSharedUserProfile();
});
