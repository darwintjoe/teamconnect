import type { User, Post, Comment, Notification } from '@/types';
import { supabase } from './supabase';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url && url !== 'your_supabase_project_url' && url.includes('supabase.co');
};

// LocalStorage fallback helpers
const getFromLocal = (key: string) => {
  const stored = localStorage.getItem(`teamconnect_${key}`);
  return stored ? JSON.parse(stored) : null;
};

const saveToLocal = (key: string, data: any) => {
  localStorage.setItem(`teamconnect_${key}`, JSON.stringify(data));
};

// Generate UUID
export const generateId = () => {
  return crypto.randomUUID();
};

// Default user for when author is not found
const defaultUser = (id: string): User => ({
  id,
  name: 'Unknown User',
  email: '',
  createdAt: new Date().toISOString(),
});

// ==================== USER OPERATIONS ====================

export const getUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage
    const users = getFromLocal('users') || [];
    return users;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return getFromLocal('users') || [];
    }

    return (data || []).map(profile => ({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar_url,
      role: profile.role,
      createdAt: profile.created_at,
    }));
  } catch (err) {
    console.error('Supabase error, using localStorage:', err);
    return getFromLocal('users') || [];
  }
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  if (!isSupabaseConfigured()) {
    const users = getFromLocal('users') || [];
    return users.find((u: User) => u.id === id);
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatar: data.avatar_url,
      role: data.role,
      createdAt: data.created_at,
    };
  } catch (err) {
    console.error('Supabase error:', err);
    return undefined;
  }
};

// ==================== POST OPERATIONS ====================

export const getPosts = async (): Promise<Post[]> => {
  if (!isSupabaseConfigured()) {
    return getFromLocal('posts') || [];
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, author:profiles(*)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return getFromLocal('posts') || [];
    }

    return (data || []).map(post => ({
      id: post.id,
      groupId: post.group_id || 'default',
      authorId: post.user_id,
      author: post.author ? {
        id: post.author.id,
        email: post.author.email,
        name: post.author.name,
        avatar: post.author.avatar_url,
        role: post.author.role,
        createdAt: post.author.created_at,
      } : defaultUser(post.user_id),
      content: post.content,
      images: post.images || [],
      likes: post.likes_count || 0,
      likedBy: [],
      commentsCount: post.comments_count || 0,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    }));
  } catch (err) {
    console.error('Supabase error, using localStorage:', err);
    return getFromLocal('posts') || [];
  }
};

export const getPostsByGroupId = async (groupId: string): Promise<Post[]> => {
  const posts = await getPosts();
  return posts.filter(p => p.groupId === groupId);
};

export const createPost = async (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'commentsCount' | 'author'>): Promise<Post | null> => {
  const newPost: Post = {
    ...post,
    id: generateId(),
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    author: defaultUser(post.authorId),
  };

  if (!isSupabaseConfigured()) {
    const posts = getFromLocal('posts') || [];
    posts.unshift(newPost);
    saveToLocal('posts', posts);
    return newPost;
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: post.authorId,
        group_id: post.groupId,
        content: post.content,
        images: post.images,
      })
      .select(`*, author:profiles(*)`)
      .single();

    if (error || !data) {
      console.error('Error creating post:', error);
      // Fallback to localStorage
      const posts = getFromLocal('posts') || [];
      posts.unshift(newPost);
      saveToLocal('posts', posts);
      return newPost;
    }

    return {
      id: data.id,
      groupId: data.group_id || 'default',
      authorId: data.user_id,
      author: data.author ? {
        id: data.author.id,
        email: data.author.email,
        name: data.author.name,
        avatar: data.author.avatar_url,
        role: data.author.role,
        createdAt: data.author.created_at,
      } : defaultUser(data.user_id),
      content: data.content,
      images: data.images || [],
      likes: data.likes_count || 0,
      likedBy: [],
      commentsCount: data.comments_count || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('Supabase error, using localStorage:', err);
    const posts = getFromLocal('posts') || [];
    posts.unshift(newPost);
    saveToLocal('posts', posts);
    return newPost;
  }
};

export const deletePost = async (id: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    const posts = getFromLocal('posts') || [];
    const filtered = posts.filter((p: Post) => p.id !== id);
    saveToLocal('posts', filtered);
    return true;
  }

  try {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      // Fallback
      const posts = getFromLocal('posts') || [];
      const filtered = posts.filter((p: Post) => p.id !== id);
      saveToLocal('posts', filtered);
      return true;
    }

    return true;
  } catch (err) {
    console.error('Supabase error:', err);
    const posts = getFromLocal('posts') || [];
    const filtered = posts.filter((p: Post) => p.id !== id);
    saveToLocal('posts', filtered);
    return true;
  }
};

export const toggleLike = async (postId: string, userId: string): Promise<{ liked: boolean; likes: number } | null> => {
  const posts = getFromLocal('posts') || [];
  const post = posts.find((p: Post) => p.id === postId);
  
  if (!post) return null;
  
  const hasLiked = post.likedBy?.includes(userId);
  
  if (hasLiked) {
    post.likedBy = post.likedBy.filter((id: string) => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy = [...(post.likedBy || []), userId];
    post.likes = (post.likes || 0) + 1;
  }
  
  saveToLocal('posts', posts);
  
  return { liked: !hasLiked, likes: post.likes };
};

export const hasUserLikedPost = async (postId: string, userId: string): Promise<boolean> => {
  const posts = getFromLocal('posts') || [];
  const post = posts.find((p: Post) => p.id === postId);
  return post?.likedBy?.includes(userId) || false;
};

// ==================== COMMENT OPERATIONS ====================

export const getComments = async (postId?: string): Promise<Comment[]> => {
  const comments = getFromLocal('comments') || [];
  if (postId) {
    return comments.filter((c: Comment) => c.postId === postId);
  }
  return comments;
};

export const createComment = async (comment: Omit<Comment, 'id' | 'createdAt' | 'author'>): Promise<Comment | null> => {
  const newComment: Comment = {
    ...comment,
    id: generateId(),
    createdAt: new Date().toISOString(),
    author: defaultUser(comment.authorId),
  };

  const comments = getFromLocal('comments') || [];
  comments.push(newComment);
  saveToLocal('comments', comments);

  return newComment;
};

export const deleteComment = async (id: string): Promise<boolean> => {
  const comments = getFromLocal('comments') || [];
  const filtered = comments.filter((c: Comment) => c.id !== id);
  saveToLocal('comments', filtered);
  return true;
};

// ==================== NOTIFICATION OPERATIONS ====================

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const notifications = getFromLocal('notifications') || [];
  return notifications.filter((n: Notification) => n.userId === userId);
};

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  const notifications = getFromLocal('notifications') || [];
  const notification = notifications.find((n: Notification) => n.id === id);
  if (notification) {
    notification.read = true;
    saveToLocal('notifications', notifications);
  }
  return true;
};

export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  const notifications = getFromLocal('notifications') || [];
  notifications.forEach((n: Notification) => {
    if (n.userId === userId) n.read = true;
  });
  saveToLocal('notifications', notifications);
  return true;
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  const notifications = getFromLocal('notifications') || [];
  return notifications.filter((n: Notification) => n.userId === userId && !n.read).length;
};

// ==================== REALTIME SUBSCRIPTIONS (NO-OP for localStorage) ====================
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const subscribeToPosts = (_callback?: (post: Post) => void) => {
  return { unsubscribe: () => {} };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const subscribeToComments = (_postId: string, _callback?: (comment: Comment) => void) => {
  return { unsubscribe: () => {} };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const subscribeToNotifications = (_userId: string, _callback?: (notification: Notification) => void) => {
  return { unsubscribe: () => {} };
};
