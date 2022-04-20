// requirements and initialization
require("dotenv").config();
const expresss = require("express");
const app = expresss();
const mongo = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
app.use(cookieParser());
const auth = require("./middlewares/auth");
const nodemailer = require("nodemailer");

// importing database schemas
const user = require("./models/user");
const accounts = require("./models/accountdetails");
const transactions = require("./models/transactions");
const benificiary = require("./models/benificiary");
const { findOne } = require("./models/user");

// database connections
mongo.connect(process.env.DATABASE_URL);
const db = mongo.connection;

// if db is gives error
db.on("error", (error) => {
  console.error(error);
});

//only called once db is connected
db.once("open", () => {
  console.log("connected to database ");
});

app.use(expresss.json());

// ------------------------------------route for login
app.post("/login", async (req, res) => {
  console.log("user is at our login route");
  var cookie = req.cookies.jwtToken;
  const { name, password } = req.body;

  const currentuser = await user.findOne({ name }).lean();

  if (!currentuser) {
    return res.json({ status: "error", error: "invalid username or password" });
  }

  // comparing password
  if (await bcrypt.compare(password, currentuser.password)) {
    const key = process.env.SECRET_TOKEN;
    const token = jwt.sign(
      { id: currentuser._id, name: currentuser.name },
      key
    );

    res.json({ success: "successfully given token", Ourtoken: token });
  } else {
    res.json({ message: "Invalid password" });
  }
});

//-------------------------------route to change our password

app.post("/changepassword", auth, async (req, res) => {
  const name = res.authuser.name;
  const newpassword = req.body.newpassword;
  const oldpassword = req.body.oldpassword;
  const currentuser = await user.findOne({ name }).lean();
  const hashedpassword = await bcrypt.hash(req.body.newpassword, 10);

  if (!currentuser) {
    return res.json({ status: "error", error: "invalid password" });
  }

  // comparing password
  if (await bcrypt.compare(oldpassword, currentuser.password)) {
    try {
      await user.findOneAndUpdate(
        { _id: currentuser._id },
        { password: hashedpassword }
      );

      res.json({
        message:
          "successfully updated password please login again with new password",
      });
    } catch (error) {
      res.json({ message: error.message });
    }
  }
});

// -------------------------------------display current user information
app.get("/displayuser", auth, async (req, res) => {
  try {
    userid = res.authuser._id;
    ouruser = await user.findOne(res.authuser).lean().populate({
      path: "accountdetails",
    });

    const acc = ouruser.accountdetails;

    const reqacc = await accounts
      .findOne(ouruser.accountdetails)
      .lean()
      .populate({
        path: "benificiarydetails",
      })
      .populate({ path: "transactionhistory" });

    if (!ouruser) {
      res.json({ message: "user doesnt exist" });
    }
    res.send({
      userinfo: ouruser,
      beni: reqacc.benificiarydetails,
      transa: reqacc.transactionhistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//--------------------------------- path for benificiary info

const benificiaryrouter = require("./routes/benificiaryroutes");
//const { response } = require("express");
app.use("/benificiaryroutes", benificiaryrouter);

// -----------------------------------------path for registeration

app.post("/register", async (req, res) => {
  // creating new object for user

  const hashedpassword = await bcrypt.hash(req.body.password, 10);

  const member = new user({
    name: req.body.name,
    email: req.body.email,
    password: hashedpassword,
  });

  // creating a new object for user account details
  const memberaccount = new accounts({
    accountholdername: req.body.accountholdername,
    accounttype: req.body.accounttype,
    accountbalance: req.body.accountbalance,
    accountnumber: req.body.accountnumber,
    accountpin: req.body.accountpin,
  });

  // creating a new object for user transactions
  const membertransactions = new transactions({
    transactionid: req.body.transactionid,
    transactionamount: req.body.transactionamount,
  });

  // creating a new object for user benificiarys
  const memberbenificiary = new benificiary({
    benificiaryname: req.body.benificiaryname,
    benificiaryaccountnumber: req.body.benificiaryaccountnumber,
  });

  // creating references
  member.accountdetails = memberaccount;
  memberaccount.benificiarydetails.push(memberbenificiary);
  memberaccount.transactionhistory.push(membertransactions);

  //saving our objects in database
  try {
    const userinfo = await member.save();
    const useraccount = await memberaccount.save();
    const userbenificiary = await memberbenificiary.save();
    const usertransaction = await membertransactions.save();

    //checking if objects successfully saved
    res.status(201).json({
      userinfo: userinfo,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//---------------------------------------------send money route
app.post("/sendmoney", auth, async (req, res) => {
  const senderaccountnumber = req.body.senderaccountnumber;
  const recieveraccountnumber = req.body.recieveraccountnumber;
  const amount = req.body.amount;

  // send the user an otp

  try {
    ouruser = await user.findOne(res.authuser).lean().populate({
      path: "accountdetails",
    });

    if (!ouruser) {
      res.json({ message: "user doesnt exist" });
    }

    // sending our user an email with otp

    const useremail = ouruser.email;

    let newotp = Math.random();
    newotp = newotp * 1000000;
    newotp = parseInt(newotp);
    console.log(newotp);

    const updatedotp = await user.findOneAndUpdate(
      { _id: ouruser._id },
      { otp: newotp }
    );

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hammasdev576@gmail.com",
        pass: "necrophos",
      },
    });

    const msg = {
      from: "hammasdev576@gmail.com", // sender address
      to: `${useremail}`, // list of receivers
      subject: "otp", // Subject line
      html:
        "<h3>OTP for account verification is </h3>" +
        "<h1 style='font-weight:bold;'>" +
        newotp +
        "</h1>",
    };

    // send mail with defined transport object
    const info = await transporter.sendMail(msg);

    res.json({ message: "successfully sent " });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//------------------------------------------verifying otp and sending money
app.post("/verifyotp", auth, async (req, res) => {
  const recieveraccountnumber = req.body.recieveraccountnumber;
  let amount = req.body.amount;
  const newotp = req.body.otp;

  try {
    const ouruser = await user.findOne(res.authuser).lean().populate({
      path: "accountdetails",
    });

    const currentuser = await accounts
      .findOne(ouruser.accountdetails)
      .lean()
      .populate({
        path: "benificiarydetails",
      })
      .populate({ path: "transactionhistory" });

    if (!ouruser) {
      res.json({ message: "user doesnt exist" });
    }

    if (ouruser.otp == newotp) {
      const reciever = await accounts
        .findOne({
          accountnumber: recieveraccountnumber,
        })
        .populate({
          path: "benificiarydetails",
        })
        .populate({ path: "transactionhistory" });

      // if check for account balance

      if (!reciever) {
        res.json({ message: "error the reciever account does not exist" });
      }

      //-------------------------------updating reciever balance
      let recieverbalance =
        parseInt(reciever.accountbalance) + parseInt(amount);

      await accounts.findOneAndUpdate(
        { _id: reciever._id },
        { accountbalance: recieverbalance }
      );

      //--------------------------------updating sender balance
      let currentuserbalance = currentuser.accountbalance - amount;
      await accounts.findOneAndUpdate(
        { _id: currentuser._id },
        { accountbalance: currentuserbalance }
      );

      //--------------------- getting the user object from database to send an email
      const recieveruser = await user.findOne({
        accountdetails: reciever._id,
      });

      // --------------------------sending mail to the reciever

      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "hammasdev576@gmail.com",
          pass: "necrophos",
        },
      });

      const msg = {
        from: "hammasdev576@gmail.com", // sender address
        to: `${recieveruser.email}`, // list of receivers
        subject: "Money Recieved", // Subject line
        html:
          "<h3>Recieved money </h3>" +
          "<h1 style='font-weight:bold;'>" +
          amount +
          "</h1>",
      };

      // send mail with defined transport object
      const info = await transporter.sendMail(msg);

      //      res.json({ message: "successfully sent " });

      // ----------------------updating the transaction history of current user
      const currentusertransaction = await new transactions({
        transactionid: 123,
        transactionamount: amount,
        transactiontype: "money transfer",
      });
      await currentusertransaction.save();
      const acct = await accounts.findOneAndUpdate(
        { _id: currentuser._id },
        { $push: { transactionhistory: currentusertransaction } }
      );

      //-----------------------------updating the transaction history of our reciever

      const recieverusertransaction = await new transactions({
        transactionid: 123,
        transactionamount: amount,
        transactiontype: "money recieved",
      });
      await recieverusertransaction.save();
      const ract = await accounts.findOneAndUpdate(
        { _id: reciever._id },
        { $push: { transactionhistory: recieverusertransaction } }
      );

      //---------------------------------------------------

      res.json({ message: "successfully sent the money " });
    }
  } catch (error) {
    res.json({ message: error.message });
  }
});

app.get("/generatestatement", auth, async (req, res) => {
  const ouruser = await user.findOne(res.authuser).lean().populate({
    path: "accountdetails",
  });

  const currentuser = await accounts
    .findOne(ouruser.accountdetails)
    .lean()
    .populate({
      path: "benificiarydetails",
    })
    .populate({ path: "transactionhistory" });

  if (!ouruser) {
    res.json({ message: "user doesnt exist" });
  }

  //-----------------------getting current date and time for statement
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = date + " " + time;
  //------------------------------------------------

  res.json({
    Accountbalance: currentuser.accountbalance,
    Date: dateTime,
    Financialstatement: currentuser.transactionhistory,
  });
});

// running our server at the following port
app.listen(4000, () => {
  console.log("server has started ");
});
