const express = require("express");
const session = require("express-session");
const passport = require("./config/passport.js");
const { connectDatabase } = require("./config/dbConnect");
const adminRoute = require("./routes/admin.route");
const userRoute = require("./routes/user.route");
const path = require("path");
const webhookHandler = require("./controllers/user.controllers/stripeWebhook.controller.js")
require("dotenv").config();
const cookieParser = require("cookie-parser")
const app = express();

app.set("view-engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

//Middlewares

app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store,no-cache,must-revalidate,private"),
    res.set("Pragma", "no-cache"),
    res.set("Expires", "0"),
    next();
});

app.post("/webhook/stripe",express.raw({type : "application/json"}),webhookHandler)

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(cookieParser())
app.use("/admin", adminRoute);
app.use("/", userRoute);
app.use((req, res, next) => {
  res.render("404page.ejs");
});

connectDatabase();
const PORT = process.env.PORT || 3001;
app.listen(PORT, (error) => {
  try {
    console.log(`Server connected @ ${PORT}`);
  } catch {
    console.log(error);
  }
});
