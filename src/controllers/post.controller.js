import { v2 as cloudinary } from "cloudinary";
import { Post } from "../models/post.models.js";

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

// ================= CREATE POST =================
export const createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const creator = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "posts",
      });
      imageUrl = result.secure_url;
    }

    const post = await Post.create({
      title,
      content,
      tags: tags ? tags.split(",") : [],
      creator,
      image: imageUrl,
    });

    await post.populate("creator", "userName avatar");

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= GET ALL POSTS =================
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("creator", "userName avatar")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= GET SINGLE POST =================
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("creator", "userName avatar")
      .populate("comments");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= UPDATE POST =================
export const updatePost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "posts",
      });
      post.image = result.secure_url;
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.tags = tags ? tags.split(",") : post.tags;

    await post.save();
    await post.populate("creator", "userName avatar");

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= DELETE POST =================
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await post.deleteOne();
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= LIKE POST =================
export const toggleLikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user.id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json({ message: "Like status updated", likes: post.likes });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= VOTE POST =================
export const votePost = async (req, res) => {
  try {
    const { type } = req.body; // "up" or "down"
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (type === "up") post.votes += 1;
    if (type === "down") post.votes -= 1;

    await post.save();
    res.status(200).json({ message: "Vote updated", votes: post.votes });
  } catch (error) {
    console.error("Error voting post:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= LEADERBOARD =================
export const getLeaderboard = async (req, res) => {
  try {
    const topPosts = await Post.find()
      .sort({ votes: -1, likes: -1 })
      .limit(10)
      .populate("creator", "userName avatar");

    res.status(200).json(topPosts);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ================= GET USER POSTS (with pagination) =================
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const currentPage = parseInt(page);
    const posts = await Post.find({ creator: userId })
      .skip((currentPage - 1) * limit)
      .limit(parseInt(limit))
      .populate("creator", "userName avatar")
      .sort({ createdAt: -1 });

    const totalPosts = await Post.countDocuments({ creator: userId });

    res.status(200).json({
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage,
      hasNext: currentPage < Math.ceil(totalPosts / limit),
      hasPrev: currentPage > 1,
    });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
