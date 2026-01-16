const User = require("../../models/user.model.js");
const Otp = require("../../models/user-otp.model.js");
const mailer = require("../../config/nodemailer.js")
const {otpGenerator} = require("../../config/otpGenerator.js")
const bcryptjs = require("bcryptjs");
require("dotenv").config();



const getUserRegister = async (req, res) => {
    let message = req.session.message || null
    delete req.session.message

    res.render("user-view/user.register.ejs",{message,ref : req.query.ref || null});
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
    if(req.body.ref !== "" || req.body.ref !== undefined){
        req.session.referral = req.body.ref
    }
    let savedOtp = await newOtp.save();
    console.log(savedOtp)
    console.log(generatedOtp);
    console.log("Otp Sent");
    req.session.otpUser = userData
    req.session.otp = savedOtp
    res.redirect("/otp-verification");
} catch (error) {
    console.log(error);
}
};

module.exports = {
    getUserRegister,
    userRegister
}