var supportThemeButton=document.getElementById("supportThemeButton");
var supportMessageList=document.getElementById("supportMessageList");
var supportMessageInput=document.getElementById("supportMessageInput");
var supportSendButton=document.getElementById("supportSendButton");
var ticketCode=document.getElementById("ticketCode");
var ticketStatus=document.getElementById("ticketStatus");
var supportToast=document.getElementById("supportToast");
var currentSupportTicket=null;
var supportAiReplyPending=false;

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
        className=message.sender==="admin"||message.sender==="cs"||message.sender==="ai"?"admin-message":"user-message";
        html+='<div class="support-message '+className+'">';
        if(message.sender==="ai"){
            html+='<b class="support-message-author">Trợ lý VieGeo</b>';
        }else if(message.sender==="admin"||message.sender==="cs"){
            html+='<b class="support-message-author">'+escapeSupportText(message.senderName||"CSKH VieGeo")+'</b>';
        }
        html+=escapeSupportText(message.text)+'<small>'+formatSupportTime(message.createdAt)+'</small></div>';
    }

    supportMessageList.innerHTML=html;
    if(supportAiReplyPending){setSupportAiTyping(true);}
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

function setSupportAiTyping(active){
    var existing=document.getElementById("supportAiTyping");
    if(existing){existing.remove();}
    if(!active){return;}
    var typing=document.createElement("div");
    typing.id="supportAiTyping";
    typing.className="support-message admin-message support-ai-typing";
    typing.innerHTML='<b class="support-message-author">Trợ lý VieGeo</b><span aria-label="Đang trả lời"><i></i><i></i><i></i></span>';
    supportMessageList.appendChild(typing);
    supportMessageList.scrollTop=supportMessageList.scrollHeight;
}

function supportConversation(ticket){
    var messages=Array.isArray(ticket&&ticket.messages)?ticket.messages:[];
    return messages.slice(-8).map(function(message){
        return {sender:String(message.sender||"user"),text:String(message.text||"")};
    });
}

function supportLocalAutoReply(message){
    var text=String(message||"").toLowerCase();
    if(/đăng nhập|mật khẩu|tài khoản/.test(text)){
        return "Tôi đã nhận được yêu cầu về tài khoản. Bạn vui lòng cho biết thông báo lỗi đang thấy; không gửi mật khẩu hoặc mã OTP trong khung chat.";
    }
    if(/premium|nâng cấp|thanh toán/.test(text)){
        return "Tôi đã ghi nhận yêu cầu Premium. Nhân viên CSKH sẽ kiểm tra trạng thái và phản hồi tại đây; bạn không cần gửi thông tin thanh toán nhạy cảm.";
    }
    if(/câu hỏi|đảo|bài học|tiến độ/.test(text)){
        return "Tôi đã ghi nhận vấn đề học tập của bạn. Hãy cho biết tên tỉnh, đảo nhỏ và bước đang gặp lỗi để CSKH kiểm tra nhanh hơn.";
    }
    return "Tôi đã nhận được tin nhắn của bạn. Bạn hãy mô tả thêm màn hình hoặc thao tác đang gặp vấn đề; nhân viên CSKH sẽ tiếp tục hỗ trợ tại đây.";
}

function appendSupportAiReply(ticket,reply){
    return supportAppendMessage(ticket.id,"ai",reply,{
        senderId:"viegeo-gemini",
        senderEmail:"ai-support@viegeo.local",
        senderName:"Trợ lý VieGeo",
        senderRole:"cs"
    });
}

function requestSupportAutoReply(ticket,userMessage){
    if(supportAiReplyPending||!ticket){return Promise.resolve(ticket);}
    supportAiReplyPending=true;
    setSupportAiTyping(true);

    return fetch("/api/support-ai",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({message:userMessage,conversation:supportConversation(ticket)})
    }).then(function(response){
        return response.json().then(function(data){return {ok:response.ok,data:data};});
    }).then(function(result){
        var reply=String(result.data&&result.data.reply||"").trim();
        if(!reply){throw new Error("Trợ lý chưa trả về nội dung.");}
        return appendSupportAiReply(ticket,reply);
    }).then(function(updatedTicket){
        renderSupportMessages(updatedTicket);
        return updatedTicket;
    }).catch(function(error){
        console.warn("[VieGeo Support] Đang dùng phản hồi hỗ trợ dự phòng.");
        return appendSupportAiReply(ticket,supportLocalAutoReply(userMessage)).then(function(updatedTicket){
            renderSupportMessages(updatedTicket);
            return updatedTicket;
        });
    }).finally(function(){
        supportAiReplyPending=false;
        setSupportAiTyping(false);
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
        requestSupportAutoReply(ticket,text);
    }).catch(function(error){
        console.error("[VieGeo Support] Không thể gửi tin nhắn:",error);
        showSupportToast("Chưa thể gửi tin nhắn. Vui lòng thử lại.");
        supportSendButton.disabled=false;
        supportSendButton.textContent="Gửi tin nhắn";
    });
}

function initializeSupportUser(){
    if(window.self!==window.top){document.documentElement.classList.add("support-embedded");}
    applyGlobalTheme(getGlobalTheme());
    currentSupportTicket=supportEnsureTicket();
    renderSupportMessages(currentSupportTicket);
    supportSyncLocalTicket(currentSupportTicket).catch(function(error){console.error("[VieGeo Support] Không thể gửi lại hội thoại cũ:",error);});
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
