'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Post } from '@/types';
import api from '@/lib/api';
import { Edit3, Upload, Calendar, TrendingUp, Heart, MessageCircle, Save, X } from 'lucide-react';
import PostCard from '@/components/PostCard';
import toast from 'react-hot-toast';

interface ProfileData {
  user: User;
  stats: {
    totalPosts: number;
    totalComments: number;
    totalLikedPosts: number;
    totalLikesReceived: number;
  };
  posts: Post[];
}

const ProfilePage = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ userName: '', bio: '' });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const { user, updateUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [user, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile/me');
      setProfileData(response.data.data);
      setEditData({
        userName: response.data.data.user.userName,
        bio: response.data.data.user.bio || ''
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      // Update avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const avatarResponse = await api.put('/users/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        updateUser({ avatar: avatarResponse.data.data.user.avatar });
      }

      // Update profile info
      const profileResponse = await api.put('/users/profile', editData);
      updateUser(profileResponse.data.data.user);
      
      // Refresh profile data
      await fetchProfile();
      
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setAvatarFile(null);
    setAvatarPreview(null);
    if (profileData) {
      setEditData({
        userName: profileData.user.userName,
        bio: profileData.user.bio || ''
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load profile</p>
        <button
          onClick={fetchProfile}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={avatarPreview || profileData.user.avatar}
                alt={profileData.user.userName}
                className="w-24 h-24 rounded-full object-cover"
              />
              {editMode && (
                <label
                  htmlFor="avatar"
                  className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4 text-white" />
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editData.userName}
                      onChange={(e) => setEditData({ ...editData, userName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleUpdateProfile}
                      disabled={updating}
                      className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Save size={16} />
                      <span>{updating ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center space-x-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <X size={16} />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{profileData.user.userName}</h1>
                    <button
                      onClick={() => setEditMode(true)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                  <p className="text-gray-600 mb-3">{profileData.user.email}</p>
                  {profileData.user.bio && (
                    <p className="text-gray-700 mb-3">{profileData.user.bio}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar size={16} className="mr-1" />
                    <span>Joined {formatDate(profileData.user.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Score */}
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{profileData.user.score}</div>
              <div className="text-sm text-gray-500">Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{profileData.stats.totalPosts}</div>
          <div className="text-sm text-gray-500">Posts</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{profileData.stats.totalComments}</div>
          <div className="text-sm text-gray-500">Comments</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{profileData.stats.totalLikesReceived}</div>
          <div className="text-sm text-gray-500">Likes Received</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">{profileData.stats.totalLikedPosts}</div>
          <div className="text-sm text-gray-500">Posts Liked</div>
        </div>
      </div>

      {/* User Posts */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">My Posts</h2>
        {profileData.posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <p className="text-gray-500 text-lg mb-2">No posts yet</p>
            <p className="text-gray-400 mb-4">Share your first post with the community!</p>
            <button
              onClick={() => router.push('/create-post')}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Post
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {profileData.posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;