// schema for our benificiarys
const mongo = require("mongoose");
const benificiarySchema = new mongo.Schema({
  benificiaryname: { type: String },
  benificiaryaccountnumber: { type: Number },
});
module.exports = mongo.model("benificiary", benificiarySchema);
