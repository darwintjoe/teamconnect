-- =====================================================
-- TeamConnect Supabase Schema Migration
-- =====================================================
-- This script creates all required tables for TeamConnect
-- Copy entire file to Supabase SQL Editor and run
-- =====================================================

-- Step 1: Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Step 2: Create Profiles Table (synced from Kinde)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Step 3: Create Groups Table (Hierarchical)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  parent_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0 CHECK (level >= 0),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  invite_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_groups_parent_id ON groups(parent_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_groups_level ON groups(level);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

-- Step 4: Create Group Members Table (with Roles)
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id),
  CONSTRAINT unique_group_member UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

-- Step 5: Create Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 CHECK (comments_count >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_content_search ON posts USING gin(to_tsvector('english', content));

-- Step 6: Create Post Likes Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_post_like UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Step 7: Create Comments Table (with Threading Support)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Step 8: Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'mention', 'group_invite', 'group_join', 'promoted')),
  actor_id UUID NOT NULL REFERENCES profiles(id),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Step 9: Create Group Invitations Table
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  invited_user_id UUID REFERENCES profiles(id),
  invited_email TEXT,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_code ON group_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);

-- Step 10: Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Step 11: Create Trigger Functions for Auto-Update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 12: Apply Update Triggers
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 13: Create Trigger Functions for Like/Comment Counts
CREATE OR REPLACE FUNCTION increment_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION decrement_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION increment_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION decrement_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ language 'plpgsql';

-- Step 14: Apply Count Triggers
CREATE TRIGGER like_post_increment AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION increment_post_likes_count();

CREATE TRIGGER like_post_decrement AFTER DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_post_likes_count();

CREATE TRIGGER comment_post_increment AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_post_comments_count();

CREATE TRIGGER comment_post_decrement AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_post_comments_count();

-- Step 15: Enable Row-Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 16: Create RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid()::text);

CREATE POLICY "Users can view other profiles in their groups" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT user_id FROM group_members
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid()::text);

-- Step 17: Create RLS Policies for Groups
CREATE POLICY "Users can view groups they are members of" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
    ) OR created_by = auth.uid()::text
  );

CREATE POLICY "Users can insert groups" ON groups
  FOR INSERT WITH CHECK (created_by = auth.uid()::text);

CREATE POLICY "Admins can update groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid()::text OR
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Step 18: Create RLS Policies for Group Members
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Group admins can manage members" ON group_members
  FOR ALL USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Step 19: Create RLS Policies for Posts
CREATE POLICY "Users can view posts in their groups" ON posts
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create posts in member groups" ON posts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (user_id = auth.uid()::text);

-- Step 20: Create RLS Policies for Post Likes
CREATE POLICY "Users can view likes" ON post_likes
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can like/unlike posts" ON post_likes
  FOR ALL USING (user_id = auth.uid()::text);

-- Step 21: Create RLS Policies for Comments
CREATE POLICY "Users can view comments on their group posts" ON comments
  FOR SELECT USING (
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can comment on group posts" ON comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::text AND
    post_id IN (
      SELECT id FROM posts WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (user_id = auth.uid()::text);

-- Step 22: Create RLS Policies for Notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid()::text);

-- Step 23: Create RLS Policies for Group Invitations
CREATE POLICY "Users can view group invitations" ON group_invitations
  FOR SELECT USING (
    invited_user_id = auth.uid()::text OR
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can create invitations" ON group_invitations
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  );

-- Step 24: Create Helpful Views
CREATE OR REPLACE VIEW user_group_stats AS
SELECT 
  gm.user_id,
  COUNT(DISTINCT gm.group_id) as total_groups,
  COUNT(DISTINCT CASE WHEN gm.role = 'admin' THEN gm.group_id END) as admin_groups,
  COUNT(DISTINCT p.id) as total_posts,
  SUM(p.likes_count) as total_likes
FROM group_members gm
LEFT JOIN posts p ON gm.user_id = p.user_id
GROUP BY gm.user_id;

CREATE OR REPLACE VIEW group_activity AS
SELECT 
  g.id as group_id,
  g.name,
  COUNT(DISTINCT gm.user_id) as member_count,
  COUNT(DISTINCT p.id) as post_count,
  SUM(p.likes_count) as total_likes,
  MAX(p.created_at) as last_post_at
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN posts p ON g.id = p.group_id
GROUP BY g.id, g.name;

-- All Done!
-- ✅ Schema created successfully
-- Next: 
-- 1. Create storage bucket: teamconnect
-- 2. Set bucket to public
-- 3. Run migration script to import data
