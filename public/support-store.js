var supportStorageKey="VieGeo_support_tickets";

function supportGetSession(){
    var raw=localStorage.getItem("lm_session");
    if(!raw){
        return {};
    }
    try{
        return JSON.parse(raw);
    }catch(error){
        return {};
    }
}

function supportGetLocalTickets(){
    var raw=localStorage.getItem(supportStorageKey);
    if(!raw){
        return [];
    }
    try{
        return JSON.parse(raw);
    }catch(error){
        return [];
    }
}

function supportSaveLocalTickets(tickets){
    localStorage.setItem(supportStorageKey,JSON.stringify(tickets));
}

function supportGetDatabase(){
    if(window.db){
        return window.db;
    }
    if(window.VieGeoSupabase&&window.VieGeoSupabase.db){
        return window.VieGeoSupabase.db;
    }
    return null;
}

function supportCreateId(email){
    return String(email||"guest").replace(/[^a-zA-Z0-9_-]/g,"_");
}

function supportFindLocalTicket(ticketId){
    var tickets=supportGetLocalTickets();
    var index;
    for(index=0;index<tickets.length;index+=1){
        if(tickets[index].id===ticketId){
            return tickets[index];
        }
    }
    return null;
}

function supportUpsertLocalTicket(ticket){
    var tickets=supportGetLocalTickets();
    var index;
    var found=false;

    for(index=0;index<tickets.length;index+=1){
        if(tickets[index].id===ticket.id){
            tickets[index]=ticket;
            found=true;
        }
    }

    if(!found){
        tickets.unshift(ticket);
    }

    supportSaveLocalTickets(tickets);
}

function supportEnsureTicket(){
    var session=supportGetSession();
    var email=session.email||"guest@viegeo.local";
    var name=session.name||session.displayName||"Người dùng";
    var ticketId=supportCreateId(email);
    var ticket=supportFindLocalTicket(ticketId);

    if(!ticket){
        ticket={
            id:ticketId,
            email:email,
            name:name,
            role:session.activeRole||session.role||"user",
            status:"open",
            updatedAt:Date.now(),
            messages:[]
        };
        supportUpsertLocalTicket(ticket);
    }

    return ticket;
}

function supportWriteRemote(ticket){
    var database=supportGetDatabase();

    if(!database){
        return Promise.resolve(false);
    }

    return database.collection("support_tickets").doc(ticket.id).set(ticket,{merge:true}).then(function(){
        return true;
    }).catch(function(){
        return false;
    });
}

function supportAppendMessage(ticketId,sender,text){
    var ticket=supportFindLocalTicket(ticketId);
    var message;

    if(!ticket){
        ticket=supportEnsureTicket();
    }

    message={
        id:"msg_"+Date.now()+"_"+Math.floor(Math.random()*1000),
        sender:sender,
        text:text,
        createdAt:Date.now()
    };

    ticket.messages.push(message);
    ticket.updatedAt=Date.now();
    ticket.status="open";
    supportUpsertLocalTicket(ticket);

    return supportWriteRemote(ticket).then(function(){
        return ticket;
    });
}

function supportLoadTickets(){
    var database=supportGetDatabase();

    if(!database){
        return Promise.resolve(supportGetLocalTickets());
    }

    return database.collection("support_tickets").limit(100).get().then(function(snapshot){
        var tickets=[];
        snapshot.forEach(function(doc){
            var data=doc.data()||{};
            data.id=data.id||doc.id;
            tickets.push(data);
            supportUpsertLocalTicket(data);
        });
        if(!tickets.length){
            tickets=supportGetLocalTickets();
        }
        return tickets;
    }).catch(function(){
        return supportGetLocalTickets();
    });
}

function supportUpdateTicket(ticket){
    supportUpsertLocalTicket(ticket);
    return supportWriteRemote(ticket);
}
