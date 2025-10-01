const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin.controller")

router.get("/login",adminController.getAdminLogin)
router.post("/login",adminController.adminLogin)
router.get("/users",adminController.getUsers)
router.post("/users",adminController.searchUser)
router.get("/block-user",adminController.blockUser)
router.get("/unblock-user",adminController.unblockUser)
router.get("/delete-user",adminController.deleteUser)
module.exports = router