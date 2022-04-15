const mongo = require("mongoose");

const userSchema = new mongo.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  accountdetails: {
    accountnumber: {
      type: Number,
      required: true,
      unique: true,
    },
    accountpin: {
      type: Number,
      required: true,
    },
    accounttype: {
      type: String,
      required: true,
    },

    accountbalance: {
      type: Number,
    },
    accountholdername: {
      type: String,
      required: true,
    },
  },
  benificiary: [
    {
      benificiaryname: { type: String },
      benificiaryaccountnumber: { type: Number },
    },
  ],

  transationhistory: [
    {
      transactionnumber: { type: Number },
      transactionamount: { type: Number },
    },
  ],
});

module.exports = mongo.model("users", userSchema);
