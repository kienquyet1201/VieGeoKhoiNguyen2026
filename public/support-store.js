var supportStorageKey="VieGeo_support_tickets";
var supportRemoteTablesAvailable=true;
var supportRemoteSchemaWarningShown=false;

function supportIsMissingTableError(error){
    var code=String(error&&error.code||"").toUpperCase();
    var message=String(error&&error.message||"").toLowerCase();
    return code==="PGRST205"||message.indexOf("support_tickets")>=0&&message.indexOf("schema cache")>=0||message.indexOf("support_messages")>=0&&message.indexOf("schema cache")>=0;
}

function supportDisableRemoteTables(error){
    supportRemoteTablesAvailable=false;
    if(!supportRemoteSchemaWarningShown){
        supportRemoteSchemaWarningShown=true;
        console.warn("[VieGeo Support] Chế độ lưu hội thoại trực tiếp chưa được bật; đang dùng lưu trữ dự phòng.");
    }
    return error;
}

function supportGetSession(){
    var raw=localStorage.getItem("lm_session");
    if(!raw){return {};}
    try{return JSON.parse(raw)||{};}catch(error){return {};}
}

function supportGetLocalTickets(){
    var raw=localStorage.getItem(supportStorageKey);
    if(!raw){return [];}
    try{
        var rows=JSON.parse(raw);
        return Array.isArray(rows)?rows:[];
    }catch(error){return [];}
}

function supportSaveLocalTickets(tickets){
    localStorage.setItem(supportStorageKey,JSON.stringify(Array.isArray(tickets)?tickets:[]));
}

function supportGetClient(){
    var candidate=window.supabaseClient||window.supabase||(window.VieGeoSupabase&&window.VieGeoSupabase.client);
    return candidate&&typeof candidate.from==="function"?candidate:null;
}

function supportMediaEncode(text,imageUrl,imageName){
    return window.VieGeoSupportMedia?window.VieGeoSupportMedia.encode(text,imageUrl,imageName):String(text||"");
}

function supportMediaDecode(value){
    return window.VieGeoSupportMedia?window.VieGeoSupportMedia.decode(value):{text:String(value||""),imageUrl:"",imageName:""};
}

function supportCreateId(email){
    return String(email||"guest").trim().toLowerCase().replace(/[^a-zA-Z0-9_-]/g,"_");
}

function supportFindLocalTicket(ticketId){
    return supportGetLocalTickets().find(function(ticket){return String(ticket.id)===String(ticketId);})||null;
}

function supportUpsertLocalTicket(ticket){
    var tickets=supportGetLocalTickets();
    var index=tickets.findIndex(function(item){return String(item.id)===String(ticket.id);});
    if(index>=0){tickets[index]=ticket;}else{tickets.unshift(ticket);}
    supportSaveLocalTickets(tickets);
}

function supportEnsureTicket(){
    var session=supportGetSession();
    var email=session.email||"guest@viegeo.local";
    var name=session.user_name||session.name||session.displayName||email||"Người dùng";
    var ticketId=supportCreateId(email);
    var ticket=supportFindLocalTicket(ticketId);

    if(!ticket){
        ticket={
            id:ticketId,
            userId:String(session.id||session.user_id||""),
            email:email,
            name:name,
            role:session.activeRole||session.role||"user",
            subject:"Hỗ trợ tài khoản",
            category:"general",
            priority:"normal",
            status:"pending",
            createdAt:Date.now(),
            updatedAt:Date.now(),
            messages:[]
        };
        supportUpsertLocalTicket(ticket);
    }
    return ticket;
}

function supportTicketPayload(ticket){
    var messages=Array.isArray(ticket.messages)?ticket.messages:[];
    var last=messages.length?messages[messages.length-1]:null;
    return {
        id:String(ticket.id),
        user_id:String(ticket.userId||ticket.user_id||"")||null,
        user_email:String(ticket.email||ticket.user_email||"guest@viegeo.local"),
        user_name:String(ticket.name||ticket.user_name||"Người dùng"),
        user_role:String(ticket.role||ticket.user_role||"user"),
        subject:String(ticket.subject||"Hỗ trợ tài khoản"),
        category:String(ticket.category||"general"),
        priority:String(ticket.priority||"normal"),
        status:String(ticket.status||"pending"),
        last_message:String(ticket.lastMessage||ticket.last_message||(last&&last.text)||""),
        created_at_client:Number(ticket.createdAt||ticket.created_at_client||Date.now()),
        updated_at_client:Number(ticket.updatedAt||ticket.updated_at_client||Date.now()),
        updated_at:new Date(Number(ticket.updatedAt||Date.now())).toISOString()
    };
}

function supportMessagePayload(ticket,message){
    return {
        id:String(message.id),
        ticket_id:String(ticket.id),
        sender:String(message.sender||"user"),
        sender_id:String(message.senderId||message.sender_id||ticket.userId||"")||null,
        sender_email:String(message.senderEmail||message.sender_email||ticket.email||"")||null,
        sender_name:String(message.senderName||message.sender_name||ticket.name||"")||null,
        sender_role:String(message.senderRole||message.sender_role||ticket.role||"user"),
        message:supportMediaEncode(message.text||message.message||"",message.imageUrl,message.imageName),
        is_internal:Boolean(message.isInternal||message.is_internal),
        status:String(message.status||"sent"),
        created_at_client:Number(message.createdAt||message.created_at_client||Date.now())
    };
}

function supportWriteRemote(ticket){
    var database=supportGetClient();
    if(!database||!supportRemoteTablesAvailable){return Promise.resolve(false);}
    return database.from("support_tickets").upsert([supportTicketPayload(ticket)],{onConflict:"id"}).then(function(result){
        if(result.error){throw result.error;}
        return true;
    }).catch(function(error){
        if(supportIsMissingTableError(error)){supportDisableRemoteTables(error);return false;}
        console.error("[VieGeo Support] Không thể đồng bộ ticket:",error);
        return false;
    });
}

function supportWriteFeedbackFallback(ticket,message){
    var database=supportGetClient();
    if(!database||!message||message.fallbackStored){return Promise.resolve(Boolean(message&&message.fallbackStored));}
    var encodedMessage=supportMediaEncode(message.text||message.message||"",message.imageUrl,message.imageName);
    var richPayload={
        user_email:String(ticket.email||ticket.user_email||"guest@viegeo.local"),
        content:encodedMessage,
        subject:"VieGeo CSKH|user|"+String(ticket.id),
        message:encodedMessage,
        sender_id:String(ticket.userId||ticket.user_id||"")||null,
        sender_name:String(ticket.name||ticket.user_name||"Người dùng"),
        status:"pending",
        created_at_client:Number(message.createdAt||message.created_at_client||Date.now())
    };
    return database.from("user_feedbacks").insert([richPayload]).then(function(result){
        if(!result.error){return result;}
        return database.from("user_feedbacks").insert([{user_email:richPayload.user_email,content:richPayload.content}]);
    }).then(function(result){
        if(result.error){throw result.error;}
        message.fallbackStored=true;
        supportUpsertLocalTicket(ticket);
        return true;
    }).catch(function(error){
        console.error("[VieGeo Support] Không thể lưu tin nhắn dự phòng:",error);
        return false;
    });
}

function supportFeedbackSender(row){
    var subject=String(row&&row.subject||"").toLowerCase();
    if(/^viegeo cskh\|note\|/.test(subject)){return "note";}
    if(/^viegeo cskh\|cs\|/.test(subject)||subject==="phản hồi cskh"){return "cs";}
    return "user";
}

function supportFeedbackMatchesTicket(row,ticket){
    var subject=String(row&&row.subject||"");
    var marker=subject.match(/^VieGeo CSKH\|(user|cs|note)\|(.+)$/i);
    if(marker){return marker[2]===String(ticket.id);}
    return /tin nhắn cskh|phản hồi cskh/i.test(subject);
}

function supportMergeFeedbackMessages(ticket,rows){
    ticket.messages=Array.isArray(ticket.messages)?ticket.messages:[];
    (Array.isArray(rows)?rows:[]).filter(function(row){return supportFeedbackMatchesTicket(row,ticket);}).forEach(function(row){
        var sender=supportFeedbackSender(row);
        if(sender==="note"){return;}
        var decoded=supportMediaDecode(row.message||row.content||"");
        var text=String(decoded.text||"").trim();
        var createdAt=Number(row.created_at_client||Date.parse(row.created_at)||0);
        var duplicate=ticket.messages.some(function(message){
            return String(message.text||"").trim()===text&&String(message.imageUrl||"")===String(decoded.imageUrl||"")&&Math.abs(Number(message.createdAt||0)-createdAt)<2000;
        });
        if(duplicate||!text){return;}
        ticket.messages.push({
            id:"feedback_"+String(row.id),
            sender:sender,
            senderId:String(row.sender_id||""),
            senderEmail:String(row.user_email||ticket.email||""),
            senderName:String(row.sender_name||(sender==="cs"?"CSKH VieGeo":ticket.name)||""),
            senderRole:sender==="cs"?"cs":ticket.role,
            text:text,
            imageUrl:decoded.imageUrl,
            imageName:decoded.imageName,
            status:"sent",
            fallbackStored:true,
            createdAt:createdAt||Date.now()
        });
    });
    ticket.messages.sort(function(first,second){return Number(first.createdAt||0)-Number(second.createdAt||0);});
    if(ticket.messages.length){
        var last=ticket.messages[ticket.messages.length-1];
        ticket.lastMessage=last.text;
        ticket.updatedAt=last.createdAt;
    }
    supportUpsertLocalTicket(ticket);
    return ticket;
}

function supportLoadFeedbackFallback(ticket){
    var database=supportGetClient();
    if(!database||!ticket||!ticket.email){return Promise.resolve(ticket);}
    return database.from("user_feedbacks").select("*").eq("user_email",ticket.email).order("created_at_client",{ascending:true}).limit(500).then(function(result){
        if(result.error&&/column|does not exist|schema/i.test(String(result.error.message||""))){
            return database.from("user_feedbacks").select("*").eq("user_email",ticket.email).limit(500);
        }
        return result;
    }).then(function(result){
        if(result.error){throw result.error;}
        return supportMergeFeedbackMessages(ticket,result.data||[]);
    }).catch(function(){
        console.warn("[VieGeo Support] Chưa thể tải phản hồi dự phòng.");
        return ticket;
    });
}

function supportWriteMessageRemote(ticket,message){
    var database=supportGetClient();
    if(!database||!message){return Promise.resolve(false);}
    if(message.remoteStored||message.fallbackStored){return Promise.resolve(true);}
    if(!supportRemoteTablesAvailable){
        if(message.sender==="ai"||message.sender==="admin"||message.sender==="cs"){return Promise.resolve(true);}
        return supportWriteFeedbackFallback(ticket,message);
    }
    return supportWriteRemote(ticket).then(function(ticketSaved){
        if(!ticketSaved){return supportWriteFeedbackFallback(ticket,message);}
        return database.from("support_messages").upsert([supportMessagePayload(ticket,message)],{onConflict:"id"}).then(function(result){
            if(result.error){throw result.error;}
            message.remoteStored=true;
            supportUpsertLocalTicket(ticket);
            return true;
        }).catch(function(error){
            if(supportIsMissingTableError(error)){
                supportDisableRemoteTables(error);
                return message.sender==="user"?supportWriteFeedbackFallback(ticket,message):true;
            }
            console.error("[VieGeo Support] Không thể lưu hội thoại trực tiếp:",error);
            return supportWriteFeedbackFallback(ticket,message);
        });
    });
}

function supportSyncLocalTicket(ticket){
    var messages=Array.isArray(ticket&&ticket.messages)?ticket.messages:[];
    return messages.reduce(function(chain,message){
        return chain.then(function(){return supportWriteMessageRemote(ticket,message);});
    },Promise.resolve(true)).then(function(){return ticket;});
}

function supportAppendMessage(ticketId,sender,text,metadata){
    var ticket=supportFindLocalTicket(ticketId)||supportEnsureTicket();
    var now=Date.now();
    var details=metadata||{};
    var isSupportSender=sender==="ai"||sender==="admin"||sender==="cs";
    var message={
        id:"msg_"+now+"_"+Math.floor(Math.random()*100000),
        sender:sender,
        senderId:String(details.senderId||(isSupportSender?"viegeo-support":ticket.userId)||""),
        senderEmail:String(details.senderEmail||(isSupportSender?"support@viegeo.local":ticket.email)||""),
        senderName:String(details.senderName||(sender==="ai"?"Trợ lý VieGeo":(isSupportSender?"CSKH VieGeo":ticket.name))||"Người dùng"),
        senderRole:String(details.senderRole||(isSupportSender?"cs":ticket.role)||"user"),
        text:String(text||"").trim(),
        imageUrl:String(details.imageUrl||""),
        imageName:String(details.imageName||""),
        status:"sent",
        createdAt:now
    };
    ticket.messages=Array.isArray(ticket.messages)?ticket.messages:[];
    ticket.messages.push(message);
    ticket.updatedAt=now;
    ticket.lastMessage=message.text||(message.imageUrl?"Đã gửi một hình ảnh":"");
    ticket.status="pending";
    supportUpsertLocalTicket(ticket);

    var database=supportGetClient();
    if(!database){return Promise.resolve(ticket);}
    return supportWriteMessageRemote(ticket,message).then(function(){return ticket;});
}

function supportNormalizeRemoteTicket(row,messages){
    return {
        id:String(row.id),
        userId:String(row.user_id||""),
        email:String(row.user_email||""),
        name:String(row.user_name||row.user_email||"Người dùng"),
        role:String(row.user_role||"user"),
        subject:String(row.subject||"Hỗ trợ tài khoản"),
        category:String(row.category||"general"),
        priority:String(row.priority||"normal"),
        status:String(row.status||"pending"),
        createdAt:Number(row.created_at_client||Date.parse(row.created_at)||0),
        updatedAt:Number(row.updated_at_client||Date.parse(row.updated_at)||0),
        messages:(messages||[]).map(function(message){
            var decoded=supportMediaDecode(message.message||"");
            return {
                id:String(message.id),
                sender:String(message.sender||"user"),
                senderId:String(message.sender_id||""),
                senderEmail:String(message.sender_email||""),
                senderName:String(message.sender_name||""),
                senderRole:String(message.sender_role||""),
                text:decoded.text,
                imageUrl:decoded.imageUrl,
                imageName:decoded.imageName,
                status:String(message.status||"sent"),
                isInternal:Boolean(message.is_internal),
                remoteStored:true,
                createdAt:Number(message.created_at_client||Date.parse(message.created_at)||0)
            };
        })
    };
}

function supportLoadTickets(){
    var database=supportGetClient();
    var localTicket=supportEnsureTicket();
    if(!database){return Promise.resolve(supportGetLocalTickets());}
    if(!supportRemoteTablesAvailable){
        return supportLoadFeedbackFallback(localTicket).then(function(){return supportGetLocalTickets();});
    }

    return database.from("support_tickets").select("*").order("updated_at_client",{ascending:false}).limit(100).then(function(ticketResult){
        if(ticketResult.error){
            if(supportIsMissingTableError(ticketResult.error)){
                supportDisableRemoteTables(ticketResult.error);
                return {tickets:null,messageResult:null};
            }
            throw ticketResult.error;
        }
        return database.from("support_messages").select("*").order("created_at_client",{ascending:true}).limit(1000).then(function(messageResult){
            if(messageResult.error&&supportIsMissingTableError(messageResult.error)){
                supportDisableRemoteTables(messageResult.error);
                return {tickets:null,messageResult:null};
            }
            return {tickets:ticketResult.data||[],messageResult:messageResult};
        });
    }).then(function(results){
        if(!results.tickets){
            return supportLoadFeedbackFallback(localTicket).then(function(){return supportGetLocalTickets();});
        }
        var messageResult=results.messageResult||{};
        var messagesByTicket={};
        if(!messageResult.error){
            (messageResult.data||[]).forEach(function(message){
                var key=String(message.ticket_id||"");
                if(!messagesByTicket[key]){messagesByTicket[key]=[];}
                messagesByTicket[key].push(message);
            });
        }
        var tickets=results.tickets.map(function(row){
            var remoteMessages=messagesByTicket[String(row.id)]||[];
            var localTicket=supportFindLocalTicket(row.id);
            var ticket=supportNormalizeRemoteTicket(row,remoteMessages);
            if(!remoteMessages.length&&localTicket&&Array.isArray(localTicket.messages)){
                ticket.messages=localTicket.messages;
            }
            supportUpsertLocalTicket(ticket);
            return ticket;
        });
        return tickets;
    }).catch(function(error){
        if(!supportIsMissingTableError(error)){console.error("[VieGeo Support] Không thể tải ticket từ Supabase:",error);}
        return supportGetLocalTickets();
    });
}

function supportUpdateTicket(ticket){
    ticket.updatedAt=Date.now();
    supportUpsertLocalTicket(ticket);
    return supportWriteRemote(ticket);
}
