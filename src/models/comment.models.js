import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    votes: [
        {
            userId: { type: Schema.Types.ObjectId, ref: "User" }, 
            voteType: { type: String, enum: ["upvote", "downvote"] },
        },
    ],
    isEdited: {
        type: Boolean,
        default: false,
    },
    editedAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

export const Comment = mongoose.model("Comment", commentSchema);