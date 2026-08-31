var regionsView=document.getElementById("regionsView");
var provincesView=document.getElementById("provincesView");
var roadmapView=document.getElementById("roadmapView");
var quizView=document.getElementById("quizView");
var provinceGrid=document.getElementById("provinceGrid");
var roadmapContainer=document.getElementById("roadmapContainer");
var regionCards=document.querySelectorAll(".region-card");
var provincesBackButton=document.getElementById("provincesBackButton");
var roadmapBackButton=document.getElementById("roadmapBackButton");
var quizBackButton=document.getElementById("quizBackButton");
var nextQuestionButton=document.getElementById("nextQuestionButton");
var answerGrid=document.getElementById("answerGrid");
var provinceRegionBadge=document.getElementById("provinceRegionBadge");
var provinceRegionTitle=document.getElementById("provinceRegionTitle");
var provinceRegionDescription=document.getElementById("provinceRegionDescription");
var provinceSummary=document.getElementById("provinceSummary");
var roadmapProvinceTitle=document.getElementById("roadmapProvinceTitle");
var quizProvinceTitle=document.getElementById("quizProvinceTitle");
var quizStageLabel=document.getElementById("quizStageLabel");
var questionNumber=document.getElementById("questionNumber");
var questionStatus=document.getElementById("questionStatus");
var questionText=document.getElementById("questionText");
var answerFeedback=document.getElementById("answerFeedback");
var premiumHintPanel=document.getElementById("premiumHintPanel");
var premiumHintButton=document.getElementById("premiumHintButton");
var premiumHintOutput=document.getElementById("premiumHintOutput");
var supportButton=document.getElementById("supportButton");
var provinceSummaryModal=document.getElementById("provinceSummaryModal");
var provinceSummaryTitle=document.getElementById("provinceSummaryTitle");
var provinceSummarySubtitle=document.getElementById("provinceSummarySubtitle");
var provinceSummaryContent=document.getElementById("provinceSummaryContent");
var provinceSummaryCloseButton=document.getElementById("provinceSummaryCloseButton");
var provinceSummaryDoneButton=document.getElementById("provinceSummaryDoneButton");
var islandTheoryModal=document.getElementById("islandTheoryModal");
var islandTheoryTitle=document.getElementById("islandTheoryTitle");
var islandTheorySubtitle=document.getElementById("islandTheorySubtitle");
var islandTheoryBankStatus=document.getElementById("islandTheoryBankStatus");
var islandTheoryContent=document.getElementById("islandTheoryContent");
var islandTheoryCloseButton=document.getElementById("islandTheoryCloseButton");
var islandTheoryStartButton=document.getElementById("islandTheoryStartButton");
var selectedRegionKey="";
var selectedProvince="";
var selectedStage=1;
var currentQuestionIndex=0;
var selectedAnswer=-1;
var activeQuestionSet=[];
var quizCompleted=false;
var ISLAND_QUESTION_LIMIT=5;
var activeQuestionBankSize=0;
var activeQuestionLoadState="idle";
var questionLoadRequestId=0;
var activeIslandTheory="";
var quizCorrectAnswers=0;
var quizStartedAt=0;
var quizAttemptId="";
var stageCompletionPromise=null;
var mapProgressByProvince=Object.create(null);
var mapProgressReady=false;
var currentMapUserEmail="";
var currentMapProfile=null;
var islandResultModal=document.getElementById("islandResultModal");
var islandResultCloseButton=document.getElementById("islandResultCloseButton");
var islandResultContinueButton=document.getElementById("islandResultContinueButton");
var islandResultStars=document.getElementById("islandResultStars");
var islandResultTitle=document.getElementById("islandResultTitle");
var islandResultScore=document.getElementById("islandResultScore");
var islandResultXp=document.getElementById("islandResultXp");
var islandResultGems=document.getElementById("islandResultGems");

function calculateIslandStars(correctAnswers){
    var correct=Math.max(0,Math.min(ISLAND_QUESTION_LIMIT,Number(correctAnswers)||0));
    if(correct===ISLAND_QUESTION_LIMIT){return 3;}
    if(correct>=3){return 2;}
    if(correct>=1){return 1;}
    return 0;
}

function updateLocalIslandRewards(xp,gems,streak){
    var state={};
    try{state=JSON.parse(localStorage.getItem("VieGeo_state")||"{}");}catch(error){state={};}
    state.xp=Number(xp)||0;
    state.gems=Number(gems)||0;
    state.streak=Number(streak)||0;
    localStorage.setItem("VieGeo_state",JSON.stringify(state));
    var sharedXp=document.getElementById("sharedXp");
    var sharedGem=document.getElementById("sharedGem");
    var sharedStreak=document.getElementById("sharedStreak");
    if(sharedXp){sharedXp.textContent=state.xp+" XP";}
    if(sharedGem){sharedGem.textContent=String(state.gems);}
    if(sharedStreak){sharedStreak.textContent=String(state.streak);}
    window.dispatchEvent(new CustomEvent("viegeo:state-hydrated"));
}

function getVietnamDateKey(value){
    var date=value?new Date(value):new Date();
    if(Number.isNaN(date.getTime())&&typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)){return value;}
    var parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(date);
    var values={};
    parts.forEach(function(part){if(part.type!=="literal"){values[part.type]=part.value;}});
    return values.year+"-"+values.month+"-"+values.day;
}

function showIslandResultModal(result){
    var stars=Math.max(0,Math.min(3,Number(result?.stars)||0));
    if(!islandResultModal){return;}
    islandResultStars.textContent="★".repeat(stars)+"☆".repeat(3-stars);
    islandResultStars.setAttribute("aria-label",stars+" trên 3 sao");
    islandResultTitle.textContent=stars>0?"Chúc mừng! Bạn đạt "+stars+" sao":"Bạn đã hoàn thành đảo";
    islandResultScore.textContent="Trả lời đúng "+quizCorrectAnswers+"/"+ISLAND_QUESTION_LIMIT+" câu hỏi";
    islandResultXp.textContent="+"+String(result?.xpReward||0)+" XP";
    islandResultGems.textContent="+"+String(result?.gemsReward||0)+" Gem";
    islandResultModal.hidden=false;
    islandResultModal.style.setProperty("display","grid","important");
    islandResultModal.style.setProperty("position","fixed","important");
    islandResultModal.style.setProperty("inset","0","important");
    islandResultModal.setAttribute("aria-hidden","false");
    document.body.classList.add("island-result-open");
    document.documentElement.classList.add("island-result-open");
    islandResultContinueButton?.focus();
}

function closeIslandResultModal(){
    if(!islandResultModal){return;}
    // Release focus before hiding the modal, otherwise Chrome reports that a
    // focused element is inside an aria-hidden container.
    if(islandResultModal.contains(document.activeElement)){
        document.activeElement.blur();
    }
    islandResultModal.hidden=true;
    islandResultModal.style.removeProperty("display");
    islandResultModal.setAttribute("aria-hidden","true");
    document.body.classList.remove("island-result-open");
    document.documentElement.classList.remove("island-result-open");
}

function continueAfterIslandResult(){
    closeIslandResultModal();
    renderRoadmap();
    showRoadmapView();
}

function ensureIslandTheoryUi(){
    var runtimeStyle=document.getElementById("viegeoIslandTheoryRuntimeStyle");

    islandTheoryModal=document.getElementById("islandTheoryModal");
    if(!islandTheoryModal){
        islandTheoryModal=document.createElement("div");
        islandTheoryModal.id="islandTheoryModal";
        islandTheoryModal.className="province-summary-modal island-theory-modal";
        islandTheoryModal.hidden=true;
        islandTheoryModal.innerHTML='<button class="province-summary-backdrop" type="button" data-close-island-theory aria-label="Quay lại lộ trình"></button>'+
            '<section class="province-summary-dialog island-theory-dialog" role="dialog" aria-modal="true" aria-labelledby="islandTheoryTitle">'+
            '<button id="islandTheoryCloseButton" class="province-summary-close" type="button" aria-label="Quay lại lộ trình">×</button>'+
            '<span class="province-summary-eyebrow">Chuẩn bị trước khi làm bài</span>'+
            '<h2 id="islandTheoryTitle">Lý thuyết cần nhớ</h2>'+
            '<p id="islandTheorySubtitle" class="province-summary-subtitle"></p>'+
            '<div id="islandTheoryBankStatus" class="island-theory-bank-status" aria-live="polite">Đang chuẩn bị nội dung bài học...</div>'+
            '<div id="islandTheoryContent" class="province-summary-content island-theory-content">Đang chuẩn bị nội dung lý thuyết...</div>'+
            '<button id="islandTheoryStartButton" class="province-summary-done island-theory-start" type="button" disabled>BẮT ĐẦU LÀM BÀI</button>'+
            '</section>';
        document.body.appendChild(islandTheoryModal);
    }

    if(!runtimeStyle){
        runtimeStyle=document.createElement("style");
        runtimeStyle.id="viegeoIslandTheoryRuntimeStyle";
        runtimeStyle.textContent="#islandTheoryModal[hidden]{display:none!important}#islandTheoryModal{position:fixed;inset:0;z-index:2147483000;place-items:center;padding:20px}#islandTheoryModal .province-summary-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;background:rgba(1,10,20,.82)}#islandTheoryModal .island-theory-dialog{position:relative;z-index:1;width:min(820px,100%);max-height:82vh;overflow:auto}";
        document.head.appendChild(runtimeStyle);
    }

    islandTheoryTitle=document.getElementById("islandTheoryTitle");
    islandTheorySubtitle=document.getElementById("islandTheorySubtitle");
    islandTheoryBankStatus=document.getElementById("islandTheoryBankStatus");
    islandTheoryContent=document.getElementById("islandTheoryContent");
    islandTheoryCloseButton=document.getElementById("islandTheoryCloseButton");
    islandTheoryStartButton=document.getElementById("islandTheoryStartButton");

    if(islandTheoryModal.dataset.viegeoBound!=="true"){
        islandTheoryModal.dataset.viegeoBound="true";
        islandTheoryCloseButton?.addEventListener("click",closeIslandTheory);
        islandTheoryStartButton?.addEventListener("click",beginIslandQuiz);
        islandTheoryModal.addEventListener("click",function(event){
            if(event.target.closest("[data-close-island-theory]")){
                closeIslandTheory();
            }
        });
    }
    return islandTheoryModal;
}

var regionData={
    north:{name:"Miền Bắc",description:"Khám phá các tỉnh thành miền Bắc từ vùng núi cao đến đồng bằng sông Hồng.",provinces:["Hà Nội","Hải Phòng","Quảng Ninh","Hà Giang","Cao Bằng","Bắc Kạn","Tuyên Quang","Lào Cai","Yên Bái","Thái Nguyên","Lạng Sơn","Bắc Giang","Phú Thọ","Vĩnh Phúc","Bắc Ninh","Hải Dương","Hưng Yên","Thái Bình","Hà Nam","Nam Định","Ninh Bình","Hòa Bình","Sơn La","Điện Biên","Lai Châu"]},
    central:{name:"Miền Trung",description:"Khám phá dải đất miền Trung, duyên hải và không gian Tây Nguyên.",provinces:["Thanh Hóa","Nghệ An","Hà Tĩnh","Quảng Bình","Quảng Trị","Thừa Thiên Huế","Đà Nẵng","Quảng Nam","Quảng Ngãi","Bình Định","Phú Yên","Khánh Hòa","Ninh Thuận","Bình Thuận","Kon Tum","Gia Lai","Đắk Lắk","Đắk Nông","Lâm Đồng"]},
    south:{name:"Miền Nam",description:"Khám phá Đông Nam Bộ và Đồng bằng sông Cửu Long với nhịp sống sôi động và sông nước đặc trưng.",provinces:["Bình Phước","Tây Ninh","Bình Dương","Đồng Nai","Bà Rịa - Vũng Tàu","TP. Hồ Chí Minh","Long An","Tiền Giang","Bến Tre","Trà Vinh","Vĩnh Long","Đồng Tháp","An Giang","Kiên Giang","Cần Thơ","Hậu Giang","Sóc Trăng","Bạc Liêu","Cà Mau"]}
};

var quizQuestions={"easy": [{"question": "Việt Nam thuộc châu lục nào?", "options": ["Châu Á", "Châu Âu", "Châu Phi", "Châu Mĩ"], "correctAnswer": 0, "explanation": "Việt Nam nằm ở khu vực Đông Nam Á, thuộc châu Á."}, {"question": "Biển nằm ở phía đông nước ta là biển nào?", "options": ["Biển Đông", "Biển Đỏ", "Biển Đen", "Biển Trắng"], "correctAnswer": 0, "explanation": "Việt Nam có bờ biển dài giáp Biển Đông."}], "medium": [{"question": "Biểu đồ tròn phù hợp nhất để thể hiện nội dung nào?", "options": ["Cơ cấu tại một thời điểm", "Nhiệt độ trong ngày", "Đường đi", "Vị trí địa danh"], "correctAnswer": 0, "explanation": "Biểu đồ tròn thường thể hiện cơ cấu thành phần của một tổng thể."}, {"question": "Yếu tố nào thúc đẩy chuyển dịch cơ cấu kinh tế?", "options": ["Khoa học - công nghệ", "Tách rời thị trường", "Giảm đào tạo", "Lãng phí tài nguyên"], "correctAnswer": 0, "explanation": "Khoa học - công nghệ nâng năng suất và tạo ngành nghề mới."}], "hard": [{"question": "Giải pháp hiệu quả để phát triển bền vững vùng kinh tế trọng điểm là gì?", "options": ["Liên kết ngành và liên kết vùng", "Phát triển tách biệt", "Bỏ qua môi trường", "Chỉ khai thác tài nguyên thô"], "correctAnswer": 0, "explanation": "Liên kết giúp tối ưu nguồn lực, hạ tầng và chuỗi giá trị."}, {"question": "Khi nhận xét biểu đồ cơ cấu, cần ưu tiên xác định nội dung nào?", "options": ["Xu hướng chuyển dịch tỉ trọng", "Màu nền biểu đồ", "Kích thước trang giấy", "Tên người vẽ"], "correctAnswer": 0, "explanation": "Cơ cấu cần được phân tích theo tỉ trọng và sự thay đổi giữa các thành phần."}]};

function hideAllViews(){
    regionsView.style.display="none";
    provincesView.style.display="none";
    roadmapView.style.display="none";
    quizView.style.display="none";
}

function showRegionsView(){
    hideAllViews();
    regionsView.style.display="block";
    window.scrollTo(0,0);
}

function showProvincesView(){
    hideAllViews();
    provincesView.style.display="block";
    window.scrollTo(0,0);
}

function showRoadmapView(){
    hideAllViews();
    roadmapView.style.display="block";
    window.scrollTo(0,0);
}

function showQuizView(){
    hideAllViews();
    quizView.style.display="block";
    window.scrollTo(0,0);
}

function getGameStateValue(){
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

function getDifficulty(){
    var state=getGameStateValue();

    if(state.selectedDifficulty==="medium"){
        return "medium";
    }

    if(state.selectedDifficulty==="hard"){
        return "hard";
    }

    return "easy";
}

function getProvinceProgress(province){
    var info=mapProgressByProvince[normalizeProvinceKey(province)];
    if(!info||!info.total.size){return 0;}
    var completed=Array.from(info.completed).filter(function(stage){return info.total.has(stage);}).length;
    return Math.min(100,Math.round(completed/info.total.size*100));
}

function getProvinceProgressInfo(province){
    return mapProgressByProvince[normalizeProvinceKey(province)]||{total:new Set(),completed:new Set(),stars:new Map()};
}

function getStageStars(province,stage){
    var info=getProvinceProgressInfo(province);
    var value=info.stars instanceof Map?Number(info.stars.get(Number(stage))):0;
    return Math.max(0,Math.min(3,Number.isFinite(value)?Math.round(value):0));
}

function getSubmissionStars(row){
    var details=row?.details||{};
    var explicit=Number(details.stars??row?.stars);
    var correct=Number(row?.correct_count??details.correct_count??details.correctAnswers);
    if(Number.isFinite(explicit)&&explicit>=0){return Math.max(0,Math.min(3,Math.round(explicit)));}
    if(Number.isFinite(correct)){return calculateIslandStars(correct);}
    return 0;
}

function renderRegionProgress(){
    Object.keys(regionData).forEach(function(regionKey){
        var card=document.querySelector('.region-card[data-region="'+regionKey+'"]');
        var region=regionData[regionKey];
        var total=0;
        var completed=0;
        if(!card||!region){return;}
        region.provinces.forEach(function(province){
            var info=getProvinceProgressInfo(province);
            total+=info.total.size;
            completed+=Array.from(info.completed).filter(function(stage){return info.total.has(stage);}).length;
        });
        var percent=total?Math.min(100,Math.round(completed/total*100)):0;
        var label=card.querySelector('.region-progress-head strong');
        var fill=card.querySelector('.progress-fill');
        if(label){label.textContent=percent+'%';}
        if(fill){fill.style.width=percent+'%';}
    });
}

async function getCurrentMapUserEmail(){
    var client=window.supabaseClient||window.supabase||window.VieGeoSupabase?.client;
    var session={};
    try{session=JSON.parse(localStorage.getItem("lm_session")||"{}");}catch(error){session={};}
    var email=String(session.email||session.user_email||"").trim().toLowerCase();
    if(client?.auth?.getUser){
        var authResult=await client.auth.getUser();
        email=String(authResult?.data?.user?.email||email).trim().toLowerCase();
    }
    return email;
}

function getCurrentMapSession(){
    try{return JSON.parse(localStorage.getItem("lm_session")||"{}")||{};}catch(error){return {};}
}

function isPremiumMapProfile(profile){
    try{
        var source=profile||{};
        var roles=Array.isArray(source.roles)?source.roles:[source.role,source.active_role];
        var values=[source.account_status,source.accountStatus,source.role,source.active_role].concat(roles||[]);
        return source.isPremium===true||source.is_premium===true||values.some(function(value){
            return ["premium","active","approved"].indexOf(String(value||"").trim().toLowerCase())>=0;
        });
    }catch(error){
        console.warn("[VieGeo Map] Không thể xác định quyền Premium:",error);
        return false;
    }
}

async function hasAuthenticatedMapSession(){
    try{
        var client=window.supabaseClient||window.supabase||window.VieGeoSupabase?.client;
        var result=await client?.auth?.getSession?.();
        if(result?.data?.session?.access_token){return true;}
        var premiumSession=await window.VieGeoPremiumLearning?.premiumSession?.();
        return premiumSession?.type==="admin";
    }catch(error){
        return false;
    }
}

async function updatePremiumHintAvailability(profile){
    try{
        var active=isPremiumMapProfile(profile)&&await hasAuthenticatedMapSession();
        if(premiumHintPanel){premiumHintPanel.hidden=!active;}
        if(!active&&premiumHintOutput){premiumHintOutput.textContent="";}
    }catch(error){
        console.warn("[VieGeo Map] Không thể cập nhật gợi ý Premium:",error);
    }
}

async function requestPremiumIslandHint(){
    try{
        var questions=getActiveQuestionList();
        var question=questions[currentQuestionIndex];
        if(!question||!window.VieGeoPremiumLearning?.request){return;}
        if(!await hasAuthenticatedMapSession()){
            if(premiumHintOutput){premiumHintOutput.textContent="";}
            return;
        }
        if(premiumHintButton){premiumHintButton.disabled=true;premiumHintButton.textContent="Đang tạo gợi ý...";}
        if(premiumHintOutput){premiumHintOutput.textContent="Trợ lý Premium đang đọc nội dung SGK...";}
        var response=await window.VieGeoPremiumLearning.request("hint",{
            questionId:question.id||"",
            context:{
                question:question.question||"",
                options:Array.isArray(question.options)?question.options:[],
                theory:question.theory||question.explanation||"",
                textbookQuote:question.textbookQuote||"",
                province:selectedProvince,
                island:"Đảo nhỏ "+selectedStage,
                topic:question.topic||""
            }
        });
        if(premiumHintOutput){premiumHintOutput.textContent="Gợi ý Premium: "+String(response?.reply||"Hãy đọc lại lý thuyết của đảo và xác định từ khóa chính.");}
    }catch(error){
        if(premiumHintOutput){premiumHintOutput.textContent=error?.message||"Chưa thể tạo gợi ý lúc này.";}
    }finally{
        if(premiumHintButton){premiumHintButton.disabled=false;premiumHintButton.textContent="✨ Gợi ý Premium";}
    }
}

function readLocalMapRewards(){
    try{return JSON.parse(localStorage.getItem("VieGeo_state")||"{}")||{};}catch(error){return {};}
}

function logMapSupabaseError(context,error,extra){
    console.error("[VieGeo Map] Lỗi chi tiết Supabase:",Object.assign({
        context:context,
        code:error?.code||"",
        message:error?.message||String(error||""),
        details:error?.details||"",
        hint:error?.hint||""
    },extra||{}));
}

async function findMapUserProfile(client,email){
    var columns="id,email,user_email,user_name,role,roles,account_status,score,current_streak,last_active_date,streak_restored_on";
    var result=await client.from("users").select(columns).eq("email",email).limit(1).maybeSingle();
    if(result.error){
        logMapSupabaseError("users.select.email",result.error,{email:email});
        throw result.error;
    }
    if(result.data){return result.data;}
    result=await client.from("users").select(columns).eq("user_email",email).limit(1).maybeSingle();
    if(result.error){
        logMapSupabaseError("users.select.user_email",result.error,{email:email});
        throw result.error;
    }
    return result.data||null;
}

async function ensureMapUserProfile(client,email){
    var profile=await findMapUserProfile(client,email);
    if(profile){return profile;}
    var session=getCurrentMapSession();
    var displayName=String(session.user_name||session.name||session.displayName||email.split("@")[0]||"Người dùng").trim();
    var role=String(session.activeRole||session.active_role||session.role||"user").trim().toLowerCase();
    var payload={email:email,user_email:email,user_name:displayName,role:role,score:0,current_streak:0};
    var created=await client.from("users").insert([payload]).select("id,email,user_email,user_name,role,roles,account_status,score,current_streak,last_active_date,streak_restored_on").single();
    if(created.error){
        if(String(created.error.code||"")==="23505"){return await findMapUserProfile(client,email);}
        logMapSupabaseError("users.insert.profile",created.error,{email:email});
        throw created.error;
    }
    return created.data;
}

async function fetchRecentMapSubmissions(client,email){
    var result=await client.from("submissions")
        .select("id,user_email,score,province,island,topic,correct_count,total_count,details,created_at")
        .eq("user_email",email)
        .order("created_at",{ascending:false})
        .limit(50);
    if(result.error){
        logMapSupabaseError("submissions.select.recent",result.error,{email:email});
        return [];
    }
    return Array.isArray(result.data)?result.data:[];
}

async function fetchSubmissionPages(client,email){
    var rows=[];
    var pageSize=1000;
    for(var page=0;page<50;page+=1){
        var response=await client.from("submissions").select("*").eq("user_email",email).range(page*pageSize,(page+1)*pageSize-1);
        if(response.error){throw response.error;}
        var pageRows=Array.isArray(response.data)?response.data:[];
        rows=rows.concat(pageRows);
        if(pageRows.length<pageSize){break;}
    }
    return rows;
}

async function fetchProgressQuestionPages(client){
    var rows=[];
    var pageSize=1000;
    for(var page=0;page<50;page+=1){
        var response=await client.from("questions").select("province,island").range(page*pageSize,(page+1)*pageSize-1);
        if(response.error){throw response.error;}
        var pageRows=Array.isArray(response.data)?response.data:[];
        rows=rows.concat(pageRows);
        if(pageRows.length<pageSize){break;}
    }
    return rows;
}

async function syncMapProgressFromSupabase(){
    var client=window.supabaseClient||window.supabase||window.VieGeoSupabase?.client;
    if(!client||typeof client.from!=="function"){throw new Error("Supabase client chưa sẵn sàng.");}
    currentMapUserEmail=await getCurrentMapUserEmail();
    if(currentMapUserEmail){
        try{
            currentMapProfile=await ensureMapUserProfile(client,currentMapUserEmail);
            await updatePremiumHintAvailability(currentMapProfile);
        }catch(profileError){
            console.warn("[VieGeo Map] Không thể tải quyền Premium:",profileError);
            await updatePremiumHintAvailability(null);
        }
    }
    try{
        var refreshedStreak=await window.VieGeoStreak?.refreshForCurrentUser({client:client,email:currentMapUserEmail});
        if(Number.isFinite(Number(refreshedStreak))){
            var localState=readLocalMapRewards();
            updateLocalIslandRewards(Number(localState.xp)||0,Number(localState.gems)||0,Number(refreshedStreak)||0);
        }
    }catch(streakError){
        console.warn("[VieGeo Map] Không thể làm mới chuỗi ngày học:",streakError);
    }
    var result=await Promise.all([
        fetchProgressQuestionPages(client),
        currentMapUserEmail?fetchSubmissionPages(client,currentMapUserEmail):Promise.resolve([])
    ]);
    var progress=Object.create(null);
    result[0].forEach(function(row){
        var province=normalizeProvinceKey(row?.province||row?.province_slug||row?.provinceName);
        var stage=questionIslandNumber(row);
        if(!province||stage<=0){return;}
        if(!progress[province]){progress[province]={total:new Set(),completed:new Set(),stars:new Map()};}
        progress[province].total.add(stage);
    });
    result[1].forEach(function(row){
        var details=row?.details||{};
        var province=normalizeProvinceKey(row?.province||details.province);
        var stage=questionIslandNumber({...details,...row});
        if(!province||stage<=0){return;}
        if(!progress[province]){progress[province]={total:new Set(),completed:new Set(),stars:new Map()};}
        progress[province].completed.add(stage);
        progress[province].stars.set(stage,Math.max(Number(progress[province].stars.get(stage))||0,getSubmissionStars(row)));
    });
    mapProgressByProvince=progress;
    mapProgressReady=true;
    renderRegionProgress();
    if(selectedRegionKey&&provincesView.style.display!=="none"){renderProvinces(selectedRegionKey);}
    if(selectedProvince&&roadmapView.style.display!=="none"){renderRoadmap();}
    return progress;
}

function renderProvinces(regionKey){
    var region=regionData[regionKey];
    var html="";
    var index;
    var province;
    var progress;
    var progressInfo;
    var number;

    selectedRegionKey=regionKey;
    provinceRegionBadge.textContent=region.name;
    provinceRegionTitle.textContent=region.name;
    provinceRegionDescription.textContent=region.description;
    provinceSummary.textContent=region.provinces.length+" tỉnh / thành";

    for(index=0;index<region.provinces.length;index+=1){
        province=region.provinces[index];
        progress=getProvinceProgress(province);
        progressInfo=getProvinceProgressInfo(province);
        number=String(index+1);

        if(number.length<2){
            number="0"+number;
        }

        html+='<button class="province-card" type="button" data-province="'+province+'">';
        html+='<div class="province-card-header"><span class="province-card-number">'+number+'</span><span class="province-card-status">'+(mapProgressReady?'✓ Sẵn sàng':'Đang tải')+'</span></div>';
        html+='<div class="province-card-body"><div class="province-location">⌖</div><div class="province-info"><h3>'+province+'</h3><p>'+String(progressInfo.total.size)+' chặng học</p></div></div>';
        html+='<div class="province-progress-meta"><span>Tiến độ</span><strong>'+progress+'%</strong></div>';
        html+='<div class="province-progress-track"><div class="province-progress-fill" style="width:'+progress+'%"></div></div>';
        html+='</button>';
    }

    provinceGrid.innerHTML=html;
}

function getNodeSide(index){
    if(index%2===0){
        return "node-left";
    }

    return "node-right";
}

function getCurve(index){
    if(index%2===0){
        return "M70 8 C70 52 320 50 320 104";
    }

    return "M320 8 C320 52 70 50 70 104";
}

function getCompletedStageCount(){
    var info=getProvinceProgressInfo(selectedProvince);
    var completed=0;
    while(info.completed.has(completed+1)){completed+=1;}
    return completed;
}

async function persistCurrentStageCompleted(){
    var client=window.supabaseClient||window.supabase||window.VieGeoSupabase?.client;
    var email=currentMapUserEmail||await getCurrentMapUserEmail();
    if(!client||!email){throw new Error("Không thể xác định phiên Supabase hiện tại.");}
    var durationSeconds=Math.max(0,Math.round((Date.now()-quizStartedAt)/1000));
    var stars=calculateIslandStars(quizCorrectAnswers);
    var xpReward=stars*20;
    var gemsReward=stars*10;
    var provinceKey=normalizeProvinceKey(selectedProvince);
    var islandLabel="Đảo nhỏ "+selectedStage;
    if(!quizAttemptId){quizAttemptId="attempt_"+Date.now()+"_"+Math.random().toString(16).slice(2);}

    var recentSubmissions=await fetchRecentMapSubmissions(client,email);
    var existingSubmission=recentSubmissions.find(function(row){return String(row?.details?.attempt_id||"")===quizAttemptId;})||null;
    var previousSubmission=recentSubmissions.find(function(row){return !existingSubmission||String(row.id)!==String(existingSubmission.id);})||null;
    var today=getVietnamDateKey();
    var submissionDetails={
        attempt_id:quizAttemptId,
        province:provinceKey,
        island_id:provinceKey+"-"+String(selectedStage),
        island_index:selectedStage,
        island:islandLabel,
        topic:islandLabel,
        difficulty:getDifficulty(),
        duration_seconds:durationSeconds,
        correct_count:quizCorrectAnswers,
        total_count:ISLAND_QUESTION_LIMIT,
        stars:stars,
        xp_reward:xpReward,
        gems_reward:gemsReward,
        reward_applied:false,
        completed_at:new Date().toISOString()
    };
    var submissionPayload={
        user_email:email,
        score:Math.round(quizCorrectAnswers/ISLAND_QUESTION_LIMIT*100)/10,
        province:provinceKey,
        island:islandLabel,
        topic:islandLabel,
        correct_count:quizCorrectAnswers,
        total_count:ISLAND_QUESTION_LIMIT,
        details:submissionDetails
    };

    if(!existingSubmission){
        var insertion=await client.from("submissions").insert([submissionPayload]).select("id,details,created_at").single();
        if(insertion.error){
            logMapSupabaseError("submissions.insert",insertion.error,{email:email,province:provinceKey,island:selectedStage,payload:submissionPayload});
            throw insertion.error;
        }
        existingSubmission=insertion.data;
    }

    var profile;
    try{
        profile=await ensureMapUserProfile(client,email);
    }catch(profileError){
        var localOnly=readLocalMapRewards();
        var localXp=(Number(localOnly.xp)||0)+xpReward;
        var localGems=(Number(localOnly.gems)||0)+gemsReward;
        var localStreakResult=window.VieGeoStreak?.applyForLesson
            ? await window.VieGeoStreak.applyForLesson({
                client:client,email:email,stars:stars,currentStreak:Number(localOnly.streak)||0,
                profile:getCurrentMapSession(),previousSubmissions:recentSubmissions,today:today
            })
            : {streak:Number(localOnly.streak)||0};
        var localStreak=Math.max(0,Number(localStreakResult?.streak)||0);
        updateLocalIslandRewards(localXp,localGems,localStreak);
        if(!mapProgressByProvince[provinceKey]){mapProgressByProvince[provinceKey]={total:new Set(),completed:new Set(),stars:new Map()};}
        mapProgressByProvince[provinceKey].completed.add(selectedStage);
        if(!(mapProgressByProvince[provinceKey].stars instanceof Map)){mapProgressByProvince[provinceKey].stars=new Map();}
        mapProgressByProvince[provinceKey].stars.set(selectedStage,Math.max(Number(mapProgressByProvince[provinceKey].stars.get(selectedStage))||0,stars));
        return {stars:stars,xpReward:xpReward,gemsReward:gemsReward,xp:localXp,score:Number(localOnly.score)||0,gems:localGems,streak:localStreak,rewardSynced:false,progressSynced:true};
    }

    var rewardAlreadyApplied=Boolean(existingSubmission?.details?.reward_applied);
    var localState=readLocalMapRewards();
    var currentXp=Number(localState.xp??profile.score)||0;
    var currentGems=Number(localState.gems)||0;
    var currentScore=Number(profile.score)||0;
    var nextXp=currentXp+(rewardAlreadyApplied?0:xpReward);
    var nextGems=currentGems+(rewardAlreadyApplied?0:gemsReward);
    var nextScore=currentScore+(rewardAlreadyApplied?0:xpReward);
    var streakResult=window.VieGeoStreak?.applyForLesson
        ? await window.VieGeoStreak.applyForLesson({
            client:client,email:email,stars:stars,currentStreak:Number(profile.current_streak)||0,
            profile:profile,previousSubmissions:recentSubmissions,today:today
        })
        : {streak:Number(profile.current_streak)||0};
    var nextStreak=Math.max(0,Number(streakResult?.streak)||0);
    var rewardSynced=true;

    if(!rewardAlreadyApplied){
        var rewardPayload={score:nextScore};
        var rewardResult=await client.from("users").update(rewardPayload).eq("id",profile.id);
        if(rewardResult.error){
            rewardSynced=false;
            logMapSupabaseError("users.update.rewards",rewardResult.error,{email:email,userId:profile.id,payload:rewardPayload});
        }else{
            var completedDetails=Object.assign({},submissionDetails,existingSubmission?.details||{},{reward_applied:true});
            var markReward=await client.from("submissions").update({details:completedDetails}).eq("id",existingSubmission.id);
            if(markReward.error){logMapSupabaseError("submissions.update.reward_applied",markReward.error,{submissionId:existingSubmission.id});}
        }
    }

    updateLocalIslandRewards(nextXp,nextGems,nextStreak);
    if(!mapProgressByProvince[provinceKey]){mapProgressByProvince[provinceKey]={total:new Set(),completed:new Set(),stars:new Map()};}
    mapProgressByProvince[provinceKey].completed.add(selectedStage);
    if(!(mapProgressByProvince[provinceKey].stars instanceof Map)){mapProgressByProvince[provinceKey].stars=new Map();}
    mapProgressByProvince[provinceKey].stars.set(selectedStage,Math.max(Number(mapProgressByProvince[provinceKey].stars.get(selectedStage))||0,stars));
    return {stars:stars,xpReward:xpReward,gemsReward:gemsReward,xp:nextXp,score:nextScore,gems:nextGems,streak:nextStreak,rewardSynced:rewardSynced,progressSynced:true};
}

function markCurrentStageCompleted(){
    if(stageCompletionPromise){return stageCompletionPromise;}
    stageCompletionPromise=persistCurrentStageCompleted();
    return stageCompletionPromise.finally(function(){stageCompletionPromise=null;});
}

function renderRoadmap(){
    var completed=getCompletedStageCount();
    var html="";
    var index;
    var stage;
    var status;
    var disabled;
    var title;
    var pathClass;
    var summaryUnlocked;
    var stageStars;
    var starClass;

    roadmapProvinceTitle.textContent=selectedProvince;

    for(index=0;index<34;index+=1){
        stage=index+1;
        disabled=" disabled";

        if(index<completed){
            status="completed";
            disabled="";
        }else if(index===completed){
            status="active";
            disabled="";
        }else{
            status="locked";
        }

        if(stage===11||stage===22||stage===33){
            title="Trạm kiểm tra";
        }else if(stage===34){
            title="Boss cuối";
        }else{
            title="Đảo tri thức "+stage;
        }

        stageStars=status==="completed"?getStageStars(selectedProvince,stage):0;
        starClass=status==="completed"?' stars-'+stageStars:'';
        html+='<div class="learning-node '+getNodeSide(index)+' '+status+starClass+'" data-stars="'+stageStars+'">';
        html+='<button class="node-circle" type="button" data-stage="'+stage+'"'+disabled+'>★</button>';
        html+='<div class="node-card"><span>Chặng '+stage+'</span><strong>'+title+'</strong><small>'+(status==="active"?"Bắt đầu học":status==="completed"?"Đã hoàn thành · "+stageStars+" ★":"Hoàn thành chặng trước")+'</small></div>';
        html+='</div>';

        if(index<33){
            pathClass="";

            if(index<completed){
                pathClass="completed-path";
            }else if(index===completed){
                pathClass="active-path";
            }

            html+='<svg class="curved-path '+pathClass+'" viewBox="0 0 390 112" preserveAspectRatio="none" aria-hidden="true"><path d="'+getCurve(index)+'"></path></svg>';
        }
    }

    summaryUnlocked=completed>=34;
    html+='<div class="province-summary-connector '+(summaryUnlocked?'unlocked':'')+'" aria-hidden="true"></div>';
    html+='<section class="province-summary-node '+(summaryUnlocked?'unlocked':'locked')+'">';
    html+='<div class="province-summary-icon" aria-hidden="true">'+(summaryUnlocked?'📖':'🔒')+'</div>';
    html+='<div class="province-summary-card">';
    html+='<span>Tổng kết toàn tỉnh</span><strong>Lý thuyết tổng hợp '+selectedProvince+'</strong>';
    html+='<small>'+(summaryUnlocked?'Đã mở khóa sau khi vượt qua BOSS':'Hoàn thành BOSS để mở khóa nội dung')+'</small>';
    html+='<button class="province-summary-open" type="button" data-open-province-summary'+(summaryUnlocked?'':' disabled')+'>'+(summaryUnlocked?'ĐỌC LÝ THUYẾT TỔNG':'CHƯA MỞ KHÓA')+'</button>';
    html+='</div></section>';

    roadmapContainer.innerHTML=html;
}

function closeProvinceSummary(){
    if(!provinceSummaryModal){
        return;
    }
    provinceSummaryModal.hidden=true;
    document.body.classList.remove("province-summary-opened");
}

async function openProvinceSummary(event){
    var button=event.target.closest("[data-open-province-summary]");
    var client;
    var rows;
    var summaryRow;
    var summaryText;

    if(!button||button.disabled||getCompletedStageCount()<34||!provinceSummaryModal){
        return;
    }

    provinceSummaryModal.hidden=false;
    document.body.classList.add("province-summary-opened");
    provinceSummaryTitle.textContent="Lý thuyết tổng kết "+selectedProvince;
    provinceSummarySubtitle.textContent="Phần kiến thức tổng hợp được mở khóa sau khi hoàn thành BOSS của tỉnh.";
    provinceSummaryContent.textContent="Đang chuẩn bị nội dung tổng kết...";

    try{
        client=window.supabaseClient||window.supabase||window.VieGeoSupabase?.client;
        if(!client||typeof client.from!=="function"){
            throw new Error("Supabase client chưa sẵn sàng");
        }
        rows=await fetchQuestionPages(client,provinceQueryCandidates(selectedProvince));
        rows=rows.filter(function(row){
            return normalizeProvinceKey(row?.province||row?.province_slug||row?.provinceName)===normalizeProvinceKey(selectedProvince)
                &&questionIslandNumber(row)===34;
        });
        summaryRow=rows.find(function(row){
            return String(row?.island_theory||"").trim();
        });
        summaryText=String(summaryRow?.island_theory||"").trim();
        provinceSummaryContent.textContent=summaryText||"Nội dung tổng kết của tỉnh này đang được cập nhật.";
    }catch(error){
        provinceSummaryContent.textContent="Chưa thể tải nội dung tổng kết. Vui lòng thử lại sau.";
        console.error("[VieGeo Map] Lỗi tải lý thuyết tổng kết BOSS:",error);
    }
}

function getCurrentQuestionList(){
    var difficulty=getDifficulty();
    var questions=quizQuestions[difficulty];

    if(!questions||questions.length===0){
        questions=quizQuestions.easy;
    }

    return questions;
}

function normalizeProvinceKey(value){
    try{
        return String(value||"")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g,"")
            .replace(/\u0111/gi,"d")
            .replace(/[^a-z0-9]+/gi,"-")
            .replace(/^-|-$/g,"")
            .toLowerCase()
            .replace(/^tp-/,"");
    }catch(error){
        return String(value||"").trim().toLowerCase().replace(/^tp[.\s-]*/,"");
    }
}

function normalizeBankQuestion(row){
    var source=row||{};
    var options=source.options;
    var rawAnswer=source.correct_option??source.correctAnswer??source.correct_answer??source.answerIndex??source.answer??0;
    var correctAnswer;

    if(typeof options==="string"){
        try{
            options=JSON.parse(options);
        }catch(error){
            options=options.split("|");
        }
    }
    if(!Array.isArray(options)){
        options=[source.option_a,source.option_b,source.option_c,source.option_d];
    }

    options=options.map(function(value){
        return String(value||"").trim();
    }).filter(Boolean);

    if(typeof rawAnswer==="string"&&/^[A-D]$/i.test(rawAnswer.trim())){
        correctAnswer=rawAnswer.trim().toUpperCase().charCodeAt(0)-65;
    }else if(typeof rawAnswer==="string"&&options.indexOf(rawAnswer.trim())>=0){
        correctAnswer=options.indexOf(rawAnswer.trim());
    }else{
        correctAnswer=Number(rawAnswer);
    }

    return {
        id:String(source.id||source.question_id||""),
        question:String(source.question||source.question_text||source.questionText||"").trim(),
        options:options,
        correctAnswer:Number.isFinite(correctAnswer)?correctAnswer:0,
        explanation:String(source.explanation||source.theory||source.island_theory||"").trim(),
        theory:String(source.theory||source.explanation||source.island_theory||"").trim(),
        textbookQuote:String(source.textbook_quote||source.textbookQuote||"").trim(),
        topic:String(source.topic||source.lesson_title||source.lessonTitle||"").trim()
    };
}

function provinceQueryCandidates(value){
    var raw=String(value||"").trim();
    var withoutPrefix=raw.replace(/^TP\.?\s*/i,"").trim();
    var slug=normalizeProvinceKey(raw);
    return Array.from(new Set([
        slug,
        raw,
        withoutPrefix,
        "tp-"+slug,
        "TP. "+withoutPrefix
    ].filter(Boolean)));
}

function questionIslandNumber(row){
    var source=row||{};
    var direct=source.sub_island??source.subIsland??source.island_index??source.islandIndex;
    var match=String(source.island||source.island_name||"").match(/\d+/);
    if(match){
        return Number(match[0]);
    }
    if(Number.isFinite(Number(direct))&&Number(direct)>0){
        return Number(direct);
    }
    return 0;
}

async function fetchQuestionPages(client,provinceCandidates){
    var rows=[];
    var pageSize=1000;
    var page;
    var query;
    var response;
    var pageRows;

    for(page=0;page<50;page+=1){
        query=client.from("questions").select("*");
        if(Array.isArray(provinceCandidates)&&provinceCandidates.length){
            query=query.in("province",provinceCandidates);
        }
        response=await query.range(page*pageSize,(page+1)*pageSize-1);
        if(response.error){
            throw response.error;
        }
        pageRows=Array.isArray(response.data)?response.data:[];
        rows=rows.concat(pageRows);
        if(pageRows.length<pageSize){
            break;
        }
    }
    return rows;
}

async function fetchIslandQuestionBank(){
    var client=window.supabaseClient||window.supabase||window.VieGeoSupabase?.client;
    var provinceId=normalizeProvinceKey(selectedProvince);
    var islandName="Đảo nhỏ "+selectedStage;
    var difficulty=getDifficulty();
    var candidates=provinceQueryCandidates(selectedProvince);
    var rows;
    var provinceRows;
    var islandRows;
    var validRows;
    var matchingDifficulty;
    var selectedPool;
    var theoryValues;

    if(!client||typeof client.from!=="function"){
        throw new Error("Supabase client chưa sẵn sàng");
    }

    rows=await fetchQuestionPages(client,candidates);
    if(!rows.length){
        rows=await fetchQuestionPages(client,[]);
    }
    provinceRows=rows.filter(function(item){
        return normalizeProvinceKey(item?.province||item?.province_slug||item?.provinceName)===provinceId;
    });
    islandRows=provinceRows.filter(function(item){
        return questionIslandNumber(item)===selectedStage;
    });
    validRows=islandRows.map(normalizeBankQuestion).filter(function(item){
        return item.question&&item.options.length>=2&&item.correctAnswer>=0&&item.correctAnswer<item.options.length;
    });
    matchingDifficulty=islandRows.filter(function(item){
        return String(item.difficulty||"easy").trim().toLowerCase()===difficulty;
    }).map(normalizeBankQuestion).filter(function(item){
        return item.question&&item.options.length>=2&&item.correctAnswer>=0&&item.correctAnswer<item.options.length;
    });
    selectedPool=matchingDifficulty.length>=ISLAND_QUESTION_LIMIT?matchingDifficulty:validRows;
    activeQuestionBankSize=selectedPool.length;
    theoryValues=Array.from(new Set(islandRows.map(function(item){
        return String(item?.island_theory||item?.islandTheory||"").trim();
    }).filter(Boolean)));
    if(theoryValues.length){
        activeIslandTheory=theoryValues[0];
    }else{
        theoryValues=Array.from(new Set(islandRows.map(function(item){
            return String(item?.theory||"").trim();
        }).filter(Boolean))).slice(0,5);
        activeIslandTheory=theoryValues.length>1
            ? theoryValues.map(function(value){return "• "+value;}).join("\n\n")
            : String(theoryValues[0]||"");
    }

    console.info("[VieGeo Map] Đồng bộ ngân hàng câu hỏi",{
        province:provinceId,
        island:islandName,
        difficulty:difficulty,
        rowsLoaded:rows.length,
        provinceRows:provinceRows.length,
        islandRows:islandRows.length,
        total:validRows.length,
        matchingDifficulty:matchingDifficulty.length,
        selectedPool:selectedPool.length
    });

    return shuffledQuestionSet(selectedPool);
}

function shuffledQuestionSet(questions){
    var items=Array.isArray(questions)?questions.slice():[];
    var index;
    var randomIndex;
    var temporary;

    for(index=items.length-1;index>0;index-=1){
        randomIndex=Math.floor(Math.random()*(index+1));
        temporary=items[index];
        items[index]=items[randomIndex];
        items[randomIndex]=temporary;
    }

    return items.slice(0,ISLAND_QUESTION_LIMIT);
}

function getActiveQuestionList(){
    return Array.isArray(activeQuestionSet)?activeQuestionSet.slice(0,ISLAND_QUESTION_LIMIT):[];
}

function renderQuestion(){
    var questions=getActiveQuestionList();
    var question;
    var html="";
    var index;

    if(!questions.length||currentQuestionIndex>=ISLAND_QUESTION_LIMIT||currentQuestionIndex>=questions.length){
        questionNumber.textContent="Đã tìm thấy "+String(activeQuestionBankSize)+" / 5 câu";
        questionStatus.textContent="Không thể tiếp tục";
        questionText.textContent="Bài học này đang được bổ sung nội dung.";
        answerGrid.innerHTML="";
        answerFeedback.textContent="Vui lòng quay lại sau để bắt đầu lượt học gồm 5 câu hỏi.";
        nextQuestionButton.disabled=true;
        return;
    }

    question=questions[currentQuestionIndex];

    selectedAnswer=-1;
    questionNumber.textContent="Câu "+String(currentQuestionIndex+1)+" / "+String(ISLAND_QUESTION_LIMIT);
    questionStatus.textContent="Chưa trả lời";
    questionText.textContent=question.question;
    answerFeedback.textContent="Hãy chọn một đáp án để tiếp tục.";
    if(premiumHintOutput){premiumHintOutput.textContent="";}
    if(premiumHintButton){premiumHintButton.disabled=false;}

    for(index=0;index<question.options.length;index+=1){
        html+='<button class="answer-card" type="button" data-answer="'+index+'">'+question.options[index]+'</button>';
    }

    answerGrid.innerHTML=html;
}

function selectAnswer(event){
    var button=event.target.closest(".answer-card");
    var buttons;
    var questions;
    var question;
    var index;

    if(!button||selectedAnswer>=0){
        return;
    }

    selectedAnswer=Number(button.getAttribute("data-answer"));
    buttons=answerGrid.querySelectorAll(".answer-card");

    for(index=0;index<buttons.length;index+=1){
        buttons[index].classList.remove("selected-answer");
        buttons[index].classList.remove("correct-answer");
        buttons[index].classList.remove("wrong-answer");
    }

    button.classList.add("selected-answer");
    questions=getActiveQuestionList();
    question=questions[currentQuestionIndex];

    if(selectedAnswer===question.correctAnswer){
        quizCorrectAnswers+=1;
        button.classList.add("correct-answer");
        questionStatus.textContent="Đúng";
        answerFeedback.textContent="Giải thích chi tiết: "+(question.explanation||"Chính xác.");
    }else{
        button.classList.add("wrong-answer");

        if(buttons[question.correctAnswer]){
            buttons[question.correctAnswer].classList.add("correct-answer");
        }

        questionStatus.textContent="Chưa đúng";
        answerFeedback.textContent="Đáp án đúng: "+String(question.options[question.correctAnswer]||"")+". Giải thích chi tiết: "+(question.explanation||"Hãy xem lại kiến thức trước khi tiếp tục.");
    }
    if(premiumHintButton){premiumHintButton.disabled=true;}
}

function openRegion(event){
    var regionKey=event.currentTarget.getAttribute("data-region");

    renderProvinces(regionKey);
    showProvincesView();
}

function openProvince(event){
    var button=event.target.closest(".province-card");

    if(!button){
        return;
    }

    selectedProvince=button.getAttribute("data-province");
    renderRoadmap();
    showRoadmapView();
}

function closeIslandTheory(){
    if(!islandTheoryModal){
        return;
    }
    islandTheoryModal.hidden=true;
    islandTheoryModal.style.setProperty("display","none","important");
    document.body.classList.remove("province-summary-opened");
}

function beginIslandQuiz(){
    if(getActiveQuestionList().length!==ISLAND_QUESTION_LIMIT){
        return;
    }
    closeIslandTheory();
    nextQuestionButton.disabled=false;
    renderQuestion();
    showQuizView();
}

async function openQuiz(event){
    var button=event.target.closest(".node-circle");
    var node=event.target.closest(".learning-node");
    var currentRequestId;

    if(!button&&node){
        button=node.querySelector(".node-circle");
    }

    if(!button||button.disabled){
        return;
    }

    ensureIslandTheoryUi();
    if(activeQuestionLoadState==="loading"&&selectedStage===Number(button.getAttribute("data-stage"))){
        islandTheoryModal.hidden=false;
        islandTheoryModal.style.setProperty("display","grid","important");
        return;
    }

    selectedStage=Number(button.getAttribute("data-stage"));
    quizProvinceTitle.textContent=selectedProvince;
    quizStageLabel.textContent="Chặng "+selectedStage;
    currentQuestionIndex=0;
    quizCompleted=false;
    selectedAnswer=-1;
    quizCorrectAnswers=0;
    quizStartedAt=Date.now();
    quizAttemptId="attempt_"+quizStartedAt+"_"+Math.random().toString(16).slice(2);
    stageCompletionPromise=null;
    activeQuestionSet=[];
    activeQuestionBankSize=0;
    activeIslandTheory="";
    activeQuestionLoadState="loading";
    currentRequestId=++questionLoadRequestId;
    nextQuestionButton.disabled=true;
    nextQuestionButton.textContent="CÂU TIẾP THEO";
    if(islandTheoryModal){
        islandTheoryModal.hidden=false;
        islandTheoryModal.style.setProperty("display","grid","important");
        document.body.classList.add("province-summary-opened");
        islandTheoryTitle.textContent="Lý thuyết cần nhớ";
        islandTheorySubtitle.textContent=selectedProvince+" · Đảo nhỏ "+selectedStage;
        islandTheoryContent.textContent="Đang chuẩn bị nội dung lý thuyết...";
        islandTheoryBankStatus.className="island-theory-bank-status";
        islandTheoryBankStatus.textContent="Đang chuẩn bị nội dung bài học...";
        islandTheoryStartButton.disabled=true;
    }

    try{
        activeQuestionSet=await fetchIslandQuestionBank();
        if(currentRequestId!==questionLoadRequestId){
            return;
        }
        activeQuestionLoadState="direct-ready";
        if(activeQuestionSet.length!==ISLAND_QUESTION_LIMIT){
            activeQuestionSet=[];
        }
        if(islandTheoryContent){
            islandTheoryContent.textContent=activeIslandTheory||"Nội dung lý thuyết của bài này đang được cập nhật.";
        }
        if(islandTheoryBankStatus){
            if(activeQuestionSet.length===ISLAND_QUESTION_LIMIT){
                islandTheoryBankStatus.className="island-theory-bank-status ready";
                islandTheoryBankStatus.textContent="Bài học đã sẵn sàng. Lượt làm bài này gồm 5 câu hỏi được chọn ngẫu nhiên.";
            }else{
                islandTheoryBankStatus.className="island-theory-bank-status error";
                islandTheoryBankStatus.textContent="Bài học này đang được bổ sung nội dung. Vui lòng quay lại sau.";
            }
        }
        if(islandTheoryStartButton){
            islandTheoryStartButton.disabled=activeQuestionSet.length!==ISLAND_QUESTION_LIMIT;
        }
    }catch(error){
        if(currentRequestId!==questionLoadRequestId){
            return;
        }
        activeQuestionLoadState="error";
        activeQuestionSet=[];
        activeQuestionBankSize=0;
        if(islandTheoryContent){
            islandTheoryContent.textContent="Chưa thể tải nội dung lý thuyết. Vui lòng thử lại.";
        }
        if(islandTheoryBankStatus){
            islandTheoryBankStatus.className="island-theory-bank-status error";
            islandTheoryBankStatus.textContent="Chưa thể chuẩn bị bài học lúc này. Vui lòng kiểm tra kết nối và thử lại.";
        }
        if(islandTheoryStartButton){
            islandTheoryStartButton.disabled=true;
        }
        console.error("[VieGeo Map] Lỗi tải câu hỏi theo đảo:",error);
    }
}

async function nextQuestion(){
    var questions=getActiveQuestionList();

    if(quizCompleted){
        renderRoadmap();
        showRoadmapView();
        return;
    }
    if(selectedAnswer<0){
        answerFeedback.textContent="Hãy chọn một đáp án trước khi tiếp tục.";
        return;
    }
    if(currentQuestionIndex>=ISLAND_QUESTION_LIMIT-1||currentQuestionIndex>=questions.length-1){
        quizCompleted=true;
        questionNumber.textContent="Hoàn thành 5 / 5 câu";
        questionStatus.textContent="Đã hoàn thành";
        questionText.textContent="Bạn đã hoàn thành đảo này!";
        answerGrid.innerHTML="";
        answerFeedback.textContent="Đang ghi nhận kết quả học tập...";
        nextQuestionButton.disabled=true;
        try{
            var completionResult=await markCurrentStageCompleted();
            answerFeedback.textContent=completionResult.rewardSynced
                ?"Kết quả và phần thưởng đã được ghi nhận."
                :"Tiến độ đã được ghi nhận. Phần thưởng sẽ được cập nhật khi kết nối ổn định.";
            nextQuestionButton.textContent="QUAY LẠI LỘ TRÌNH";
            nextQuestionButton.disabled=false;
            showIslandResultModal(completionResult);
        }catch(error){
            logMapSupabaseError("nextQuestion.save",error,{email:currentMapUserEmail,province:normalizeProvinceKey(selectedProvince),island:selectedStage});
            quizCompleted=false;
            answerFeedback.textContent="Chưa thể ghi nhận kết quả. Vui lòng bấm nút bên dưới để thử lại.";
            nextQuestionButton.textContent="THỬ LƯU LẠI";
            nextQuestionButton.disabled=false;
        }
        return;
    }
    currentQuestionIndex+=1;
    renderQuestion();
}

function openSupport(){
    window.location.href="support-user.html";
}

function initializeLearningFlow(){
    var index;

    showRegionsView();
    syncMapProgressFromSupabase().catch(function(error){
        mapProgressReady=true;
        console.warn("[VieGeo Map] Không thể đồng bộ tiến độ Supabase:",error);
        renderRegionProgress();
        if(selectedRegionKey){renderProvinces(selectedRegionKey);}
    });

    for(index=0;index<regionCards.length;index+=1){
        regionCards[index].addEventListener("click",openRegion);
    }

    provincesBackButton.addEventListener("click",showRegionsView);
    roadmapBackButton.addEventListener("click",showProvincesView);
    quizBackButton.addEventListener("click",showRoadmapView);
    provinceGrid.addEventListener("click",openProvince);
    roadmapContainer.addEventListener("click",openQuiz);
    roadmapContainer.addEventListener("click",openProvinceSummary);
    answerGrid.addEventListener("click",selectAnswer);
    nextQuestionButton.addEventListener("click",nextQuestion);
    if(premiumHintButton){premiumHintButton.addEventListener("click",requestPremiumIslandHint);}

    if(islandResultCloseButton){
        islandResultCloseButton.addEventListener("click",closeIslandResultModal);
    }
    if(islandResultContinueButton){
        islandResultContinueButton.addEventListener("click",continueAfterIslandResult);
    }
    if(islandResultModal){
        islandResultModal.addEventListener("click",function(event){
            if(event.target.closest("[data-close-island-result]")){closeIslandResultModal();}
        });
    }

    if(supportButton){
        supportButton.addEventListener("click",openSupport);
    }

    if(provinceSummaryCloseButton){
        provinceSummaryCloseButton.addEventListener("click",closeProvinceSummary);
    }
    if(provinceSummaryDoneButton){
        provinceSummaryDoneButton.addEventListener("click",closeProvinceSummary);
    }
    if(provinceSummaryModal){
        provinceSummaryModal.addEventListener("click",function(event){
            if(event.target.closest("[data-close-province-summary]")){
                closeProvinceSummary();
            }
        });
    }
    ensureIslandTheoryUi();
    document.addEventListener("keydown",function(event){
        if(event.key==="Escape"&&islandResultModal&&!islandResultModal.hidden){
            closeIslandResultModal();
            return;
        }
        if(event.key==="Escape"&&islandTheoryModal&&!islandTheoryModal.hidden){
            closeIslandTheory();
            return;
        }
        if(event.key==="Escape"&&provinceSummaryModal&&!provinceSummaryModal.hidden){
            closeProvinceSummary();
        }
    });
}

document.addEventListener("DOMContentLoaded",initializeLearningFlow);

/* Supabase data enhancement. The restored visual flow remains available when
   the network is slow, while real question rows replace the local bank as soon
   as the shared data bridge has loaded them. */
(function () {
    'use strict';

    var remoteQuestions = [];
    var originalQuestionList = getCurrentQuestionList;

    function slug(value) {
        try {
            return String(value || '')
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/đ/gi, 'd').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
                .toLowerCase();
        } catch (error) {
            return String(value || '').toLowerCase();
        }
    }

    window.addEventListener('viegeo:questions-ready', function (event) {
        try {
            remoteQuestions = Array.isArray(event.detail) ? event.detail.filter(function (item) {
                return item && item.question && Array.isArray(item.options) && item.options.length >= 2;
            }) : [];
            console.info('[VieGeo Map] Đã nhận câu hỏi Supabase', { count: remoteQuestions.length });
            if(quizView&&quizView.style.display!=="none"&&activeQuestionLoadState==="idle"){
                activeQuestionSet=shuffledQuestionSet(getCurrentQuestionList());
                if(activeQuestionSet.length!==ISLAND_QUESTION_LIMIT){
                    activeQuestionSet=[];
                }
                currentQuestionIndex=0;
                quizCompleted=false;
                nextQuestionButton.disabled=false;
                nextQuestionButton.textContent="CÂU TIẾP THEO";
                renderQuestion();
            }
        } catch (error) {
            console.warn('[VieGeo Map] Không thể nhận dữ liệu Supabase:', error);
            remoteQuestions = [];
        }
    });

    getCurrentQuestionList = function () {
        try {
            if (!remoteQuestions.length) return originalQuestionList();
            var difficulty = getDifficulty();
            var provinceId = slug(selectedProvince).replace(/^tp-/, '');
            var byDifficulty = remoteQuestions.filter(function (item) {
                return String(item.difficulty || 'easy').toLowerCase() === difficulty;
            });
            var byProvince = byDifficulty.filter(function (item) {
                return !provinceId || slug(item.province).replace(/^tp-/, '') === provinceId;
            });
            var islandName = 'Đảo nhỏ ' + selectedStage;
            var byIsland = byProvince.filter(function (item) {
                return String(item.island || '').trim() === islandName;
            });
            var selected = byIsland;
            return selected.map(function (item) {
                return {
                    question: item.question,
                    options: item.options,
                    correctAnswer: Number(item.correctAnswer ?? item.answer ?? 0),
                    explanation: item.theory || item.explanation || 'Hãy ôn lại kiến thức trước khi tiếp tục.'
                };
            });
        } catch (error) {
            console.warn('[VieGeo Map] Dùng câu hỏi dự phòng:', error);
            return [];
        }
    };
}());
