import { z } from 'zod';

// =====================================================
// USER & AUTH SCHEMAS
// =====================================================

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address'),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;

// =====================================================
// GROUP SCHEMAS
// =====================================================

export const createGroupSchema = z.object({
  name: z.string()
    .min(3, 'Group name must be at least 3 characters')
    .max(100, 'Group name must be less than 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  avatar: z.string()
    .url('Invalid avatar URL')
    .optional()
    .or(z.literal('')),
  parentId: z.string().uuid('Invalid parent group ID').optional().nullable(),
  isPublic: z.boolean().default(false),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

export const updateGroupSchema = createGroupSchema.partial();

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

export const groupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  avatar: z.string().url().optional(),
  parentId: z.string().uuid().nullable(),
  level: z.number().int().min(0),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  inviteCode: z.string(),
  isPublic: z.boolean(),
});

export type Group = z.infer<typeof groupSchema>;

// =====================================================
// GROUP MEMBER SCHEMAS
// =====================================================

export const groupRoleSchema = z.enum(['admin', 'moderator', 'member']);
export type GroupRole = z.infer<typeof groupRoleSchema>;

export const groupMemberSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
  user: userSchema.optional(),
  role: groupRoleSchema,
  joinedAt: z.string().datetime(),
  invitedBy: z.string().uuid().optional(),
});

export type GroupMember = z.infer<typeof groupMemberSchema>;

export const updateMemberRoleSchema = z.object({
  role: groupRoleSchema,
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;

// =====================================================
// POST SCHEMAS
// =====================================================

export const createPostSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  content: z.string()
    .min(1, 'Post content cannot be empty')
    .max(5000, 'Post content must be less than 5000 characters')
    .trim(),
  images: z.string().url('Invalid image URL').array().max(10, 'Maximum 10 images allowed').optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const postSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  authorId: z.string().uuid(),
  author: userSchema.optional(),
  content: z.string(),
  images: z.string().url().array(),
  likes: z.number().int().min(0).default(0),
  likedBy: z.string().uuid().array().default([]),
  commentsCount: z.number().int().min(0).default(0),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export type Post = z.infer<typeof postSchema>;

// =====================================================
// COMMENT SCHEMAS
// =====================================================

export const createCommentSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim(),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const commentSchema = z.object({
  id: z.string().uuid(),
  postId: z.string().uuid(),
  authorId: z.string().uuid(),
  author: userSchema.optional(),
  content: z.string(),
  parentId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});

export type Comment = z.infer<typeof commentSchema>;

// =====================================================
// NOTIFICATION SCHEMAS
// =====================================================

export const notificationTypeSchema = z.enum([
  'like',
  'comment',
  'mention',
  'group_invite',
  'group_join',
  'promoted',
]);

export type NotificationType = z.infer<typeof notificationTypeSchema>;

export const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: notificationTypeSchema,
  actorId: z.string().uuid(),
  actor: userSchema.optional(),
  postId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  message: z.string(),
  read: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export type Notification = z.infer<typeof notificationSchema>;

// =====================================================
// INVITATION SCHEMAS
// =====================================================

export const groupInvitationSchema = z.object({
  id: z.string().uuid(),
  groupId: z.string().uuid(),
  invitedBy: z.string().uuid(),
  invitedUserId: z.string().uuid().optional(),
  invitedEmail: z.string().email().optional(),
  inviteCode: z.string(),
  status: z.enum(['pending', 'accepted', 'expired']),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type GroupInvitation = z.infer<typeof groupInvitationSchema>;

// =====================================================
// FILE/MEDIA SCHEMAS
// =====================================================

export const uploadImageSchema = z.object({
  file: z.instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      'File size must be less than 5MB'
    )
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Only JPEG, PNG, WebP, and GIF images are allowed'
    ),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

// =====================================================
// PAGINATION SCHEMAS
// =====================================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// =====================================================
// SEARCH SCHEMAS
// =====================================================

export const searchSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').max(100),
  type: z.enum(['groups', 'posts', 'users']).optional(),
  ...paginationSchema.shape,
});

export type SearchInput = z.infer<typeof searchSchema>;
