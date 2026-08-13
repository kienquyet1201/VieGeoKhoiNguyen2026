var shopState=null;
var shopItems=[];
var shopGrid=document.getElementById("shopGrid");
var statHearts=document.getElementById("statHearts");
var statStreak=document.getElementById("statStreak");
var statGems=document.getElementById("statGems");
var statXp=document.getElementById("statXp");
var statTrophies=document.getElementById("statTrophies");
var statLevel=document.getElementById("statLevel");
var inventoryGemBalance=document.getElementById("inventoryGemBalance");
var inventoryInfinite=document.getElementById("inventoryInfinite");
var inventoryFreeze=document.getElementById("inventoryFreeze");
var inventoryDoubleXp=document.getElementById("inventoryDoubleXp");
var inventory5050=document.getElementById("inventory5050");
var difficultySelect=document.getElementById("difficultySelect");
var themeButton=document.getElementById("themeButton");
var parentButton=document.getElementById("parentButton");
var logoutButton=document.getElementById("logoutButton");
var backButton=document.getElementById("backButton");
var supportButton=document.getElementById("supportButton");
var toast=document.getElementById("toast");
var SHOP_MAX_HEARTS=3;

function setShopText(element,value){
    if(element){
        element.textContent=value;
    }
}

function getShopState(){
    if(typeof getGameState==="function"){
        return getGameState();
    }

    try{
        return JSON.parse(localStorage.getItem("VieGeo_state")||"{}");
    }catch(error){
        return {};
    }
}

function saveShopState(){
    if(typeof saveGameState==="function"){
        saveGameState(shopState);
    }else{
        localStorage.setItem("VieGeo_state",JSON.stringify(shopState));
    }
}

function getShopItems(){
    if(typeof SHOP_ITEMS!=="undefined"&&Array.isArray(SHOP_ITEMS)){
        return SHOP_ITEMS;
    }

    return [
        {id:"infinite_hearts",title:"Hồi đầy trái tim",desc:"Hồi ngay toàn bộ trái tim về mức tối đa.",price:50,icon:"fa-heart",color:"#ff5364"},
        {id:"freeze",title:"Khiên đóng băng",desc:"Bảo vệ Chuỗi ngày nếu bạn quên học 1 ngày.",price:200,icon:"fa-shield-halved",color:"#22b7ef"},
        {id:"p_double_xp",title:"Bùa x2 XP (Đấu Trường)",desc:"Nhân đôi điểm số trong 1 câu hỏi đấu trường.",price:30,icon:"fa-bolt",color:"#ffc928"},
        {id:"p_5050",title:"Bùa 50/50 (Đấu Trường)",desc:"Loại bỏ 2 đáp án sai trong đấu trường.",price:40,icon:"fa-wand-magic-sparkles",color:"#c768ef"}
    ];
}

function shopIconSvg(iconName,className){
    var paths={
        "fa-heart":"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z",
        "fa-shield-halved":"M12 3 5 6v5c0 4.8 3 8.7 7 10 4-1.3 7-5.2 7-10V6l-7-3Zm0 3v12",
        "fa-bolt":"m13 2-9 12h7l-1 8 10-12h-7V2Z",
        "fa-wand-magic-sparkles":"m14 5 1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1ZM4 20 17 7l2 2L6 22l-2-2Zm1-9 1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z",
        "fa-gem":"m12 3 7 7-7 11L5 10l7-7Zm0 0v18M5 10h14"
    };
    var path=paths[iconName]||paths["fa-gem"];
    return '<svg class="'+(className||'shop-svg-icon')+'" viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
}

function ensureInventory(){
    if(!shopState.inventory){
        shopState.inventory={};
    }

    if(shopState.inventory.streakFreeze===undefined){
        shopState.inventory.streakFreeze=0;
    }

    if(shopState.inventory.powerupDoubleXp===undefined){
        shopState.inventory.powerupDoubleXp=0;
    }

    if(shopState.inventory.powerup5050===undefined){
        shopState.inventory.powerup5050=0;
    }

    if(shopState.inventory.infiniteHeartsExpiry===undefined){
        shopState.inventory.infiniteHeartsExpiry=null;
    }
}

function getLevelValue(){
    if(typeof getLevel==="function"){
        return getLevel(Number(shopState.xp)||0);
    }

    return Math.floor((Number(shopState.xp)||0)/100)+1;
}

function updateShopHeader(){
    setShopText(statHearts,shopState.hearts===undefined?3:shopState.hearts);
    setShopText(statStreak,shopState.streak||0);
    setShopText(statGems,shopState.gems||0);
    setShopText(statXp,(shopState.xp||0)+" XP");
    setShopText(statTrophies,shopState.trophies||shopState.pvpWins||0);
    setShopText(statLevel,getLevelValue());
    setShopText(inventoryGemBalance,shopState.gems||0);
    if(difficultySelect){
        difficultySelect.value=shopState.selectedDifficulty||"easy";
    }
}

function updateInventoryPanel(){
    var maxHearts=Math.max(1,Number(shopState.maxHearts)||SHOP_MAX_HEARTS);
    inventoryInfinite.textContent=(Number(shopState.hearts)||0)+"/"+maxHearts+" trái tim";

    inventoryFreeze.textContent=shopState.inventory.streakFreeze||0;
    inventoryDoubleXp.textContent=shopState.inventory.powerupDoubleXp||0;
    inventory5050.textContent=shopState.inventory.powerup5050||0;
}

function renderShop(){
    var html="";
    var index;
    var item;

    if(!shopGrid){
        return;
    }

    for(index=0;index<shopItems.length;index+=1){
        item=shopItems[index];
        html+='<article class="shop-card" style="--item-color:'+item.color+'">';
        html+='<div class="shop-card-badge">Vật phẩm hỗ trợ</div>';
        html+='<div class="shop-card-icon">'+shopIconSvg(item.icon,'shop-svg-icon')+'</div>';
        html+='<h2>'+item.title+'</h2>';
        html+='<p>'+item.desc+'</p>';
        html+='<div class="shop-card-footer">';
        html+='<span class="shop-price">'+shopIconSvg('fa-gem','shop-price-icon')+' '+item.price+'</span>';
        html+='<button class="shop-buy-button" type="button" data-item-id="'+item.id+'" data-item-price="'+item.price+'">Mua ngay <span aria-hidden="true">→</span></button>';
        html+='</div>';
        html+='</article>';
    }

    shopGrid.innerHTML=html;
}

function findShopItem(itemId){
    var index;

    for(index=0;index<shopItems.length;index+=1){
        if(shopItems[index].id===itemId){
            return shopItems[index];
        }
    }

    return null;
}

function applyPurchasedItem(itemId){
    ensureInventory();

    if(itemId==="infinite_hearts"){
        shopState.maxHearts=Math.max(1,Number(shopState.maxHearts)||SHOP_MAX_HEARTS);
        shopState.hearts=shopState.maxHearts;
        shopState.inventory.infiniteHeartsExpiry=null;
    }

    if(itemId==="freeze"){
        shopState.inventory.streakFreeze=(shopState.inventory.streakFreeze||0)+1;
    }

    if(itemId==="p_double_xp"){
        shopState.inventory.powerupDoubleXp=(shopState.inventory.powerupDoubleXp||0)+1;
    }

    if(itemId==="p_5050"){
        shopState.inventory.powerup5050=(shopState.inventory.powerup5050||0)+1;
    }
}

async function syncShopPurchaseToSupabase(gems,hearts){
    var client=window.supabaseClient||window.supabase||(window.VieGeoSupabase&&window.VieGeoSupabase.client);
    var session={};
    var authResult;
    var email="";
    var response;

    try{
        session=JSON.parse(localStorage.getItem("lm_session")||"{}");
    }catch(error){
        session={};
    }

    if(!client||typeof client.from!=="function"){
        throw new Error("Supabase chưa sẵn sàng.");
    }

    if(client.auth&&typeof client.auth.getUser==="function"){
        authResult=await client.auth.getUser();
        email=String(authResult&&authResult.data&&authResult.data.user&&authResult.data.user.email||"").trim().toLowerCase();
    }
    email=email||String(session.email||"").trim().toLowerCase();
    if(!email){
        throw new Error("Không xác định được tài khoản đang đăng nhập.");
    }

    response=await client.from("users").update({gems:gems,hearts:hearts}).eq("email",email);
    if(response.error){
        throw response.error;
    }
}

async function purchaseItem(itemId,price){
    var item=findShopItem(itemId);
    var approved;
    var remainingGems;
    var maxHearts;

    if(!item){
        showToast("Không tìm thấy vật phẩm.",true);
        return;
    }

    approved=window.confirm("Mua "+item.title+" với "+price+" Gem?");

    if(!approved){
        return;
    }

    if((Number(shopState.gems)||0)<price){
        showToast("Bạn không đủ Gem để mua vật phẩm này.","error");
        return;
    }

    remainingGems=(Number(shopState.gems)||0)-price;
    maxHearts=Math.max(1,Number(shopState.maxHearts)||SHOP_MAX_HEARTS);

    try{
        await syncShopPurchaseToSupabase(remainingGems,itemId==="infinite_hearts"?maxHearts:Number(shopState.hearts)||0);
    }catch(error){
        console.error("Không thể đồng bộ giao dịch cửa hàng:",error);
        showToast(error.message||"Không thể đồng bộ giao dịch lên Supabase.","error");
        return;
    }

    shopState.gems=remainingGems;
    applyPurchasedItem(itemId);
    saveShopState();
    updateShopHeader();
    updateInventoryPanel();
    setShopText(document.getElementById("sharedHeart"),shopState.hearts);
    setShopText(document.getElementById("sharedGem"),shopState.gems);
    createConfetti();
    showToast("Đã mua "+item.title+". Bạn còn "+shopState.gems+" Gem.","success");
}

async function handleShopClick(event){
    var button=event.target.closest(".shop-buy-button");
    var itemId;
    var price;

    if(!button){
        return;
    }

    itemId=button.getAttribute("data-item-id");
    price=parseInt(button.getAttribute("data-item-price"),10)||0;
    button.disabled=true;
    try{
        await purchaseItem(itemId,price);
    }finally{
        button.disabled=false;
    }
}

function createConfetti(){
    var colors=["#58cc02","#22b7ef","#ffc928","#c768ef","#ff5364"];
    var index;
    var piece;
    var moveX;
    var moveY;

    for(index=0;index<30;index+=1){
        piece=document.createElement("div");
        piece.className="confetti";
        piece.style.left="50%";
        piece.style.top="48%";
        piece.style.backgroundColor=colors[index%colors.length];
        moveX=(Math.random()*420-210)+"px";
        moveY=(Math.random()*330-180)+"px";
        piece.style.setProperty("--move-x",moveX);
        piece.style.setProperty("--move-y",moveY);
        document.body.appendChild(piece);

        window.setTimeout(function(element){
            if(element&&element.parentNode){
                element.parentNode.removeChild(element);
            }
        },900,piece);
    }
}

function showToast(message,type){
    var normalizedType=type===true?"error":(type===false?"success":String(type||"info").toLowerCase());
    var container=document.getElementById("viegeoToastContainer");
    var toastItem;

    if(!container){
        container=document.createElement("div");
        container.id="viegeoToastContainer";
        container.className="viegeo-toast-container";
        container.setAttribute("aria-live","polite");
        document.body.appendChild(container);
    }

    toastItem=document.createElement("div");
    toastItem.className="viegeo-toast viegeo-toast--"+normalizedType;
    toastItem.setAttribute("role",normalizedType==="error"?"alert":"status");
    toastItem.textContent=String(message||"");
    container.appendChild(toastItem);
    window.requestAnimationFrame(function(){toastItem.classList.add("is-visible");});
    window.setTimeout(function(){
        toastItem.classList.remove("is-visible");
        toastItem.classList.add("is-leaving");
        window.setTimeout(function(){toastItem.remove();},300);
    },3000);
}
window.showToast=showToast;

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

function changeDifficulty(){
    if(!difficultySelect){
        return;
    }
    shopState.selectedDifficulty=difficultySelect.value;
    saveShopState();
    showToast("Đã đổi độ khó.",false);
}

function openParent(){
    window.location.href="parent.html";
}

function logoutUser(){
    localStorage.removeItem("lm_session");
    window.location.href="loginout.html";
}

function goBack(){
    window.location.href="map.html";
}

function openSupport(){
    window.location.href="cs-dashboard.html";
}

function initializeShop(){
    var savedTheme=localStorage.getItem("VieGeo_theme");

    shopState=getShopState();
    shopItems=getShopItems();
    ensureInventory();

    if(savedTheme==="light"){
        applyTheme("light");
    }else{
        applyTheme("dark");
    }

    renderShop();
    updateShopHeader();
    updateInventoryPanel();

    if(shopGrid) shopGrid.addEventListener("click",handleShopClick);
    if(themeButton) themeButton.addEventListener("click",switchTheme);
    if(difficultySelect) difficultySelect.addEventListener("change",changeDifficulty);
    if(parentButton) parentButton.addEventListener("click",openParent);
    if(logoutButton) logoutButton.addEventListener("click",logoutUser);
    if(backButton) backButton.addEventListener("click",goBack);
    /* shared-topbar.js owns the support button on this page. */
}

document.addEventListener("DOMContentLoaded",initializeShop);
