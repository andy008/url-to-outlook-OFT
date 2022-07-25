import * as msg from '@independentsoft/msg';
import * as fs from 'fs';
import fetch from 'node-fetch';

// get html file from URL
const root = 'http://playground.infomaxim.com/nib/'
const url = 'http://playground.infomaxim.com/nib/email1.html';

const htmlEntities = {
    nbsp: ' ',
    cent: '¢',
    pound: '£',
    yen: '¥',
    euro: '€',
    copy: '©',
    reg: '®',
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: '\''
};

const response = await fetch(url);
let htmlBody = await response.text();
let newMessage = new msg.Message();

// get image URLS from html; save to attachments; add CID attributes

const imageUrls = htmlBody.match(/src="(.*?)"/g);
if (imageUrls) {
    for (let i = 0; i < imageUrls.length; i++) {

        const imageSRC = imageUrls[i].replace('"','');
        const imageName = imageSRC.split('/').pop();
        htmlBody = htmlBody.replace(imageUrls[i], ' cid="'+(i+1)+'"');
        
        // get file name        
        console.log('Found image:' + imageName + ' Now:' + imageUrls[i]);

        const imageBuffer = await fetch(root + imageName).then(response => response.arrayBuffer());
        let attachment = new msg.Attachment(imageBuffer);
        attachment.fileName = imageName;
        attachment.displayName = imageName;
        attachment.contentId = i+1;
        attachment.contentLocation = i+1;

        newMessage.attachments.push(attachment);
    }
}

const htmlBodyWithRtf = "{\\rtf1\\ansi\\ansicpg1252\\fromhtml1 \\htmlrtf0 " + unescapeHTML(htmlBody)  + "}";
const rtfBody = new TextEncoder().encode(htmlBodyWithRtf);

newMessage.subject = "NIB Template";
newMessage.body = "This is an HTML email";
newMessage.bodyTtmlText = htmlBodyWithRtf
newMessage.bodyRtf = rtfBody
newMessage.messageFlags.push(msg.MessageFlag.UNSENT);
newMessage.storeSupportMasks.push(msg.StoreSupportMask.CREATE);

console.log(htmlBodyWithRtf);

fs.writeFileSync("C:\\Users\\andy\\AppData\\Roaming\\Microsoft\\Templates\\Baptcare5.oft", newMessage.toBytes());


function unescapeHTML(str) {
    return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
        var match;

        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
};
