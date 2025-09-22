export interface User {
  _id: string;
  userName: string;
  email: string;
  avatar: string;
  bio: string;
  score: number;
  isActive?: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Post {
  _id: string;
  title: string;
  content: string;
  tags: string[];
  creator: {
    _id: string;
    userName: string;
    avatar: string;
  };
  comments: string[];
  image?: string;
  likes: string[];
  votes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  postId: string;
  content: string;
  author: {
    _id: string;
    userName: string;
    avatar: string;
  };
  votes: Array<{
    userId: string;
    voteType: 'upvote' | 'downvote';
  }>;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}