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
var studentRoleSwitcher=document.getElementById("studentRoleSwitcher");
var studentSupportButton=document.getElementById("studentSupportButton");
var studentGreeting=document.getElementById("studentGreeting");
var studentStreak=document.getElementById("studentStreak");
var studentGemValue=document.getElementById("studentGemValue");
var studentExpValue=document.getElementById("studentExpValue");
var studentAllowedRoles=[];
var studentRolesHydrated=false;

function normalizeStudentRole(value){
    var aliases={student:"user",map:"user",cskh:"cs",support:"cs",premium:"user"};
    var role=String(value||"").trim().toLowerCase();
    return aliases[role]||role;
}

function appendStudentRoles(target,value){
    if(Array.isArray(value)){value.forEach(function(item){appendStudentRoles(target,item);});return;}
    if(typeof value==="string"){
        var trimmed=value.trim();
        if(!trimmed){return;}
        if((trimmed.charAt(0)==="["&&trimmed.charAt(trimmed.length-1)==="]")||trimmed.indexOf(",")>=0){
            try{
                var parsed=JSON.parse(trimmed);
                if(Array.isArray(parsed)){appendStudentRoles(target,parsed);return;}
            }catch(error){}
            trimmed.split(",").forEach(function(item){appendStudentRoles(target,item);});
            return;
        }
        var role=normalizeStudentRole(trimmed);
        if(["user","parent","cs","admin"].indexOf(role)>=0&&target.indexOf(role)<0){target.push(role);}
    }
}

function studentRolesFromUser(user){
    var roles=[];
    var hasExplicitRoles=Boolean(user&&Object.prototype.hasOwnProperty.call(user,"roles"));
    if(hasExplicitRoles){
        appendStudentRoles(roles,user.roles);
    }else if(user){
        appendStudentRoles(roles,user.active_role||user.activeRole||user.role);
    }
    return roles;
}

function renderStudentRoleSwitcher(user){
    var labels={user:"Học viên",parent:"Phụ huynh",cs:"Chăm sóc KH",admin:"Quản trị viên"};
    var requested=window.VieGeoUserStore?.getActiveRole?.()||normalizeStudentRole(user?.role);
    studentAllowedRoles=studentRolesFromUser(user);
    studentRolesHydrated=true;

    if(studentRoleSelect){
        studentRoleSelect.replaceChildren();
        studentAllowedRoles.forEach(function(role){
            var option=document.createElement("option");
            option.value=role;
            option.textContent=labels[role];
            studentRoleSelect.appendChild(option);
        });
        studentRoleSelect.value=studentAllowedRoles.indexOf(requested)>=0?requested:(studentAllowedRoles[0]||"");
        studentRoleSelect.disabled=studentAllowedRoles.length<2;
    }
    if(studentRoleSwitcher){studentRoleSwitcher.hidden=studentAllowedRoles.length<2;}

}

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
    return window.VieGeoUserStore?.get?.()||window.VieGeoCurrentUser||{};
}

function updateStudentIdentity(user){
    var name=String(user?.display_name||"Bạn").trim();
    var streak=Number(user&&(user.current_streak!==undefined?user.current_streak:user.streak));
    var exp=Number(user&&(user.score??user.xp));
    var gems=Number(user&&(user.gems??user.diamonds));
    var legacyAvatar=String(user&&user.avatar||"").trim();
    var avatarUrl=String(user&&(user.avatar_url||user.avatarUrl)||"").trim();
    if(!avatarUrl&&/^(https?:|data:image\/)/i.test(legacyAvatar)){avatarUrl=legacyAvatar;}
    var initials=name.split(/\s+/).filter(Boolean).slice(-2).map(function(part){return part.charAt(0);}).join("").toUpperCase()||"HV";

    if(!Number.isFinite(streak)){streak=0;}
    if(!Number.isFinite(exp)){exp=0;}
    if(!Number.isFinite(gems)){gems=0;}
    if(studentGreeting){studentGreeting.textContent="Chào "+name+" 👋";}
    if(studentStreak){studentStreak.textContent="🔥 "+streak+" ngày";}
    if(studentExpValue){studentExpValue.textContent=exp.toLocaleString("vi-VN")+" EXP";}
    if(studentGemValue){studentGemValue.textContent=gems.toLocaleString("vi-VN");}
    if(profileButton){
        profileButton.replaceChildren();
        if(avatarUrl){
            var avatarImage=document.createElement("img");
            avatarImage.src=avatarUrl;
            avatarImage.alt="Ảnh đại diện của "+name;
            avatarImage.addEventListener("error",function(){profileButton.textContent=initials;},{once:true});
            profileButton.appendChild(avatarImage);
        }else{
            profileButton.textContent=initials;
        }
    }
}

async function syncStudentIdentity(){
    try{
        var canonicalProfile=await window.VieGeoUserStore?.ready?.({refreshStreak:false});
        if(canonicalProfile){
            updateStudentIdentity(canonicalProfile);
            renderStudentRoleSwitcher(canonicalProfile);
            return;
        }
    }catch(canonicalError){console.warn('Không thể tải hồ sơ chuẩn:',canonicalError);}
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
        if(client&&typeof client.from==="function"&&authenticatedUser?.id){
            var result=await client.from("users")
                .select("*")
                .eq("id",authenticatedUser.id)
                .maybeSingle();
            if(result.error){throw result.error;}
            updateStudentIdentity(result.data||authenticatedUser||session);
            renderStudentRoleSwitcher(result.data||{});
            return;
        }
    }catch(error){
        console.warn("Không thể đồng bộ thông tin học viên từ Supabase:",error.message||error);
    }
    renderStudentRoleSwitcher(null);
    updateStudentIdentity(authenticatedUser||session);
}

function getStudentClient(){
    var client=window.supabaseClient||window.supabase||window.VieGeoSupabase&&window.VieGeoSupabase.client;
    return client&&typeof client.from==="function"?client:null;
}

function normalizeLearningKey(value){
    try{
        return String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase();
    }catch(error){
        return String(value||"").trim().toLowerCase();
    }
}

function submissionIslandNumber(row){
    var source=row||{};
    var direct=source.sub_island??source.subIsland??source.island_index??source.islandIndex??source.details?.island_index;
    var match=String(source.island||source.details?.island||"").match(/\d+/);
    if(match){return Number(match[0]);}
    return Number.isFinite(Number(direct))?Number(direct):0;
}

function learningRecordKey(row){
    var province=normalizeLearningKey(row?.province||row?.province_slug||row?.details?.province||"");
    var island=submissionIslandNumber(row);
    return province&&island>0?province+"|"+island:"";
}

async function fetchStudentRows(table,columns,email){
    var client=getStudentClient();
    var rows=[];
    var pageSize=1000;
    if(!client){throw new Error("Supabase client chưa sẵn sàng.");}
    for(var page=0;page<50;page+=1){
        var query=client.from(table).select(columns||"*");
        if(email){query=query.eq("user_email",email);}
        var result=await query.range(page*pageSize,(page+1)*pageSize-1);
        if(result.error){throw result.error;}
        var pageRows=Array.isArray(result.data)?result.data:[];
        rows=rows.concat(pageRows);
        if(pageRows.length<pageSize){break;}
    }
    return rows;
}

function startOfCurrentWeek(){
    var date=new Date();
    var day=date.getDay()||7;
    date.setHours(0,0,0,0);
    date.setDate(date.getDate()-day+1);
    return date;
}

function submissionScore(row){
    var correct=Number(row?.correct_count??row?.details?.correct_count);
    var total=Number(row?.total_count??row?.details?.total_count);
    if(Number.isFinite(correct)&&Number.isFinite(total)&&total>0){return Math.max(0,Math.min(10,correct/total*10));}
    var score=Number(row?.score??0);
    if(!Number.isFinite(score)){return 0;}
    return score>10?Math.max(0,Math.min(10,score/10)):Math.max(0,Math.min(10,score));
}

function submissionDurationSeconds(row){
    var details=row?.details||{};
    var seconds=Number(row?.duration_seconds??details.duration_seconds);
    if(Number.isFinite(seconds)&&seconds>0){return seconds;}
    var minutes=Number(row?.duration_minutes??details.duration_minutes);
    if(Number.isFinite(minutes)&&minutes>0){return minutes*60;}
    var milliseconds=Number(row?.duration_ms??details.duration_ms);
    return Number.isFinite(milliseconds)&&milliseconds>0?milliseconds/1000:0;
}

function formatStudyTime(totalSeconds){
    var minutes=Math.round(Math.max(0,Number(totalSeconds)||0)/60);
    if(minutes<60){return minutes+" phút";}
    return Math.floor(minutes/60)+"h "+String(minutes%60).padStart(2,"0")+"m";
}

function renderWeeklyActivity(submissions){
    var weekStart=startOfCurrentWeek().getTime();
    var weekly=(Array.isArray(submissions)?submissions:[]).filter(function(row){
        var timestamp=new Date(row?.created_at||row?.submitted_at||0).getTime();
        return Number.isFinite(timestamp)&&timestamp>=weekStart;
    });
    var average=weekly.length?weekly.reduce(function(total,row){return total+submissionScore(row);},0)/weekly.length:0;
    var duration=weekly.reduce(function(total,row){return total+submissionDurationSeconds(row);},0);
    var lessons=document.getElementById("weeklyLessons");
    var averageNode=document.getElementById("weeklyAverage");
    var time=document.getElementById("weeklyStudyTime");
    if(lessons){lessons.textContent=String(weekly.length);}
    if(averageNode){averageNode.textContent=average.toFixed(1).replace(".0","");}
    if(time){time.textContent=formatStudyTime(duration);}
}

function renderStudentProgress(questions,submissions){
    var totals=new Set();
    var completed=new Set();
    (Array.isArray(questions)?questions:[]).forEach(function(row){var key=learningRecordKey(row);if(key){totals.add(key);}});
    (Array.isArray(submissions)?submissions:[]).forEach(function(row){var key=learningRecordKey(row);if(key){completed.add(key);}});
    var completedExisting=Array.from(completed).filter(function(key){return totals.has(key);}).length;
    var overall=totals.size?Math.min(100,Math.round(completedExisting/totals.size*100)):0;
    var overallLabel=document.getElementById("studentOverallProgress");
    var overallFill=document.getElementById("studentOverallProgressFill");
    if(overallLabel){overallLabel.textContent=overall+"%";}
    if(overallFill){overallFill.style.width=overall+"%";}

    document.querySelectorAll(".course-card").forEach(function(card){
        var course=normalizeLearningKey(card.querySelector("[data-course]")?.dataset.course||"");
        var courseTotal=Array.from(totals).filter(function(key){return key.indexOf(course+"|")===0;}).length;
        var courseCompleted=Array.from(completed).filter(function(key){return key.indexOf(course+"|")===0&&totals.has(key);}).length;
        var percent=courseTotal?Math.min(100,Math.round(courseCompleted/courseTotal*100)):0;
        var label=card.querySelector(".course-topline strong");
        var fill=card.querySelector(".course-progress-fill");
        if(label){label.textContent=percent+"%";}
        if(fill){fill.style.width=percent+"%";}
    });
}

function renderStudentLeaderboard(rows,user){
    var list=document.querySelector(".student-main .leaderboard-list");
    if(!list){return;}
    var email=String(user?.email||"").trim().toLowerCase();
    var displayName=function(row){
        var candidates=[row?.user_name,row?.username,row?.display_name,row?.full_name,row?.name];
        for(var candidateIndex=0;candidateIndex<candidates.length;candidateIndex+=1){
            var candidate=String(candidates[candidateIndex]||"").trim();
            // A few legacy leaderboard rows saved the email in `name`.
            // Never expose that address when the user profile has a display name.
            if(candidate&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate)){return candidate;}
        }
        return "Học viên";
    };
    var normalized=(Array.isArray(rows)?rows:[]).map(function(row,index){
        return {
            id:row?.id||row?.email||index,
            email:String(row?.email||row?.user_email||"").trim().toLowerCase(),
            name:displayName(row),
            score:Number(row?.score??row?.xp??0)||0,
            streak:Number(row?.current_streak??row?.streak??0)||0
        };
    }).sort(function(first,second){return second.score-first.score||second.streak-first.streak;}).slice(0,3);
    list.replaceChildren();
    if(!normalized.length){list.innerHTML='<div class="empty-state">Chưa có học viên nào trên bảng xếp hạng.</div>';return;}
    normalized.forEach(function(entry,index){
        var item=document.createElement("div");
        item.className="leaderboard-item"+(entry.email&&entry.email===email?" current-place":"")+(index===0?" first-place":"");
        item.innerHTML='<span class="rank"></span><div class="leader-avatar"></div><div><strong></strong><small></small></div><span class="medal"></span>';
        item.querySelector(".rank").textContent=String(index+1);
        item.querySelector(".leader-avatar").textContent=entry.name.trim().split(/\s+/).slice(-2).map(function(part){return part.charAt(0);}).join("").toUpperCase();
        item.querySelector("strong").textContent=entry.name;
        item.querySelector("small").textContent=entry.score.toLocaleString("vi-VN")+" điểm · 🔥 "+entry.streak;
        item.querySelector(".medal").textContent=["🥇","🥈","🥉"][index]||"";
        list.appendChild(item);
    });
}

async function syncStudentLearningData(){
    try{
        var canonicalProfile=await window.VieGeoUserStore?.ready?.({refreshStreak:false});
        var canonicalClient=getStudentClient();
        if(canonicalProfile&&canonicalClient){
            var canonicalResults=await Promise.all([
                canonicalClient.from('questions').select('province,island'),
                canonicalClient.from('lesson_completions').select('*'),
                canonicalClient.rpc('get_leaderboard',{p_limit:500})
            ]);
            var completed=(canonicalResults[1].data||[]).map(function(row){
                return Object.assign({},row,{created_at:row.completed_at,details:{island_index:Number(String(row.lesson_key||'').split('-').pop())||0,stars:row.stars}});
            });
            updateStudentIdentity(canonicalProfile);
            renderStudentProgress(canonicalResults[0].data||[],completed);
            renderWeeklyActivity(completed);
            renderStudentLeaderboard(canonicalResults[2].data||[],canonicalProfile);
            return;
        }
    }catch(canonicalError){console.warn('Không thể tải tiến độ chuẩn:',canonicalError);}
    var client=getStudentClient();
    var session=getStudentSession();
    var authenticatedUser=null;
    var email=String(session.email||"").trim().toLowerCase();
    try{
        if(!client){throw new Error("Supabase client chưa sẵn sàng.");}
        if(client.auth&&typeof client.auth.getUser==="function"){
            var authResult=await client.auth.getUser();
            authenticatedUser=authResult?.data?.user||null;
            email=String(authenticatedUser?.email||email).trim().toLowerCase();
        }
        if(!email){throw new Error("Không xác định được tài khoản học viên hiện tại.");}
        var userResult=await client.from("users").select("*").eq("id",authenticatedUser?.id||"").maybeSingle();
        if(userResult.error){throw userResult.error;}
        var leaderboardResult=await client.rpc("get_leaderboard",{p_limit:500});
        var usersResult={data:Array.isArray(leaderboardResult.data)?leaderboardResult.data:[],error:leaderboardResult.error};
        if(usersResult.error){throw usersResult.error;}
        var leaderboardRows=[];
        if(!leaderboardResult.error&&Array.isArray(leaderboardResult.data)&&leaderboardResult.data.length){
            var usersById=new Map();
            (Array.isArray(usersResult.data)?usersResult.data:[]).forEach(function(item){
                if(item.id!==undefined&&item.id!==null){usersById.set(String(item.id),item);}
                if(item.email){usersById.set(String(item.email).trim().toLowerCase(),item);}
            });
            leaderboardRows=leaderboardResult.data.map(function(row){
                var linked=usersById.get(String(row?.user_id??row?.id??""))||usersById.get(String(row?.user_email||row?.email||"").trim().toLowerCase())||{};
                return Object.assign({},linked,row,{current_streak:row?.current_streak??linked.current_streak??0,score:row?.score??linked.score??linked.xp??0});
            });
        }else{
            leaderboardRows=Array.isArray(usersResult.data)?usersResult.data:[];
        }
        var rows=await Promise.all([
            fetchStudentRows("questions","province,island"),
            fetchStudentRows("submissions","*",email)
        ]);
        var user=userResult.data||authenticatedUser||{email:email};
        updateStudentIdentity(user);
        renderStudentProgress(rows[0],rows[1]);
        renderWeeklyActivity(rows[1]);
        renderStudentLeaderboard(leaderboardRows,user);
    }catch(error){
        console.warn("Không thể đồng bộ dữ liệu học tập từ Supabase:",error);
        updateStudentIdentity(authenticatedUser||{email:email,current_streak:0});
        renderStudentProgress([],[]);
        renderWeeklyActivity([]);
        renderStudentLeaderboard([],{email:email});
    }
}

function changeStudentRole(){
    var role=studentRoleSelect.value;
    var routeMap={
        user:"student-dashboard.html",
        parent:"parent.html",
        cs:"cs-dashboard.html",
        admin:"admin-dashboard.html"
    };

    if(!studentRolesHydrated||studentAllowedRoles.indexOf(role)<0){
        showToast("Tài khoản chưa được cấp vai trò này.");
        studentRoleSelect.value=window.VieGeoUserStore?.getActiveRole?.()||studentAllowedRoles[0]||"";
        return;
    }
    window.VieGeoUserStore?.setActiveRole?.(role);
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
    if(section==="deathmatch"){window.location.href="arena.html";return;}
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
    if(typeof window.VieGeoLogout==="function"){window.VieGeoLogout("loginout.html");return;}
    localStorage.removeItem("lm_session");
    window.location.href="loginout.html";
}

function initializeStudent(){
    var session=getStudentSession();
    var index;

    applyTheme(getGlobalTheme());
    syncStudentLearningData();

    if(studentRoleSelect){
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
