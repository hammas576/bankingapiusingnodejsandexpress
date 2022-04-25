const mongo = require("mongoose");
// schema for user details
const userSchema = new mongo.Schema(
  // document for user details
  {
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

    otp: {
      type: Number,
      default: 0,
    },
    securityquestion: {
      type: String,
      default: 0,
    },
    accountdetails: {
      type: mongo.Schema.Types.ObjectId,
      ref: "accountinfo",
    },
  }
);

module.exports = mongo.model("users", userSchema);
