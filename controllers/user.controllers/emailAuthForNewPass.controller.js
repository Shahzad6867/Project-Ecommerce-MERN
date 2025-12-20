const User = require("../../models/user.model.js");
const Otp = require("../../models/user-otp.model.js");
const mailer = require("../../config/nodemailer.js")
const bcryptjs = require("bcryptjs");
const {otpGenerator} = require("../../config/otpGenerator.js")
require("dotenv").config();


const getEmailAuth = async (req,res) => {
    let message = req.session.message || null;
    delete req.session.message;
    let userEmail = req.session.user?.email
    let backTo = (req.query?.location === "Profile") ? "Profile" : "Login"
    res.render("user-view/user.email-auth.ejs", { message: message,userEmail,backTo});
  }
  
const emailAuth = async (req,res) => {
try {
    let {email} = req.body
    const userData = await User.findOne({email : email})
    console.log(userData)
    if(!userData){
    return  res.render("user-view/user.email-auth.ejs",{message :  "User does not Exist - Will be redirected to Signup" })
    }else{
    let generatedOtp = otpGenerator();
    console.log(generatedOtp)
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
    req.session.otpUser = userData;
    req.session.otp = savedOtp
    req.session.message = 'OTP has been sent to your mail! Check your email'
    return res.redirect("/otp-verification-for-new-pass");
    }    

} catch (error) {
    console.log(error)
}
}

const getEmailAuthForNewEmail = async (req,res) => {
    let message = req.session.message || null;
    delete req.session.message;
    let userEmail = req.session.user
    userEmail = userEmail.email
    res.render("user-view/user.email-auth-for-new-email.ejs", { message: message,userEmail});
  }
  
const emailAuthForNewEmail = async (req,res) => {
try {
    const {email} = req.body
    if(email === req.session.user.email){
        req.session.message = "No changes detected. Please enter a new email"
        return res.redirect("/email-auth-for-new-email")
    }
    req.session.userEmail = email
    let generatedOtp = otpGenerator();
    console.log(generatedOtp)
    await mailer.sendVerificationEmail(email, generatedOtp);
    const now = new Date()
    const newOtp = new Otp({
        userEmail: email,
        otpCode: generatedOtp,
        createdAt : new Date(now.getTime() + (3 * 60 * 1000))
    });
    let savedOtp = await newOtp.save();
    console.log(savedOtp)
    console.log(generatedOtp);
    console.log("Otp Sent");
    req.session.otp = savedOtp
    req.session.message = 'OTP has been sent to your New Mail Id! Check your email'
    return res.redirect("/otp-verification-for-new-email");
} catch (error) {
    console.log(error)
}
}

module.exports = {
    getEmailAuth,
    emailAuth,
    getEmailAuthForNewEmail,
    emailAuthForNewEmail
}