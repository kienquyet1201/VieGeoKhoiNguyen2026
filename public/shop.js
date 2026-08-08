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
        {id:"infinite_hearts",title:"Trái tim vô hạn",desc:"Không bao giờ mất mạng trong 15 phút.",price:50,icon:"fa-heart",color:"#ff5364"},
        {id:"freeze",title:"Khiên đóng băng",desc:"Bảo vệ Chuỗi ngày nếu bạn quên học 1 ngày.",price:200,icon:"fa-shield-halved",color:"#22b7ef"},
        {id:"p_double_xp",title:"Bùa x2 XP (Đấu Trường)",desc:"Nhân đôi điểm số trong 1 câu hỏi đấu trường.",price:30,icon:"fa-bolt",color:"#ffc928"},
        {id:"p_5050",title:"Bùa 50/50 (Đấu Trường)",desc:"Loại bỏ 2 đáp án sai trong đấu trường.",price:40,icon:"fa-wand-magic-sparkles",color:"#c768ef"}
    ];
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
    statHearts.textContent=shopState.hearts===undefined?3:shopState.hearts;
    statStreak.textContent=shopState.streak||0;
    statGems.textContent=shopState.gems||0;
    statXp.textContent=(shopState.xp||0)+" XP";
    statTrophies.textContent=shopState.trophies||shopState.pvpWins||0;
    statLevel.textContent=getLevelValue();
    inventoryGemBalance.textContent=shopState.gems||0;
    difficultySelect.value=shopState.selectedDifficulty||"easy";
}

function updateInventoryPanel(){
    var expiry=Number(shopState.inventory.infiniteHeartsExpiry)||0;
    var remain=Math.max(0,expiry-Date.now());
    var minutes;

    if(remain>0){
        minutes=Math.ceil(remain/60000);
        inventoryInfinite.textContent="Còn "+minutes+" phút";
    }else{
        inventoryInfinite.textContent="Chưa kích hoạt";
    }

    inventoryFreeze.textContent=shopState.inventory.streakFreeze||0;
    inventoryDoubleXp.textContent=shopState.inventory.powerupDoubleXp||0;
    inventory5050.textContent=shopState.inventory.powerup5050||0;
}

function renderShop(){
    var html="";
    var index;
    var item;

    for(index=0;index<shopItems.length;index+=1){
        item=shopItems[index];
        html+='<article class="shop-card" style="--item-color:'+item.color+'">';
        html+='<div class="shop-card-badge">Vật phẩm hỗ trợ</div>';
        html+='<div class="shop-card-icon"><i class="fa-solid '+item.icon+'"></i></div>';
        html+='<h2>'+item.title+'</h2>';
        html+='<p>'+item.desc+'</p>';
        html+='<div class="shop-card-footer">';
        html+='<span class="shop-price"><i class="fa-solid fa-gem"></i> '+item.price+'</span>';
        html+='<button class="shop-buy-button" type="button" data-item-id="'+item.id+'" data-item-price="'+item.price+'">Mua ngay <i class="fa-solid fa-arrow-right"></i></button>';
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
        shopState.inventory.infiniteHeartsExpiry=Date.now()+15*60*1000;
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

function purchaseItem(itemId,price){
    var item=findShopItem(itemId);
    var approved;

    if(!item){
        showToast("Không tìm thấy vật phẩm.",true);
        return;
    }

    approved=window.confirm("Mua "+item.title+" với "+price+" Gem?");

    if(!approved){
        return;
    }

    if((Number(shopState.gems)||0)<price){
        showToast("Bạn không đủ Đá quý!",true);
        window.alert("Bạn không đủ Gem để mua vật phẩm này.");
        return;
    }

    shopState.gems=(Number(shopState.gems)||0)-price;
    applyPurchasedItem(itemId);
    saveShopState();
    updateShopHeader();
    updateInventoryPanel();
    createConfetti();
    showToast("Đã mua "+item.title+" thành công!",false);
    window.alert("Mua thành công! Bạn còn "+shopState.gems+" Gem.");
}

function handleShopClick(event){
    var button=event.target.closest(".shop-buy-button");
    var itemId;
    var price;

    if(!button){
        return;
    }

    itemId=button.getAttribute("data-item-id");
    price=parseInt(button.getAttribute("data-item-price"),10)||0;
    purchaseItem(itemId,price);
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

function showToast(message,isError){
    toast.textContent=message;
    toast.className="toast show";

    if(isError){
        toast.classList.add("error");
    }

    window.setTimeout(function(){
        toast.className="toast";
    },2400);
}

function applyTheme(theme){
    document.documentElement.setAttribute("data-theme",theme);
    localStorage.setItem("VieGeo_theme",theme);

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

    shopGrid.addEventListener("click",handleShopClick);
    themeButton.addEventListener("click",switchTheme);
    difficultySelect.addEventListener("change",changeDifficulty);
    parentButton.addEventListener("click",openParent);
    logoutButton.addEventListener("click",logoutUser);
    backButton.addEventListener("click",goBack);
    supportButton.addEventListener("click",openSupport);
}

document.addEventListener("DOMContentLoaded",initializeShop);
