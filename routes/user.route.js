const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")
const passport = require("passport")


router.get("/auth/google",passport.authenticate("google",{scope : ["profile","email"]}))
router.get("/auth/google/callback",passport.authenticate("google",{failureRedirect : "/register"}),(req,res) => {
    res.redirect("/")
})
router.get("/login",userController.getUserLogin)
router.post("/login",userController.userLogin)
router.get("/register",userController.getUserRegister)
router.post("/register",userController.userRegister)
router.get("/otp-verification",userController.getUserOtp)
router.post("/otp-verification",userController.userOtp)
router.get("/",(req,res) => {res.send("<h1>Homepage</h1>")})
router.post("/resend-otp",userController.resendOtp)
router.post("/resend-otp-for-new-pass",userController.resendOtpForNewPass)
router.get("/email-auth",userController.getEmailAuth)
router.post("/email-auth",userController.emailAuth)
router.get("/otp-verification-for-new-pass",userController.getUserOtpForNewPass)
router.post("/otp-verification-for-new-pass",userController.userOtpForNewPass)
router.get("/reset-password",userController.getResetPassword)
router.post("/reset-password",userController.resetPassword)


module.exports = router