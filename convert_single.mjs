import * as msg from '@independentsoft/msg';
import * as fs from 'fs';
import axios from 'axios';
// import mssql
import * as sql from 'mssql';
//import data from './campaigns.js';

// DOCS
// https://www.skypack.dev/view/@independentsoft/msg
// https://npm.io/package/@independentsoft/msg

// open SQL server nodeJS
// https://www.npmjs.com/package/mssql

/*
const sqlDb =  {
    database: 'infomaxim',
    server: 'NETAMBITION01',
    user: 'sa',
    password: '8Bp9i39WR',     
    driver: 'msnodesqlv8',
    options: {
      trustedConnection: false
    }
}

async () => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await sql.connect(sqlDb)
        const result = await sql.query`select * from campaigns`
        console.dir(result)
    } catch (err) {
        // ... error checks
    }
}


/*

const poolPromise = new ConnectionPool(sqlDb)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL:' + config.sqlDb.database)
    return pool
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err))



// get records
let SQL = "SELECT * FROM [dbo].[Campaigns]";
let result = await getRows(SQL);
*/

// get html file from URL
//let ii=1
/*
for (var campaign of data.campaigns) {
    //ii++;
    merge(campaign);
    //if(ii==2) break;
}
*/

let campaign = {
    title: 'BB-Sep19',
    hero_image: 3,
    logo: '',
    discount: 10,
    join_url: ''
}

let file = await merge(campaign);
console.log('Complete:' + file);


async function merge(campaign){

    // merge
    // [logo] [join_now] [discount] [hero]

    console.log('Campaign:' + campaign.title);

    const imagesRoot = 'https://playground.infomaxim.com/nib/'
    const url = 'https://playground.infomaxim.com/nib/beyondbank.html';

    const response = await axios.get(url);
    let htmlBody = response.data;
    let newMessage = new msg.Message();

    // set hero
    let heroImage = ''; 
    switch (campaign.hero_image) {
        case 3:
            heroImage = (imagesRoot + "hero/3_canoe.jpg"); 
            break;
        case 4:
            heroImage = (imagesRoot + "hero/4_kitchen.jpg"); 
            break;
        case 6:
            heroImage = (imagesRoot + "hero/6_handshake.jpg"); 
            break;
        case 10:
            heroImage = (imagesRoot + "hero/10_couple.jpg"); 
            break;
        case 11:
            heroImage = (imagesRoot + "hero/11_blue_lady.jpg"); 
            break;
        case 12:
            heroImage = (imagesRoot + "hero/12_hardhatlady.jpg");      
            break;
    }

    let logo = '';
    if(campaign.logo.length==0){campaign.logo = 'blank.png'}
    logo = (imagesRoot + 'logo/' + campaign.logo)
    let joinNow = (campaign.join_url)

    htmlBody = htmlBody.replace('[discount]', (campaign.discount * 100).toString());

    htmlBody = htmlBody.replace('[join]', joinNow);
    htmlBody = htmlBody.replace('[join]', joinNow);
    htmlBody = htmlBody.replace('[join]', joinNow);
    htmlBody = htmlBody.replace('[join]', joinNow);
    htmlBody = htmlBody.replace('[join]', joinNow);
    htmlBody = htmlBody.replace('[join]', joinNow);
    htmlBody = htmlBody.replace('[join]', joinNow);
    
    htmlBody = htmlBody.replace('[logo]', logo);
    htmlBody = htmlBody.replace('[hero]', heroImage);


    console.log('Hero:' + heroImage);
    console.log('Logo:' + logo);
    console.log('Discount:' + (campaign.discount * 100).toString());
    console.log('Join Now:' + joinNow);
    // get image URLS from html; save to attachments; add CID attributes


    const imageUrls = htmlBody.match(/src="(.*?)"/g);
    if (imageUrls) {
        for (let i = 0; i < imageUrls.length; i++) {

            const imageSRC = imageUrls[i].replace('"','').replace('"','');
            const imageName = imageSRC.split('/').pop();

            //  insert CID attribute

            htmlBody = htmlBody.replace(imageUrls[i], ' src="cid:img'+ i.toString() +'"');
            
            let suffix = imageName.split('.').pop();
           

            let filepath = '';
            if(imageSRC.indexOf('http')!==-1){
                filepath = imageSRC.replace('src=','');
            }else{
                filepath = imagesRoot + imageSRC.replace('src=','');
            }
            console.log('Filepath:' + filepath)

        
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
            if (suffix='jpeg'){
                attachment.contentType = 'image/jpeg';
            }            
            if (suffix='gif'){
                attachment.contentType = 'image/gif';
            }  
            newMessage.attachments.push(attachment);    
            //console.log('Added attachment: ' + attachment.fileName);  
              
        }
    }

    //console.log('Attached ' + newMessage.attachments.length + ' images');


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

    fs.writeFileSync("C:\\Users\\andy\\Downloads\\" + campaign.title + ".msg", newMessage.toBytes());

    return "File: " + campaign.title + ".msg";
    
}

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

async function getRows(SQL){
    console.log('SQL:'+SQL)
    try {
        const pool = await poolPromise;
        return await pool.request().query(SQL);     
    } catch (error) {
        //logger.error(`🔥 Error ${error.message}`,error);
        console.log('ERROR from getRows:' + error.message);
        return null;
    }      
}