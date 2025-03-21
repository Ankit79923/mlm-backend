const express = require("express");
const router = express.Router();
const { upload } = require("../middlewares/multer");
const { isAdminMiddleware } = require("../middlewares/jwt");
const {
  handleAdminLogin,
  handleCreateAdmin,
  activeWithKyc,
  activeWithNoKyc,
  inactiveWithKyc,
  inactiveWithNoKyc,
  activeuser,
  calculatePurchaseStats
} = require("../controllers/adminController");
const {
  handleAddProduct,
  handleEditProduct,
  handleDeleteProduct,
  handleViewProducts,
  handleClearAllRedisCache,
  handleAssignProductsToUsersByAdmin,
  handleGetUserOrdersDeliveredByAdmin,
} = require("../controllers/productController");
const {
  handleCreateFranchise,
  handleGetAllFranchises,
  handleAssignProductsToFranchise,
  handleGetFranchiesInventory,
  handleRemoveProductFromFranchiseInventory,
  handleGetFranchiseOrders,
} = require("../controllers/franchiseController");
const {
  handleGetAllNonVerifiedKycUsers,
  handleVerifyKYCDetails,
  handleRejectKYCDetails,
  handleGetAllVerifiedKycUsers,
  handleGetrejectKycUsers,
  handleEditbankdetails,
  handleGetVerifiedKycUserById
} = require("../controllers/kycController");

// Authentication Routes
router.post("/create", handleCreateAdmin);
router.post("/login", handleAdminLogin);
router.delete("/cache/clear", handleClearAllRedisCache);

// Product Routes
router.post(
  "/addProduct",
  isAdminMiddleware,
  upload.single("picture"),
  handleAddProduct
);
router.post(
  "/editProduct/:id",
  isAdminMiddleware,
  upload.single("picture"),
  handleEditProduct
); // DONE
router.delete("/deleteProduct/:id", isAdminMiddleware, handleDeleteProduct);
router.get("/viewProducts", isAdminMiddleware, handleViewProducts);
router.post("/getFranchiseOrders", handleGetFranchiseOrders);

// Franchise routes
router.post("/franchise/create", handleCreateFranchise);
router.get("/getAllFranchies", handleGetAllFranchises);
router.post(
  "/franchise/:franchiseId/assign-products",
  handleAssignProductsToFranchise
);
router.get(
  "/franchise/:franchiseId/assigned-products",
  handleGetFranchiesInventory
);
router.delete(
  "/franchise/:franchiseId/remove-product/:productId",
  handleRemoveProductFromFranchiseInventory
);

router.post(
  "/user/:mySponsorId/assign-products",
  handleAssignProductsToUsersByAdmin
);

router.get("/kycVerification/pending", handleGetAllNonVerifiedKycUsers);
router.get("/kycVerification/rejected", handleGetrejectKycUsers);
router.get("/kycVerification/approved", handleGetAllVerifiedKycUsers);
router.post("/approveKycVerification", handleVerifyKYCDetails);
router.post("/rejectKycVerification", handleRejectKYCDetails);
router.post("/editbankdetails/:id", upload.single("bankCard"), handleEditbankdetails);
router.get("/getVerifiedKycUserById/:id", handleGetVerifiedKycUserById);
router.get("/createdOrdersForUser", handleGetUserOrdersDeliveredByAdmin);
router.get('/active-kyc-users',  activeWithKyc);
router.get('/active-nokyc-users', activeWithNoKyc);
router.get('/inactive-kyc-users', inactiveWithKyc);
router.get('/inactive-nokyc-users', inactiveWithNoKyc);
router.get('/active-users', activeuser);
router.get('/purchase-stats', calculatePurchaseStats);
module.exports = router;
