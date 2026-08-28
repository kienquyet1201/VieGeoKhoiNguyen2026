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
window.VieGeoToast=showToast;

function showConfirmToast(message,options){
    var settings=options||{};
    var normalizedType=String(settings.type||"warning").toLowerCase();
    var allowedTypes=["success","error","warning","info"];

    if(allowedTypes.indexOf(normalizedType)===-1){normalizedType="warning";}

    return new Promise(function(resolve){
        var previousFocus=document.activeElement;
        var existing=document.getElementById("viegeoConfirmOverlay");
        var overlay=document.createElement("div");
        var dialog=document.createElement("section");
        var copy=document.createElement("div");
        var title=document.createElement("strong");
        var body=document.createElement("p");
        var actions=document.createElement("div");
        var confirmButton=document.createElement("button");
        var cancelButton=document.createElement("button");
        var settled=false;
        var timer=0;

        if(existing){existing.remove();}
        overlay.id="viegeoConfirmOverlay";
        overlay.className="viegeo-confirm-overlay";
        dialog.className="viegeo-confirm-dialog viegeo-confirm-dialog--"+normalizedType;
        dialog.setAttribute("role","alertdialog");
        dialog.setAttribute("aria-modal","true");
        dialog.setAttribute("aria-labelledby","viegeoConfirmTitle");
        title.textContent=String(settings.title||"Xác nhận");
        title.id="viegeoConfirmTitle";
        body.textContent=String(message||"");
        copy.className="viegeo-confirm-dialog__copy";
        actions.className="viegeo-confirm-dialog__actions";
        confirmButton.type="button";
        confirmButton.className="viegeo-confirm-dialog__button viegeo-confirm-dialog__button--confirm";
        confirmButton.textContent=String(settings.confirmText||"Đồng ý");
        cancelButton.type="button";
        cancelButton.className="viegeo-confirm-dialog__button viegeo-confirm-dialog__button--cancel";
        cancelButton.textContent=String(settings.cancelText||"Hủy");
        copy.appendChild(title);
        copy.appendChild(body);
        actions.appendChild(confirmButton);
        if(settings.showCancel!==false&&settings.cancelText!==false){actions.appendChild(cancelButton);}
        dialog.appendChild(copy);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        function handleKeydown(event){
            if(event.key==="Escape"){finish(false);}
        }

        function finish(value){
            if(settled){return;}
            settled=true;
            if(timer){window.clearTimeout(timer);}
            document.removeEventListener("keydown",handleKeydown);
            overlay.classList.remove("is-visible");
            overlay.classList.add("is-leaving");
            window.setTimeout(function(){
                overlay.remove();
                if(previousFocus&&typeof previousFocus.focus==="function"){previousFocus.focus();}
                resolve(value);
            },220);
        }

        confirmButton.addEventListener("click",function(){finish(true);});
        cancelButton.addEventListener("click",function(){finish(false);});
        overlay.addEventListener("click",function(event){if(event.target===overlay){finish(false);}});
        document.addEventListener("keydown",handleKeydown);
        window.requestAnimationFrame(function(){overlay.classList.add("is-visible");confirmButton.focus();});
        if(Number(settings.timeout)>0){timer=window.setTimeout(function(){finish(false);},Number(settings.timeout));}
    });
}
window.showConfirmToast=showConfirmToast;

window.VieGeoUI=window.VieGeoUI||{};
window.VieGeoUI.toast=function(message,options){
    var settings=options||{};
    showToast(message,settings.type||settings.icon||"info");
    return Promise.resolve({isConfirmed:true});
};
window.VieGeoUI.success=function(message,options){return window.VieGeoUI.toast(message,Object.assign({},options||{},{type:"success"}));};
window.VieGeoUI.warning=function(message,options){return window.VieGeoUI.toast(message,Object.assign({},options||{},{type:"warning"}));};
window.VieGeoUI.error=function(message,options){return window.VieGeoUI.toast(message,Object.assign({},options||{},{type:"error"}));};
window.VieGeoUI.confirm=function(message,options){return showConfirmToast(message,options).then(function(value){return {isConfirmed:value};});};

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
    modal.innerHTML='<div class="viegeo-support-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="viegeoSupportModalTitle">'+
        '<header class="viegeo-support-modal__header"><span class="viegeo-support-modal__icon" aria-hidden="true">🎧</span><div><strong id="viegeoSupportModalTitle">VieGeo Care</strong><small><i></i>CSKH đang online</small></div><button class="viegeo-support-modal__close" type="button" aria-label="Đóng cửa sổ hỗ trợ">×</button></header>'+
        '<iframe class="viegeo-support-modal__frame" title="Hỗ trợ VieGeo" src="support-user.html?embedded=1"></iframe></div>';
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
