// schema for our account details
const mongo = require("mongoose");
const accountSchema = new mongo.Schema({
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
    default: 0,
  },
  accountholdername: {
    type: String,
    required: true,
  },

  benificiarydetails: [
    {
      type: mongo.Schema.Types.ObjectId,
      ref: "benificiary",
    },
  ],

  transactionhistory: [
    {
      type: mongo.Schema.Types.ObjectId,
      ref: "transactions",
    },
  ],
});
module.exports = mongo.model("accountinfo", accountSchema);
