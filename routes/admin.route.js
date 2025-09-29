const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin.controller")

router.get("/login",adminController.getAdminLogin)
router.post("/login",adminController.adminLogin)

module.exports = router