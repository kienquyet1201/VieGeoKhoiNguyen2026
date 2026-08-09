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
var supportButton=document.getElementById("supportButton");
var selectedRegionKey="";
var selectedProvince="";
var selectedStage=1;
var currentQuestionIndex=0;
var selectedAnswer=-1;
var activeQuestionSet=[];
var quizCompleted=false;
var ISLAND_QUESTION_LIMIT=5;

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
    var state=getGameStateValue();
    var completed=state["completed_"+province];

    if(typeof completed!=="number"){
        completed=0;
    }

    return Math.round((completed/34)*100);
}

function renderProvinces(regionKey){
    var region=regionData[regionKey];
    var html="";
    var index;
    var province;
    var progress;
    var number;

    selectedRegionKey=regionKey;
    provinceRegionBadge.textContent=region.name;
    provinceRegionTitle.textContent=region.name;
    provinceRegionDescription.textContent=region.description;
    provinceSummary.textContent=region.provinces.length+" tỉnh / thành";

    for(index=0;index<region.provinces.length;index+=1){
        province=region.provinces[index];
        progress=getProvinceProgress(province);
        number=String(index+1);

        if(number.length<2){
            number="0"+number;
        }

        html+='<button class="province-card" type="button" data-province="'+province+'">';
        html+='<div class="province-card-header"><span class="province-card-number">'+number+'</span><span class="province-card-status">✓ Sẵn sàng</span></div>';
        html+='<div class="province-card-body"><div class="province-location">⌖</div><div class="province-info"><h3>'+province+'</h3><p>34 đảo tri thức</p></div></div>';
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
    var state=getGameStateValue();
    var completed=state["completed_"+selectedProvince];

    if(typeof completed!=="number"){
        return 0;
    }

    return completed;
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

        html+='<div class="learning-node '+getNodeSide(index)+' '+status+'">';
        html+='<button class="node-circle" type="button" data-stage="'+stage+'"'+disabled+'>★</button>';
        html+='<div class="node-card"><span>Chặng '+stage+'</span><strong>'+title+'</strong><small>'+(status==="active"?"Bắt đầu học":status==="completed"?"Đã hoàn thành":"Hoàn thành chặng trước")+'</small></div>';
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

    roadmapContainer.innerHTML=html;
}

function getCurrentQuestionList(){
    var difficulty=getDifficulty();
    var questions=quizQuestions[difficulty];

    if(!questions||questions.length===0){
        questions=quizQuestions.easy;
    }

    return questions;
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
        questionNumber.textContent="Tối đa 5 câu";
        questionStatus.textContent="Không thể tiếp tục";
        questionText.textContent="Đảo này cần đủ 5 câu hỏi từ ngân hàng Admin.";
        answerGrid.innerHTML="";
        answerFeedback.textContent="Vui lòng tải đủ 5 câu hỏi đúng Tỉnh/Thành và Đảo nhỏ.";
        nextQuestionButton.disabled=true;
        return;
    }

    question=questions[currentQuestionIndex];

    selectedAnswer=-1;
    questionNumber.textContent="Câu "+String(currentQuestionIndex+1)+" / "+String(ISLAND_QUESTION_LIMIT);
    questionStatus.textContent="Chưa trả lời";
    questionText.textContent=question.question;
    answerFeedback.textContent="Hãy chọn một đáp án để tiếp tục.";

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

    if(!button){
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

function openQuiz(event){
    var button=event.target.closest(".node-circle");

    if(!button||button.disabled){
        return;
    }

    selectedStage=Number(button.getAttribute("data-stage"));
    quizProvinceTitle.textContent=selectedProvince;
    quizStageLabel.textContent="Chặng "+selectedStage;
    currentQuestionIndex=0;
    quizCompleted=false;
    nextQuestionButton.disabled=false;
    nextQuestionButton.textContent="CÂU TIẾP THEO";
    activeQuestionSet=shuffledQuestionSet(getCurrentQuestionList());
    if(activeQuestionSet.length!==ISLAND_QUESTION_LIMIT){
        activeQuestionSet=[];
    }
    renderQuestion();
    showQuizView();
}

function nextQuestion(){
    var questions=getActiveQuestionList();

    if(quizCompleted){
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
        answerFeedback.textContent="Không còn câu hỏi nào khác trong lượt học này.";
        nextQuestionButton.textContent="QUAY LẠI LỘ TRÌNH";
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

    for(index=0;index<regionCards.length;index+=1){
        regionCards[index].addEventListener("click",openRegion);
    }

    provincesBackButton.addEventListener("click",showRegionsView);
    roadmapBackButton.addEventListener("click",showProvincesView);
    quizBackButton.addEventListener("click",showRoadmapView);
    provinceGrid.addEventListener("click",openProvince);
    roadmapContainer.addEventListener("click",openQuiz);
    answerGrid.addEventListener("click",selectAnswer);
    nextQuestionButton.addEventListener("click",nextQuestion);

    if(supportButton){
        supportButton.addEventListener("click",openSupport);
    }
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
            if(quizView&&quizView.style.display!=="none"){
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
