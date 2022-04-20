// schema for our transactions
const mongo = require("mongoose");
const transactionSchema = new mongo.Schema({
  transactionid: { type: Number },
  transactionamount: { type: Number },
  transactiontype: { type: String, default: "" },
});
module.exports = mongo.model("transactions", transactionSchema);
