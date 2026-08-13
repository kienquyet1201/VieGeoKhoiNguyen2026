var globalThemeKey="VieGeo_theme";

function showToast(message,type){
    var normalizedType=type===true?"error":(type===false?"success":String(type||"info").toLowerCase());
    var allowedTypes=["success","error","warning","info"];
    var container=document.getElementById("viegeoToastContainer");
    var toast;

    if(allowedTypes.indexOf(normalizedType)===-1){normalizedType="info";}
    if(!container){
        container=document.createElement("div");
        container.id="viegeoToastContainer";
        container.className="viegeo-toast-container";
        container.setAttribute("aria-live","polite");
        container.setAttribute("aria-atomic","true");
        document.body.appendChild(container);
    }

    toast=document.createElement("div");
    toast.className="viegeo-toast viegeo-toast--"+normalizedType;
    toast.setAttribute("role",normalizedType==="error"?"alert":"status");
    toast.textContent=String(message||"");
    container.appendChild(toast);
    window.requestAnimationFrame(function(){toast.classList.add("is-visible");});
    window.setTimeout(function(){
        toast.classList.remove("is-visible");
        toast.classList.add("is-leaving");
        window.setTimeout(function(){toast.remove();},300);
    },3000);
    return toast;
}
window.showToast=showToast;

function getGlobalTheme(){
    var savedTheme=localStorage.getItem(globalThemeKey);
    if(savedTheme==="light"){
        return "light";
    }
    return "dark";
}

function applyGlobalTheme(theme){
    document.documentElement.setAttribute("data-theme",theme);
    localStorage.setItem(globalThemeKey,theme);
    updateGlobalThemeButtons(theme);
}

function toggleGlobalTheme(){
    var currentTheme=document.documentElement.getAttribute("data-theme");
    if(currentTheme==="light"){
        applyGlobalTheme("dark");
    }else{
        applyGlobalTheme("light");
    }
}

function updateGlobalThemeButtons(theme){
    var buttons=document.querySelectorAll("[data-global-theme-toggle]");
    var index;
    for(index=0;index<buttons.length;index+=1){
        if(theme==="light"){
            buttons[index].textContent="Chế độ tối";
        }else{
            buttons[index].textContent="Chế độ sáng";
        }
    }
}

function initializeGlobalTheme(){
    applyGlobalTheme(getGlobalTheme());
}

function ensureVieGeoSupportModal(){
    var modal=document.getElementById("viegeoSupportModal");
    if(modal){return modal;}

    modal=document.createElement("div");
    modal.id="viegeoSupportModal";
    modal.className="viegeo-support-modal";
    modal.hidden=true;
    modal.style.display="none";
    modal.innerHTML='<div class="viegeo-support-modal__dialog" role="dialog" aria-modal="true" aria-label="Hỗ trợ khách hàng"><button class="viegeo-support-modal__close" type="button" aria-label="Đóng">×</button><iframe class="viegeo-support-modal__frame" title="Hỗ trợ VieGeo" src="support-user.html"></iframe></div>';
    document.body.appendChild(modal);

    modal.querySelector(".viegeo-support-modal__close").addEventListener("click",closeVieGeoSupportModal);
    modal.addEventListener("click",function(event){
        if(event.target===modal){closeVieGeoSupportModal();}
    });
    return modal;
}

function openVieGeoSupportModal(){
    var modal=ensureVieGeoSupportModal();
    modal.hidden=false;
    modal.style.display="block";
    document.body.style.overflow="hidden";
}

function closeVieGeoSupportModal(){
    var modal=document.getElementById("viegeoSupportModal");
    if(!modal){return;}
    modal.hidden=true;
    modal.style.display="none";
    document.body.style.overflow="";
}

applyGlobalTheme(getGlobalTheme());

document.addEventListener("DOMContentLoaded",initializeGlobalTheme);

document.addEventListener("click",function(event){
    var button=event.target.closest(".support-button,.support-btn,#supportButton,#studentSupportButton");
    if(!button){return;}
    event.preventDefault();
    event.stopImmediatePropagation();
    var modal=document.getElementById("viegeoSupportModal");
    if(modal&&!modal.hidden&&modal.style.display!=="none"){
        closeVieGeoSupportModal();
    }else{
        openVieGeoSupportModal();
    }
},true);

document.addEventListener("keydown",function(event){
    if(event.key==="Escape"){closeVieGeoSupportModal();}
});

window.openVieGeoSupportModal=openVieGeoSupportModal;

window.addEventListener("storage",function(event){
    if(event.key===globalThemeKey){
        applyGlobalTheme(getGlobalTheme());
    }
});
