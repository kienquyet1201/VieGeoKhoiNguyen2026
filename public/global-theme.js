var globalThemeKey="VieGeo_theme";

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

applyGlobalTheme(getGlobalTheme());

document.addEventListener("DOMContentLoaded",initializeGlobalTheme);

window.addEventListener("storage",function(event){
    if(event.key===globalThemeKey){
        applyGlobalTheme(getGlobalTheme());
    }
});
