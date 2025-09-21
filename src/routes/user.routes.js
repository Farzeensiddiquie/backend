import express from "express";
import { 
  registerUser, 
  loginUser, 
  logoutUser,
  getProfile, 
  updateAvatar, 
  updateProfile, 
  getUserById 
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { authLimiter, uploadLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validateRegister, validateLogin, validateProfileUpdate } from "../middlewares/validation.middleware.js";

const router = express.Router();

// Public routes
router.get("/:userId", getUserById); // Get user by ID (public profile)

// Register route with avatar upload
router.post("/register", authLimiter, upload.single("avatar"), validateRegister, registerUser);

// Login route
router.post("/login", authLimiter, validateLogin, loginUser);

// Logout route
router.post("/logout", authMiddleware, logoutUser);

// Protected routes (require authentication)
router.get("/profile/me", authMiddleware, getProfile); // Get current user's profile
router.put("/profile/avatar", authMiddleware, uploadLimiter, upload.single("avatar"), updateAvatar); // Update avatar
router.put("/profile", authMiddleware, validateProfileUpdate, updateProfile); // Update profile info

export default router;
