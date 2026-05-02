-- TeamConnect - Complete Supabase Schema
-- Copy and run entire script in Supabase SQL Editor
-- Time: ~30 seconds

-- ============================================================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- ============================================================================
-- STEP 2: PROFILES TABLE (from Kinde Auth)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT valid_name CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin', 'moderator'))
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);


-- ============================================================================
-- STEP 3: GROUPS TABLE (Hierarchical structure)
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  parent_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invite_code TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT valid_name CHECK (char_length(name) > 0 AND char_length(name) <= 255),
  CONSTRAINT valid_description CHECK (char_length(description) <= 1000),
  CONSTRAINT valid_level CHECK (level >= 0 AND level <= 10),
  CONSTRAINT valid_invite_code CHECK (char_length(invite_code) = 6)
);

CREATE INDEX idx_groups_parent_id ON groups(parent_id);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_invite_code ON groups(invite_code);
CREATE INDEX idx_groups_level ON groups(level);
CREATE INDEX idx_groups_is_public ON groups(is_public);


-- ============================================================================
-- STEP 4: GROUP MEMBERS TABLE (With roles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  UNIQUE(group_id, user_id),
  CONSTRAINT valid_role CHECK (role IN ('admin', 'moderator', 'member'))
);

CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_role ON group_members(role);
CREATE INDEX idx_group_members_joined_at ON group_members(joined_at DESC);


-- ============================================================================
-- STEP 5: POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  CONSTRAINT valid_likes CHECK (likes_count >= 0),
  CONSTRAINT valid_comments CHECK (comments_count >= 0)
);

CREATE INDEX idx_posts_group_id ON posts(group_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_content_search ON posts USING gin(to_tsvector('english', content));


-- ============================================================================
-- STEP 6: POST LIKES TABLE (Many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);


-- ============================================================================
-- STEP 7: COMMENTS TABLE (With threading support)
-- ============================================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_content CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);


-- ============================================================================
-- STEP 8: NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'mention', 'group_invite', 'group_join', 'promoted')),
  actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_message CHECK (char_length(message) > 0)
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);


-- ============================================================================
-- STEP 9: GROUP INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invited_email TEXT,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_invite_code CHECK (char_length(invite_code) = 6),
  CONSTRAINT either_user_or_email CHECK (
    (invited_user_id IS NOT NULL AND invited_email IS NULL) OR
    (invited_user_id IS NULL AND invited_email IS NOT NULL) OR
    (invited_user_id IS NOT NULL AND invited_email IS NOT NULL)
  )
);

CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX idx_group_invitations_code ON group_invitations(invite_code);
CREATE INDEX idx_group_invitations_status ON group_invitations(status);
CREATE INDEX idx_group_invitations_expires ON group_invitations(expires_at);


-- ============================================================================
-- STEP 10: AUDIT LOG TABLE (Optional - for compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);


-- ============================================================================
-- STEP 11: TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- STEP 12: TRIGGERS FOR POST LIKE/COMMENT COUNTS
-- ============================================================================

-- Update post likes_count when like added
CREATE OR REPLACE FUNCTION increment_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_likes AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION increment_post_likes();

-- Update post likes_count when like removed
CREATE OR REPLACE FUNCTION decrement_post_likes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_likes AFTER DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_post_likes();

-- Update post comments_count when comment added
CREATE OR REPLACE FUNCTION increment_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_comments AFTER INSERT ON comments
  FOR EACH ROW WHEN (NEW.parent_id IS NULL)
  EXECUTE FUNCTION increment_post_comments();

-- Update post comments_count when comment removed
CREATE OR REPLACE FUNCTION decrement_post_comments()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_decrement_comments AFTER DELETE ON comments
  FOR EACH ROW WHEN (OLD.parent_id IS NULL)
  EXECUTE FUNCTION decrement_post_comments();


-- ============================================================================
-- STEP 13: ROW LEVEL SECURITY (RLS) - ENABLE & CREATE POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can only view their own and teammates
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can view team members"
  ON profiles FOR SELECT
  USING (
    id IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id IN (
        SELECT gm2.group_id FROM group_members gm2
        WHERE gm2.user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id);

-- GROUPS: Users can only view groups they're members of
CREATE POLICY "Users can view member groups"
  ON groups FOR SELECT
  USING (
    id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid()::text = created_by);

CREATE POLICY "Admins can update groups"
  ON groups FOR UPDATE
  USING (
    auth.uid()::text IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id = groups.id AND gm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete groups"
  ON groups FOR DELETE
  USING (
    auth.uid()::text IN (
      SELECT gm.user_id FROM group_members gm
      WHERE gm.group_id = groups.id AND gm.role = 'admin'
    )
  );

-- GROUP_MEMBERS: Users can only see members of groups they're in
CREATE POLICY "Users can view group members"
  ON group_members FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage members"
  ON group_members FOR UPDATE
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::text AND gm.role = 'admin'
    )
  );

-- POSTS: Users can view posts from groups they're in
CREATE POLICY "Users can view posts"
  ON posts FOR SELECT
  USING (
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id AND
    group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid()::text = user_id);

-- POST_LIKES: Users can only like posts in visible groups
CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id AND
    post_id IN (
      SELECT p.id FROM posts p
      WHERE p.group_id IN (
        SELECT gm.group_id FROM group_members gm
        WHERE gm.user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can unlike own likes"
  ON post_likes FOR DELETE
  USING (auth.uid()::text = user_id);

-- COMMENTS: Users can see comments on posts they can see
CREATE POLICY "Users can view comments"
  ON comments FOR SELECT
  USING (
    post_id IN (
      SELECT p.id FROM posts p
      WHERE p.group_id IN (
        SELECT gm.group_id FROM group_members gm
        WHERE gm.user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can comment"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id AND
    post_id IN (
      SELECT p.id FROM posts p
      WHERE p.group_id IN (
        SELECT gm.group_id FROM group_members gm
        WHERE gm.user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid()::text = user_id);

-- NOTIFICATIONS: Users can only see their own
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can mark own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid()::text = user_id);

-- GROUP_INVITATIONS: Users can see their invitations
CREATE POLICY "Users can view invitations"
  ON group_invitations FOR SELECT
  USING (
    auth.uid()::text = invited_user_id OR
    invited_email = (SELECT email FROM profiles WHERE id = auth.uid()::text)
  );


-- ============================================================================
-- STEP 14: HELPFUL VIEWS
-- ============================================================================

-- View for user's groups with member count
CREATE OR REPLACE VIEW user_groups_view AS
SELECT
  g.id,
  g.name,
  g.description,
  g.avatar_url,
  g.level,
  g.invite_code,
  gm.role,
  COUNT(DISTINCT gm2.user_id) as member_count,
  g.created_at
FROM groups g
JOIN group_members gm ON g.id = gm.group_id
LEFT JOIN group_members gm2 ON g.id = gm2.group_id
WHERE gm.user_id = auth.uid()::text
GROUP BY g.id, gm.role;

-- View for group hierarchy
CREATE OR REPLACE VIEW group_hierarchy_view AS
WITH RECURSIVE hierarchy AS (
  SELECT
    id, name, parent_id, level, 0 as depth
  FROM groups
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT
    g.id, g.name, g.parent_id, g.level, h.depth + 1
  FROM groups g
  JOIN hierarchy h ON g.parent_id = h.id
)
SELECT * FROM hierarchy;


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check indexes created
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY indexname;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies created
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- All tables, indexes, RLS policies, and triggers have been created.
-- Ready for data migration!
-- ============================================================================
