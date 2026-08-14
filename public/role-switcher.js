function getRolePageSession(){
    var raw=localStorage.getItem("lm_session");
    if(!raw){return {};}
    try{return JSON.parse(raw);}catch(error){return {};}
}

function getAllowedRolePages(session){
    var aliases={student:"user",map:"user",cskh:"cs",support:"cs"};
    var raw=session&&session.roles;
    var hasExplicitRoles=Boolean(session&&Object.prototype.hasOwnProperty.call(session,"roles"));
    var source=hasExplicitRoles?raw:(session.activeRole||session.role||"");
    var values=Array.isArray(source)?source:(source?[source]:[]);
    var roles=[];
    var index;
    for(index=0;index<values.length;index+=1){
        var role=aliases[String(values[index]||"").toLowerCase()]||String(values[index]||"").toLowerCase();
        if(["user","parent","cs","admin"].indexOf(role)>=0&&roles.indexOf(role)<0){roles.push(role);}
    }
    return roles;
}

function changeRolePage(){
    var role=this.value;
    var session=getRolePageSession();
    var routeMap={user:"student-dashboard.html",parent:"parent.html",cs:"cs-dashboard.html",admin:"admin-dashboard.html"};

    if(getAllowedRolePages(session).indexOf(role)<0){
        this.value=session.activeRole||session.role||"";
        return;
    }
    session.role=role;
    session.activeRole=role;
    localStorage.setItem("lm_session",JSON.stringify(session));
    window.location.href=routeMap[role];
}

function initializeRolePageSwitcher(){
    var selects=document.querySelectorAll("[data-role-page-select]");
    var session=getRolePageSession();
    var allowedRoles=getAllowedRolePages(session);
    var currentRole=session.activeRole||session.role||allowedRoles[0];
    var index;

    [document.getElementById("roleButton"),document.getElementById("settingsRoleButton")].forEach(function(button){
        if(button){button.hidden=allowedRoles.length<2;button.style.display=allowedRoles.length<2?"none":"";}
    });

    for(index=0;index<selects.length;index+=1){
        var select=selects[index];
        Array.prototype.slice.call(select.options).forEach(function(option){
            option.hidden=allowedRoles.indexOf(option.value)<0;
            option.disabled=allowedRoles.indexOf(option.value)<0;
        });
        select.value=allowedRoles.indexOf(currentRole)>=0?currentRole:(allowedRoles[0]||"");
        select.disabled=allowedRoles.length<2;
        if(select.closest(".role-page-switcher")){select.closest(".role-page-switcher").hidden=allowedRoles.length<2;}
        if(select.dataset.roleSwitchBound!=="true"){
            select.dataset.roleSwitchBound="true";
            select.addEventListener("change",changeRolePage);
        }
    }
}

document.addEventListener("DOMContentLoaded",initializeRolePageSwitcher);
window.addEventListener("viegeo:user-hydrated",initializeRolePageSwitcher);
