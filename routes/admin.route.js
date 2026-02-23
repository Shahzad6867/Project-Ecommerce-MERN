const express = require("express");
const router = express.Router();
const adminLoginController = require("../controllers/admin.controllers/adminLoginController.js");
const userManagmentController = require("../controllers/admin.controllers/userManagmentController.js");
const itemsPerPageController = require("../controllers/admin.controllers/itemsPerPage.controller.js");
const categoryManagmentController = require("../controllers/admin.controllers/categoryManagmentController.js");
const brandManagmentController = require("../controllers/admin.controllers/brandManagmentController.js");
const productManagmentController = require("../controllers/admin.controllers/productManagmentController.js");
const searchController = require("../controllers/admin.controllers/searchController.js");
const orderManagementController = require("../controllers/admin.controllers/ordersManagementController.js");
const offerManagementController = require("../controllers/admin.controllers/offerManagementController.js");
const couponManagementController = require("../controllers/admin.controllers/couponManagementController.js");
const reportsController = require("../controllers/admin.controllers/reportsController.js");
const dashboardController = require("../controllers/admin.controllers/dashboardController.js");
const adminAuth = require("../middlewares/admin.auth.js");
const upload = require("../config/multerConfig.js");

// Authentication
router.get("/login", adminAuth.isLogged, adminLoginController.getAdminLogin);
router.post("/login", adminLoginController.adminLogin);
router.get("/logout", adminLoginController.logoutAdmin);

// Users Management
router.get("/users", adminAuth.checkSession, userManagmentController.getUsers);
router.patch(
  "/block-user",
  adminAuth.checkSession,
  userManagmentController.blockUser
);
router.patch(
  "/unblock-user",
  adminAuth.checkSession,
  userManagmentController.unblockUser
);

router.post("/users", searchController.searchUser);
router.post("/products", searchController.searchProducts);
router.post(
  "/items-per-page",
  itemsPerPageController.selectedOptionToViewTheList
);

// Category Management
router.get(
  "/categories",
  adminAuth.checkSession,
  categoryManagmentController.getCategories
);
router.post(
  "/add-category",
  upload.single("categoryImage"),
  categoryManagmentController.addCategory
);
router.post(
  "/edit-category",
  upload.single("categoryImage"),
  categoryManagmentController.editCategory
);
router.patch(
  "/delete-category",
  adminAuth.checkSession,
  categoryManagmentController.deleteCategory
);
router.patch(
  "/restore-category",
  adminAuth.checkSession,
  categoryManagmentController.restoreCategory
);

// Product Management
router.get(
  "/products",
  adminAuth.checkSession,
  productManagmentController.getProducts
);
router.get(
  "/add-product",
  adminAuth.checkSession,
  productManagmentController.getAddProduct
);
router.post(
  "/add-product",
  upload.any(),
  productManagmentController.addProduct
);
router.get(
  "/edit-product",
  adminAuth.checkSession,
  productManagmentController.getEditProduct
);
router.post(
  "/edit-product",
  upload.any(),
  productManagmentController.editProduct
);
router.patch(
  "/delete-product",
  adminAuth.checkSession,
  productManagmentController.blockProduct
);
router.patch(
  "/restore-product",
  adminAuth.checkSession,
  productManagmentController.restoreProduct
);

//Brand Management
router.get(
  "/brands",
  adminAuth.checkSession,
  brandManagmentController.getBrand
);
router.post(
  "/add-brand",
  upload.single("brandImage"),
  brandManagmentController.addBrand
);
router.post(
  "/edit-brand",
  upload.single("brandImage"),
  brandManagmentController.editBrand
);
router.patch(
  "/delete-brand",
  adminAuth.checkSession,
  brandManagmentController.deleteBrand
);
router.patch(
  "/restore-brand",
  adminAuth.checkSession,
  brandManagmentController.restoreBrand
);

// Orders Management
router.get(
  "/orders",
  adminAuth.checkSession,
  orderManagementController.getOrders
);
router.post("/orders", searchController.searchOrders);
router.get(
  "/orders/:id",
  adminAuth.checkSession,
  orderManagementController.getOrderDetailPage
);
router.patch(
  "/orders/:id/update-status",
  orderManagementController.updateStatus
);
router.patch(
  "/orders/update-product-stock",
  orderManagementController.updateProductStock
);

//Offer Management
router.get(
  "/offers",
  adminAuth.checkSession,
  offerManagementController.getOffers
);
router.get(
  "/offers/add-offer",
  adminAuth.checkSession,
  offerManagementController.getAddOffer
);
router.get(
  "/offers/edit-offer",
  adminAuth.checkSession,
  offerManagementController.getEditOffer
);
router.post(
  "/offers/add-offer",
  upload.single("bannerImage"),
  offerManagementController.addOffer
);
router.post(
  "/offers/edit-offer",
  upload.single("bannerImage"),
  offerManagementController.editOffer
);
router.delete("/offers/delete-offer", offerManagementController.deleteOffer);
router.post("/search-products", offerManagementController.searchProducts);
router.get("/search-categories", offerManagementController.searchCategories);

//Coupon Management
router.get(
  "/coupons",
  adminAuth.checkSession,
  couponManagementController.getCoupons
);
router.get(
  "/coupons/add-coupon",
  adminAuth.checkSession,
  couponManagementController.getAddCoupon
);
router.get(
  "/coupons/edit-coupon",
  adminAuth.checkSession,
  couponManagementController.getEditCoupon
);
router.post(
  "/coupons/add-coupon",
  upload.single("bannerImage"),
  couponManagementController.addCoupon
);
router.post(
  "/coupons/edit-coupon",
  upload.single("bannerImage"),
  couponManagementController.editCoupon
);
router.delete(
  "/coupons/delete-coupon",
  couponManagementController.deleteCoupon
);

//Sales Report
router.get(
  "/reports",
  adminAuth.checkSession,
  reportsController.getSalesReport
);
router.get("/reports/sales/excel", reportsController.getSalesReportIntoExcel);
router.get("/reports/sales/pdf", reportsController.getSalesReportIntoPdf);

//Admin Dashboard
router.get(
  "/dashboard",
  adminAuth.checkSession,
  dashboardController.getAdminDashboard
);
router.get(
  "/dashboard/get-chart-details",
  dashboardController.getRevenueChartDetails
);

module.exports = router;
