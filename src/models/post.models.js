import mongoose, { Schema } from "mongoose";

const postSchema = new Schema(
  {
    title: { 
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      }
    ],
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    image: {
      type: String,
      default: null,   // optional now
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    votes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Optional indexes for better query performance
postSchema.index({ title: "text", content: "text", tags: 1 });

export const Post = mongoose.model("Post", postSchema);
