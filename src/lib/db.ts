import type { User, Post, Comment, Notification } from '@/types';

// Generate UUID
export const generateId = () => {
  return crypto.randomUUID();
};

// LocalStorage keys
const KEYS = {
  USERS: 'teamconnect_users',
  POSTS: 'teamconnect_posts',
  COMMENTS: 'teamconnect_comments',
  NOTIFICATIONS: 'teamconnect_notifications',
  CURRENT_USER: 'teamconnect_current_user',
  MEDIA_ITEMS: 'teamconnect_media_items',
};

// Media storage - 6 months expiration
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export interface MediaItem {
  id: string;
  url: string;
  postId: string;
  groupId: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt: string;
  isDeleted: boolean;
}

// Clean up expired media
export const cleanupExpiredMedia = (): void => {
  const media = JSON.parse(localStorage.getItem(KEYS.MEDIA_ITEMS) || '[]') as MediaItem[];
  const now = new Date().toISOString();
  
  media.forEach(item => {
    if (!item.isDeleted && item.expiresAt < now) {
      item.isDeleted = true;
      // In a real app, you would also delete from server storage here
    }
  });
  
  localStorage.setItem(KEYS.MEDIA_ITEMS, JSON.stringify(media));
};

// Track uploaded media
export const trackMedia = (url: string, postId: string, groupId: string, uploadedBy: string): MediaItem => {
  const media = JSON.parse(localStorage.getItem(KEYS.MEDIA_ITEMS) || '[]') as MediaItem[];
  
  const newItem: MediaItem = {
    id: generateId(),
    url,
    postId,
    groupId,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SIX_MONTHS_MS).toISOString(),
    isDeleted: false,
  };
  
  media.push(newItem);
  localStorage.setItem(KEYS.MEDIA_ITEMS, JSON.stringify(media));
  
  return newItem;
};

// Initialize with demo data
const initDemoData = () => {
  const users: User[] = [
    {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      role: 'Product Manager',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      id: 'user-2',
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      role: 'Engineering Lead',
      createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    },
    {
      id: 'user-3',
      name: 'Mike Williams',
      email: 'mike@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      role: 'Designer',
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
    {
      id: 'user-4',
      name: 'Emily Davis',
      email: 'emily@company.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily',
      role: 'Marketing Manager',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ];

  const now = new Date().toISOString();
  const posts: Post[] = [
    {
      id: 'post-1',
      groupId: 'group-1',
      authorId: 'user-1',
      author: users[0],
      content: 'Excited to share that our Q4 product roadmap is now finalized! Looking forward to all the amazing features we\'ll be shipping. 🚀',
      images: [],
      likes: 12,
      likedBy: ['user-2', 'user-3', 'user-4'],
      commentsCount: 3,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: now,
    },
    {
      id: 'post-2',
      groupId: 'group-2',
      authorId: 'user-2',
      author: users[1],
      content: 'Just deployed a major performance improvement to our API. Response times are now 40% faster! 💪',
      images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80'],
      likes: 18,
      likedBy: ['user-1', 'user-3', 'user-4'],
      commentsCount: 5,
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: now,
    },
    {
      id: 'post-3',
      groupId: 'group-3',
      authorId: 'user-3',
      author: users[2],
      content: 'New design system is coming together nicely! Here\'s a sneak peek of our updated component library.',
      images: [
        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
        'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=800&q=80',
      ],
      likes: 24,
      likedBy: ['user-1', 'user-2', 'user-4'],
      commentsCount: 7,
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
      updatedAt: now,
    },
    {
      id: 'post-4',
      groupId: 'group-5',
      authorId: 'user-4',
      author: users[3],
      content: 'Team lunch today was amazing! Great conversations and even better food. 🍕',
      images: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80',
      ],
      likes: 31,
      likedBy: ['user-1', 'user-2', 'user-3'],
      commentsCount: 8,
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: now,
    },
    {
      id: 'post-5',
      groupId: 'group-4',
      authorId: 'user-2',
      author: users[1],
      content: 'Welcome to our newest team member! Excited to have you on board. 🎉',
      images: [],
      likes: 15,
      likedBy: ['user-2', 'user-3'],
      commentsCount: 4,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: now,
    },
  ];

  const comments: Comment[] = [
    {
      id: 'comment-1',
      postId: 'post-1',
      authorId: 'user-2',
      author: users[1],
      content: 'Can\'t wait to see what we build! The roadmap looks solid.',
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    },
    {
      id: 'comment-2',
      postId: 'post-1',
      authorId: 'user-3',
      author: users[2],
      content: 'Great work on putting this together!',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'comment-3',
      postId: 'post-2',
      authorId: 'user-1',
      author: users[0],
      content: 'This is huge! Our users are going to love the speed improvements.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'comment-4',
      postId: 'post-2',
      authorId: 'user-4',
      author: users[3],
      content: 'Amazing work team! 🚀',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 'comment-5',
      postId: 'post-3',
      authorId: 'user-1',
      author: users[0],
      content: 'The new components look fantastic! Clean and modern.',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ];

  const notifications: Notification[] = [
    {
      id: 'notif-1',
      userId: 'user-1',
      type: 'like',
      actorId: 'user-2',
      actor: users[1],
      postId: 'post-1',
      message: 'Sarah Chen liked your post',
      read: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'notif-2',
      userId: 'user-1',
      type: 'comment',
      actorId: 'user-3',
      actor: users[2],
      postId: 'post-1',
      message: 'Mike Williams commented on your post',
      read: false,
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
  localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments));
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

// Initialize data if not exists
const initDB = () => {
  if (!localStorage.getItem(KEYS.USERS)) {
    initDemoData();
  }
};

// User operations
export const getUsers = (): User[] => {
  initDB();
  return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
};

export const getUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return getUsers().find(u => u.email === email);
};

export const createUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return newUser;
};

export const updateUser = (id: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates };
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  return users[index];
};

// Post operations
export const getPosts = (): Post[] => {
  initDB();
  const posts = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
  // Enrich with author data
  return posts.map((post: Post) => ({
    ...post,
    author: getUserById(post.authorId),
  })).sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPostById = (id: string): Post | undefined => {
  const post = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]').find((p: Post) => p.id === id);
  if (post) {
    post.author = getUserById(post.authorId);
  }
  return post;
};

export const getPostsByUserId = (userId: string): Post[] => {
  return getPosts().filter(p => p.authorId === userId);
};

export const getPostsByGroupId = (groupId: string): Post[] => {
  return getPosts().filter(p => p.groupId === groupId);
};

export const getPostsByGroupIds = (groupIds: string[]): Post[] => {
  return getPosts().filter(p => groupIds.includes(p.groupId));
};

export const createPost = (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'commentsCount' | 'author'>): Post => {
  const posts = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
  const newPost: Post = {
    ...post,
    id: generateId(),
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: new Date().toISOString(),
    author: getUserById(post.authorId)!,
  };
  posts.push(newPost);
  localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
  
  // Track media for cleanup
  if (post.images && post.images.length > 0) {
    post.images.forEach(url => {
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        trackMedia(url, newPost.id, post.groupId, post.authorId);
      }
    });
  }
  
  return newPost;
};

export const updatePost = (id: string, updates: Partial<Post>): Post | null => {
  const posts = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
  const index = posts.findIndex((p: Post) => p.id === id);
  if (index === -1) return null;
  posts[index] = { ...posts[index], ...updates };
  localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
  return { ...posts[index], author: getUserById(posts[index].authorId) };
};

export const deletePost = (id: string): boolean => {
  const posts = JSON.parse(localStorage.getItem(KEYS.POSTS) || '[]');
  const filtered = posts.filter((p: Post) => p.id !== id);
  if (filtered.length === posts.length) return false;
  localStorage.setItem(KEYS.POSTS, JSON.stringify(filtered));
  // Also delete associated comments
  const comments = JSON.parse(localStorage.getItem(KEYS.COMMENTS) || '[]');
  const filteredComments = comments.filter((c: Comment) => c.postId !== id);
  localStorage.setItem(KEYS.COMMENTS, JSON.stringify(filteredComments));
  return true;
};

export const toggleLike = (postId: string, userId: string): { liked: boolean; likes: number } => {
  const post = getPostById(postId);
  if (!post) return { liked: false, likes: 0 };
  
  const isLiked = post.likedBy.includes(userId);
  if (isLiked) {
    post.likedBy = post.likedBy.filter(id => id !== userId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    post.likedBy.push(userId);
    post.likes += 1;
  }
  
  updatePost(postId, { likedBy: post.likedBy, likes: post.likes });
  
  // Create notification if liking someone else's post
  if (!isLiked && post.authorId !== userId) {
    createNotification({
      userId: post.authorId,
      type: 'like',
      actorId: userId,
      postId,
      message: `${getUserById(userId)?.name} liked your post`,
    });
  }
  
  return { liked: !isLiked, likes: post.likes };
};

// Comment operations
export const getComments = (postId?: string): Comment[] => {
  initDB();
  const comments = JSON.parse(localStorage.getItem(KEYS.COMMENTS) || '[]');
  const enriched = comments.map((comment: Comment) => ({
    ...comment,
    author: getUserById(comment.authorId),
  }));
  if (postId) {
    return enriched.filter((c: Comment) => c.postId === postId);
  }
  return enriched;
};

export const createComment = (comment: Omit<Comment, 'id' | 'createdAt' | 'author'>): Comment => {
  const comments = JSON.parse(localStorage.getItem(KEYS.COMMENTS) || '[]');
  const newComment: Comment = {
    ...comment,
    id: generateId(),
    createdAt: new Date().toISOString(),
    author: getUserById(comment.authorId)!,
  };
  comments.push(newComment);
  localStorage.setItem(KEYS.COMMENTS, JSON.stringify(comments));
  
  // Update post comments count
  const post = getPostById(comment.postId);
  if (post) {
    updatePost(comment.postId, { commentsCount: post.commentsCount + 1 });
  }
  
  // Create notification if commenting on someone else's post
  if (post && post.authorId !== comment.authorId) {
    createNotification({
      userId: post.authorId,
      type: 'comment',
      actorId: comment.authorId,
      postId: comment.postId,
      message: `${getUserById(comment.authorId)?.name} commented on your post`,
    });
  }
  
  return newComment;
};

export const deleteComment = (id: string): boolean => {
  const comments = JSON.parse(localStorage.getItem(KEYS.COMMENTS) || '[]');
  const comment = comments.find((c: Comment) => c.id === id);
  if (!comment) return false;
  
  const filtered = comments.filter((c: Comment) => c.id !== id);
  localStorage.setItem(KEYS.COMMENTS, JSON.stringify(filtered));
  
  // Update post comments count
  const post = getPostById(comment.postId);
  if (post) {
    updatePost(comment.postId, { commentsCount: Math.max(0, post.commentsCount - 1) });
  }
  
  return true;
};

// Notification operations
export const getNotifications = (userId: string): Notification[] => {
  initDB();
  const notifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
  return notifications
    .filter((n: Notification) => n.userId === userId)
    .map((n: Notification) => ({
      ...n,
      actor: getUserById(n.actorId),
    }))
    .sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read' | 'actor'> & { actor?: User }): Notification => {
  const notifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    read: false,
    createdAt: new Date().toISOString(),
    actor: notification.actor || getUserById(notification.actorId)!,
  };
  notifications.push(newNotification);
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return newNotification;
};

export const markNotificationAsRead = (id: string): boolean => {
  const notifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
  const index = notifications.findIndex((n: Notification) => n.id === id);
  if (index === -1) return false;
  notifications[index].read = true;
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  return true;
};

export const markAllNotificationsAsRead = (userId: string): void => {
  const notifications = JSON.parse(localStorage.getItem(KEYS.NOTIFICATIONS) || '[]');
  notifications.forEach((n: Notification) => {
    if (n.userId === userId) {
      n.read = true;
    }
  });
  localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const getUnreadCount = (userId: string): number => {
  return getNotifications(userId).filter(n => !n.read).length;
};

// Auth operations
export const getCurrentUser = (): User | null => {
  const userJson = localStorage.getItem(KEYS.CURRENT_USER);
  return userJson ? JSON.parse(userJson) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

export const login = (email: string): User | null => {
  const user = getUserByEmail(email);
  if (user) {
    setCurrentUser(user);
    return user;
  }
  return null;
};

export const logout = (): void => {
  setCurrentUser(null);
};

// Clear all data (for testing)
export const clearAllData = (): void => {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
};
