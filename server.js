var express = require("express");
var fileuploader = require("express-fileupload");
var cloudinary = require("cloudinary").v2;
var mysql2 = require("mysql2");

var app = express();
app.use(fileuploader());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.listen(2006, function () {
    console.log("server started");
});

app.get("/", function (req, resp) {
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
});

cloudinary.config({
    cloud_name: 'dd4gjrvez',
    api_key: '688973355443826',
    api_secret: 'Buyjf6_c5x3d2EtOhN8udhHoF_c'
});

let dbConfig = "mysql://avnadmin:AVNS_rEx_2XybdeMwIs5ab2l@mysql-dda3b98-guptariddhima291-0561.c.aivencloud.com:14560/defaultdb";

let mySqlVen = mysql2.createPool(dbConfig);
console.log("Aiven connected sucessfully");
/*mySqlVen.connect(function(errKuch)
{
    if (errKuch==null)
         console.log("Aiven connected sucessfully");

    else
        console.log(errKuch.message)
})*/

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyCqizuScr0vcgSLB4sbg2XGz2H9lWhPNWc");
const model = genAI.getGenerativeModel({model:"gemini-2.0-flash"});

app.get("/ai", function (req, resp) {

    let dirName = __dirname;
    let fullpath = dirName + "/public/player-profile.html";
    resp.sendFile(fullpath);
});

app.post("/abc", async function (req, resp) {
    console.log(req.body);
    let txt = req.body.txtttt;

    let prompt=txt + " Give response in JSON object with key message"

    const result = await model.generateContent(prompt);

    resp.send(result.response.text());

});

async function extractAadharDetails(ImgUrl)
{
const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."   
    const imageResp = await fetch(ImgUrl)
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

    return jsonData;

};

app.post("/picreader", async function (req, resp) {
    let fileName;
    if (req.files != null) 
        {
        fileName = req.files.inputPic1.name;
        let locationToSave = __dirname + "/public/uploads/" + fileName;//full ile path
        
        req.files.inputPic1.mv(locationToSave);
        try{
        await cloudinary.uploader.upload(locationToSave).then(async function (picUrlResult) {
                
            let jsonData=await extractAadharDetails( picUrlResult.url);
            
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
});


app.post("/server-signup", function (req, resp) {
    let emailid = req.body.txtEmail;
    let pwd = req.body.txtPwd;
    let usertype = req.body.comboUser;

    mySqlVen.query(
        "INSERT INTO project1 (emailid,pwd,status,usertype,dol) VALUES (?,?,1,?,CURRENT_DATE())",
        [emailid, pwd, usertype],
        function (errKuch) {
            if (errKuch == null)
                resp.send("record saved successfully");
            else
                resp.send("Error:" + errKuch.message);
        }
    );
});

app.get("/get-one", function (req, resp) {
    let email = req.query.txtEmail;
    let pwd = req.query.txtPwd;
    let usertype = req.query.comboUser;

    mySqlVen.query(
        "SELECT * FROM project1 WHERE emailid = ? AND pwd = ? AND usertype = ?",
        [email, pwd, usertype],
        function (err, allRecords) {
            if (allRecords.length == 0) {
                resp.send("no record found");
            } else {
                resp.json(allRecords);
            }
        }
    );
});

app.post("/server-login", function (req, resp) {
    let emailid = req.body.txtEmail;
    let pwd = req.body.txtPwd;

    mySqlVen.query(
        "SELECT * FROM project1 WHERE emailid=? AND pwd=?",
        [emailid, pwd],
        function (err, allRecords) {

            if (allRecords.length == 0) 
                {
                resp.send("Invalid");
                }
            else if(allRecords[0].status==1)
            {
                resp.send(allRecords[0].usertype);
            }
            else 
                resp.send("Blocked");
                
            }

            
        
    )
});

app.post("/contact", function (req, resp) {
//console.log(req.body);
  let name=req.body.name;
  let email=req.body.email;
  let message=req.body.message;

  mySqlVen.query(
     "INSERT INTO message (name, email, message,created_at) VALUES (?, ?, ?,CURRENT_DATE())",
     [name, email, message],
     function(errKuch){
        if (errKuch)
          return  resp.json({success: false, error:errKuch.message});
        else 
            resp.json({success: true});
     }
    )
   
});

app.post("/org-details", async function (req, resp) {
    let picurl = "";
    if (req.files != null) {
        let fname = req.files.inputPic.name;
        let fullPath = __dirname + "/public/uploads/" + fname;
        req.files.inputPic.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;

            console.log(picurl);
        });
    }

    let emailid = req.body.inputEmail4;
    let pwd = req.body.inputPassword4;
    let orgname = req.body.inputOrgName;
    let reg_number = req.body.inputRegNum;
    let address = req.body.inputAddress;
    let city = req.body.inputCity;
    let state = req.body.inputState;
    let pincode = req.body.inputPin;
    let sports = req.body.inputSports;
    let website = req.body.inputWebsite;
    let insta = req.body.inputInst;
    let head = req.body.inputHead;
    let contact = req.body.inputContact;
    let otherinfo = req.body.inputInfo;

    mySqlVen.query(
        "INSERT INTO organisers_1(emailid,pwd,orgname,reg_number,address,city,state,pincode,sports,website,insta,head,contact,otherinfo,picurl) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [emailid, pwd, orgname, reg_number, address, city, state, pincode, sports, website, insta, head, contact, otherinfo, picurl],
        function (errKuch) {
            if (errKuch == null)
                resp.send("Record saved successfully");
            else
                resp.send("Error:" + errKuch.message);
        }
    )
});

app.post("/update-user", async function (req, resp) {
    let picurl = "";
    if (req.files != null) {
        let fname = req.files.inputPic.name;
        let fullPath = __dirname + "/public/uploads/" + fname;
        req.files.inputPic.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;

            console.log(picurl);
        });
    }
    else
        picurl = req.body.hdn;

    let emailid = req.body.inputEmail4;
    let pwd = req.body.inputPassword4;
    let orgname = req.body.inputOrgName;
    let reg_number = req.body.inputRegNum;
    let address = req.body.inputAddress;
    let city = req.body.inputCity;
    let state = req.body.inputState;
    let pincode = req.body.inputPin;
    let sports = req.body.inputSports;
    let website = req.body.inputWebsite;
    let insta = req.body.inputInst;
    let head = req.body.inputHead;
    let contact = req.body.inputContact;
    let otherinfo = req.body.inputInfo;

    mySqlVen.query(
        "UPDATE organisers_1 set pwd=?,orgname=?,reg_number=?,address=?,city=?,state=?,pincode=?,sports=?,website=?,insta=?,head=?,contact=?,otherinfo=?,picurl=? WHERE emailid=?",
        [pwd, orgname, reg_number, address, city, state, pincode, sports, website, insta, head, contact, otherinfo, picurl, emailid],
        function (errKuch, result) {
            if (errKuch == null) {
                if (result.affectedRows == 1)
                    resp.send("Record updated successfully");
                else
                    resp.send("Invalid email id");
            }
            else
                resp.send(errKuch.message)
        }
    )
})

app.post("/post-tour", function (req, resp) {
    let emailid = req.body.inputEmail5;
    let event_title = req.body.inputEvent;
    let doe = req.body.inputDate;
    let toe = req.body.inputTime;
    let address = req.body.inputAddress;
    let city = req.body.inputCity;
    let sports = req.body.inputSports;
    let minage = req.body.inputMin;
    let maxage = req.body.inputMax;
    let lastdate = req.body.inputReg;
    let fee = req.body.inputFee;
    let prize = req.body.inputMoney;
    let contact = req.body.inputContact;

    mySqlVen.query(
        "INSERT INTO tournaments(emailid,event_title,doe,toe,address,city,sports,minage,maxage,lastdate,fee,prize,contact) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [emailid, event_title, doe, toe, address, city, sports, minage, maxage, lastdate, fee, prize, contact],
        function (errKuch) {
            if (errKuch == null)
                resp.send("record saved successfully");
            else
                resp.send("Error:" + errKuch.message);
        }
    )

});

app.get("/do-fetch-tournaments-by-email", function (req, resp) {
    let emailid = req.query.emailid;

    mySqlVen.query("SELECT * FROM tournaments WHERE emailid=?", [req.query.emailid], function (err, allRecords) {
        if (err) {
            console.log(err);
            resp.send("error");
        }
        else {
            resp.send(allRecords);
        }
    })
});

app.get("/delete-tournament", function (req, resp) {
    let rid = req.query.rid;

    mySqlVen.query("DELETE FROM tournaments WHERE rid=?", [req.query.rid], function (err, allRecords) {
        if (err) {
            console.log(err);
            resp.send("error");
        }
        else {
            resp.send(allRecords);
        }
    })
});

app.post("/player-profile", async function (req, resp) 
{
    let acardpicurl = "";
    let profilepicurl = "";
    let jsonData={};

    let nameuser="";
    let dob="";
    let gender="";

    if (req.files && req.files.inputPic1) {
        // Adhaar card
        let acardPath = __dirname + "/public/uploads/" + req.files.inputPic1.name;
        await req.files.inputPic1.mv(acardPath);
        //await cloudinary.uploader.upload(acardPath).then(function (result) {
        //    acardpicurl = result.url;
       
        const acardUpload = await cloudinary.uploader.upload(acardPath);
        acardpicurl=acardUpload.url;

            jsonData = await extractAadharDetails(acardpicurl);
            console.log("AI Aadhar data:",jsonData);
    }
    if (req.files && req.files.inputPic2) {
        // Profile picture
        let profilePath = __dirname + "/public/uploads/" + req.files.inputPic2.name;
        await req.files.inputPic2.mv(profilePath);
        await cloudinary.uploader.upload(profilePath).then(function (result) {
            profilepicurl = result.url;
        }
        
    );
    }

     if (jsonData) {
      if (jsonData.name) nameuser = jsonData.name;
     if (jsonData.dob) dob = jsonData.dob;
      if (jsonData.gender) gender = jsonData.gender;
     }


    let emailid = req.body.inputEmail5;
    if (req.body.inputName) nameuser = req.body.inputName;
    if (req.body.inputDOB) dob = req.body.inputDOB;
    if (req.body.inputGender) gender = req.body.inputGender;
    let contact = req.body.inputContact1;
    let address = req.body.inputAddress1;
    let game = req.body.inputGame;
    let otherinfo = req.body.inputInfo1;

    if (dob && dob.includes("/")) {
    let [d, m, y] = dob.split("/");
    dob = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;}

    mySqlVen.query(
        "INSERT INTO player(emailid,nameuser,dob,gender,contact,address,game,otherinfo,acardpicurl,profilepicurl) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [emailid, nameuser, dob, gender, contact, address, game, otherinfo, acardpicurl, profilepicurl],
        function (errKuch) {
            if (errKuch == null)
                resp.send("Record saved successfully");
            else
                resp.send("Error:" + errKuch.message);
        }
    );
});

app.post("/modify-user", async function (req, resp) {

    let acardpicurl = "";
    let profilepicurl = "";

    if (req.files != null) {
        // Adhaar card
        let acardPath = __dirname + "/public/uploads/" + req.files.inputPic1.name;
        await req.files.inputPic1.mv(acardPath);
        await cloudinary.uploader.upload(acardPath).then(function (result) {
            acardpicurl = result.url;
        });

        // Profile picture
        let profilePath = __dirname + "/public/uploads/" + req.files.inputPic2.name;
        await req.files.inputPic2.mv(profilePath);
        await cloudinary.uploader.upload(profilePath).then(function (result) {
            profilepicurl = result.url;
        });
    }
    else {
        acardpicurl = req.body.hdn;
        profilepicurl = req.body.hdn;
    }


    let emailid = req.body.inputEmail5;
    let nameuser = req.body.inputName;
    let dob = req.body.inputDOB;
    let gender = req.body.inputGender;
    let contact = req.body.inputContact1;
    let address = req.body.inputAddress1;
    let game = req.body.inputGame;
    let otherinfo = req.body.inputInfo1;

    mySqlVen.query(
        "UPDATE player set nameuser=?,dob=?,gender=?,contact=?,address=?,game=?,otherinfo=?,acardpicurl=?,profilepicurl=? WHERE emailid=? ",
        [nameuser, dob, gender, contact, address, game, otherinfo, acardpicurl, profilepicurl, emailid],
        function (errKuch, result) {
            if (errKuch == null) {
                if (result.affectedRows == 1)
                    resp.send("Record updated successfully");
                else
                    resp.send("Invalid email id");
            }
            else
                resp.send(errKuch.message)
        }
    );
});

app.post("/get-one", function (req, resp) {
    let email = req.body.inputEmail5;
    mySqlVen.query("SELECT * FROM player WHERE emailid=?", [email], function (err, allRecords) {
        if (err) {
            console.log(err);
            resp.send("Error in query");
        } else if (allRecords.length == 0) {
            resp.send("No Record Found");
        } else {
            resp.json(allRecords);
        }
    });
});

app.get("/fetch-all", function (req, resp) {

  let city = req.query.city;
  let sports = req.query.sports;

  let query = "SELECT * FROM tournaments WHERE 1=1";
  let params = [];

  if (city) {
    query += " AND city = ?";
    params.push(city);
  }

  if (sports) {
    query += " AND sports = ?";
    params.push(sports);
  }

  mySqlVen.query(query, params, function (err, records) {
    if (err) {
      console.log(err);
      resp.status(500).send("DB Error");
    } else {
      resp.json(records);
    }
  });
});



app.get("/do-fetch-users", function (req, resp) {
    //let emailid = req.query.emailid;

    mySqlVen.query("SELECT * FROM project1", [req.query.emailid,req.query.usertype,req.query.status], function (err, allRecords) {
        if (err) {
            console.log(err);
            resp.send("error");
        }
        else {
            resp.send(allRecords);
        }
    })
});

app.get("/Unblock-user", function (req, resp) {
    let emailid = req.query.emailid;
    let newStatus = req.query.status == 1 ? 0 : 1; // toggle status

    mySqlVen.query(
        "UPDATE project1 SET status=? WHERE emailid=?",
        [newStatus, emailid],
        function (err, result) {
            if (err) {
                console.log(err);
                resp.send("error");
            } else if (result.affectedRows == 1) {
                let msg = newStatus == 1 ? "Unblocked" : "Blocked";
                resp.send("User " + msg + " successfully");
            } else {
                resp.send("No such user found");
            }
        }
    );
});

app.get("/do-fetch-organisers", function (req, resp) {
    //let emailid = req.query.emailid;

    mySqlVen.query("SELECT * FROM organisers_1", [req.query.emailid,req.query.orgname,req.query.reg_number,req.query.contact,req.query.sports], function (err, allRecords) {
        if (err) {
            console.log(err);
            resp.send("error");
        }
        else {
            resp.send(allRecords);
        }
    })
});

app.get("/do-fetch-players", function (req, resp) {
    //let emailid = req.query.emailid;

    mySqlVen.query("SELECT * FROM organisers_1", [req.query.emailid,req.query.nameuser,req.query.dob,req.query.gender,req.query.contact,req.query.address,req.query.game], function (err, allRecords) {
        if (err) {
            console.log(err);
            resp.send("error");
        }
        else {
            resp.send(allRecords);
        }
    })
});

app.post("/update-pwd", function(req, resp) {
    let emailid = req.body.signupEmail;
    let oldPwd = req.body.signupPwd;
    let newPwd = req.body.newPwd;

    const sql = "UPDATE project1 SET pwd=? WHERE emailid=? AND pwd=?";
    mySqlVen.query(sql, [newPwd, emailid, oldPwd], function(err, result) {
        if (err) return resp.send(err.message);
        if (result.affectedRows === 0) {
            return resp.send("Invalid email or old password");
        }
        resp.send("Password updated successfully");
    });
});

