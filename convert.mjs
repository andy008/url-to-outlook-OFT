import * as msg from '@independentsoft/msg';
import * as fs from 'fs';
import axios from 'axios';

// DOCS
// https://www.skypack.dev/view/@independentsoft/msg
// https://npm.io/package/@independentsoft/msg

// get html file from URL
const imagesRoot = 'http://playground.infomaxim.com/nib/images/'
const url = 'https://playground.infomaxim.com/nib/idx.html';

const response = await axios.get(url);
let htmlBody = response.data;
let newMessage = new msg.Message();

// get image URLS from html; save to attachments; add CID attributes

const imageUrls = htmlBody.match(/src="(.*?)"/g);
if (imageUrls) {
    for (let i = 0; i < imageUrls.length; i++) {

        const imageSRC = imageUrls[i].replace('"','').replace('"','');
        const imageName = imageSRC.split('/').pop();

        //  insert CID attribute

        htmlBody = htmlBody.replace(imageUrls[i], ' src="cid:img'+ i.toString() +'"');
        
        let suffix = imageName.split('.').pop();
        let filepath = imagesRoot + imageName;

        let buffer  
        try {
            console.log('Get image:' + filepath);
            const arrayBuffer = await axios.get(filepath,  { responseType: 'arraybuffer' })
            buffer = Buffer.from(arrayBuffer.data,'binary');
        } catch (error) {
            console.log('Error:', error);
        }

        let attachment = new msg.Attachment(buffer);
        attachment.fileName = 'img' + i.toString();
        attachment.longFileName = 'img' + i.toString();
        attachment.displayName = imageName;

        //  add contentId
        attachment.contentId = 'img' + i.toString();
        if(suffix='png'){
            attachment.contentType = 'image/png';
        }
        if (suffix='jpg'){
            attachment.contentType = 'image/jpeg';
        }
        if (suffix='gif'){
            attachment.contentType = 'image/gif';
        }  
        newMessage.attachments.push(attachment);    
        console.log('Added attachment: ' + attachment.fileName);    
    }
}

console.log('Attached ' + newMessage.attachments.length + ' images');


const htmlBodyWithRtf = "{\\rtf1\\ansi\\ansicpg1252\\fromhtml1 \\htmlrtf0 " + getRtfUnicodeEscapedString(htmlBody)  + "}";
const rtfBody = new TextEncoder().encode(htmlBodyWithRtf);

newMessage.subject = "NIB Template";
newMessage.body = "This is an HTML email";
newMessage.bodyTtmlText = htmlBody; 
newMessage.bodyRtf = rtfBody

newMessage.storeSupportMasks.push(msg.StoreSupportMask.CREATE);
newMessage.messageFlags.push(msg.MessageFlag.UNSENT);
newMessage.encoding = msg.Encoding.UNICODE
newMessage.internetCodePage = 65001;

fs.writeFileSync("C:\\Users\\andy\\Downloads\\ExportedEmail.msg", newMessage.toBytes());

function getRtfUnicodeEscapedString(input) {
    let output = '';
    for (let i = 0; i < input.length; i++) {
        const c = input[i];
        const code = input.charCodeAt(i);
        if (c === '\\' || c === '{' || c === '}') {
            output = output.concat(c);
        }
        else if (code <= 0x7f) {
            output = output.concat(c);
        }
        else {
            output = output.concat("\\u" + code + "?");
        }
    }
    return output;
}