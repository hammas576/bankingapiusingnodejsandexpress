// requirements and initialization
require("dotenv").config();
const expresss = require("express");
const app = expresss();
const mongo = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = expresss.Router();

// importing database schemas
const user = require("../models/user");
const accounts = require("../models/accountdetails");
const transactions = require("../models/transactions");
const benificiary = require("../models/benificiary");
const { findOne } = require("../models/user");
const findbenificiary = require("../middlewares/findallbenificiary");
const auth = require("../middlewares/auth");

app.use(expresss.json());

// -------------------------------------------------show all benificiaries

router.get("/", auth, async (req, res) => {
  try {
    userid = res.authuser._id;
    ouruser = await user.findOne({ userid }).lean().populate({
      path: "accountdetails",
    });

    const acc = ouruser.accountdetails.accountnumber;
    const reqacc = await accounts
      .findOne({ accountnumber: acc })
      .lean()
      .populate({
        path: "benificiarydetails",
      });

    if (!ouruser) {
      res.json({ message: "user doesnt exist" });
    }

    res.send(reqacc.benificiarydetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//------------------------------------------ add a benificiary

router.post("/", auth, async (req, res) => {
  let ouruser;
  const beni = await new benificiary({
    benificiaryname: req.body.benificiaryname,
    benificiaryaccountnumber: req.body.benificiaryaccountnumber,
  });

  await beni.save();

  try {
    userid = res.authuser._id;

    ouruser = await user.findOne({ userid });

    const acct = await accounts.findOneAndUpdate(
      { _id: ouruser.accountdetails },
      { $push: { benificiarydetails: beni._id } }
    );

    if (!ouruser) {
      res.json({ message: "user doesnt exist" });
    }

    res.json({ add: "added" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

//------------------------------------ update a benificiary

router.put("/", auth, async (req, res) => {
  const searchaccountnumber = req.body.searchaccountnumber;
  const newaccountnumber = req.body.newaccountnumber;
  let newbenif;
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

    const benifi = currentuser.benificiarydetails;
    for (var i = 0; i < benifi.length; i++) {
      if (benifi[i].benificiaryaccountnumber == searchaccountnumber) {
        {
          benifi[i].benificiaryaccountnumber = newaccountnumber;
          newbenif = benifi[i];
        }
      }
    }
    await benificiary.findOneAndUpdate(
      { _id: newbenif },
      { benificiaryaccountnumber: newbenif.benificiaryaccountnumber }
    );

    res.json({ message: "succesfully updated benificiary" });
  } catch (error) {
    res.json({ message: error.message });
  }
});

// ---------------------------------------------delete a benificiary

router.delete("/", auth, async (req, res) => {
  const searchaccountnumber = req.body.searchaccountnumber;
  let newbenif;
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

    const benifi = currentuser.benificiarydetails;
    for (var i = 0; i < benifi.length; i++) {
      if (benifi[i].benificiaryaccountnumber == searchaccountnumber) {
        {
          newbenif = benifi[i];
        }
      }
    }
    await benificiary.findOneAndDelete({ _id: newbenif });

    res.json({ message: "succesfully deleted benificiary" });
  } catch (error) {
    res.json({ message: error.message });
  }
});

module.exports = router;
