// requirements and initialization
require("dotenv").config();
const expresss = require("express");
const app = expresss();
const mongo = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// importing database schemas
const user = require("../models/user");
const accounts = require("../models/accountdetails");
const transactions = require("../models/transactions");
const benificiary = require("../models/benificiary");
const { findOne } = require("../models/user");

app.use(expresss.json());

// middleware function to find account using account number
async function findbenificiary(req, res, next) {
  let currentbenificiary;
  try {
    const accountnumber = req.params.accountnumber;

    currentbenificiary = await accounts.findOne({ accountnumber }).lean();
    if (!currentbenificiary) {
      return res
        .status(404)
        .json({ message: "Invalid account credentials or does not exist" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
  res.currentbenificiary = currentbenificiary;
  next();
}

module.exports = findbenificiary;
