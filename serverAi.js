var express = require("express");
var fileUploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;


var app = express();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyCqizuScr0vcgSLB4sbg2XGz2H9lWhPNWc");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


//for style and script files
app.use(express.static("public"));
app.use(express.urlencoded(true)); //convert POST data to JSON object



app.use(fileUploader());//to recv. and upload pic on server from client

cloudinary.config({
     cloud_name:'dd4gjrvez',
    api_key:'688973355443826',
    api_secret:'Buyjf6_c5x3d2EtOhN8udhHoF_c' // Click 'View API Keys' above to copy your API secret
});


app.get("/ai", function (req, resp) {

    // resp.sendFile();
    let dirName = __dirname;//Global Variable for path of current directory
    //let filename=__filename;
    //resp.send(dirName+"  <br>     "+filename);
    let fullpath = dirName + "/public/frontAi.html";
    resp.sendFile(fullpath);
})

app.post("/abc", async function (req, resp) {
    console.log(req.body);
    let txt = req.body.txtttt;

    let prompt=txt + " Give response in JSON object with key message"

    const result = await model.generateContent(prompt);

    resp.send(result.response.text());

})

//--------------------------------------------------------

async function RajeshBansalKaChirag(imgurl)
{
const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."   
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())
            
            const cleaned = result.response.text().replace(/```json|```/g, '').trim();
            const jsonData = JSON.parse(cleaned);
            console.log(jsonData);

    return jsonData

}

app.post("/picreader", async function (req, resp) {
    let fileName;
    if (req.files != null) 
        {
       //const myprompt = "Read the text on picture and tell all the information";
        //  const myprompt = "Read the text on picture in JSON format";
        fileName = req.files.imggg.name;
        let locationToSave = __dirname + "/public/uploads/" + fileName;//full ile path
        
        req.files.imggg.mv(locationToSave);//saving file in uploads folder
        
        //saving ur file/pic on cloudinary server
        try{
        await cloudinary.uploader.upload(locationToSave).then(async function (picUrlResult) {
                
            let jsonData=await RajeshBansalKaChirag( picUrlResult.url);
            
            resp.send(jsonData);

        });

        //var respp=await run("https://res.cloudinary.com/dfyxjh3ff/image/upload/v1747073555/ed7qdfnr6hez2dxoqxzf.jpg", myprompt);
        // resp.send(respp);
        // console.log(typeof(respp));
        }
        catch(err)
        {
            resp.send(err.message)
        }

    }
})

app.listen(2006, function () {
    console.log("Server Started");
})
