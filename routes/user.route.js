const express = require("express")
const router = express.Router()
const userController = require("../controllers/user.controller")

router.get("/login",userController.getUserLogin)
router.get("/register",userController.getUserRegister)

module.exports = router