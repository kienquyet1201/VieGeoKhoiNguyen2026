var statHearts=document.getElementById("statHearts");
var statStreak=document.getElementById("statStreak");
var statGems=document.getElementById("statGems");
var statXp=document.getElementById("statXp");
var statTrophies=document.getElementById("statTrophies");
var themeButton=document.getElementById("themeButton");
var homeButton=document.getElementById("homeButton");
var filterButtons=document.querySelectorAll(".filter-button");
var leagueSelect=document.getElementById("leagueSelect");
var toast=document.getElementById("toast");

function getLeaderboardState(){
    try{
        return JSON.parse(localStorage.getItem("VieGeo_state")||"{}");
    }catch(error){
        return {};
    }
}

function updateStats(){
    var state=getLeaderboardState();

    if(statHearts){statHearts.textContent=state.hearts===undefined?3:state.hearts;}
    if(statStreak){statStreak.textContent=state.streak||0;}
    if(statGems){statGems.textContent=state.gems===undefined?500:state.gems;}
    if(statXp){statXp.textContent=(state.xp||0)+" XP";}
    if(statTrophies){statTrophies.textContent=state.trophies||state.pvpWins||0;}
}

function applyTheme(theme){
    document.documentElement.setAttribute("data-theme",theme);
    localStorage.setItem("VieGeo_theme",theme);

    if(!themeButton){
        return;
    }
    if(theme==="light"){
        themeButton.innerHTML='<i class="fa-solid fa-moon"></i>';
    }else{
        themeButton.innerHTML='<i class="fa-solid fa-sun"></i>';
    }
}

function switchTheme(){
    var currentTheme=document.documentElement.getAttribute("data-theme");

    if(currentTheme==="light"){
        applyTheme("dark");
    }else{
        applyTheme("light");
    }
}

function selectBoard(event){
    var index;

    for(index=0;index<filterButtons.length;index+=1){
        filterButtons[index].classList.remove("active");
    }

    event.currentTarget.classList.add("active");
    showToast("Đã đổi bảng xếp hạng.");
}

function changeLeague(){
    showToast("Đã chuyển hạng đấu.");
}

function goHome(){
    window.location.href="student-dashboard.html";
}

function showToast(message){
    toast.textContent=message;
    toast.classList.add("show");

    window.setTimeout(function(){
        toast.classList.remove("show");
    },2200);
}

function initializeLeaderboard(){
    var savedTheme=localStorage.getItem("VieGeo_theme");
    var index;

    updateStats();

    if(savedTheme==="light"){
        applyTheme("light");
    }else{
        applyTheme("dark");
    }

    if(themeButton){themeButton.addEventListener("click",switchTheme);}
    if(homeButton){homeButton.addEventListener("click",goHome);}
    if(leagueSelect){leagueSelect.addEventListener("change",changeLeague);}

    for(index=0;index<filterButtons.length;index+=1){
        filterButtons[index].addEventListener("click",selectBoard);
    }
}

document.addEventListener("DOMContentLoaded",initializeLeaderboard);
