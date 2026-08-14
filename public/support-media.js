(function(){
    "use strict";

    var MARKER="__viegeo_support_media_v1";
    var MAX_SOURCE_BYTES=5*1024*1024;
    var MAX_DATA_LENGTH=1800000;

    function cleanText(value,maxLength){
        return String(value||"").replace(/[\u0000-\u001f\u007f]/g," ").trim().slice(0,maxLength||3000);
    }

    function safeImageUrl(value){
        var url=String(value||"").trim();
        if(/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(url)){return url;}
        if(/^https:\/\//i.test(url)){return url;}
        return "";
    }

    function encode(text,imageUrl,imageName){
        var message=cleanText(text,3000);
        var image=safeImageUrl(imageUrl);
        if(!image){return message;}
        return JSON.stringify({
            marker:MARKER,
            text:message,
            imageUrl:image,
            imageName:cleanText(imageName,120)
        });
    }

    function decode(value){
        var raw=String(value||"");
        if(!raw.trim().startsWith("{")){return {text:raw,imageUrl:"",imageName:""};}
        try{
            var data=JSON.parse(raw);
            if(data&&data.marker===MARKER){
                return {
                    text:cleanText(data.text,3000),
                    imageUrl:safeImageUrl(data.imageUrl),
                    imageName:cleanText(data.imageName,120)
                };
            }
        }catch(error){}
        return {text:raw,imageUrl:"",imageName:""};
    }

    function readFile(file){
        return new Promise(function(resolve,reject){
            var reader=new FileReader();
            reader.onload=function(){resolve(String(reader.result||""));};
            reader.onerror=function(){reject(reader.error||new Error("Không thể đọc ảnh."));};
            reader.readAsDataURL(file);
        });
    }

    function loadImage(dataUrl){
        return new Promise(function(resolve,reject){
            var image=new Image();
            image.onload=function(){resolve(image);};
            image.onerror=function(){reject(new Error("Không thể xử lý ảnh đã chọn."));};
            image.src=dataUrl;
        });
    }

    async function prepareImage(file){
        if(!file){return null;}
        if(!/^image\/(png|jpe?g|webp)$/i.test(String(file.type||""))){
            throw new Error("Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.");
        }
        if(Number(file.size||0)>MAX_SOURCE_BYTES){
            throw new Error("Ảnh không được vượt quá 5MB.");
        }
        var source=await readFile(file);
        var image=await loadImage(source);
        var scale=Math.min(1,1400/Math.max(image.naturalWidth||1,image.naturalHeight||1));
        var canvas=document.createElement("canvas");
        canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
        canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
        var context=canvas.getContext("2d",{alpha:false});
        context.fillStyle="#ffffff";
        context.fillRect(0,0,canvas.width,canvas.height);
        context.drawImage(image,0,0,canvas.width,canvas.height);
        var output=canvas.toDataURL("image/webp",.82);
        if(output.length>MAX_DATA_LENGTH){output=canvas.toDataURL("image/webp",.62);}
        if(output.length>MAX_DATA_LENGTH){throw new Error("Ảnh vẫn quá lớn sau khi nén. Hãy chọn ảnh nhỏ hơn.");}
        return {url:output,name:cleanText(file.name||"anh-dinh-kem.webp",120)};
    }

    window.VieGeoSupportMedia={encode:encode,decode:decode,prepareImage:prepareImage,safeImageUrl:safeImageUrl};
}());
