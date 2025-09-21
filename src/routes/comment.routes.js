import express from "express";
import { 
  createComment, 
  getCommentsByPost, 
  updateComment, 
  deleteComment, 
  voteComment, 
  getUserComments 
} from "../controllers/comment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/post/:postId", getCommentsByPost); // Get comments by post ID
router.get("/user/:userId", getUserComments); // Get comments by user ID

// Protected routes (require authentication)
router.post("/", authMiddleware, createComment); // Create new comment
router.put("/:id", authMiddleware, updateComment); // Update comment
router.delete("/:id", authMiddleware, deleteComment); // Delete comment
router.post("/:id/vote", authMiddleware, voteComment); // Vote on comment

export default router;
