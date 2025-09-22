'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import { Heart, MessageCircle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface PostCardProps {
  post: Post;
  onUpdate?: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onUpdate }) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user._id) : false);
  const [likesCount, setLikesCount] = useState(post.likes.length);
  const [votes, setVotes] = useState(post.votes);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      const response = await api.post(`/posts/${post._id}/like`);
      const newLikesCount = response.data.likes.length;
      setLikesCount(newLikesCount);
      setIsLiked(!isLiked);
      
      if (onUpdate) {
        onUpdate({ ...post, likes: response.data.likes });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to like post');
    }
  };

  const handleVote = async (type: 'up' | 'down') => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    try {
      const response = await api.post(`/posts/${post._id}/vote`, { type });
      setVotes(response.data.votes);
      
      if (onUpdate) {
        onUpdate({ ...post, votes: response.data.votes });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to vote');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={post.creator.avatar}
            alt={post.creator.userName}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <Link
              href={`/user/${post.creator._id}`}
              className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
            >
              {post.creator.userName}
            </Link>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar size={14} className="mr-1" />
              {formatDate(post.createdAt)}
            </div>
          </div>
        </div>

        {/* Content */}
        <Link href={`/post/${post._id}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-blue-600 transition-colors cursor-pointer">
            {post.title}
          </h2>
        </Link>
        
        <p className="text-gray-700 mb-4 line-clamp-3">
          {post.content}
        </p>

        {/* Image */}
        {post.image && (
          <div className="mb-4">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {/* Vote buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleVote('up')}
                className="p-2 rounded-full hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors"
                disabled={!user}
              >
                <TrendingUp size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700">{votes}</span>
              <button
                onClick={() => handleVote('down')}
                className="p-2 rounded-full hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                disabled={!user}
              >
                <TrendingDown size={18} />
              </button>
            </div>

            {/* Like button */}
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 p-2 rounded-full transition-colors ${
                isLiked
                  ? 'text-red-600 bg-red-50'
                  : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
              }`}
              disabled={!user}
            >
              <Heart size={18} fill={isLiked ? 'currentColor' : 'none'} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>

            {/* Comments */}
            <Link
              href={`/post/${post._id}`}
              className="flex items-center space-x-1 p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="text-sm font-medium">{post.comments.length}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;