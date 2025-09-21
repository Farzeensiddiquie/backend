import { Comment } from "../models/comment.models.js";
import { Post } from "../models/post.models.js";
import { User } from "../models/user.models.js";

// ================= CREATE COMMENT =================
export const createComment = async (req, res) => {
  try {
    const { postId, content } = req.body;
    const authorId = req.user._id;

    if (!postId || !content) {
      return res.status(400).json({
        success: false,
        message: "Post ID and content are required"
      });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = new Comment({
      postId,
      content,
      author: authorId
    });

    await comment.save();

    // Add comment to post's comments array
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: comment._id }
    });

    // Add comment to user's comments array
    await User.findByIdAndUpdate(authorId, {
      $push: { comments: comment._id }
    });

    // Populate author details
    await comment.populate('author', 'userName fullName avatar');

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment
    });
  } catch (err) {
    console.error("Create Comment Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= GET COMMENTS BY POST =================
export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ postId })
      .populate('author', 'userName fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({ postId });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNext: page < Math.ceil(totalComments / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get Comments Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= UPDATE COMMENT =================
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required"
      });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own comments"
      });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        content,
        isEdited: true,
        editedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('author', 'userName fullName avatar');

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment
    });
  } catch (err) {
    console.error("Update Comment Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= DELETE COMMENT =================
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments"
      });
    }

    // Remove comment from post's comments array
    await Post.findByIdAndUpdate(comment.postId, {
      $pull: { comments: id }
    });

    // Remove comment from user's comments array
    await User.findByIdAndUpdate(comment.author, {
      $pull: { comments: id }
    });

    await Comment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (err) {
    console.error("Delete Comment Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= VOTE COMMENT =================
export const voteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({
        success: false,
        message: "Vote type must be 'upvote' or 'downvote'"
      });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Check if user already voted
    const existingVote = comment.votes.find(vote => 
      vote.userId.toString() === userId.toString()
    );

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        comment.votes = comment.votes.filter(vote => 
          vote.userId.toString() !== userId.toString()
        );
      } else {
        // Update vote type
        existingVote.voteType = voteType;
      }
    } else {
      // Add new vote
      comment.votes.push({ userId, voteType });
    }

    await comment.save();

    const upvotes = comment.votes.filter(vote => vote.voteType === 'upvote').length;
    const downvotes = comment.votes.filter(vote => vote.voteType === 'downvote').length;

    res.status(200).json({
      success: true,
      message: "Vote updated successfully",
      data: {
        upvotes,
        downvotes,
        totalVotes: upvotes - downvotes
      }
    });
  } catch (err) {
    console.error("Vote Comment Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ================= GET USER COMMENTS =================
export const getUserComments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const comments = await Comment.find({ author: userId })
      .populate('postId', 'title')
      .populate('author', 'userName fullName avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalComments = await Comment.countDocuments({ author: userId });

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasNext: page < Math.ceil(totalComments / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get User Comments Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
