// requirements and initialization
require("dotenv").config();
const expresss = require("express");
const app = expresss();
const mongo = require("mongoose");
const user = require("./models/user");
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

// route for login
app.get("/login", async (req, res) => {
  console.log("user is at our login route");

  try {
    const users = await user.find();
    res.json(users);
  } catch (error) {
    res.error(error);
  }
});

// path for registeration

app.post("/register", async (req, res) => {
  console.log("user is at registeration route");
  // const accountdetails = {accountnumber:''}

  const member = new user({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,

    accountdetails: {
      accountholdername: req.body.accountholdername,
      accounttype: req.body.accounttype,
      accountnumber: req.body.accountnumber,
      accountpin: req.body.accountpin,
    },
  });

  // res.status(201).json(member);

  try {
    const newuser = await member.save();
    res.status(201).json(newuser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// running our server at the following port
app.listen(4000, () => {
  console.log("server has started ");
});
