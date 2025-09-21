import { User } from "../models/user.models.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// Debug: Log environment variables
console.log("Environment check:", {
    cloudinary_url: process.env.CLOUDINARY_URL ? "***" + process.env.CLOUDINARY_URL.slice(-10) : "undefined",
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY ? "***" + process.env.API_KEY.slice(-4) : "undefined"
});

// Configure Cloudinary with explicit credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME || "dqxmgdj5i",
    api_key: process.env.API_KEY || "766337761652718", 
    api_secret: process.env.API_SECRET || "WdKmctLgJyXhgisDeBbLAcAaVss",
    secure: true
});

const uploadToCloudinary = (fileBuffer, folder = "avatars") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (result) resolve(result);
      else reject(error);
    });
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {
    const { userName, fullName, email, password, bio } = req.body;

    if (!userName || !fullName || !email || !password || !bio) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { userName }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Default avatar
    let avatarUrl = "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg";

    // Upload avatar if file exists
    if (req.file && req.file.buffer) {
      console.log("Uploading avatar to Cloudinary...");
      try {
        const result = await uploadToCloudinary(req.file.buffer);
        avatarUrl = result.secure_url;
        console.log("Avatar uploaded successfully:", avatarUrl);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        // Continue with default avatar if upload fails
      }
    }

    const user = new User({ userName, fullName, email, password, avatar: avatarUrl, bio });
    await user.save();

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          _id: user._id,
          userName: user.userName,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          score: user.score,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= LOGIN =================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const isValid = await user.isPasswordCorrect(password);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          userName: user.userName,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          score: user.score,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= PROFILE =================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate('posts', 'title createdAt likes')
      .populate('comments', 'content createdAt postId')
      .populate('likedPosts', 'title createdAt creator');

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Calculate additional stats
    const totalPosts = user.posts.length;
    const totalComments = user.comments.length;
    const totalLikedPosts = user.likedPosts.length;
    
    // Calculate total likes received on user's posts
    const totalLikesReceived = user.posts.reduce((total, post) => {
      return total + (post.likes ? post.likes.length : 0);
    }, 0);

    res.status(200).json({ 
      success: true, 
      data: {
        user: {
          _id: user._id,
          userName: user.userName,
          fullName: user.fullName,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          score: user.score,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        stats: {
          totalPosts,
          totalComments,
          totalLikedPosts,
          totalLikesReceived
        },
        posts: user.posts,
        comments: user.comments,
        likedPosts: user.likedPosts
      }
    });
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= UPDATE AVATAR =================
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Avatar image is required"
      });
    }

    console.log("Uploading new avatar to Cloudinary...");
    
    // Upload new avatar
    const result = await uploadToCloudinary(req.file.buffer);
    const newAvatarUrl = result.secure_url;
    
    console.log("New avatar uploaded successfully:", newAvatarUrl);

    // Update user's avatar
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: newAvatarUrl },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Avatar updated successfully",
      data: {
        user: {
          _id: updatedUser._id,
          userName: updatedUser.userName,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          score: updatedUser.score
        }
      }
    });
  } catch (err) {
    console.error("Update Avatar Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, userName } = req.body;

    // Check if userName is being changed and if it's available
    if (userName) {
      const existingUser = await User.findOne({ 
        userName: userName,
        _id: { $ne: userId }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken"
        });
      }
    }

    // Build update object
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (userName) updateData.userName = userName;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          _id: updatedUser._id,
          userName: updatedUser.userName,
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          score: updatedUser.score
        }
      }
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= LOGOUT =================
export const logoutUser = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none"
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully"
    });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// ================= GET USER BY ID =================
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select("-password -email")
      .populate('posts', 'title createdAt likes image')
      .populate('comments', 'content createdAt postId');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Calculate stats
    const totalPosts = user.posts.length;
    const totalComments = user.comments.length;
    const totalLikesReceived = user.posts.reduce((total, post) => {
      return total + (post.likes ? post.likes.length : 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          userName: user.userName,
          fullName: user.fullName,
          avatar: user.avatar,
          bio: user.bio,
          score: user.score,
          createdAt: user.createdAt
        },
        stats: {
          totalPosts,
          totalComments,
          totalLikesReceived
        },
        posts: user.posts,
        comments: user.comments
      }
    });
  } catch (err) {
    console.error("Get User By ID Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};
