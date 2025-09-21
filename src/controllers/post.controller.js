import { Post } from "../models/post.models.js";
import { User } from "../models/user.models.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Configure Cloudinary with explicit credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dqxmgdj5i",
    api_key: process.env.API_KEY || "766337761652718", 
    api_secret: process.env.API_SECRET || "WdKmctLgJyXhgisDeBbLAcAaVss",
    secure: true
});

const uploadToCloudinary = (fileBuffer, folder = "posts") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// ================= CREATE POST =================
export const createPost = async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const creatorId = req.user._id;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and content are required" 
      });
    }

    // Parse tags if provided as string
    let parsedTags = [];
    if (tags) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        parsedTags = tags.filter(tag => tag && tag.trim());
      }
    }

    // Upload image if provided
    let imageUrl = null;
    if (req.file && req.file.buffer) {
      console.log("Uploading post image to Cloudinary...");
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
        console.log("Post image uploaded successfully:", imageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
      }
    }

    const post = new Post({
      title,
      content,
      tags: parsedTags,
      creator: creatorId,
      ...(imageUrl && { image: imageUrl })
    });

    await post.save();

    // Add post to user's posts array
    await User.findByIdAndUpdate(creatorId, {
      $push: { posts: post._id }
    });

    // Populate creator details
    await post.populate('creator', 'userName fullName avatar');

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post
    });
  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= GET ALL POSTS =================
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tag } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (tag) {
      filter.tags = { $in: [tag] };
    }

    const posts = await Post.find(filter)
      .populate('creator', 'userName fullName avatar')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNext: page < Math.ceil(totalPosts / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get All Posts Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= GET POST BY ID =================
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('creator', 'userName fullName avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'userName fullName avatar'
        }
      });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    res.status(200).json({
      success: true,
      data: post
    });
  } catch (err) {
    console.error("Get Post By ID Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= UPDATE POST =================
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the creator
    if (post.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own posts"
      });
    }

    // Parse tags if provided
    let parsedTags = post.tags;
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(tags)) {
        parsedTags = tags.filter(tag => tag && tag.trim());
      }
    }

    // Handle image update
    let imageUrl = post.image;
    if (req.file && req.file.buffer) {
      console.log("Uploading new post image to Cloudinary...");
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        imageUrl = result.secure_url;
        console.log("New post image uploaded successfully:", imageUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image"
        });
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      {
        ...(title && { title }),
        ...(content && { content }),
        tags: parsedTags,
        ...(imageUrl && { image: imageUrl })
      },
      { new: true, runValidators: true }
    ).populate('creator', 'userName fullName avatar');

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: updatedPost
    });
  } catch (err) {
    console.error("Update Post Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= DELETE POST =================
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user is the creator
    if (post.creator.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts"
      });
    }

    await Post.findByIdAndDelete(id);

    // Remove post from user's posts array
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: id }
    });

    res.status(200).json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= GET USER POSTS =================
export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ creator: userId })
      .populate('creator', 'userName fullName avatar')
      .populate('comments')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalPosts = await Post.countDocuments({ creator: userId });

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNext: page < Math.ceil(totalPosts / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get User Posts Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= LIKE/UNLIKE POST =================
export const toggleLikePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user already liked the post
    const isLiked = post.likes && post.likes.includes(userId);
    
    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(like => like.toString() !== userId.toString());
      // Remove from user's likedPosts
      await User.findByIdAndUpdate(userId, {
        $pull: { likedPosts: id }
      });
    } else {
      // Like the post
      if (!post.likes) post.likes = [];
      post.likes.push(userId);
      // Add to user's likedPosts
      await User.findByIdAndUpdate(userId, {
        $push: { likedPosts: id }
      });
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      data: {
        isLiked: !isLiked,
        likesCount: post.likes ? post.likes.length : 0
      }
    });
  } catch (err) {
    console.error("Toggle Like Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= GET LEADERBOARD =================
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const posts = await Post.find({})
      .populate('creator', 'userName fullName avatar')
      .sort({ votes: -1 })
      .limit(parseInt(limit));

    // Add ranking number to each post
    const leaderboard = posts.map((post, index) => ({
      ...post.toObject(),
      rank: index + 1
    }));

    res.status(200).json({
      success: true,
      message: "Leaderboard retrieved successfully",
      data: {
        leaderboard,
        totalPosts: leaderboard.length
      }
    });
  } catch (err) {
    console.error("Get Leaderboard Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= VOTE POST =================
export const votePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const userId = req.user._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Initialize votes if not exists
    if (post.votes === undefined) {
      post.votes = 0;
    }

    // Update votes based on vote type
    if (voteType === 'upvote') {
      post.votes += 1;
    } else if (voteType === 'downvote') {
      post.votes -= 1;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid vote type. Use 'upvote' or 'downvote'"
      });
    }

    await post.save();

    res.status(200).json({
      success: true,
      message: `Post ${voteType} successful`,
      data: {
        votes: post.votes
      }
    });
  } catch (err) {
    console.error("Vote Post Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};