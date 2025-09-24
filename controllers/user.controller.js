const User = require("../models/user.model")
const bcryptjs = require("bcryptjs")
require("dotenv").config()
const nodemailer = require("nodemailer")

function otpGenerator(params) {
    return Math.floor(100000 + Math.random() * 900000)
}
async function sendVerificationEmail(email,otp) {
    try {
        const transporter = nodemailer.createTransport({
            service : "gmail",
            port : 587,
            secure : false,
            auth : {
                user : process.env.GOOGLE_ACCOUNT,
                pass : process.env.GOOGLE_APP_PASSWORD
            }

        })

        transporter.sendMail({
            from : process.env.GOOGLE_ACCOUNT,
            to : email,
            subject : "Your OTP for Verification",
            text : `Your OTP is ${otp}`,
            html :` <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8" />
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <title>OTP Verification</title>
                    </head>
                    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background: linear-gradient(135deg, #2eec71 0%, #8db39b 100%);">
                        <table align="center" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:40px auto; ; box-shadow:0 6px 20px rgba(0,0,0,0.1); overflow:hidden;">
                        <tr>
                            <td style="padding:30px; text-align:center;">
                            <h1 style="margin:0; font-size:24px; color:#474744;">OTP Verification</h1>
                            <p style="margin:20px 0; font-size:16px; color:#474744;">
                                Use the OTP below to complete your verification process:
                            </p>
                            <div style="background: white; color: #474744; font-size:28px; letter-spacing:4px; font-weight:bold; padding:15px 30px; border-radius:12px; display:inline-block; margin:20px 0;">
                                ${otp}
                            </div>
                            <p style="margin:20px 0; font-size:14px; color:#474744;">
                                This OTP will expire in <strong>2 minutes</strong>. Do not share it with anyone.
                            </p>
                            <hr style="border:none; border-top:1px solid #e0e0e0; margin:30px 0;" />
                            <p style="font-size:12px; color:#888888;">
                                If you did not request this, please ignore this email or contact our support team.
                            </p>
                            </td>
                        </tr>
                        </table>
                    </body>
                    </html>
                    `
        })
    } catch (error) {
        console.error(error)
    }
}

const getUserLogin = async (req,res) => {
    let message = req.session.message || null
    delete req.session.message
    res.render("user-view/user.login.ejs",{message : message})
}

const userLogin = async (req,res) => {
    try {
        const {email,password} = req.body
        console.log(email)
        console.log(password)
        const userExist = await User.findOne({email})
        console.log(userExist)
        if(!userExist){
            req.session.message = "User does not Exist - Please Create Account"
           return res.redirect("/login")
        }
        if(userExist.isBlocked){
            req.session.message = "You have been Blocked by the Admin, Contact the Administration";
           return res.redirect("/login")
        }

        const isPassMatch = await bcryptjs.compare(password, userExist.password)
        if(!isPassMatch){
            req.session.message = "Incorrect Password";
            return res.redirect("/login");
        }

        req.session.user = userExist
        req.session.message = `👋 Hi, ${userExist.firstName} ${userExist.lastName}`
        res.redirect("/home")

    } catch (error) {
        console.log(error)
    }
}

const getUserRegister = async (req,res) => {
    res.render("user-view/user.register.ejs")
}

const userRegister = async (req,res) => {
    try {
        const userData = req.body
        console.log(userData)
    const userExist = await User.findOne({email : userData.email})
    if(userExist !== null||undefined){
        req.session.message = "User Already Exists, Please Log In";
      return res.redirect("/login");
    }
    let generatedOtp = otpGenerator()
    const emailSent = await sendVerificationEmail(userData.email,generatedOtp)
    req.session.user = userData;
    generatedOtp = String(generatedOtp).split("").map((value) => parseInt(value))
    req.session.otp = generatedOtp
    console.log(req.session.otp)
    console.log(generatedOtp)
    console.log("Otp Sent")
    res.redirect("/otp-verification")
    } catch (error) {
        console.log(error)
    }
}

const getUserOtp = async (req,res) => {
    let message = req.session.message || null
    delete req.session.message
    res.render("user-view/userotp-verification.ejs",{message : message})
}

const userOtp = async (req,res) => {
    try {
        let inputOtp = req.body.otp.map((value) => {
            return parseInt(value)
        })
        let sessionOtp = req.session.otp 
        for(let i = 0 ; i < sessionOtp.length ; i++){
            if(sessionOtp[i] !== inputOtp[i]){
                req.session.message = "Invalid OTP"
                return res.redirect("/otp-verification")
            }
        }
        const {firstName,lastName,email,mobileNo,password,terms} = req.session.user
        const passwordHashed = await bcryptjs.hash(password,12)
        const newUser = new User({
            firstName,
            lastName,
            mobileNo,
            email,
            password : passwordHashed,
            terms,
            isVerified : true
        })
        await newUser.save()
        req.session.message = "User Created Successfully, Please Log In"
        res.redirect("/login")
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    getUserLogin,
    userLogin,
    userRegister,
    getUserRegister,
    getUserOtp,
    userOtp
}