var themeButton=document.getElementById("themeButton");
var themeIcon=document.getElementById("themeIcon");
var themeText=document.getElementById("themeText");
var menuItems=document.querySelectorAll(".menu-item[data-section]");
var courseButtons=document.querySelectorAll(".course-button");
var toast=document.getElementById("toast");
var continueButton=document.getElementById("continueButton");
var viewAllCoursesButton=document.getElementById("viewAllCoursesButton");
var leaderboardButton=document.getElementById("leaderboardButton");
var profileButton=document.getElementById("profileButton");
var logoutButton=document.getElementById("logoutButton");
var studentRoleSelect=document.getElementById("studentRoleSelect");
var studentSupportButton=document.getElementById("studentSupportButton");

function applyTheme(theme){
    applyGlobalTheme(theme);

    if(theme==="dark"){
        themeIcon.textContent="☀️";
        themeText.textContent="Chế độ sáng";
    }else{
        themeIcon.textContent="🌙";
        themeText.textContent="Chế độ tối";
    }
}

function switchTheme(){
    toggleGlobalTheme();
    applyTheme(getGlobalTheme());
}

function getStudentSession(){
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

function changeStudentRole(){
    var session=getStudentSession();
    var role=studentRoleSelect.value;
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

function activateMenu(){
    var index;
    var section=this.getAttribute("data-section");

    for(index=0;index<menuItems.length;index+=1){
        menuItems[index].classList.remove("active");
    }

    this.classList.add("active");

    if(section==="home"){window.location.href="student-dashboard.html";return;}
    if(section==="courses"){window.location.href="map.html";return;}
    if(section==="arena"){window.location.href="exam-arena.html";return;}
    if(section==="leaderboard"){window.location.href="leaderboard.html";return;}
    if(section==="shop"){window.location.href="shop.html";return;}
}

function showToast(message){
    toast.textContent=message;
    toast.classList.add("show");
    window.setTimeout(function(){toast.classList.remove("show");},2400);
}

function openCourse(){
    var course=this.getAttribute("data-course");
    localStorage.setItem("viegeo-selected-course",course);
    window.location.href="map.html";
}

function continueLearning(){window.location.href="map.html";}
function openAllCourses(){window.location.href="map.html";}
function openLeaderboard(){window.location.href="leaderboard.html";}
function openProfile(){window.location.href="profile.html";}
function openStudentSupport(){window.location.href="support-user.html";}

function logoutStudent(){
    localStorage.removeItem("lm_session");
    window.location.href="loginout.html";
}

function initializeStudent(){
    var session=getStudentSession();
    var index;

    applyTheme(getGlobalTheme());

    if(studentRoleSelect){
        studentRoleSelect.value=session.activeRole||session.role||"user";
        studentRoleSelect.addEventListener("change",changeStudentRole);
    }

    themeButton.addEventListener("click",switchTheme);
    continueButton.addEventListener("click",continueLearning);
    viewAllCoursesButton.addEventListener("click",openAllCourses);
    leaderboardButton.addEventListener("click",openLeaderboard);
    profileButton.addEventListener("click",openProfile);
    logoutButton.addEventListener("click",logoutStudent);

    if(studentSupportButton){
        studentSupportButton.addEventListener("click",openStudentSupport);
    }

    for(index=0;index<menuItems.length;index+=1){
        menuItems[index].addEventListener("click",activateMenu);
    }

    for(index=0;index<courseButtons.length;index+=1){
        courseButtons[index].addEventListener("click",openCourse);
    }
}

document.addEventListener("DOMContentLoaded",initializeStudent);
