var sharedHeart=document.getElementById("sharedHeart");
var sharedStreak=document.getElementById("sharedStreak");
var sharedGem=document.getElementById("sharedGem");
var sharedXp=document.getElementById("sharedXp");
var sharedThemeButton=document.getElementById("sharedThemeButton");
var sharedLogoutButton=document.getElementById("sharedLogoutButton");
var sharedDifficulty=document.getElementById("sharedDifficulty");
var sharedRole=document.getElementById("sharedRole");
var sharedLinks=document.querySelectorAll(".shared-link");
var supportButton=document.getElementById("supportButton");

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
    var session=getSharedSession();

    if(sharedHeart){
        sharedHeart.textContent=state.hearts===undefined?3:state.hearts;
    }
    if(sharedStreak){
        sharedStreak.textContent=state.streak||0;
    }
    if(sharedGem){
        sharedGem.textContent=state.gems===undefined?500:state.gems;
    }
    if(sharedXp){
        sharedXp.textContent=(state.xp||0)+" XP";
    }
    if(sharedDifficulty){
        sharedDifficulty.value=state.selectedDifficulty||"easy";
    }
    if(sharedRole){
        sharedRole.value=session.activeRole||session.role||"user";
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
    var file=window.location.pathname.substring(window.location.pathname.lastIndexOf("/")+1)||"student-dashboard.html";
    var index;
    var linkFile;

    for(index=0;index<sharedLinks.length;index+=1){
        linkFile=sharedLinks[index].getAttribute("href").split("?")[0];
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

    session.role=role;
    session.activeRole=role;
    localStorage.setItem("lm_session",JSON.stringify(session));
    window.location.href=routeMap[role];
}

function sharedLogout(){
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

document.addEventListener("DOMContentLoaded",initializeSharedNavbar);
