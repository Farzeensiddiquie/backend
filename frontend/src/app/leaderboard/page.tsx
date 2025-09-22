'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Post } from '@/types';
import api from '@/lib/api';
import { Trophy, TrendingUp, Heart, MessageCircle, Calendar, Medal, Award } from 'lucide-react';

const LeaderboardPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/posts/leaderboard');
      setPosts(response.data);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{index + 1}</span>;
    }
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 1:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 2:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
        </div>
        <p className="text-gray-600">Top posts ranked by community votes and engagement</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No posts on the leaderboard yet</p>
          <p className="text-gray-400">Be the first to create a post and climb to the top!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post._id}
              className={`bg-white rounded-lg shadow-md border-2 overflow-hidden transition-all hover:shadow-lg ${
                index < 3 ? 'border-yellow-200' : 'border-gray-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {/* Rank */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${getRankBadge(index)}`}>
                    {getRankIcon(index)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <img
                        src={post.creator.avatar}
                        alt={post.creator.userName}
                        className="w-8 h-8 rounded-full"
                      />
                      <Link
                        href={`/user/${post.creator._id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.creator.userName}
                      </Link>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(post.createdAt)}
                      </div>
                    </div>

                    <Link href={`/post/${post._id}`}>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors cursor-pointer">
                        {post.title}
                      </h3>
                    </Link>

                    <p className="text-gray-700 mb-3 line-clamp-2">
                      {post.content}
                    </p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{post.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-1 text-green-600">
                        <TrendingUp size={18} />
                        <span className="font-semibold">{post.votes}</span>
                        <span className="text-sm text-gray-500">votes</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-red-600">
                        <Heart size={18} />
                        <span className="font-semibold">{post.likes.length}</span>
                        <span className="text-sm text-gray-500">likes</span>
                      </div>
                      
                      <div className="flex items-center space-x-1 text-blue-600">
                        <MessageCircle size={18} />
                        <span className="font-semibold">{post.comments.length}</span>
                        <span className="text-sm text-gray-500">comments</span>
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  {post.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Special styling for top 3 */}
              {index < 3 && (
                <div className={`h-1 ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                  index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                  'bg-gradient-to-r from-amber-400 to-amber-600'
                }`} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;