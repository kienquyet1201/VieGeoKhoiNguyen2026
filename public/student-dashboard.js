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
var studentGreeting=document.getElementById("studentGreeting");
var studentStreak=document.getElementById("studentStreak");

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

function updateStudentIdentity(user){
    var session=getStudentSession();
    var name=String((user&& (user.name||user.full_name||user.display_name)) || session.name || session.displayName || "Bạn").trim();
    var streak=Number(user&&(user.current_streak!==undefined?user.current_streak:user.streak));

    if(!Number.isFinite(streak)){
        try{
            var state=JSON.parse(localStorage.getItem("VieGeo_state")||"{}");
            streak=Number(state.streak)||0;
        }catch(error){
            streak=0;
        }
    }
    if(studentGreeting){studentGreeting.textContent="Chào "+name+" 👋";}
    if(studentStreak){studentStreak.textContent="🔥 "+streak+" ngày";}
}

async function syncStudentIdentity(){
    var client=window.supabaseClient||window.supabase||window.VieGeoSupabase&&window.VieGeoSupabase.client;
    var session=getStudentSession();
    var authenticatedUser=null;
    var email=String(session.email||"").trim().toLowerCase();

    try{
        if(client&&client.auth&&typeof client.auth.getUser==="function"){
            var authResult=await client.auth.getUser();
            authenticatedUser=authResult&&authResult.data&&authResult.data.user;
            email=String((authenticatedUser&&authenticatedUser.email)||email).trim().toLowerCase();
        }
        if(client&&typeof client.from==="function"&&email){
            var result=await client.from("users")
                .select("name,full_name,display_name,email,current_streak")
                .eq("email",email)
                .maybeSingle();
            if(result.error){throw result.error;}
            updateStudentIdentity(result.data||authenticatedUser||session);
            return;
        }
    }catch(error){
        console.warn("Không thể đồng bộ thông tin học viên từ Supabase:",error.message||error);
    }
    updateStudentIdentity(authenticatedUser||session);
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
    syncStudentIdentity();

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
