const User = require("../models/user.model");
const Otp = require("../models/user-otp.model");
const mailer = require("../controllers/node-mailer")
const bcryptjs = require("bcryptjs");
require("dotenv").config();



function otpGenerator(params) {
  return Math.floor(100000 + Math.random() * 900000);
}


const getUserLogin = async (req, res) => {
  let message = req.session.message || null;
  delete req.session.message;
  res.render("user-view/user.login.ejs", { message: message });
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email);
    console.log(password);
    const userExist = await User.findOne({ email });
    console.log(userExist);
    if (!userExist) {
      req.session.message = "User does not Exist - Please Create Account";
      return res.redirect("/login");
    }
    if (userExist.isBlocked) {
      req.session.message =
        "You have been Blocked by the Admin, Contact the Administration";
      return res.redirect("/login");
    }

    const isPassMatch = await bcryptjs.compare(password, userExist.password);
    if (!isPassMatch) {
      req.session.message = "Incorrect Password";
      return res.redirect("/login");
    }

    req.session.user = userExist;
    req.session.message = `👋 Hi, ${userExist.firstName} ${userExist.lastName}`;
    res.redirect("/home");
  } catch (error) {
    console.log(error);
  }
};

const getUserRegister = async (req, res) => {
  res.render("user-view/user.register.ejs");
};

const userRegister = async (req, res) => {
  try {
    const userData = req.body;
    console.log(userData);
    const userExist = await User.findOne({ email: userData.email });
    if (userExist !== null || undefined) {
      req.session.message = "User Already Exists, Please Log In";
      return res.redirect("/login");
    }
    let generatedOtp = otpGenerator();
    const emailSent = await mailer.sendVerificationEmail(userData.email, generatedOtp);
    const now = new Date()
    const newOtp = new Otp({
      userEmail: userData.email,
      otpCode: generatedOtp,
      createdAt : new Date(now.getTime() + (3 * 60 * 1000))
    });
    let savedOtp = await newOtp.save();
    console.log(savedOtp)
    console.log(generatedOtp);
    console.log("Otp Sent");
    req.session.user = userData;
    req.session.otpTimer = savedOtp.createdAt
    res.redirect("/otp-verification");
  } catch (error) {
    console.log(error);
  }
};

const getUserOtp = async (req, res) => {
  let message = req.session.message || null;
  delete req.session.message;

  res.render("user-view/user.otp-verification.ejs", { message: message, allocatedTime : req.session.otpTimer });
};

const userOtp = async (req, res) => {
  try {
    let inputOtp = req.body.otp.join("");
    inputOtp = parseInt(inputOtp);
    console.log(inputOtp);
    if(!req.session.user.email){
      return res.render("user-view/user.otp-verification.ejs", {
        message: "OTP Expired, Click Resend OTP",
      });
    }
    let userOtp = await Otp.findOne({ userEmail: req.session.user.email });
    console.log(userOtp);
    
    if (!userOtp || userOtp.createdAt < Date.now()) {
      return res.render("user-view/user.otp-verification.ejs", {
        message: "OTP Expired, Click Resend OTP",
      });
    }
    if (userOtp.otpCode === inputOtp) {
      await Otp.deleteOne({_id : userOtp._id})
      const { firstName, lastName, email, phone, password, terms } = req.session.user;
      console.log(req.session.user);
      const passwordHashed = await bcryptjs.hash(password, 12);
      const newUser = new User({
        firstName,
        lastName,
        phone,
        email,
        password: passwordHashed,
        terms,
        isVerified: true,
      });
      await newUser.save();
      req.session.message = "User Created Successfully, Please Log In";
      return res.redirect("/login");
    } else {
      return res.render("user-view/user.otp-verification.ejs", {
        message: "Incorrect OTP", allocatedTime : userOtp.createdAt 
      });
    }
  } catch (error) {
    console.log(error);
  }
};

const getForgotPassword = async (req,res) => {
  let message = req.session.message || null;
  delete req.session.message;

  res.render("user-view/user.reset-password.ejs", { message: message, allocatedTime : req.session.otpTimer });
}

module.exports = {
  getUserLogin,
  userLogin,
  userRegister,
  getUserRegister,
  getUserOtp,
  userOtp,
};
