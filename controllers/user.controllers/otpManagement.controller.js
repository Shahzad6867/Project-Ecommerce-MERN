const User = require("../../models/user.model.js");
const Wallet = require("../../models/wallet.model.js");
const Otp = require("../../models/user-otp.model.js");
const Coupon = require("../../models/coupon.model.js");
const { otpGenerator } = require("../../utils/otpGenerator.js");
const generateReferralCode = require("../../utils/referralCodeGenerator.js");
const mailer = require("../../config/nodemailer.js");
const bcryptjs = require("bcryptjs");
const HTTP_STATUS = require("../../constants/httpStatus.js");
require("dotenv").config();

const getUserOtp = async (req, res, next) => {
  let message = req.session.message || null;
  delete req.session.message;

  res.status(HTTP_STATUS.OK).render("user-view/user.otp-verification.ejs", {
    message: message,
    allocatedTime: req.session.otp.createdAt,
  });
};

const userOtp = async (req, res, next) => {
  try {
    let inputOtp = req.body.otp.join("");
    inputOtp = parseInt(inputOtp);
    console.log(inputOtp);
    if (!req.session.otpUser) {
      return res.status(HTTP_STATUS.UNAVAILABLE).render("user-view/user.otp-verification.ejs", {
        message: "OTP Expired, Click Resend OTP",
      });
    }
    let userOtp = await Otp.findById({ _id: req.session.otp?._id });

    if (!userOtp || userOtp.createdAt < Date.now()) {
      return res.status(HTTP_STATUS.UNAVAILABLE).render("user-view/user.otp-verification.ejs", {
        message: "OTP Expired, Click Resend OTP",
      });
    }
    if (userOtp.otpCode === inputOtp) {
      await Otp.deleteOne({ _id: userOtp._id });
      const { firstName, lastName, email, phone, password, terms } =
        req.session.otpUser;
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
      let savedUser = await newUser.save();
      
      savedUser.referralCode = generateReferralCode(savedUser._id);
      let wallet = new Wallet({
        userId: savedUser._id,
        balanceAmount: 0,
        transactions: [],
      });
      if (req.session.referral) {
        let user = await User.findOne({ referralCode: req.session.referral });
        let referralUserWallet = await Wallet.findOne({ userId : user._id})
        referralUserWallet.walletBalance += 10
        let transaction = {
         paymentId : null,
         transactionType : "Credit",
         transactionReason : "Referral Reward",
         transactionAmount : 10,
         createdAt : new Date(),
         updatedAt : new Date()
        }
        referralUserWallet.transactions.push(transaction)
        let coupon = new Coupon({
          name: "WELCOME10",
          description: "Upto 10% off on next Order",
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          discountValue: 10,
          discountType: "percentage",
          minAmount: 500,
          maxDiscountAmount: 60,
          bannerImage: null,
          userId: savedUser._id,
          maxUsage: 1,
        });
        await coupon.save();
        await referralUserWallet.save()
      }
      await wallet.save();
      await savedUser.save();
      req.session.message = "User Created Successfully, Please Log In";
      delete req.session.otpUser;
      return res.redirect("/login");
    } else {
      return res.status(HTTP_STATUS.UNAUTHORIZED).render("user-view/user.otp-verification.ejs", {
        message: "Incorrect OTP",
        allocatedTime: userOtp.createdAt,
      });
    }
  } catch (error) {
    next(error)
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const userData = req.session.otpUser;
    await Otp.findOneAndDelete({ _id: req.session.otp._id });
    let generatedOtp = otpGenerator();
    await mailer.sendVerificationEmail(userData.email, generatedOtp);
    const now = new Date();
    const newOtp = new Otp({
      userEmail: userData.email,
      otpCode: generatedOtp,
      createdAt: new Date(now.getTime() + 3 * 60 * 1000),
    });
    let savedOtp = await newOtp.save();
    console.log(savedOtp);
    console.log(generatedOtp);
    console.log("Otp Sent");
    req.session.otpUser = userData;
    req.session.otp = savedOtp;
    res.redirect("/otp-verification");
  } catch (error) {
    next(error)
  }
};

const getUserOtpForNewPass = async (req, res, next) => {
  let message = req.session.message || null;
  delete req.session.message;

  res.status(HTTP_STATUS.OK).render("user-view/user.otp-verification-for-new-pass.ejs", {
    message: message,
    allocatedTime: req.session.otp.createdAt,
  });
};

const userOtpForNewPass = async (req, res, next) => {
  try {
    let inputOtp = req.body.otp.join("");
    inputOtp = parseInt(inputOtp);
    console.log(inputOtp);
    console.log(req.session.otpUser);
    if (!req.session.otpUser.email) {
      return res.status(HTTP_STATUS.UNAVAILABLE).render("user-view/user.otp-verification-for-new-pass.ejs", {
        message: "OTP Expired, Click Resend OTP",
      });
    }
    let userOtp = await Otp.findById({ _id: req.session.otp._id });
    console.log(userOtp);

    if (!userOtp || userOtp.createdAt < Date.now()) {
      return res.status(HTTP_STATUS.UNAVAILABLE).render("user-view/user.otp-verification-for-new-pass.ejs", {
        message: "OTP Expired, Click Resend OTP",
      });
    }
    if (userOtp.otpCode === inputOtp) {
      await Otp.deleteOne({ _id: userOtp._id });
      return res.redirect("/reset-password");
    } else {
      return res.status(HTTP_STATUS.UNAUTHORIZED).render("user-view/user.otp-verification-for-new-pass.ejs", {
        message: "Incorrect OTP",
        allocatedTime: userOtp.createdAt,
      });
    }
  } catch (error) {
    next(error)
  }
};

const resendOtpForNewPass = async (req, res, next) => {
  try {
    const userData = req.session.user;
    await Otp.findOneAndDelete({ _id: req.session.otp._id });
    let generatedOtp = otpGenerator();
    await mailer.sendVerificationEmail(userData.email, generatedOtp);
    const now = new Date();
    const newOtp = new Otp({
      userEmail: userData.email,
      otpCode: generatedOtp,
      createdAt: new Date(now.getTime() + 3 * 60 * 1000),
    });
    let savedOtp = await newOtp.save();
    console.log(savedOtp);
    console.log(generatedOtp);
    console.log("Otp Sent");
    req.session.user = userData;
    req.session.otp = savedOtp;
    res.redirect("/otp-verification-for-new-pass");
  } catch (error) {
   next(error)
  }
};
const getUserOtpForNewEmail = async (req, res, next) => {
  let message = req.session.message || null;
  delete req.session.message;

  res.status(HTTP_STATUS.OK).render("user-view/user.otp-verification-for-new-email.ejs", {
    message: message,
    allocatedTime: req.session.otp.createdAt,
  });
};
const userOtpForNewEmail = async (req, res, next) => {
  try {
    console.log(req.body)
    let inputOtp = req.body.otp;
    inputOtp = parseInt(inputOtp);
    console.log(inputOtp);

    let userOtp = await Otp.findById({ _id: req.session.otp._id });
    console.log(userOtp);

    if (!userOtp || userOtp.createdAt < Date.now()) {
      return res.status(HTTP_STATUS.UNAVAILABLE).json({
        success : false,
        message: "OTP Expired, Click Resend OTP",
      });
    }
    if (userOtp.otpCode === inputOtp) {
      await Otp.deleteOne({ _id: userOtp._id });
      const userWithNewEmail = await User.findByIdAndUpdate(
        { _id: req.session.user._id },
        { $set: { email: req.session.userEmail } },
        { new: true }
      );
      req.session.user = userWithNewEmail;
      req.session.message = "Email Updated Successfully";
      return res.status(HTTP_STATUS.OK).json({
        success : true
      });
    } else {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success : false,
        message: "Incorrect OTP",
        allocatedTime: userOtp.createdAt,
      });
    }
  } catch (error) {
    next(error)
  }
};

const resendOtpForNewEmail = async (req, res, next) => {
  try {
    const userEmail = req.session.userEmail;
    await Otp.findOneAndDelete({ _id: req.session.otp._id });
    let generatedOtp = otpGenerator();
    await mailer.sendVerificationEmail(userEmail, generatedOtp);
    const now = new Date();
    const newOtp = new Otp({
      userEmail: userEmail,
      otpCode: generatedOtp,
      createdAt: new Date(now.getTime() + 3 * 60 * 1000),
    });
    let savedOtp = await newOtp.save();
    console.log(generatedOtp);
    console.log("Otp Sent");
    req.session.otp = savedOtp;
    res.redirect("/otp-verification-for-new-email");
  } catch (error) {
    next(error)
  }
};

module.exports = {
  getUserOtp,
  userOtp,
  resendOtp,
  getUserOtpForNewPass,
  userOtpForNewPass,
  resendOtpForNewPass,
  getUserOtpForNewEmail,
  userOtpForNewEmail,
  resendOtpForNewEmail,
};
