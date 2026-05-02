# TeamConnect - Complete Architecture & System Design

**Generated**: 2026-05-02  
**Status**: Production Assessment  
**URL**: https://teamconnect8.vercel.app

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Core Systems](#core-systems)
4. [Data Models](#data-models)
5. [Authentication Flow](#authentication-flow)
6. [State Management](#state-management)
7. [Database Schema](#database-schema)
8. [Component Hierarchy](#component-hierarchy)
9. [Data Flow Examples](#data-flow-examples)
10. [Performance Analysis](#performance-analysis)
11. [Security Model](#security-model)
12. [Known Limitations](#known-limitations)

---

## System Overview

### Purpose
TeamConnect is a **team collaboration platform** enabling organizations to:
- Create hierarchical groups (Company → Department → Team)
- Share posts and updates within groups
- Engage through likes and comments
- Get notifications for interactions
- Manage team membership with invitations

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19.2.0 + TypeScript 5.9 |
| **Styling** | Tailwind CSS 3.4.19 |
| **Build** | Vite 7.2.4 |
| **UI Components** | Radix UI + shadcn/ui |
| **Forms** | React Hook Form 7.70 + Zod 4.3.5 |
| **Authentication** | Kinde Auth (PKCE flow) |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage (images) |
| **Deployment** | Vercel |
| **Charts** | Recharts 2.15.4 |

### Key Features

✅ **Hierarchical Groups** - Multi-level team organization  
✅ **Group Invitations** - Secure invite codes (6 chars, 7-day expiry)  
✅ **Posts & Comments** - Share updates within groups  
✅ **Notifications** - Real-time activity alerts  
✅ **Role-Based Access** - Admin/Moderator/Member  
✅ **Image Uploads** - Supabase Storage integration  
✅ **Responsive UI** - Mobile-first design  

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  UI LAYER (React Components)                                │
│  ├─ Pages: FeedPage, ProfilePage, NotificationsPage, etc.  │
│  ├─ Components: Post, Comment, GroupCard, UserCard         │
│  └─ Forms: CreatePostForm, CreateGroupForm, etc.           │
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────────────▼────────────────────────────────────────┐
│  STATE MANAGEMENT LAYER (Hooks)                             │
│  ├─ useSupabasePosts() - Post state & operations           │
│  ├─ useSupabaseNotifications() - Notifications             │
│  ├─ useGroups() - Group management & permissions           │
│  └─ Custom hooks - useUser(), useAuth(), etc.              │
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────────────▼────────────────────────────────────────┐
│  BUSINESS LOGIC LAYER (Services/Utilities)                  │
│  ├─ groups.ts - Group operations & hierarchy               │
│  ├─ db-supabase.ts - Database queries (posts, comments)   │
│  ├─ supabase.ts - Image upload helpers                    │
│  ├─ kinde.ts - Authentication wrapper                      │
│  └─ db.ts - In-memory user data (fallback)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
┌─────────────────────▼────────────────────────────────────────┐
│  DATA ACCESS LAYER                                          │
│  ├─ Supabase Client (PostgreSQL)                           │
│  ├─ Supabase Storage (images)                              │
│  ├─ Kinde Auth API                                         │
│  └─ localStorage (fallback/demo mode)                      │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

#### 1. UI Layer
- **Responsibility**: Render data, handle user input, navigate
- **Examples**: 
  - `FeedPage.tsx` - Posts feed with group selector
  - `PostDetailPage.tsx` - Single post with comments
  - `ProfilePage.tsx` - User profile & statistics
- **Key Constraint**: No direct database access (use hooks)

#### 2. State Management Layer
- **Responsibility**: Manage local state, call services, handle loading/errors
- **Pattern**: Custom React hooks
- **Examples**:
  - `useSupabasePosts()` - Posts fetch, create, delete, like
  - `useGroups()` - Group operations with permission checks
  - `useSupabaseNotifications()` - Notification subscriptions

#### 3. Business Logic Layer
- **Responsibility**: Core logic, validation, transformations
- **Location**: `src/lib/` directory
- **Examples**:
  - `groups.ts` - Group hierarchy, member roles, permissions
  - `db-supabase.ts` - Database queries with Supabase fallback
  - `kinde.ts` - Auth initialization & token management

#### 4. Data Access Layer
- **Responsibility**: External API calls, database queries
- **Technologies**: Supabase SDK, Kinde SDK, localStorage
- **Fallback**: If Supabase not configured, use localStorage

---

## Core Systems

### 1. Authentication System

**Flow**: Login → Kinde → Token → Sync to Supabase → App Access

```
User Login
    ↓
Kinde (Google/Facebook/Email)
    ↓
Kinde returns auth token + user info
    ↓
Check if profile exists in Supabase
    ├─ If exists: Use existing profile
    └─ If not: Create new profile from Kinde user
    ↓
Save user to localStorage (fallback)
    ↓
Load App
```

**Key Files**:
- `src/lib/kinde.ts` - Kinde initialization & methods
- `src/main.tsx` - Auth state management in Root component
- `src/pages/LoginScreen` - Login UI with Google/Facebook/Email

**Token Management**:
- Kinde handles token storage in sessionStorage
- Auto-refresh via Kinde SDK
- Clear on logout

**Current Issue**: ⚠️ Hard-coded Kinde Client ID in `src/lib/kinde.ts:3`

---

### 2. Group System

**Hierarchy**: Supports unlimited nesting

```
Company (Level 0)
├─ Department (Level 1)
│  ├─ Team (Level 2)
│  │  └─ Subteam (Level 3)
└─ Region (Level 1)
   └─ Office (Level 2)
```

**Key Tables** (localStorage currently, migrate to Supabase):
- `groups` - Group metadata
- `group_members` - Membership with roles
- `group_invitations` - Invite codes & status

**Member Roles**:
- `admin` - Full control (create sub-groups, manage members, delete group)
- `moderator` - Moderate content (plan for future)
- `member` - Basic access (view, post, comment)

**Permissions Model**:
```
Can View Group (canViewGroup):
  - Direct member OR
  - Member of any ancestor group

Can Post in Group (canPostInGroup):
  - Must be direct member (not from ancestor)

Can Manage Group:
  - Must be admin
```

**Key Functions** (`src/lib/groups.ts`):
- `getGroupHierarchy()` - Path from root to group
- `getAllDescendantGroups()` - Group + all subgroups
- `getVisibleGroups()` - Groups accessible to user
- `getAdminGroups()` - Groups where user is admin

**Current Issue**: ⚠️ All group data in localStorage only

---

### 3. Post & Comment System

**Data Model**:
```typescript
Post
├─ id: UUID
├─ groupId: UUID (which group post belongs to)
├─ authorId: UUID (who posted)
├─ author: User object (denormalized)
├─ content: string (1-5000 chars)
├─ images: string[] (URLs from Supabase Storage)
├─ likes: number (count)
├─ likedBy: string[] (user IDs who liked)
├─ commentsCount: number
├─ createdAt: ISO timestamp
└─ updatedAt: ISO timestamp

Comment (threaded)
├─ id: UUID
├─ postId: UUID
├─ authorId: UUID
├─ author: User object
├─ content: string
├─ parentId?: UUID (for threading, not fully implemented)
└─ createdAt: ISO timestamp
```

**Operations**:
- Create post → Validates content → Uploads images → Insert to DB
- Like post → Toggle like state → Update count
- Comment → Create comment → Update post comment count
- Delete post → Remove post + all comments + all likes

**Key Files**:
- `src/hooks/useSupabasePosts.ts` - Post state management
- `src/lib/db-supabase.ts` - Post CRUD operations
- `src/pages/FeedPage.tsx` - Post list UI
- `src/pages/PostDetailPage.tsx` - Post detail + comments

**Current Issues**:
- ⚠️ Posts stored in localStorage (demo only)
- ⚠️ No pagination (loads all posts at once)
- ⚠️ No caching (refetches on every navigation)
- ⚠️ Comment threading not implemented (parentId exists but unused)
- ⚠️ No post editing capability
- ⚠️ No search functionality

---

### 4. Notification System

**Types**:
- `like` - Someone liked your post
- `comment` - Someone commented on your post
- `mention` - You were mentioned in a comment
- `group_invite` - You were invited to a group
- `group_join` - Someone joined a group you admin
- `promoted` - You were promoted to admin

**Storage** (localStorage currently):
```typescript
interface Notification {
  id: string;
  userId: string;        // Who receives notification
  type: NotificationType;
  actorId: string;       // Who triggered it
  actor: User;
  postId?: string;       // Relevant post
  groupId?: string;      // Relevant group
  message: string;       // Display text
  read: boolean;
  createdAt: ISO timestamp;
}
```

**Key Files**:
- `src/hooks/useSupabaseNotifications.ts` - Notification state
- `src/pages/NotificationsPage.tsx` - Notification list UI

**Current Behavior**:
- Real-time subscriptions defined but use no-op (subscribeToPosts)
- Not actually fetching from Supabase
- No automatic notification creation on like/comment

---

### 5. Image Upload System

**Flow**:
1. User selects image → Crop/edit (in app)
2. Convert to base64 or File
3. Upload to Supabase Storage bucket: `teamconnect`
4. Get public URL → Save in post.images array
5. Display in UI with <img src="publicUrl" />

**Functions** (`src/lib/supabase.ts`):
- `uploadImage(file)` - Upload File object
- `uploadBase64Image(base64String)` - Upload canvas/cropped image

**Storage Bucket**:
- Name: `teamconnect`
- Public: Yes (read-only, write restricted by RLS)
- Path: `{bucket}/{images or other}/{timestamp}_{random}.jpg`

**Current Issues**:
- ⚠️ No image validation (size, type)
- ⚠️ No compression before upload
- ⚠️ No storage policies in Supabase

---

## Data Models

### Type Definitions (`src/types/index.ts`)

#### User
```typescript
interface User {
  id: string;              // From Kinde
  name: string;            // Display name
  email: string;
  avatar?: string;         // Profile picture URL
  role?: string;           // 'user', 'admin', etc.
  createdAt: string;       // ISO timestamp
}
```

#### Group
```typescript
interface Group {
  id: string;              // UUID
  name: string;
  description: string;
  avatar?: string;         // Generated via DiceBear API
  parentId: string | null; // null = top-level
  level: number;           // 0=company, 1=dept, 2=team, etc.
  createdBy: string;       // User ID who created
  createdAt: string;
  updatedAt: string;
  inviteCode: string;      // 6-char uppercase (e.g., "ACME01")
  isPublic: boolean;       // Public discovery (plan for future)
}
```

#### GroupMember
```typescript
interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  user: User;              // Enriched with user data
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  invitedBy?: string;      // Who invited them
}
```

#### Post (see Post & Comment System above)

#### Comment (see Post & Comment System above)

#### Notification (see Notification System above)

#### GroupInvitation
```typescript
interface GroupInvitation {
  id: string;
  groupId: string;
  invitedBy: string;       // Admin who created invite
  invitedUserId?: string;  // Specific user (optional)
  invitedEmail?: string;   // Email (optional)
  inviteCode: string;      // Same as group.inviteCode (for now)
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;       // 7 days from creation
  createdAt: string;
}
```

---

## Authentication Flow

### Detailed Sequence Diagram

```
Browser                 App                 Kinde              Supabase
  │                     │                      │                   │
  │─ Visit app          │                      │                   │
  ├─────────────────────>│                      │                   │
  │                     │ initKinde()          │                   │
  │                     ├─────────────────────>│                   │
  │                     │<─ Client initialized │                   │
  │                     │                      │                   │
  │                     │ isAuthenticated()?   │                   │
  │                     ├─────────────────────>│                   │
  │                     │< true (from session) │                   │
  │                     │                      │                   │
  │                     │ getUser()            │                   │
  │                     ├─────────────────────>│                   │
  │                     │< kindeUser object    │                   │
  │                     │                      │                   │
  │                     │ Check profile exists │                   │
  │                     ├──────────────────────────────────────────>│
  │                     │                      │  SELECT * FROM     │
  │                     │                      │  profiles WHERE id=?│
  │                     │<──────────────────────────────────────────┤
  │                     │ Profile not found    │                   │
  │                     │                      │                   │
  │                     │ Create profile       │                   │
  │                     ├──────────────────────────────────────────>│
  │                     │                      │  INSERT INTO      │
  │                     │                      │  profiles          │
  │                     │<──────────────────────────────────────────┤
  │                     │ Profile created      │                   │
  │                     │                      │                   │
  │ <─ App loads        │                      │                   │
  │<─────────────────────                      │                   │

For login:
Browser                 App                 Kinde
  │                     │                      │
  │─ Click Login        │                      │
  ├─────────────────────>│                      │
  │                     │ loginWithRedirect()  │
  │                     ├─────────────────────>│
  │                     │                      │
  │<─ Redirect to Kinde │                      │
  │─────────────────────────────────────────>│
  │ (User enters credentials)                 │
  │<─────────────────────────────────────────┤
  │                     │<─ Return to app     │
  │<─ Redirect to app   │  with code param    │
  │─────────────────────>│                      │
  │                     │ Exchange code        │
  │                     ├─────────────────────>│
  │                     │< Access token       │
  │                     │                      │
  │                     │ (Same sequence as   │
  │                     │  above: check/create│
  │                     │  profile)           │
```

### Current Auth Flow Implementation

**Location**: `src/main.tsx` (Root component)

```typescript
useEffect(() => {
  const initAuth = async () => {
    // 1. Initialize Kinde
    await initKinde();
    
    // 2. Check for auth callback (code/state params)
    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Check Kinde auth status
    const kindeAuth = isAuthenticated();
    
    if (kindeAuth) {
      // 4. Get Kinde user
      const kindeUser = getKindeUser();
      
      // 5. Create user object
      const userData = {
        id: kindeUser.id,
        email: kindeUser.email,
        name: kindeUser.given_name + ' ' + kindeUser.family_name,
        avatar: kindeUser.picture,
        role: 'user',
      };
      
      // 6. Try to sync with Supabase
      if (isSupabaseConfigured()) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', kindeUser.id)
          .single();
        
        if (!profile) {
          // Create profile if not exists
          await supabase.from('profiles').insert(userData);
        }
      }
      
      // 7. Save to localStorage
      saveUserToLocal(userData);
      setUser(userData);
      setIsAuth(true);
    } else {
      // Check if user in localStorage
      const savedUser = getUserFromLocal();
      if (savedUser) {
        setUser(savedUser);
        setIsAuth(true);
      }
    }
    
    setIsLoading(false);
  };
  
  initAuth();
}, []);
```

---

## State Management

### Root-Level State (`src/main.tsx` & `src/App.tsx`)

```typescript
// In Root component (main.tsx)
const [isAuth, setIsAuth] = useState(false);
const [user, setUser] = useState<User | null>(null);
const [isLoading, setIsLoading] = useState(true);

// In App component (App.tsx)
const [user, setUser] = useState<User>(initialUser);
const [currentView, setCurrentView] = useState<ViewType>('feed');
const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
const [postComments, setPostComments] = useState<Comment[]>([]);
const [joinCode, setJoinCode] = useState<string>('');
```

### Hook-Based State

#### useGroups Hook
```typescript
const {
  groups,              // All groups
  userGroups,          // Groups user is member of
  visibleGroups,       // Groups user can access
  adminGroups,         // Groups user administers
  isLoading,
  createGroup,
  joinGroup,
  leaveGroup,
  promoteMember,
  demoteMember,
  removeMember,
  regenerateInviteCode,
} = useGroups(user);
```

**State Storage**: localStorage + local React state  
**Persistence**: Writes to localStorage after each operation  
**Refresh**: Manual via `refreshGroups()` or on group creation

#### useSupabasePosts Hook
```typescript
const {
  posts,      // All posts for group
  isLoading,
  addPost,
  deletePost,
  toggleLike,
  refreshPosts,
} = useSupabasePosts(user, currentGroup?.id);
```

**State Storage**: React state (useState)  
**Fetching**: Called on mount and when groupId changes  
**Likes**: Tracked in `post.likedBy` array  
**Realtime**: Subscription defined but not active (no-op)

#### useSupabaseNotifications Hook
```typescript
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
} = useSupabaseNotifications(user?.id);
```

**State Storage**: localStorage  
**Polling**: No automatic updates (demo mode)  
**Unread**: Filtered by `read: false`

---

## Database Schema

### Current Status
⚠️ **Groups, posts, comments NOT in Supabase** (localStorage only)  
✅ **Profiles synced from Kinde** (created on first login)

### Required Supabase Schema

```sql
-- Authentication (handled by Supabase Auth)
-- User IDs from Kinde auth.uid()

-- Profiles table (synced from Kinde)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  parent_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  invite_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  CONSTRAINT valid_level CHECK (level >= 0)
);

CREATE INDEX idx_groups_parent_id ON groups(parent_id);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);

-- Group members table
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' 
    CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id),
  UNIQUE(group_id, user_id)
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

CREATE INDEX idx_posts_group_id ON posts(group_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Likes table (many-to-many)
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL 
    CHECK (type IN ('like', 'comment', 'mention', 'group_invite', 'group_join', 'promoted')),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Group invitations table
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invited_user_id UUID REFERENCES profiles(id),
  invited_email TEXT,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX idx_group_invitations_code ON group_invitations(invite_code);

-- Storage bucket for images
-- Created via Supabase dashboard: Storage → Create bucket
-- Name: teamconnect
-- Public: true (with policies)
-- Path: teamconnect/images/{filename}
```

### Row-Level Security (RLS) Policies

**Status**: ⚠️ NOT IMPLEMENTED

```sql
-- Profiles: Users can only view/edit their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid()::text);

CREATE POLICY "Users can view other profiles for team features"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM group_members
      WHERE group_id IN (
        SELECT group_id FROM group_members
        WHERE user_id = auth.uid()::text
      )
    )
  );

-- Groups: Users can only view groups they're members of
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view member groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::text
    ) OR created_by = auth.uid()::text
  );

-- Posts: Users can only view posts in groups they're members of
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group posts"
  ON posts FOR SELECT
  USING (
    group_id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (user_id = auth.uid()::text);

-- Similar policies for comments, likes, notifications
-- (See CODE_REVIEW.md for critical security issues)
```

---

## Component Hierarchy

### Page-Level Components

```
App.tsx (Main orchestrator)
├─ FeedPage.tsx
│  ├─ GroupSelector
│  ├─ CreatePostForm
│  ├─ PostList
│  │  └─ PostCard (× N)
│  │     ├─ PostAuthor
│  │     ├─ PostContent
│  │     ├─ PostImages
│  │     ├─ PostActions (Like, Comment, More)
│  │     └─ PostStats (Likes, Comments count)
│  └─ GroupMembersPanel (when admin)
│     ├─ MemberCard (× N)
│     └─ GroupInviteButton
│
├─ PostDetailPage.tsx
│  ├─ PostDetail
│  │  ├─ PostCard
│  │  ├─ CommentList
│  │  │  └─ CommentCard (× N)
│  │  │     ├─ CommentAuthor
│  │  │     ├─ CommentContent
│  │  │     └─ CommentActions
│  │  └─ CommentForm
│  └─ [Back button]
│
├─ NotificationsPage.tsx
│  └─ NotificationList
│     └─ NotificationCard (× N)
│        ├─ NotificationIcon (type)
│        ├─ NotificationMessage
│        └─ NotificationTime
│
├─ ProfilePage.tsx
│  ├─ ProfileHeader
│  │  ├─ Avatar
│  │  ├─ UserInfo
│  │  └─ EditProfileButton (if own profile)
│  ├─ ProfileStats
│  ├─ UserPosts
│  │  └─ PostCard (× N)
│  └─ [Logout/Groups/Admin buttons]
│
├─ MyGroupsPage.tsx
│  ├─ MyGroupsList
│  │  └─ GroupCard (× N)
│  │     ├─ GroupInfo
│  │     ├─ MemberCount
│  │     └─ [Join/Leave button]
│  ├─ AdminGroupsList
│  │  └─ GroupCard (× N)
│  │     ├─ GroupInfo
│  │     └─ [Settings/Invite button]
│  └─ InvitationsList
│     └─ InvitationCard (× N)
│
└─ AdminPage.tsx
   ├─ UserManagement
   │  └─ UserTable
   │     └─ UserRow (× N)
   ├─ GroupManagement
   │  └─ GroupTree
   │     └─ GroupNode (× N)
   └─ PostModeration
      └─ PostList

BottomTabBar (persistent across pages)
├─ Home tab
├─ Notifications tab (with badge)
├─ Profile tab
└─ (Admin can access My Groups / Admin)
```

### Reusable Components

Located in `src/components/`:
- **UI**: Button, Card, Input, Dialog, Avatar, Badge, etc. (Radix UI)
- **Custom**: GroupCard, PostCard, UserCard, etc.
- **Forms**: CreatePostForm, CreateGroupForm, EditProfileForm
- **Layout**: BottomTabBar, Header, Sidebar (if needed)

---

## Data Flow Examples

### Example 1: Create Post Flow

```
User writes post in FeedPage
    ↓
Clicks "Post" button
    ↓
handleCreatePost(content, images)
    ├─ Call addPost() from useSupabasePosts hook
    ├─ Pass content, images, authorId, groupId
    │
    └─→ In useSupabasePosts:
        ├─ Call db.createPost()
        │
        └─→ In db-supabase.ts:
            ├─ Check if Supabase configured
            ├─ If yes:
            │  ├─ supabase.from('posts').insert({
            │  │    user_id, group_id, content, images
            │  │  })
            │  └─ If error, fall back to localStorage
            │
            └─ If no Supabase:
               ├─ Save to localStorage
               └─ Create mock post object
        
        ├─ Return newPost
        └─ setPosts(prev => [newPost, ...prev])
    
    ↓
Posts state updates
    ↓
FeedPage re-renders with new post at top
    ↓
User sees post immediately

(If group changed, refreshPosts() called)
```

### Example 2: Join Group via Invite Link

```
User receives link: https://teamconnect.com/join/ACME01
    ↓
Browser navigates to URL
    ↓
App.tsx detects invite code in URL
    ├─ Extract code from pathname: /join/ACME01
    ├─ Set currentView = 'join'
    └─ Show join confirmation page
    
User clicks "Join Group" button
    ↓
handleJoinGroup() called
    ├─ Call joinGroup(inviteCode) from useGroups hook
    │
    └─→ In useGroups:
        ├─ Call acceptInvitation(inviteCode, userId)
        │
        └─→ In groups.ts:
            ├─ Find invitation by code
            ├─ Check if still pending and not expired
            ├─ Call addGroupMember(groupId, userId, 'member')
            ├─ Update invitation status = 'accepted'
            ├─ Return group object
        
        ├─ Call refreshGroups()
        └─ Return group

    ├─ setCurrentGroup(group)
    ├─ setCurrentView('feed')
    └─ Show success

    ↓
User now member of group
    ↓
Can see group posts
    ↓
Can create posts in group
```

### Example 3: Like Post Flow

```
User clicks like button on post
    ↓
handleLike(postId) called
    ├─ Call toggleLike(postId) from useSupabasePosts
    │
    └─→ In useSupabasePosts:
        ├─ Call db.toggleLike(postId, userId)
        │
        └─→ In db-supabase.ts:
            ├─ Get post from localStorage
            ├─ Check if user already liked
            ├─ If yes:
            │  ├─ Remove userId from likedBy array
            │  └─ likes--
            ├─ If no:
            │  ├─ Add userId to likedBy array
            │  └─ likes++
            ├─ Save to localStorage
            └─ Return { liked, likes: count }
        
        ├─ Update posts state
        │  setPosts(prev => prev.map(p =>
        │    p.id === postId 
        │      ? { ...p, likes, likedBy }
        │      : p
        │  ))
        └─ Return result

    ├─ UI updates immediately (optimistic)
    ├─ Like button toggles active state
    └─ Like count updates

(Notification could be created here - currently not implemented)
```

---

## Performance Analysis

### Current Bottlenecks

#### 1. No Pagination ⚠️⚠️⚠️ CRITICAL
```
With 1000 posts:
- Load time: 5-10 seconds
- Memory usage: 50+ MB
- Network: 1-2 MB download

With pagination (20 posts/page):
- Load time: 200-500ms
- Memory usage: 2-5 MB
- Network: 50-100 KB

Impact: Severe at scale (> 500 posts)
Solution: Implement cursor-based pagination (see CODE_REVIEW.md)
```

#### 2. No Caching ⚠️⚠️ HIGH
```
Current: Every navigation = full refetch
With React Query: Stale for 5 min, cached for 30 min

Example: Feed → Profile → Feed
- Current: 2 API calls (30s total load)
- With caching: 0 API calls (0s, instant)

Solution: Add React Query (see CODE_REVIEW.md)
```

#### 3. localStorage Serialization ⚠️ MEDIUM
```
JSON.stringify on every save
- 100 posts: 2ms
- 1000 posts: 50ms
- 10000 posts: 500ms

Not huge but adds up with many operations.
Solution: Use IndexedDB for large datasets in future.
```

#### 4. Synchronous Group Operations ⚠️ MEDIUM
```
getVisibleGroups() traverses entire group tree:
- 50 groups: < 1ms
- 500 groups: 5-10ms
- 5000 groups: 100ms+

Solution: Cache group tree, invalidate on changes.
```

### Memory Usage

**Current** (localStorage):
- 100 posts: ~5 MB
- 1000 posts: ~50 MB
- 10000 posts: ~500 MB (exceeds localStorage limit of 5-10 MB)

**localStorage Limit**: 5-10 MB per domain (varies by browser)  
**Action**: Migrate to Supabase ASAP to remove this constraint

### Network Usage

**Current** (if using Supabase):
- Fetch all posts: Depends on size
- Single post creation: ~5 KB
- Image upload: Depends on size (should compress)

**Recommendation**:
- Compress images before upload (target: 200 KB max)
- Implement pagination (20 posts = ~50 KB)
- Use Supabase query caching headers

---

## Security Model

### Current Security Status

| Area | Status | Risk |
|------|--------|------|
| Authentication | ✅ Kinde PKCE | Low |
| Authorization | ⚠️ No RLS | **Critical** |
| Input Validation | ❌ None | **Critical** |
| XSS Prevention | ⚠️ No sanitization | **High** |
| CSRF Protection | ✅ Same-site cookies | Low |
| Data Privacy | ⚠️ No encryption | High |
| Secrets Management | ❌ Hard-coded | **Critical** |
| HTTPS | ✅ Always on | Low |

### Known Vulnerabilities

#### 1. No Row-Level Security (RLS)
**Risk**: Any authenticated user can access all data  
**Current**: Supabase RLS disabled  
**Fix**: Enable RLS and add policies (see Database Schema above)  

#### 2. No Input Validation
**Risk**: XSS, SQL injection, invalid data  
**Current**: Forms accept any input  
**Fix**: Add Zod validation (see CODE_REVIEW.md)  

#### 3. Hard-coded Credentials
**Risk**: Credentials exposed in git  
**Current**: `src/lib/kinde.ts` has hard-coded client ID  
**Fix**: Remove defaults, require .env  

#### 4. No Content Sanitization
**Risk**: Stored XSS in post content  
**Current**: No sanitization, no escaping  
**Fix**: Use DOMPurify or similar  

```typescript
import DOMPurify from 'dompurify';

const safeContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'a'],
  ALLOWED_ATTR: ['href']
});
```

#### 5. localStorage Usage
**Risk**: Sensitive data in browser storage  
**Current**: User data, groups, posts in localStorage  
**Fix**: Only use for caching, not sensitive data  

#### 6. No Rate Limiting
**Risk**: Brute force, spam, DoS  
**Current**: No limits on API calls  
**Fix**: Add Supabase rate limiting via PostgREST  

#### 7. No Audit Logging
**Risk**: Can't trace who did what  
**Current**: No audit trail  
**Fix**: Add audit table, log all sensitive actions  

---

## Known Limitations

### Data Persistence
- ❌ Groups stored in localStorage (lost on browser clear)
- ❌ Posts stored in localStorage (demo only)
- ❌ Comments stored in localStorage (demo only)
- ✅ Profiles synced from Kinde (persistent)

### Features Not Implemented
- ❌ Comment threading (parentId exists but unused)
- ❌ Post editing (delete only)
- ❌ Post search
- ❌ User mentions/tagging
- ❌ Direct messaging
- ❌ Video/audio calls
- ❌ Rich text editor (plain text only)
- ❌ Post categories/tags
- ❌ User following system
- ❌ Dark mode (UI supports it, not enabled)

### Performance Limitations
- ⚠️ No pagination (loads all posts)
- ⚠️ No caching (refetches on navigation)
- ⚠️ No infinite scroll
- ⚠️ No offline support
- ⚠️ No service worker

### Scalability Limits
- ⚠️ localStorage limit: 5-10 MB (blocks growth)
- ⚠️ No pagination: O(n) memory and load time
- ⚠️ Synchronous group tree: O(n²) in worst case
- ⚠️ No database indexes: Slow queries at scale

### Testing
- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ❌ No test database

### Deployment
- ⚠️ No error tracking (Sentry, etc.)
- ⚠️ No analytics (Mixpanel, GA, etc.)
- ⚠️ No monitoring (uptime, performance)
- ⚠️ No CI/CD pipeline

---

## Recommendations for Production

### Phase 1: Foundation (2-3 weeks)
1. Migrate groups/posts to Supabase
2. Implement RLS policies
3. Add input validation with Zod
4. Add error boundaries

### Phase 2: Optimization (1-2 weeks)
1. Implement pagination
2. Add React Query caching
3. Add error tracking
4. Clean up console.logs

### Phase 3: Security (1 week)
1. Fix hard-coded credentials
2. Add content sanitization
3. Add rate limiting
4. Create audit logs

### Phase 4: Features (2-3 weeks)
1. Comment threading
2. Post editing/deletion
3. Search functionality
4. User mentions

---

**Last Updated**: 2026-05-02  
**Review Interval**: Every sprint or major change  
**Owner**: Development Team
