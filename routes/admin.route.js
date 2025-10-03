const express = require("express")
const router = express.Router()
const adminController = require("../controllers/admin.controller")
const adminAuth = require("../middlewares/admin.auth.js")
const upload = require("../config/multerConfig.js")

router.get("/login",adminAuth.isLogged,adminController.getAdminLogin)
router.post("/login",adminController.adminLogin)

router.get("/users",adminAuth.checkSession,adminController.getUsers)
router.post("/users",adminController.searchUser)

router.get("/block-user",adminAuth.checkSession,adminController.blockUser)
router.get("/unblock-user",adminAuth.checkSession,adminController.unblockUser)
router.get("/delete-user",adminAuth.checkSession,adminController.deleteUser)
router.post("/items-per-page",adminController.selectedOptionToViewTheList)

router.get("/categories",adminAuth.checkSession,adminController.getCategories)
router.post("/add-category",upload.single("categoryImage"),adminController.addCategory)
router.post("/edit-category",upload.single("categoryImage"),adminController.editCategory)
router.get("/delete-category",adminAuth.checkSession,adminController.deleteCategory)
router.get("/restore-category",adminAuth.checkSession,adminController.restoreCategory)

router.get("/products",adminAuth.checkSession,adminController.getProducts)
router.get("/add-product",adminAuth.checkSession,adminController.getAddProduct)
router.post("/add-product",upload.any(),adminController.addProduct)
router.get("/edit-product",adminController.getEditProduct)
router.post("/edit-product",upload.any(),adminController.editProduct)
router.get("/delete-product",adminController.deleteProduct)
router.get("/restore-product",adminController.restoreProduct)

router.get("/brands",adminAuth.checkSession,adminController.getBrand)
router.post("/add-brand",upload.single("brandImage"),adminController.addBrand)
router.post("/edit-brand",upload.single("categoryImage"),adminController.editBrand)
router.get("/delete-brand",adminController.deleteBrand)
router.get("/restore-brand",adminController.restoreBrand)
router.get("/logout",adminAuth.checkSession,adminController.logoutAdmin)

module.exports = router