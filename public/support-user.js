var supportThemeButton=document.getElementById("supportThemeButton");
var supportMessageList=document.getElementById("supportMessageList");
var supportMessageInput=document.getElementById("supportMessageInput");
var supportSendButton=document.getElementById("supportSendButton");
var ticketCode=document.getElementById("ticketCode");
var ticketStatus=document.getElementById("ticketStatus");
var supportToast=document.getElementById("supportToast");
var currentSupportTicket=null;

function showSupportToast(message){
    supportToast.textContent=message;
    supportToast.classList.add("show");
    window.setTimeout(function(){supportToast.classList.remove("show");},2200);
}

function formatSupportTime(value){
    var date=new Date(value);
    var hour=String(date.getHours()).padStart(2,"0");
    var minute=String(date.getMinutes()).padStart(2,"0");
    return hour+":"+minute;
}

function renderSupportMessages(ticket){
    var html="";
    var index;
    var message;
    var className;

    currentSupportTicket=ticket;
    ticketCode.textContent="Ticket "+ticket.id;
    ticketStatus.textContent=ticket.status==="closed"?"Đã đóng":"Đang mở";

    if(!ticket.messages||!ticket.messages.length){
        supportMessageList.innerHTML='<div class="support-empty">Chưa có tin nhắn. Hãy mô tả vấn đề bạn đang gặp.</div>';
        return;
    }

    for(index=0;index<ticket.messages.length;index+=1){
        message=ticket.messages[index];
        className=message.sender==="admin"||message.sender==="cs"?"admin-message":"user-message";
        html+='<div class="support-message '+className+'">'+escapeSupportText(message.text)+'<small>'+formatSupportTime(message.createdAt)+'</small></div>';
    }

    supportMessageList.innerHTML=html;
    supportMessageList.scrollTop=supportMessageList.scrollHeight;
}

function escapeSupportText(text){
    return String(text||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function refreshSupportTicket(){
    var localTicket=supportEnsureTicket();

    supportLoadTickets().then(function(tickets){
        var index;
        var found=null;

        for(index=0;index<tickets.length;index+=1){
            if(tickets[index].id===localTicket.id){
                found=tickets[index];
            }
        }

        renderSupportMessages(found||localTicket);
    });
}

function sendSupportMessage(){
    var text=supportMessageInput.value.trim();

    if(!text){
        showSupportToast("Hãy nhập nội dung cần hỗ trợ.");
        return;
    }

    supportSendButton.disabled=true;
    supportSendButton.textContent="Đang gửi...";

    supportAppendMessage(currentSupportTicket.id,"user",text).then(function(ticket){
        supportMessageInput.value="";
        renderSupportMessages(ticket);
        showSupportToast("Đã gửi tin nhắn tới CSKH.");
        supportSendButton.disabled=false;
        supportSendButton.textContent="Gửi tin nhắn";
    });
}

function initializeSupportUser(){
    applyGlobalTheme(getGlobalTheme());
    currentSupportTicket=supportEnsureTicket();
    renderSupportMessages(currentSupportTicket);
    refreshSupportTicket();

    supportThemeButton.addEventListener("click",function(){
        toggleGlobalTheme();
        updateGlobalThemeButtons(getGlobalTheme());
    });

    supportSendButton.addEventListener("click",sendSupportMessage);

    supportMessageInput.addEventListener("keydown",function(event){
        if(event.key==="Enter"&&!event.shiftKey){
            event.preventDefault();
            sendSupportMessage();
        }
    });

    window.setInterval(refreshSupportTicket,5000);
}

document.addEventListener("DOMContentLoaded",initializeSupportUser);
