import express from "express";
import { 
  createPost, 
  getAllPosts, 
  getPostById, 
  updatePost, 
  deletePost, 
  getUserPosts, 
  toggleLikePost,
  getLeaderboard,
  votePost
} from "../controllers/post.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllPosts); // Get all posts with pagination and search
router.get("/leaderboard", getLeaderboard); // Get leaderboard of posts by votes
router.get("/:id", getPostById); // Get post by ID
router.get("/user/:userId", getUserPosts); // Get posts by user ID

// Protected routes (require authentication)
router.post("/", authMiddleware, upload.single("image"), createPost); // Create new post
router.put("/:id", authMiddleware, upload.single("image"), updatePost); // Update post
router.delete("/:id", authMiddleware, deletePost); // Delete post
router.post("/:id/like", authMiddleware, toggleLikePost); // Like/Unlike post
router.post("/:id/vote", authMiddleware, votePost); // Vote on post (upvote/downvote)

export default router;
