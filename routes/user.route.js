const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")

router.get("/login",userController.getUserLogin)
router.post("/login",userController.userLogin)
router.get("/register",userController.getUserRegister)
router.post("/register",userController.userRegister)
router.get("/otp-verification",userController.getUserOtp)
router.post("/otp-verification",userController.userOtp)
router.get("/home",(req,res) => {res.send("<h1>Homepage</h1>")})
// router.post("/resend-otp",(req,res) => {res.redirect("/otp-verification")})

module.exports = router