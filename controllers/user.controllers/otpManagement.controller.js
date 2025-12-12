const User = require("../../models/user.model.js");
const Otp = require("../../models/user-otp.model.js");
const {otpGenerator} = require("../../config/otpGenerator.js")
const mailer = require("../../config/nodemailer.js")
const bcryptjs = require("bcryptjs");
require("dotenv").config();




const getUserOtp = async (req, res) => {
    let message = req.session.message || null;
    delete req.session.message;
  
    res.render("user-view/user.otp-verification.ejs", { message: message, allocatedTime : req.session.otp.createdAt });
  };
  
  const userOtp = async (req, res) => {
    try {
  
      let inputOtp = req.body.otp.join("");
      inputOtp = parseInt(inputOtp);
      console.log(inputOtp);
      if(!req.session.otpUser){
        return res.render("user-view/user.otp-verification.ejs", {
          message: "OTP Expired, Click Resend OTP",
        });
      }
      let userOtp = await Otp.findById({ _id : req.session.otp._id });
      
      if (!userOtp || userOtp.createdAt < Date.now()) {
        return res.render("user-view/user.otp-verification.ejs", {
          message: "OTP Expired, Click Resend OTP",
        });
      }
      if (userOtp.otpCode === inputOtp) {
        await Otp.deleteOne({_id : userOtp._id})
        const { firstName, lastName, email, phone, password, terms } = req.session.otpUser;
        const passwordHashed = await bcryptjs.hash(password, 12);
        console.log(passwordHashed)
        const newUser = new User({
          firstName,
          lastName,
          phone,
          email,
          password: passwordHashed,
          terms,
          isVerified: true,
        });
        let savedUser = await newUser.save();
        req.session.message = "User Created Successfully, Please Log In";
        delete req.session.otpUser
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


  const resendOtp = async (req,res) => {
    try {
      const userData = req.session.otpUser
      await Otp.findOneAndDelete({_id : req.session.otp._id})
      let generatedOtp = otpGenerator();
      await mailer.sendVerificationEmail(userData.email, generatedOtp);
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
      res.redirect("/otp-verification");
    } catch (error) {
      console.log(error);
    }
  
  }


  const getUserOtpForNewPass = async (req, res) => {
    let message = req.session.message || null;
    delete req.session.message;
  
    res.render("user-view/user.otp-verification-for-new-pass.ejs", { message: message, allocatedTime : req.session.otp.createdAt});
  };
  
  const userOtpForNewPass = async (req, res) => {
    try {
      let inputOtp = req.body.otp.join("");
      inputOtp = parseInt(inputOtp);
      console.log(inputOtp);
      console.log(req.session.otpUser)
      if(!req.session.otpUser.email){
        return res.render("user-view/user.otp-verification-for-new-pass.ejs", {
          message: "OTP Expired, Click Resend OTP",
        });
      }
      let userOtp = await Otp.findById({ _id: req.session.otp._id });
      console.log(userOtp);
      
      if (!userOtp || userOtp.createdAt < Date.now()) {
        return res.render("user-view/user.otp-verification-for-new-pass.ejs", {
          message: "OTP Expired, Click Resend OTP",
        });
      }
      if (userOtp.otpCode === inputOtp) {
        await Otp.deleteOne({_id : userOtp._id})
        return res.redirect("/reset-password");
      } else {
        return res.render("user-view/user.otp-verification-for-new-pass.ejs", {
          message: "Incorrect OTP", allocatedTime : userOtp.createdAt 
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const resendOtpForNewPass = async (req,res) => {
    try {
      const userData = req.session.user
       await Otp.findOneAndDelete({_id : req.session.otp._id})
      let generatedOtp = otpGenerator();
      await mailer.sendVerificationEmail(userData.email, generatedOtp);
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
      res.redirect("/otp-verification-for-new-pass");
    } catch (error) {
      console.log(error);
    }
  
  }




  
  
  module.exports = {
    getUserOtp,
    userOtp,
    resendOtp,
    getUserOtpForNewPass,
    userOtpForNewPass,
    resendOtpForNewPass
  }