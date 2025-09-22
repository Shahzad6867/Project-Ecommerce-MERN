const express = require("express")
const router = express.Router()
const adminRoute = require("../controllers/admin.controller")

router.get("/login",adminRoute.getAdminLogin)

module.exports = router