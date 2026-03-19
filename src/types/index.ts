// User types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  createdAt: string;
}

// Group types - Hierarchical structure
export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  parentId: string | null; // null = top-level group
  level: number; // 0 = company/regional, 1 = department/city, 2 = branch/area, etc.
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  inviteCode: string; // For invitation links
  isPublic: boolean; // Can be discovered or invite-only
}

// Group membership with roles
export type GroupRole = 'admin' | 'moderator' | 'member';

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: User;
  role: GroupRole;
  joinedAt: string;
  invitedBy?: string;
}

// Post types - now linked to groups
export interface Post {
  id: string;
  groupId: string; // Which group this post belongs to
  authorId: string;
  author: User;
  content: string;
  images: string[];
  likes: number;
  likedBy: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt?: string;
}

// Comment types
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  parentId?: string;
  createdAt: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'mention' | 'group_invite' | 'group_join' | 'promoted';
  actorId: string;
  actor: User;
  postId?: string;
  groupId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// Invitation types
export interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;
  invitedUserId?: string; // null = open invitation via link
  invitedEmail?: string;
  inviteCode: string;
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

// Media storage tracking
export interface MediaItem {
  id: string;
  url: string;
  postId: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt: string; // 6 months from upload
  isDeleted: boolean;
}

// Auth state
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// App state
export interface AppState {
  posts: Post[];
  notifications: Notification[];
  currentUser: User | null;
  currentGroup: Group | null;
  userGroups: Group[];
}
