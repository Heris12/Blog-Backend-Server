const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getMe} = require("../controllers/authController");
const { protect} = require("../middleware/auth")

//@Route POST /api/auth
router.post("/register", registerUser)

//@Route POST /api/auth
router.post("/login", loginUser);

//@route GET /api/auth/me
router.get("/me", protect, getMe)

module.exports = router;